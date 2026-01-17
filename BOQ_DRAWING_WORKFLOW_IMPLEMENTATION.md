# BOQ & Drawing Analysis Workflow - Implementation Specification

## Executive Summary

This specification defines the complete implementation of an automated BOQ and Drawing analysis workflow that:
1. **Extracts BOQ data** from Excel files with validation
2. **Analyzes CAD drawings** to extract measurements and calculate areas
3. **Validates BOQ data** against drawing measurements with 2% tolerance
4. **Detects conflicts** and highlights discrepancies to users
5. **Generates professional deliverables** based on validated data

---

## 1. BOQ Parser & Extraction System

### 1.1 Excel BOQ File Parsing

**Input**: Excel file (XLSX format) with multiple worksheets
**Output**: Structured BOQ data with validation status

#### Parsing Algorithm
```
1. Read Excel file and identify all worksheets
2. For each worksheet:
   a. Skip header rows (identify by keywords: "SL NO", "Item Description")
   b. Extract data rows with pattern matching
   c. Parse columns: SL NO, Description, Qty, Unit, Unit Price, Amount, Remarks
   d. Extract metadata: Drawing references, Locations, Specifications
3. Validate extracted data
4. Return structured BOQ with validation results
```

#### Data Extraction Rules

**Column Mapping**:
- Column A: SL NO (line number)
- Column B: Item Description (includes specs, dimensions, drawing refs)
- Column C: Qty (quantity - numeric)
- Column D: Unit (unit of measurement)
- Column E: Unit Price (AED - numeric)
- Column F: Amount (AED - numeric)
- Column G: Remarks (supplier, status, notes)

**Text Parsing from Description**:
- Extract drawing references: Pattern "A587-00-00-600" or "A-201"
- Extract dimensions: Pattern "2100x2400 mm" or "600x600mm"
- Extract locations: Pattern "Location: [text]"
- Extract material: Pattern "Material: [text]" or after colon
- Extract brand: Pattern "Brand: [text]" or "Dorma or equivalent"

**Example Parsing**:
```
Input: "D1 - Supply and fixing of 12 mm thick clear tempered frameless glass door, 
patch fitting, standard floor spring and 900 mm long brushed finished SS handle. 
Door size: 2100x2400 mm. Fittings: Dorma or equivalent. Ref dwg no: A587-00-00-600. 
Location: Common corridor, 5cc, Other VAC 1"

Extracted:
{
  "lineNumber": "1",
  "category": "Doors",
  "description": "Frameless glass door",
  "specification": "12mm clear tempered glass, floor spring, SS handle",
  "dimensions": "2100x2400 mm",
  "quantity": 4,
  "unit": "nos",
  "unitPrice": 12000,
  "amount": 48000,
  "drawingReferences": ["A587-00-00-600"],
  "locations": ["Common corridor", "5cc", "Other VAC 1"],
  "brand": "Dorma",
  "remarks": ""
}
```

### 1.2 BOQ Validation Rules

**Numeric Validation**:
- Quantity > 0
- Unit Price > 0
- Amount = Quantity × Unit Price (with 0.01 tolerance)
- Flag discrepancies

**Unit Validation**:
- Standardize units: nos, m², m³, item, LS, kg, etc.
- Flag non-standard units
- Suggest standard unit

**Drawing Reference Validation**:
- Minimum 1 drawing reference per item
- Validate format (A-XXX, S-XXX, M-XXX, F-XXX, D-XXX)
- Flag invalid references

**Completeness Check**:
- Flag missing quantities
- Flag missing unit prices
- Flag missing drawing references
- Flag items with 0 amount

### 1.3 BOQ Category Mapping

Map Excel worksheets to standard categories:

```json
{
  "categoryMappings": [
    {
      "excelSheet": "Preamble & General",
      "standardCategory": "Project Setup & Management",
      "categoryCode": "GEN"
    },
    {
      "excelSheet": "Design & Approvals",
      "standardCategory": "Design & Approvals",
      "categoryCode": "DES"
    },
    {
      "excelSheet": "Doors",
      "standardCategory": "Architectural Finishes - Doors",
      "categoryCode": "ARC-DOR"
    },
    {
      "excelSheet": "Floor & Floor Finishes",
      "standardCategory": "Architectural Finishes - Flooring",
      "categoryCode": "ARC-FLR"
    },
    {
      "excelSheet": "Walls & Wall Finishes",
      "standardCategory": "Architectural Finishes - Walls",
      "categoryCode": "ARC-WAL"
    },
    {
      "excelSheet": "Ceiling Finishes",
      "standardCategory": "Architectural Finishes - Ceilings",
      "categoryCode": "ARC-CEL"
    },
    {
      "excelSheet": "Electrical & Lighting",
      "standardCategory": "MEP Systems - Electrical",
      "categoryCode": "MEP-ELE"
    },
    {
      "excelSheet": "FIRE FIGHTING & FIRE ALARM",
      "standardCategory": "MEP Systems - Fire Safety",
      "categoryCode": "MEP-FIR"
    },
    {
      "excelSheet": "HVAC",
      "standardCategory": "MEP Systems - HVAC",
      "categoryCode": "MEP-HVA"
    },
    {
      "excelSheet": "PLUMBING & DRAINAGE",
      "standardCategory": "MEP Systems - Plumbing",
      "categoryCode": "MEP-PLU"
    },
    {
      "excelSheet": "DATA & VOICE",
      "standardCategory": "MEP Systems - Communications",
      "categoryCode": "MEP-DAT"
    },
    {
      "excelSheet": "Signage",
      "standardCategory": "Specialist Works - Signage",
      "categoryCode": "SPC-SIG"
    }
  ]
}
```

---

## 2. CAD Drawing Analysis Tool

### 2.1 CAD File Support

**Supported Formats**:
- DWG (AutoCAD native format)
- DXF (Drawing Exchange Format)
- PDF (scanned/exported drawings)

**Drawing Analysis Libraries**:
- `dxf-parser` - Parse DXF files
- `dwg2dxf` - Convert DWG to DXF
- `pdf-lib` - Extract PDF content
- `canvas` - Render and measure drawings

### 2.2 Measurement Extraction Algorithm

#### Step 1: Parse Drawing File
```
1. Read CAD file (DWG/DXF/PDF)
2. Extract drawing layers and entities
3. Identify dimension entities (DIMENSION, MTEXT, TEXT)
4. Extract coordinate data (X, Y, Z)
5. Parse dimension values and units
```

#### Step 2: Identify Spaces & Areas
```
1. Identify closed polygons (rooms, spaces)
2. Extract polygon vertices and coordinates
3. Calculate area using Shoelace formula:
   Area = 0.5 × |Σ(x_i × y_{i+1} - x_{i+1} × y_i)|
4. Convert to standard units (m²)
5. Assign space names from drawing labels
```

#### Step 3: Extract Dimensions
```
1. Parse dimension text from drawing
2. Extract numeric values
3. Identify dimension type (length, width, height, area)
4. Convert to standard units (mm → m)
5. Create dimension records with location reference
```

### 2.3 Drawing Reference Mapping

**Drawing Code Structure**:
- Format: `[Type]-[Sheet]-[Block]-[Item]`
- Example: `A587-00-00-600` (Architectural, Sheet 00, Block 00, Item 600)

**Space Identification**:
- Extract space names from drawing labels
- Match with BOQ locations
- Create space-to-BOQ mapping

**Example Mapping**:
```json
{
  "drawingCode": "A587-00-00-600",
  "drawingTitle": "Ground Floor Plan",
  "spaces": [
    {
      "spaceName": "Common Corridor",
      "area": 125.5,
      "unit": "m²",
      "dimensions": {
        "length": 50.2,
        "width": 2.5
      }
    },
    {
      "spaceName": "5cc Office",
      "area": 45.8,
      "unit": "m²",
      "dimensions": {
        "length": 9.1,
        "width": 5.0
      }
    }
  ]
}
```

### 2.4 CAD Data Extraction Process

```python
class CADAnalyzer:
    def __init__(self, filePath):
        self.filePath = filePath
        self.fileType = self.detectFileType()
    
    def extractMeasurements(self):
        """Extract all measurements from CAD file"""
        if self.fileType == 'DWG':
            return self.extractFromDWG()
        elif self.fileType == 'DXF':
            return self.extractFromDXF()
        elif self.fileType == 'PDF':
            return self.extractFromPDF()
    
    def extractFromDXF(self):
        """Parse DXF file and extract dimensions"""
        dxf = dxf_parser.parse(self.filePath)
        measurements = []
        
        for entity in dxf.entities:
            if entity.type == 'DIMENSION':
                measurements.append({
                    'type': 'dimension',
                    'value': entity.text,
                    'location': entity.insert,
                    'layer': entity.layer
                })
            elif entity.type == 'LWPOLYLINE':
                area = self.calculatePolygonArea(entity.points)
                measurements.append({
                    'type': 'area',
                    'value': area,
                    'layer': entity.layer,
                    'vertices': entity.points
                })
        
        return measurements
    
    def calculatePolygonArea(self, vertices):
        """Calculate area using Shoelace formula"""
        n = len(vertices)
        area = 0
        for i in range(n):
            j = (i + 1) % n
            area += vertices[i][0] * vertices[j][1]
            area -= vertices[j][0] * vertices[i][1]
        return abs(area) / 2
    
    def extractSpaces(self):
        """Identify and extract space information"""
        spaces = []
        measurements = self.extractMeasurements()
        
        for measurement in measurements:
            if measurement['type'] == 'area':
                space = {
                    'name': self.getSpaceNameFromLayer(measurement['layer']),
                    'area': measurement['value'],
                    'unit': 'm²',
                    'vertices': measurement.get('vertices', [])
                }
                spaces.append(space)
        
        return spaces
```

---

## 3. Conflict Detection & Validation System

### 3.1 Tolerance-Based Comparison

**Tolerance Rule**: 2% difference allowed between BOQ and Drawing measurements

```
Tolerance = 2%
Acceptable Range = Drawing Area × (1 ± 0.02)
Lower Limit = Drawing Area × 0.98
Upper Limit = Drawing Area × 1.02

If BOQ Area < Lower Limit or BOQ Area > Upper Limit:
    Status = "CONFLICT"
    Highlight to user
Else:
    Status = "VALIDATED"
```

### 3.2 Conflict Detection Algorithm

```python
class ConflictDetector:
    def __init__(self, boqData, drawingData, tolerance=0.02):
        self.boqData = boqData
        self.drawingData = drawingData
        self.tolerance = tolerance
        self.conflicts = []
    
    def detectConflicts(self):
        """Compare BOQ data with drawing measurements"""
        for boqItem in self.boqData:
            drawingRef = boqItem['drawingReferences'][0]
            drawingSpaces = self.findDrawingSpaces(drawingRef)
            
            for space in drawingSpaces:
                conflict = self.compareAreas(boqItem, space)
                if conflict:
                    self.conflicts.append(conflict)
        
        return self.conflicts
    
    def compareAreas(self, boqItem, drawingSpace):
        """Compare BOQ area with drawing area"""
        boqArea = self.calculateBOQArea(boqItem)
        drawingArea = drawingSpace['area']
        
        lowerLimit = drawingArea * (1 - self.tolerance)
        upperLimit = drawingArea * (1 + self.tolerance)
        
        if boqArea < lowerLimit or boqArea > upperLimit:
            percentDiff = abs(boqArea - drawingArea) / drawingArea * 100
            
            return {
                'boqLineId': boqItem['id'],
                'boqItem': boqItem['description'],
                'boqArea': boqArea,
                'drawingArea': drawingArea,
                'percentDifference': percentDiff,
                'status': 'CONFLICT',
                'severity': 'HIGH' if percentDiff > 5 else 'MEDIUM',
                'message': f"Area mismatch: BOQ {boqArea}m² vs Drawing {drawingArea}m² ({percentDiff:.2f}% difference)",
                'recommendation': "Review BOQ quantities and drawing measurements. Revise BOQ if drawing is accurate."
            }
        
        return None
    
    def calculateBOQArea(self, boqItem):
        """Calculate area from BOQ quantity and dimensions"""
        quantity = boqItem['quantity']
        unit = boqItem['unit']
        
        if unit == 'm²':
            return quantity
        elif unit == 'nos' and 'dimensions' in boqItem:
            # For items with count, use dimensions if available
            dims = boqItem['dimensions']
            return quantity * self.calculateDimensionArea(dims)
        else:
            return quantity
    
    def calculateDimensionArea(self, dimensions):
        """Calculate area from dimensions string"""
        # Parse "2100x2400 mm" format
        parts = dimensions.replace('mm', '').split('x')
        if len(parts) == 2:
            width = float(parts[0]) / 1000  # Convert mm to m
            height = float(parts[1]) / 1000
            return width * height
        return 0
```

### 3.3 Conflict Report Generation

```json
{
  "conflictReport": {
    "totalItems": 156,
    "validatedItems": 152,
    "conflictItems": 4,
    "conflicts": [
      {
        "boqLineId": "FLR-001",
        "boqItem": "Marble flooring - Main lobby",
        "boqArea": 155.0,
        "drawingArea": 150.5,
        "percentDifference": 2.98,
        "status": "CONFLICT",
        "severity": "MEDIUM",
        "message": "Area mismatch: BOQ 155.0m² vs Drawing 150.5m² (2.98% difference)",
        "recommendation": "Review BOQ quantities. Drawing shows 150.5m², BOQ allows 155.0m².",
        "action": "HIGHLIGHT_TO_USER"
      },
      {
        "boqLineId": "FLR-002",
        "boqItem": "Wooden flooring - Offices",
        "boqArea": 245.0,
        "drawingArea": 230.0,
        "percentDifference": 6.52,
        "status": "CONFLICT",
        "severity": "HIGH",
        "message": "Area mismatch: BOQ 245.0m² vs Drawing 230.0m² (6.52% difference)",
        "recommendation": "REVISE BOQ. Difference exceeds 2% tolerance. Recommend reducing to 230m² or verify drawing.",
        "action": "REQUIRE_USER_REVISION"
      }
    ]
  }
}
```

---

## 4. BOQ Template Mapping & Normalization

### 4.1 Data Normalization Process

```
Input: Raw extracted BOQ data
↓
Step 1: Clean text (remove extra spaces, standardize formatting)
↓
Step 2: Normalize units (convert to standard units)
↓
Step 3: Validate numeric values
↓
Step 4: Extract structured fields (dimensions, drawing refs, locations)
↓
Step 5: Map to standard categories
↓
Step 6: Validate against rules
↓
Output: Normalized BOQ template
```

### 4.2 Unit Normalization

```json
{
  "unitNormalization": {
    "nos": "Number of items",
    "m²": "Square meters",
    "m³": "Cubic meters",
    "m": "Linear meters",
    "kg": "Kilograms",
    "item": "Single item",
    "LS": "Lump Sum",
    "set": "Set of items",
    "box": "Box",
    "roll": "Roll",
    "pair": "Pair of items"
  },
  "conversionRules": [
    {
      "from": "sqm",
      "to": "m²"
    },
    {
      "from": "sq.m",
      "to": "m²"
    },
    {
      "from": "number",
      "to": "nos"
    },
    {
      "from": "pcs",
      "to": "nos"
    }
  ]
}
```

---

## 5. Gap Detection & User Prompts

### 5.1 Gap Identification

Gaps are identified for:
1. Missing unit prices
2. Missing quantities
3. Missing drawing references
4. Missing supplier information
5. Missing lead times
6. Conflict items requiring revision

### 5.2 Gap Completion Workflow

```
1. Identify gaps in BOQ
2. Generate user prompts for each gap
3. Display prompts in UI with priority
4. Collect user input
5. Validate input
6. Update BOQ
7. Re-validate
8. Mark as complete when all gaps resolved
```

### 5.3 Prompt Template

```json
{
  "prompt": {
    "promptId": "gap_FLR_001",
    "boqLineId": "FLR-001",
    "field": "unitPrice",
    "question": "What is the unit price for Marble flooring (m²)?",
    "context": {
      "item": "Marble flooring - Main lobby",
      "quantity": 150,
      "unit": "m²",
      "drawing": "A-201"
    },
    "suggestedValue": 350,
    "priority": "HIGH",
    "estimatedTime": "2 minutes",
    "helpText": "Enter the cost per square meter in AED"
  }
}
```

---

## 6. Professional Deliverable Generation

### 6.1 Deliverable Types

Each deliverable is generated as a separate professional document:

| Deliverable | File Format | Content |
|------------|-----------|---------|
| Baseline Program | PDF/DOCX | Project schedule, milestones, timeline |
| Procurement Log | PDF/DOCX | Suppliers, lead times, order schedule |
| Engineering Log | PDF/DOCX | Technical specs, approvals, RFIs |
| Budget Estimation | PDF/DOCX | Cost breakdown, contingency, totals |
| Value Engineering | PDF/DOCX | Cost optimization, alternatives |
| Risk Assessment | PDF/DOCX | Risks, probability, mitigation |

### 6.2 Document Generation Template

```python
class DeliverableGenerator:
    def __init__(self, boqData, projectInfo):
        self.boqData = boqData
        self.projectInfo = projectInfo
    
    def generateBaselineProgram(self):
        """Generate Baseline Program document"""
        doc = Document()
        
        # Cover page
        self.addCoverPage(doc)
        
        # Executive summary
        self.addExecutiveSummary(doc)
        
        # Project schedule
        self.addProjectSchedule(doc)
        
        # Milestone timeline
        self.addMilestoneTimeline(doc)
        
        # Critical path
        self.addCriticalPath(doc)
        
        # Appendices
        self.addAppendices(doc)
        
        return doc
    
    def generateBudgetEstimation(self):
        """Generate Budget Estimation document"""
        doc = Document()
        
        # Cover page
        self.addCoverPage(doc)
        
        # Executive summary
        self.addExecutiveSummary(doc)
        
        # Cost breakdown by category
        self.addCostBreakdown(doc)
        
        # Detailed line items
        self.addDetailedLineItems(doc)
        
        # Contingency analysis
        self.addContingencyAnalysis(doc)
        
        # Total cost summary
        self.addCostSummary(doc)
        
        # Appendices
        self.addAppendices(doc)
        
        return doc
```

---

## 7. Workflow Integration

### 7.1 Complete Workflow Process

```
User uploads BOQ (Excel) + Drawing (DWG/DXF/PDF)
↓
BOQ Parser extracts data
↓
CAD Analyzer extracts measurements
↓
Conflict Detector compares data
↓
If conflicts exist:
    → Display conflict report
    → Highlight items to user
    → Request revision
↓
Gap Detector identifies missing data
↓
User completes gaps via prompts
↓
Final validation
↓
Generate professional deliverables
↓
Download documents
```

### 7.2 Database Schema

```sql
-- BOQ Templates
CREATE TABLE boq_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  projectId INT NOT NULL,
  fileName VARCHAR(255),
  fileUrl VARCHAR(500),
  uploadDate TIMESTAMP,
  status ENUM('uploaded', 'parsing', 'validating', 'conflicts_detected', 'gaps_identified', 'completed', 'approved'),
  totalLineItems INT,
  completedLineItems INT,
  conflictCount INT,
  gapCount INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

-- BOQ Line Items
CREATE TABLE boq_line_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  boqTemplateId INT NOT NULL,
  lineNumber VARCHAR(50),
  category VARCHAR(100),
  description TEXT,
  specification TEXT,
  quantity DECIMAL(10, 2),
  unit VARCHAR(20),
  unitRate DECIMAL(12, 2),
  totalCost DECIMAL(15, 2),
  drawingReferences JSON,
  locations JSON,
  validationStatus ENUM('valid', 'conflict', 'gap', 'error'),
  conflicts JSON,
  gaps JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (boqTemplateId) REFERENCES boq_templates(id)
);

-- Drawing Analysis
CREATE TABLE drawing_analysis (
  id INT PRIMARY KEY AUTO_INCREMENT,
  projectId INT NOT NULL,
  fileName VARCHAR(255),
  fileUrl VARCHAR(500),
  fileType ENUM('DWG', 'DXF', 'PDF'),
  uploadDate TIMESTAMP,
  status ENUM('uploaded', 'analyzing', 'completed'),
  spaces JSON,
  measurements JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id)
);

-- Conflict Records
CREATE TABLE conflicts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  boqLineItemId INT NOT NULL,
  drawingAnalysisId INT,
  boqArea DECIMAL(10, 2),
  drawingArea DECIMAL(10, 2),
  percentDifference DECIMAL(5, 2),
  severity ENUM('LOW', 'MEDIUM', 'HIGH'),
  status ENUM('detected', 'acknowledged', 'resolved', 'revised'),
  resolution TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (boqLineItemId) REFERENCES boq_line_items(id),
  FOREIGN KEY (drawingAnalysisId) REFERENCES drawing_analysis(id)
);
```

### 7.3 API Endpoints

```
POST   /api/boq/upload              - Upload BOQ file
POST   /api/drawings/upload         - Upload CAD drawing
GET    /api/boq/{id}/parse          - Parse BOQ file
GET    /api/drawings/{id}/analyze   - Analyze drawing
GET    /api/conflicts/{boqId}       - Get conflict report
POST   /api/boq/{id}/resolve        - Resolve conflicts
GET    /api/boq/{id}/gaps           - Get gap prompts
POST   /api/boq/{id}/complete       - Submit gap completion
POST   /api/deliverables/generate   - Generate all deliverables
GET    /api/deliverables/{id}       - Download deliverable
```

---

## 8. Implementation Timeline

**Phase 1** (Week 1-2): BOQ Parser & Validation
**Phase 2** (Week 3-4): CAD Drawing Analysis
**Phase 3** (Week 5): Conflict Detection & Resolution
**Phase 4** (Week 6): Gap Detection & Completion
**Phase 5** (Week 7-8): Deliverable Generation
**Phase 6** (Week 9): UI Integration & Testing
**Phase 7** (Week 10): End-to-end Testing & Deployment

---

## 9. Quality Assurance

### 9.1 Testing Checklist

- [ ] BOQ parser correctly extracts all data
- [ ] Unit normalization works for all unit types
- [ ] Drawing analysis extracts measurements accurately
- [ ] Conflict detection identifies all discrepancies
- [ ] Tolerance calculation is correct (2%)
- [ ] Gap detection identifies all missing data
- [ ] User prompts are clear and actionable
- [ ] Deliverables are professionally formatted
- [ ] All calculations are accurate
- [ ] End-to-end workflow completes successfully

### 9.2 Sample Data Testing

Test with provided VFS Wafi Mall BOQ:
- 156 line items across 13 categories
- AED 7.34M total budget
- Multiple drawing references
- Mixed units and specifications

---

## 10. Success Criteria

1. ✅ BOQ data extracted with 100% accuracy
2. ✅ Drawing measurements extracted automatically
3. ✅ Conflicts detected with 2% tolerance
4. ✅ All gaps identified and prompted
5. ✅ Professional deliverables generated
6. ✅ Complete workflow automated
7. ✅ User experience is intuitive
8. ✅ Performance: BOQ processing < 5 seconds, Drawing analysis < 10 seconds

---

## Appendix: Sample Output

### BOQ Extraction Sample
```json
{
  "boqId": "VFS-001",
  "projectName": "VFS Interior Fitout - Wafi Mall",
  "totalItems": 156,
  "totalBudget": 7342265,
  "items": [
    {
      "lineNumber": "1",
      "category": "Doors",
      "description": "Frameless glass door",
      "specification": "12mm clear tempered glass, Dorma floor spring",
      "quantity": 4,
      "unit": "nos",
      "unitPrice": 12000,
      "totalCost": 48000,
      "drawingReferences": ["A587-00-00-600"],
      "locations": ["Common corridor", "5cc"],
      "validationStatus": "VALID"
    }
  ]
}
```

### Conflict Report Sample
```json
{
  "conflictReport": {
    "totalConflicts": 4,
    "conflicts": [
      {
        "boqLineId": "FLR-001",
        "item": "Marble flooring",
        "boqArea": 155.0,
        "drawingArea": 150.5,
        "percentDifference": 2.98,
        "severity": "MEDIUM",
        "action": "HIGHLIGHT_TO_USER"
      }
    ]
  }
}
```

