import * as XLSX from 'xlsx';
import { db } from './db';
import { boqTemplates, boqLineItems, boqGaps } from '../drizzle/schema';

/**
 * BOQ Parser Service
 * Handles extraction, parsing, and validation of BOQ Excel files
 */

export interface ParsedBOQItem {
  lineNumber: string;
  category: string;
  description: string;
  specification?: string;
  quantity: number;
  unit: string;
  unitRate: number;
  totalCost: number;
  drawingReferences: string[];
  locations: string[];
  dimensions?: string;
  brand?: string;
  supplier?: string;
  leadTime?: number;
  validationStatus: 'valid' | 'conflict' | 'gap' | 'error';
  gaps: object[];
  notes?: string;
}

export interface BOQValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  gaps: object[];
}

/**
 * Extract drawing references from description text
 * Patterns: A587-00-00-600, A-201, S-XXX, M-XXX, F-XXX, D-XXX
 */
function extractDrawingReferences(text: string): string[] {
  if (!text) return [];
  const pattern = /([A-Z]-?\d{1,3}(?:-\d{2})*)/g;
  const matches = text.match(pattern) || [];
  return [...new Set(matches)]; // Remove duplicates
}

/**
 * Extract locations from description text
 * Pattern: "Location: [text]" or after "Location:"
 */
function extractLocations(text: string): string[] {
  if (!text) return [];
  const locationMatch = text.match(/Location:\s*([^.]+)/i);
  if (locationMatch) {
    return locationMatch[1]
      .split(',')
      .map(loc => loc.trim())
      .filter(loc => loc.length > 0);
  }
  return [];
}

/**
 * Extract dimensions from description text
 * Pattern: "2100x2400 mm" or "600x600mm"
 */
function extractDimensions(text: string): string | undefined {
  if (!text) return undefined;
  const dimMatch = text.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*(mm|m|cm)?/i);
  if (dimMatch) {
    const unit = dimMatch[3] || 'mm';
    return `${dimMatch[1]}x${dimMatch[2]} ${unit}`;
  }
  return undefined;
}

/**
 * Extract brand from description text
 * Pattern: "Brand: [text]" or "Dorma or equivalent"
 */
function extractBrand(text: string): string | undefined {
  if (!text) return undefined;
  const brandMatch = text.match(/Brand:\s*([^,;.]+)|([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+or\s+equivalent/i);
  if (brandMatch) {
    return brandMatch[1] || brandMatch[2];
  }
  return undefined;
}

/**
 * Normalize unit to standard format
 */
function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'nos': 'nos',
    'no': 'nos',
    'number': 'nos',
    'pcs': 'nos',
    'piece': 'nos',
    'sqm': 'm²',
    'sq.m': 'm²',
    'sq m': 'm²',
    'cbm': 'm³',
    'cu.m': 'm³',
    'cubic meter': 'm³',
    'item': 'item',
    'ls': 'LS',
    'lump sum': 'LS',
    'set': 'set',
    'box': 'box',
    'roll': 'roll',
    'pair': 'pair',
    'kg': 'kg',
    'meter': 'm',
    'linear meter': 'm',
  };
  
  const normalized = unitMap[unit.toLowerCase().trim()];
  return normalized || unit;
}

/**
 * Parse Excel BOQ file
 */
export async function parseBOQFile(filePath: string): Promise<ParsedBOQItem[]> {
  const workbook = XLSX.readFile(filePath);
  const items: ParsedBOQItem[] = [];

  // Process each worksheet
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    // Determine category from sheet name
    const category = mapSheetToCategory(sheetName);

    // Parse each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, any>;
      
      // Skip empty rows and header rows
      if (!row['SL NO'] && !row['Unnamed: 0']) continue;
      if (typeof row['SL NO'] === 'string' && row['SL NO'].toLowerCase().includes('sl no')) continue;

      const item = parseRowToItem(row, category, sheetName);
      if (item) {
        items.push(item);
      }
    }
  }

  return items;
}

/**
 * Parse a single row to BOQ item
 */
function parseRowToItem(row: Record<string, any>, category: string, sheetName: string): ParsedBOQItem | null {
  // Extract values from row (handle various column name variations)
  const lineNumber = String(row['SL NO'] || row['Unnamed: 0'] || row['Line No'] || '').trim();
  const description = String(row['Item Description'] || row['Unnamed: 1'] || row['Description'] || '').trim();
  const quantity = parseFloat(String(row['Qty.'] || row['Quantity'] || row['Unnamed: 2'] || '0'));
  const unit = String(row['Unit'] || row['Unnamed: 3'] || '').trim();
  const unitRate = parseFloat(String(row['Unit Price (AED)'] || row['Unit Price'] || row['Unnamed: 4'] || '0'));
  const amount = parseFloat(String(row['Amount (AED)'] || row['Amount'] || row['Unnamed: 5'] || '0'));
  const remarks = String(row['Remarks'] || row['Unnamed: 6'] || '').trim();

  // Skip if no description
  if (!description) return null;

  // Extract additional information from description
  const drawingReferences = extractDrawingReferences(description);
  const locations = extractLocations(description);
  const dimensions = extractDimensions(description);
  const brand = extractBrand(description);

  // Validate item
  const gaps: object[] = [];
  let validationStatus: 'valid' | 'conflict' | 'gap' | 'error' = 'valid';

  if (quantity <= 0) {
    gaps.push({ field: 'quantity', message: 'Quantity must be greater than 0' });
    validationStatus = 'gap';
  }

  if (unitRate <= 0) {
    gaps.push({ field: 'unitRate', message: 'Unit rate must be greater than 0' });
    validationStatus = 'gap';
  }

  if (drawingReferences.length === 0) {
    gaps.push({ field: 'drawingReferences', message: 'At least one drawing reference is required' });
    validationStatus = 'gap';
  }

  // Check calculation accuracy
  const expectedAmount = quantity * unitRate;
  if (amount > 0 && Math.abs(amount - expectedAmount) > 0.01) {
    gaps.push({ 
      field: 'amount', 
      message: `Amount mismatch: Expected ${expectedAmount}, got ${amount}` 
    });
  }

  return {
    lineNumber,
    category,
    description,
    specification: description, // Full description as specification
    quantity,
    unit: normalizeUnit(unit),
    unitRate,
    totalCost: amount > 0 ? amount : expectedAmount,
    drawingReferences,
    locations,
    dimensions,
    brand,
    validationStatus,
    gaps,
    notes: remarks,
  };
}

/**
 * Map Excel sheet name to standard category
 */
function mapSheetToCategory(sheetName: string): string {
  const categoryMap: Record<string, string> = {
    'Preamble & General': 'Project Setup & Management',
    'Design & Approvals': 'Design & Approvals',
    'Doors': 'Architectural Finishes - Doors',
    'Floor & Floor Finishes': 'Architectural Finishes - Flooring',
    'Walls & Wall Finishes': 'Architectural Finishes - Walls',
    'Ceiling Finishes': 'Architectural Finishes - Ceilings',
    'Electrical & Lighting': 'MEP Systems - Electrical',
    'FIRE FIGHTING & FIRE ALARM': 'MEP Systems - Fire Safety',
    'HVAC': 'MEP Systems - HVAC',
    'PLUMBING & DRAINAGE': 'MEP Systems - Plumbing',
    'DATA & VOICE': 'MEP Systems - Communications',
    'Signage': 'Specialist Works - Signage',
  };

  return categoryMap[sheetName] || sheetName;
}

/**
 * Validate BOQ item
 */
export function validateBOQItem(item: ParsedBOQItem): BOQValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const gaps: object[] = [];

  // Numeric validation
  if (item.quantity <= 0) {
    errors.push(`Line ${item.lineNumber}: Quantity must be greater than 0`);
  }

  if (item.unitRate <= 0) {
    errors.push(`Line ${item.lineNumber}: Unit rate must be greater than 0`);
  }

  if (item.totalCost <= 0) {
    errors.push(`Line ${item.lineNumber}: Total cost must be greater than 0`);
  }

  // Drawing reference validation
  if (item.drawingReferences.length === 0) {
    gaps.push({
      field: 'drawingReferences',
      lineNumber: item.lineNumber,
      message: 'At least one drawing reference is required',
      severity: 'high',
    });
  }

  // Unit validation
  const validUnits = ['nos', 'm²', 'm³', 'm', 'kg', 'item', 'LS', 'set', 'box', 'roll', 'pair'];
  if (!validUnits.includes(item.unit)) {
    warnings.push(`Line ${item.lineNumber}: Non-standard unit "${item.unit}". Consider using standard units.`);
  }

  // Supplier validation
  if (!item.supplier) {
    gaps.push({
      field: 'supplier',
      lineNumber: item.lineNumber,
      message: 'Supplier information is missing',
      severity: 'medium',
    });
  }

  // Lead time validation
  if (!item.leadTime) {
    gaps.push({
      field: 'leadTime',
      lineNumber: item.lineNumber,
      message: 'Lead time is not specified',
      severity: 'medium',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    gaps,
  };
}

/**
 * Calculate total BOQ cost
 */
export function calculateTotalBOQCost(items: ParsedBOQItem[]): number {
  return items.reduce((total, item) => total + item.totalCost, 0);
}

/**
 * Group items by category
 */
export function groupByCategory(items: ParsedBOQItem[]): Record<string, ParsedBOQItem[]> {
  return items.reduce((grouped, item) => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
    return grouped;
  }, {} as Record<string, ParsedBOQItem[]>);
}

/**
 * Generate BOQ summary statistics
 */
export function generateBOQSummary(items: ParsedBOQItem[]) {
  const grouped = groupByCategory(items);
  const summary: Record<string, { count: number; total: number }> = {};

  for (const [category, categoryItems] of Object.entries(grouped)) {
    summary[category] = {
      count: categoryItems.length,
      total: categoryItems.reduce((sum, item) => sum + item.totalCost, 0),
    };
  }

  return {
    totalItems: items.length,
    totalCost: calculateTotalBOQCost(items),
    byCategory: summary,
    itemsWithGaps: items.filter(item => item.gaps.length > 0).length,
    itemsWithErrors: items.filter(item => item.validationStatus === 'error').length,
  };
}
