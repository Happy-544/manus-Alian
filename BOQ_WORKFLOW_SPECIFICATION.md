# Professional BOQ & Drawing Analysis Workflow Specification

## Overview

This document defines the professional workflow for analyzing Bill of Quantities (BOQ) and Drawing files, validating data, identifying gaps, and generating professional deliverables for fit-out projects.

---

## 1. BOQ Template Schema

### 1.1 Standard BOQ Categories

The BOQ is organized into the following professional categories:

| Category | Description | Key Fields |
|----------|-------------|-----------|
| **Structural Works** | Foundation, walls, columns, slabs | Material, Quantity, Unit, Unit Rate, Total Cost |
| **Architectural Finishes** | Flooring, wall finishes, ceilings, doors, windows | Type, Finish, Quantity, Unit, Unit Rate, Total Cost |
| **MEP Systems** | Mechanical, Electrical, Plumbing installations | System Type, Capacity, Quantity, Unit Rate, Total Cost |
| **Soft Furnishings** | Furniture, fixtures, fittings (FF&E) | Item, Specification, Quantity, Unit, Unit Rate, Total Cost |
| **Specialist Works** | Kitchens, bathrooms, specialized installations | Work Type, Specification, Quantity, Unit Rate, Total Cost |
| **Contingency & Provisional** | Contingency allowance, provisional sums | Item, Amount, Percentage |

### 1.2 BOQ Line Item Structure

Each BOQ line item must contain:

```json
{
  "lineNumber": "1.1.1",
  "category": "Structural Works",
  "description": "Reinforced concrete foundation",
  "specification": "Grade C30 concrete, reinforced with steel",
  "quantity": 250,
  "unit": "m³",
  "unitRate": 450,
  "totalCost": 112500,
  "supplier": "Optional",
  "leadTime": "Optional (days)",
  "notes": "Optional notes",
  "drawingReference": ["A-101", "A-102"],
  "status": "confirmed | pending | estimated"
}
```

### 1.3 Mandatory vs Optional Fields

**Mandatory Fields** (must be completed):
- Line Number
- Category
- Description
- Specification
- Quantity
- Unit
- Unit Rate
- Total Cost
- Drawing Reference (at least one)

**Optional Fields** (can be filled later):
- Supplier
- Lead Time
- Notes

---

## 2. Drawing Reference System

### 2.1 Drawing Classification

Drawings are classified by type and referenced in BOQ:

| Drawing Type | Code Format | Purpose |
|--------------|-------------|---------|
| **Architectural Plans** | A-XXX | Floor plans, elevations, sections |
| **Structural Plans** | S-XXX | Structural details, reinforcement |
| **MEP Plans** | M-XXX | Mechanical, Electrical, Plumbing layouts |
| **Finishing Plans** | F-XXX | Material finishes, color schemes |
| **Details** | D-XXX | Construction details, specifications |

### 2.2 Drawing-to-BOQ Cross-Reference

Each BOQ line item must reference at least one drawing:

```json
{
  "boqLineId": "1.1.1",
  "drawingReferences": [
    {
      "drawingCode": "A-101",
      "drawingTitle": "Ground Floor Plan",
      "relevantArea": "Foundation area shown in plan",
      "validationStatus": "confirmed | needs_review | mismatch"
    }
  ]
}
```

---

## 3. BOQ Validation Rules

### 3.1 Data Quality Checks

| Check | Rule | Action if Failed |
|-------|------|-----------------|
| **Completeness** | All mandatory fields present | Flag as incomplete, request user input |
| **Numeric Validation** | Quantity > 0, Unit Rate > 0, Total = Qty × Rate | Highlight error, suggest correction |
| **Unit Consistency** | Units match category standards | Suggest standard unit, allow override |
| **Drawing Reference** | At least one valid drawing reference | Request drawing reference |
| **Cost Reasonableness** | Unit rates within market range for Dubai | Flag outliers, request confirmation |
| **Total Cost Accuracy** | Sum of line items matches BOQ total | Recalculate and verify |

### 3.2 Gap Detection

The system identifies missing information:

```json
{
  "boqLineId": "1.1.1",
  "gaps": [
    {
      "field": "supplier",
      "severity": "medium",
      "message": "Supplier not specified. Required for procurement planning.",
      "suggestedAction": "Select supplier from approved list or add new supplier"
    },
    {
      "field": "leadTime",
      "severity": "high",
      "message": "Lead time not specified. Critical for project scheduling.",
      "suggestedAction": "Enter lead time in days or contact supplier"
    }
  ]
}
```

---

## 4. AI Analysis & Gap Completion Workflow

### 4.1 Automated Analysis Process

1. **Extract Data** - Parse BOQ file (Excel/PDF) and extract line items
2. **Validate Data** - Run all validation rules
3. **Cross-Reference** - Match BOQ items with drawing references
4. **Identify Gaps** - Detect missing or incomplete information
5. **Generate Prompts** - Create user prompts for missing data
6. **Collect Input** - User completes missing information
7. **Verify** - Re-validate completed BOQ
8. **Approve** - Mark BOQ as ready for deliverable generation

### 4.2 User Prompt Template

```json
{
  "promptId": "gap_001",
  "boqLineId": "1.1.1",
  "field": "supplier",
  "question": "Which supplier will provide the reinforced concrete for the foundation?",
  "options": ["Supplier A", "Supplier B", "Supplier C", "Other"],
  "priority": "high",
  "estimatedTime": "2 minutes"
}
```

---

## 5. Professional Deliverable Templates

### 5.1 Deliverable Types

Each deliverable is generated as a separate, professionally formatted document:

| Deliverable | Purpose | Key Content |
|------------|---------|------------|
| **Baseline Program** | Project schedule and milestones | Work breakdown, timeline, critical path |
| **Procurement Log** | Supplier and procurement tracking | Suppliers, lead times, order dates, delivery |
| **Engineering Log** | Technical specifications and approvals | Specifications, approvals, changes, RFIs |
| **Budget Estimation** | Detailed cost breakdown and analysis | Line items, costs, contingency, totals |
| **Value Engineering** | Cost optimization recommendations | Alternatives, savings, trade-offs |
| **Risk Assessment** | Project risks and mitigation strategies | Risks, probability, impact, mitigation |

### 5.2 Document Structure

Each deliverable follows this professional structure:

```
1. Cover Page
   - Project name, location, date
   - Client, contractor, consultant names
   - Document title and version

2. Executive Summary
   - Key findings and recommendations
   - Critical items and risks
   - Timeline overview

3. Detailed Analysis
   - Category-by-category breakdown
   - Data tables and visualizations
   - Supporting calculations

4. Appendices
   - BOQ summary
   - Drawing references
   - Supplier information
   - Assumptions and notes
```

---

## 6. Data Extraction & Mapping System

### 6.1 BOQ File Parsing

**Excel BOQ Format:**
- Column A: Line Number
- Column B: Category
- Column C: Description
- Column D: Specification
- Column E: Quantity
- Column F: Unit
- Column G: Unit Rate
- Column H: Total Cost
- Column I: Drawing References (comma-separated)

**PDF BOQ Format:**
- Extract table data using OCR
- Parse line items from structured tables
- Identify drawing references from text

### 6.2 Data Transformation Rules

```json
{
  "transformations": [
    {
      "source": "Raw BOQ quantity",
      "target": "Normalized quantity",
      "rule": "Convert to standard unit (m³, m², kg, etc.)"
    },
    {
      "source": "Unit rate (various currencies)",
      "target": "Standardized AED rate",
      "rule": "Apply exchange rate if needed"
    },
    {
      "source": "Drawing reference text",
      "target": "Structured drawing code",
      "rule": "Parse and validate against drawing database"
    }
  ]
}
```

---

## 7. Workflow Integration Points

### 7.1 Database Schema Extensions

**BOQ Template Table:**
```sql
CREATE TABLE boq_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  projectId INT NOT NULL,
  fileName VARCHAR(255),
  fileUrl VARCHAR(500),
  uploadDate TIMESTAMP,
  status ENUM('uploaded', 'parsing', 'validating', 'gaps_identified', 'completed', 'approved'),
  totalLineItems INT,
  completedLineItems INT,
  gapCount INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id)
);
```

**BOQ Line Items Table:**
```sql
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
  supplier VARCHAR(255),
  leadTime INT,
  drawingReferences JSON,
  validationStatus ENUM('valid', 'warning', 'error'),
  gaps JSON,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (boqTemplateId) REFERENCES boq_templates(id)
);
```

### 7.2 API Endpoints

- `POST /api/boq/upload` - Upload BOQ file
- `GET /api/boq/{id}/validate` - Validate BOQ
- `GET /api/boq/{id}/gaps` - Get identified gaps
- `POST /api/boq/{id}/complete` - Submit gap completion
- `POST /api/boq/{id}/approve` - Approve BOQ for deliverables
- `POST /api/deliverables/generate` - Generate all deliverables

---

## 8. Professional Formatting Standards

### 8.1 Document Styling

- **Font**: Calibri 11pt (body), 16pt (headings)
- **Colors**: Navy blue (#0B1E3D) headers, gold (#D4AF37) accents
- **Spacing**: 1.5 line spacing, 1" margins
- **Tables**: Professional borders, alternating row colors
- **Charts**: High-quality visualizations with legends

### 8.2 Professional Elements

- Company logo on cover page
- Project information header on each page
- Page numbers and document version
- Table of contents with page references
- Professional footer with date and confidentiality notice

---

## 9. Quality Assurance

### 9.1 Validation Checklist

- [ ] All mandatory BOQ fields completed
- [ ] All numeric values validated
- [ ] All drawing references confirmed
- [ ] No cost discrepancies
- [ ] Supplier information complete
- [ ] Lead times realistic
- [ ] BOQ total matches sum of line items
- [ ] Professional formatting applied

### 9.2 Sign-Off Process

1. Project Manager reviews BOQ
2. Consultant approves BOQ
3. Client confirms BOQ accuracy
4. System generates deliverables
5. Documents delivered to stakeholders

---

## 10. Implementation Roadmap

**Phase 1**: BOQ template schema and validation rules
**Phase 2**: Drawing cross-reference system
**Phase 3**: AI gap detection and user prompts
**Phase 4**: Professional deliverable templates
**Phase 5**: Complete workflow integration
**Phase 6**: Testing and documentation

---

## Appendix: Sample BOQ Line Item

```json
{
  "lineNumber": "2.1.5",
  "category": "Architectural Finishes",
  "description": "Marble flooring - Main lobby",
  "specification": "Italian Carrara marble, 600x600mm, honed finish, installed with epoxy adhesive",
  "quantity": 150,
  "unit": "m²",
  "unitRate": 350,
  "totalCost": 52500,
  "supplier": "Italian Marble Imports LLC",
  "leadTime": 45,
  "drawingReferences": ["A-201", "F-101", "D-305"],
  "status": "confirmed",
  "notes": "Requires sample approval before ordering. Special handling for delivery.",
  "validationStatus": "valid",
  "gaps": []
}
```
