/**
 * BOQ Excel Import Service
 * Handles parsing and validation of BOQ data from Excel files
 */

import * as XLSX from "xlsx";

export interface BOQImportRow {
  itemNumber?: string;
  description: string;
  category: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice?: number;
  supplier?: string;
  leadTime?: number;
  notes?: string;
  material?: string;
  brand?: string;
}

export interface BOQImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  errorRows: number;
  errors: Array<{
    rowNumber: number;
    error: string;
    data?: Record<string, any>;
  }>;
  data: BOQImportRow[];
}

export interface BOQImportTemplate {
  itemNumber: string;
  description: string;
  category: string;
  quantity: string;
  unitOfMeasure: string;
  unitPrice: string;
  supplier: string;
  leadTime: string;
  notes: string;
  material: string;
  brand: string;
}

/**
 * Generate BOQ Excel import template
 */
export function generateBOQTemplate(): Buffer {
  const template: BOQImportTemplate[] = [
    {
      itemNumber: "1",
      description: "Example Item",
      category: "Electrical",
      quantity: "100",
      unitOfMeasure: "units",
      unitPrice: "50.00",
      supplier: "Supplier Name",
      leadTime: "14",
      notes: "Optional notes",
      material: "Copper",
      brand: "Brand Name",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BOQ");

  // Set column widths
  ws["!cols"] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 20 },
    { wch: 12 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
  ];

  return XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
}

/**
 * Parse BOQ data from Excel file buffer
 */
export function parseBOQExcel(fileBuffer: Buffer): BOQImportResult {
  const errors: Array<{
    rowNumber: number;
    error: string;
    data?: Record<string, any>;
  }> = [];
  const data: BOQImportRow[] = [];

  try {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!worksheet) {
      return {
        success: false,
        totalRows: 0,
        importedRows: 0,
        errorRows: 1,
        errors: [{ rowNumber: 1, error: "No worksheet found in Excel file" }],
        data: [],
      };
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because of header row and 0-based indexing

      try {
        // Validate required fields
        if (!row.description || typeof row.description !== "string") {
          throw new Error("Description is required and must be text");
        }

        if (!row.category || typeof row.category !== "string") {
          throw new Error("Category is required and must be text");
        }

        if (!row.quantity) {
          throw new Error("Quantity is required");
        }

        const quantity = parseFloat(String(row.quantity));
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error("Quantity must be a positive number");
        }

        if (!row.unitOfMeasure || typeof row.unitOfMeasure !== "string") {
          throw new Error("Unit of Measure is required");
        }

        // Parse optional numeric fields
        let unitPrice: number | undefined;
        if (row.unitPrice) {
          unitPrice = parseFloat(String(row.unitPrice));
          if (isNaN(unitPrice)) {
            throw new Error("Unit Price must be a valid number");
          }
        }

        let leadTime: number | undefined;
        if (row.leadTime) {
          leadTime = parseInt(String(row.leadTime), 10);
          if (isNaN(leadTime) || leadTime < 0) {
            throw new Error("Lead Time must be a non-negative number");
          }
        }

        // Validate category
        const validCategories = [
          "Electrical",
          "Plumbing",
          "HVAC",
          "Carpentry",
          "Painting",
          "Flooring",
          "Doors & Windows",
          "Hardware",
          "Fixtures",
          "Materials",
        ];

        if (!validCategories.includes(row.category)) {
          throw new Error(
            `Invalid category. Must be one of: ${validCategories.join(", ")}`
          );
        }

        // Create import row
        const importRow: BOQImportRow = {
          itemNumber: row.itemNumber ? String(row.itemNumber) : undefined,
          description: String(row.description).trim(),
          category: String(row.category).trim(),
          quantity,
          unitOfMeasure: String(row.unitOfMeasure).trim(),
          unitPrice,
          supplier: row.supplier ? String(row.supplier).trim() : undefined,
          leadTime,
          notes: row.notes ? String(row.notes).trim() : undefined,
          material: row.material ? String(row.material).trim() : undefined,
          brand: row.brand ? String(row.brand).trim() : undefined,
        };

        data.push(importRow);
      } catch (error) {
        errors.push({
          rowNumber,
          error: error instanceof Error ? error.message : "Unknown error",
          data: row,
        });
      }
    });

    return {
      success: errors.length === 0,
      totalRows: rows.length,
      importedRows: data.length,
      errorRows: errors.length,
      errors,
      data,
    };
  } catch (error) {
    return {
      success: false,
      totalRows: 0,
      importedRows: 0,
      errorRows: 1,
      errors: [
        {
          rowNumber: 1,
          error: error instanceof Error ? error.message : "Failed to parse Excel file",
        },
      ],
      data: [],
    };
  }
}

/**
 * Validate BOQ import data
 */
export function validateBOQImportData(data: BOQImportRow[]): BOQImportResult {
  const errors: Array<{
    rowNumber: number;
    error: string;
    data?: Record<string, any>;
  }> = [];
  const validData: BOQImportRow[] = [];

  data.forEach((row, index) => {
    const rowNumber = index + 1;

    try {
      // Validate description length
      if (row.description.length > 500) {
        throw new Error("Description must be 500 characters or less");
      }

      // Validate quantity range
      if (row.quantity > 1000000) {
        throw new Error("Quantity cannot exceed 1,000,000");
      }

      // Validate unit price range
      if (row.unitPrice && row.unitPrice > 1000000) {
        throw new Error("Unit Price cannot exceed 1,000,000");
      }

      // Validate lead time range
      if (row.leadTime && row.leadTime > 365) {
        throw new Error("Lead Time cannot exceed 365 days");
      }

      validData.push(row);
    } catch (error) {
      errors.push({
        rowNumber,
        error: error instanceof Error ? error.message : "Validation error",
        data: row,
      });
    }
  });

  return {
    success: errors.length === 0,
    totalRows: data.length,
    importedRows: validData.length,
    errorRows: errors.length,
    errors,
    data: validData,
  };
}

/**
 * Calculate total cost for imported BOQ items
 */
export function calculateBOQTotalCost(data: BOQImportRow[]): number {
  return data.reduce((total, row) => {
    if (row.unitPrice) {
      return total + row.quantity * row.unitPrice;
    }
    return total;
  }, 0);
}

/**
 * Group BOQ items by category
 */
export function groupBOQByCategory(data: BOQImportRow[]): Record<string, BOQImportRow[]> {
  return data.reduce(
    (grouped, row) => {
      if (!grouped[row.category]) {
        grouped[row.category] = [];
      }
      grouped[row.category].push(row);
      return grouped;
    },
    {} as Record<string, BOQImportRow[]>
  );
}

/**
 * Get BOQ import summary statistics
 */
export function getBOQImportSummary(data: BOQImportRow[]) {
  const grouped = groupBOQByCategory(data);
  const totalCost = calculateBOQTotalCost(data);
  const totalQuantity = data.reduce((sum, row) => sum + row.quantity, 0);

  return {
    totalItems: data.length,
    totalQuantity,
    totalCost,
    estimatedCost: totalCost,
    categoriesCount: Object.keys(grouped).length,
    categories: Object.entries(grouped).map(([category, items]) => ({
      category,
      itemCount: items.length,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      cost: items.reduce((sum, item) => sum + (item.unitPrice ? item.quantity * item.unitPrice : 0), 0),
    })),
    itemsWithoutPrice: data.filter((item) => !item.unitPrice).length,
    itemsWithoutSupplier: data.filter((item) => !item.supplier).length,
  };
}
