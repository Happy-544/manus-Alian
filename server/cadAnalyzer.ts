import * as fs from 'fs';
import * as path from 'path';

/**
 * CAD Drawing Analyzer Service
 * Handles extraction of measurements and areas from CAD files (DWG, DXF, PDF)
 */

export interface Space {
  name: string;
  area: number;
  unit: string;
  length?: number;
  width?: number;
  height?: number;
  vertices?: Array<[number, number]>;
}

export interface Measurement {
  type: 'dimension' | 'area' | 'length' | 'width' | 'height';
  value: number;
  unit: string;
  location?: string;
  layer?: string;
}

export interface DrawingAnalysisResult {
  drawingCode?: string;
  drawingTitle?: string;
  spaces: Space[];
  measurements: Measurement[];
  totalArea: number;
  fileType: string;
}

/**
 * Analyze CAD file and extract measurements
 */
export async function analyzeCADFile(filePath: string): Promise<DrawingAnalysisResult> {
  const fileType = path.extname(filePath).toLowerCase().replace('.', '');

  switch (fileType) {
    case 'dxf':
      return analyzeDXFFile(filePath);
    case 'dwg':
      return analyzeDWGFile(filePath);
    case 'pdf':
      return analyzePDFFile(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Analyze DXF file
 */
async function analyzeDXFFile(filePath: string): Promise<DrawingAnalysisResult> {
  try {
    // For now, return a mock implementation
    // In production, use dxf-parser library
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const spaces: Space[] = [];
    const measurements: Measurement[] = [];
    let totalArea = 0;

    // Parse DXF content for LWPOLYLINE entities (closed polygons)
    const polylinePattern = /LWPOLYLINE[\s\S]*?(?=ENDSEC|ENDBLK)/g;
    const polylines = content.match(polylinePattern) || [];

    for (const polyline of polylines) {
      // Extract vertices
      const vertexPattern = /10\s+([\d.]+)\s+20\s+([\d.]+)/g;
      const vertices: Array<[number, number]> = [];
      let match;

      while ((match = vertexPattern.exec(polyline)) !== null) {
        vertices.push([parseFloat(match[1]), parseFloat(match[2])]);
      }

      if (vertices.length >= 3) {
        // Calculate area using Shoelace formula
        const area = calculatePolygonArea(vertices);
        
        // Convert from drawing units (mm) to m²
        const areaInSquareMeters = area / 1000000; // mm² to m²

        spaces.push({
          name: `Space ${spaces.length + 1}`,
          area: Math.round(areaInSquareMeters * 100) / 100,
          unit: 'm²',
          vertices,
        });

        totalArea += areaInSquareMeters;
      }
    }

    // Extract dimensions from TEXT and MTEXT entities
    const textPattern = /TEXT[\s\S]*?1\s+([\d.]+)\s+5\s+([\d.]+)\s+1\s+([^\n]+)/g;
    while ((match = textPattern.exec(content)) !== null) {
      const value = parseFloat(match[3]);
      if (!isNaN(value)) {
        measurements.push({
          type: 'dimension',
          value,
          unit: 'mm',
          location: `${match[1]}, ${match[2]}`,
        });
      }
    }

    return {
      spaces,
      measurements,
      totalArea: Math.round(totalArea * 100) / 100,
      fileType: 'dxf',
    };
  } catch (error) {
    throw new Error(`Failed to analyze DXF file: ${error}`);
  }
}

/**
 * Analyze DWG file
 * Note: DWG parsing requires specialized libraries or conversion to DXF first
 */
async function analyzeDWGFile(filePath: string): Promise<DrawingAnalysisResult> {
  // For production, use a library like 'dwg2dxf' to convert DWG to DXF
  // Then analyze the DXF file
  
  // Mock implementation for now
  return {
    spaces: [],
    measurements: [],
    totalArea: 0,
    fileType: 'dwg',
  };
}

/**
 * Analyze PDF file
 * Extract text and dimensions from PDF
 */
async function analyzePDFFile(filePath: string): Promise<DrawingAnalysisResult> {
  // For production, use pdf-lib or pdfjs-dist
  // Extract text content and parse dimensions
  
  // Mock implementation for now
  return {
    spaces: [],
    measurements: [],
    totalArea: 0,
    fileType: 'pdf',
  };
}

/**
 * Calculate polygon area using Shoelace formula
 * Vertices should be in order (clockwise or counterclockwise)
 */
export function calculatePolygonArea(vertices: Array<[number, number]>): number {
  if (vertices.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i][0] * vertices[j][1];
    area -= vertices[j][0] * vertices[i][1];
  }

  return Math.abs(area) / 2;
}

/**
 * Extract drawing code from filename or content
 * Pattern: A587-00-00-600 or A-201
 */
export function extractDrawingCode(fileName: string, content?: string): string | undefined {
  // Try to extract from filename first
  const filePattern = /([A-Z]\d{1,3}(?:-\d{2})*)/;
  const fileMatch = fileName.match(filePattern);
  if (fileMatch) return fileMatch[1];

  // Try to extract from content
  if (content) {
    const contentPattern = /([A-Z]\d{1,3}(?:-\d{2})*)/;
    const contentMatch = content.match(contentPattern);
    if (contentMatch) return contentMatch[1];
  }

  return undefined;
}

/**
 * Compare drawing area with BOQ area
 * Returns tolerance-based validation result
 */
export interface AreaComparisonResult {
  boqArea: number;
  drawingArea: number;
  percentDifference: number;
  isWithinTolerance: boolean;
  tolerancePercent: number;
}

export function compareAreas(
  boqArea: number,
  drawingArea: number,
  tolerancePercent: number = 2
): AreaComparisonResult {
  const percentDifference = Math.abs(boqArea - drawingArea) / drawingArea * 100;
  const isWithinTolerance = percentDifference <= tolerancePercent;

  return {
    boqArea,
    drawingArea,
    percentDifference: Math.round(percentDifference * 100) / 100,
    isWithinTolerance,
    tolerancePercent,
  };
}

/**
 * Validate BOQ area against drawing measurements
 */
export function validateBOQAreaAgainstDrawing(
  boqQuantity: number,
  boqUnit: string,
  drawingArea: number,
  tolerancePercent: number = 2
): { isValid: boolean; message: string; details: AreaComparisonResult } {
  // Convert BOQ quantity to area if unit is m² or similar
  let boqArea = boqQuantity;
  
  if (boqUnit !== 'm²' && boqUnit !== 'sqm') {
    // If unit is not area-based, we can't directly compare
    return {
      isValid: true,
      message: 'Cannot validate area for non-area-based units',
      details: {
        boqArea: 0,
        drawingArea,
        percentDifference: 0,
        isWithinTolerance: true,
        tolerancePercent,
      },
    };
  }

  const comparison = compareAreas(boqArea, drawingArea, tolerancePercent);

  return {
    isValid: comparison.isWithinTolerance,
    message: comparison.isWithinTolerance
      ? `Area matches within ${tolerancePercent}% tolerance`
      : `Area mismatch: BOQ ${boqArea}m² vs Drawing ${drawingArea}m² (${comparison.percentDifference}% difference)`,
    details: comparison,
  };
}

/**
 * Extract spaces from drawing analysis result
 * Filters and sorts by area
 */
export function extractSpacesSummary(result: DrawingAnalysisResult): Space[] {
  return result.spaces
    .sort((a, b) => b.area - a.area)
    .map((space, index) => ({
      ...space,
      name: space.name || `Space ${index + 1}`,
    }));
}

/**
 * Generate drawing analysis summary
 */
export function generateDrawingAnalysisSummary(result: DrawingAnalysisResult) {
  const largestSpace = result.spaces.length > 0
    ? result.spaces.reduce((max, space) => space.area > max.area ? space : max)
    : null;

  const smallestSpace = result.spaces.length > 0
    ? result.spaces.reduce((min, space) => space.area < min.area ? space : min)
    : null;

  const averageSpaceArea = result.spaces.length > 0
    ? result.totalArea / result.spaces.length
    : 0;

  return {
    totalSpaces: result.spaces.length,
    totalArea: result.totalArea,
    averageSpaceArea: Math.round(averageSpaceArea * 100) / 100,
    largestSpace: largestSpace ? {
      name: largestSpace.name,
      area: largestSpace.area,
    } : null,
    smallestSpace: smallestSpace ? {
      name: smallestSpace.name,
      area: smallestSpace.area,
    } : null,
    totalMeasurements: result.measurements.length,
  };
}
