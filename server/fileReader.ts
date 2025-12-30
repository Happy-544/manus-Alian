import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export interface BOQData {
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitRate: number;
    total: number;
  }>;
  totalAmount: number;
  currency: string;
}

export interface DrawingData {
  title: string;
  description: string;
  scale: string;
  dimensions: string;
  areas: Array<{
    name: string;
    size: string;
  }>;
}

export async function readBOQFromExcel(filePath: string): Promise<BOQData> {
  try {
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const items = data.map((row: any) => ({
      description: row['Description'] || row['Item'] || '',
      quantity: parseFloat(row['Quantity'] || 0),
      unit: row['Unit'] || 'No',
      unitRate: parseFloat(row['Unit Rate'] || row['Rate'] || 0),
      total: parseFloat(row['Total'] || 0),
    }));

    const totalAmount = items.reduce((sum: number, item: any) => sum + item.total, 0);

    return {
      items,
      totalAmount,
      currency: 'AED',
    };
  } catch (error) {
    console.error('Error reading BOQ from Excel:', error);
    throw new Error('Failed to read BOQ file');
  }
}

export async function readBOQFromPDF(filePath: string): Promise<BOQData> {
  try {
    // For PDF, we'll extract text and parse it
    // This is a simplified version - in production, use pdf-parse
    const pdfParse = require('pdf-parse');
    const fileBuffer = fs.readFileSync(filePath);
    
    const data = await pdfParse(fileBuffer);
    const text = data.text;

    // Extract BOQ items from text (simplified parsing)
    const items: any[] = [];
    const lines = text.split('\n');
    
    let totalAmount = 0;
    for (const line of lines) {
      // Try to parse lines that look like BOQ entries
      const match = line.match(/(.+?)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
      if (match) {
        const item = {
          description: match[1].trim(),
          quantity: parseFloat(match[2]),
          unit: match[3],
          unitRate: parseFloat(match[4]),
          total: parseFloat(match[5]),
        };
        items.push(item);
        totalAmount += item.total;
      }
    }

    return {
      items: items.length > 0 ? items : [{ description: 'PDF content extracted', quantity: 1, unit: 'No', unitRate: 0, total: 0 }],
      totalAmount,
      currency: 'AED',
    };
  } catch (error) {
    console.error('Error reading BOQ from PDF:', error);
    throw new Error('Failed to read BOQ PDF file');
  }
}

export async function readDrawingFromPDF(filePath: string): Promise<DrawingData> {
  try {
    const pdfParse = require('pdf-parse');
    const fileBuffer = fs.readFileSync(filePath);
    
    const data = await pdfParse(fileBuffer);
    const text = data.text;

    // Extract drawing information from PDF text
    const titleMatch = text.match(/(?:Title|Project|Drawing):\s*(.+)/i);
    const scaleMatch = text.match(/(?:Scale|Scale:)\s*(.+)/i);
    const dimensionMatch = text.match(/(?:Dimensions|Size):\s*(.+)/i);

    return {
      title: titleMatch ? titleMatch[1].trim() : 'Drawing',
      description: text.substring(0, 500), // First 500 chars as description
      scale: scaleMatch ? scaleMatch[1].trim() : '1:100',
      dimensions: dimensionMatch ? dimensionMatch[1].trim() : 'Standard',
      areas: [
        {
          name: 'Main Area',
          size: 'To be determined from drawing',
        },
      ],
    };
  } catch (error) {
    console.error('Error reading Drawing from PDF:', error);
    throw new Error('Failed to read Drawing PDF file');
  }
}

export async function readCADFile(filePath: string): Promise<DrawingData> {
  try {
    // For CAD files, we'll read basic metadata
    // In production, use specialized CAD parsing libraries
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    return {
      title: path.basename(filePath),
      description: `CAD file: ${path.basename(filePath)}`,
      scale: '1:100',
      dimensions: 'To be extracted from CAD',
      areas: [
        {
          name: 'CAD Drawing',
          size: 'Requires CAD viewer for full details',
        },
      ],
    };
  } catch (error) {
    console.error('Error reading CAD file:', error);
    throw new Error('Failed to read CAD file');
  }
}

export async function detectFileType(filePath: string): Promise<'boq' | 'drawing' | 'unknown'> {
  const fileName = path.basename(filePath).toLowerCase();
  const ext = path.extname(fileName).toLowerCase();

  // Detect BOQ files
  if (fileName.includes('boq') || fileName.includes('bill of quantities')) {
    return 'boq';
  }
  if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
    return 'boq';
  }

  // Detect Drawing files
  if (fileName.includes('drawing') || fileName.includes('plan') || fileName.includes('layout')) {
    return 'drawing';
  }
  if (ext === '.pdf' || ext === '.dwg' || ext === '.dxf' || ext === '.rvt') {
    return 'drawing';
  }

  return 'unknown';
}

export async function readProjectFile(filePath: string): Promise<BOQData | DrawingData | null> {
  const fileType = await detectFileType(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (fileType === 'boq') {
    if (ext === '.xlsx' || ext === '.xls') {
      return await readBOQFromExcel(filePath);
    } else if (ext === '.pdf') {
      return await readBOQFromPDF(filePath);
    }
  } else if (fileType === 'drawing') {
    if (ext === '.pdf') {
      return await readDrawingFromPDF(filePath);
    } else if (ext === '.dwg' || ext === '.dxf' || ext === '.rvt') {
      return await readCADFile(filePath);
    }
  }

  return null;
}
