/**
 * BOQ Gap Completion Service
 * Detects missing BOQ data and provides AI-powered suggestions
 */

import { invokeLLM } from "./_core/llm";

export interface BOQLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  supplier?: string;
  leadTime?: number; // days
  category: string;
  drawingReference?: string;
  location?: string;
  material?: string;
  brand?: string;
}

export interface GapAnalysis {
  itemId: string;
  missingFields: string[];
  severity: "HIGH" | "MEDIUM" | "LOW";
  suggestions: {
    unitPrice?: PriceSuggestion;
    supplier?: SupplierSuggestion;
    leadTime?: LeadTimeSuggestion;
  };
}

export interface PriceSuggestion {
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  confidence: number; // 0-1
  source: string;
  lastUpdated: Date;
}

export interface SupplierSuggestion {
  suppliers: {
    name: string;
    rating: number; // 0-5
    leadTime: number; // days
    minOrder: number;
    pricePerUnit: number;
    contact: string;
    specialization: string[];
  }[];
  confidence: number; // 0-1
}

export interface LeadTimeSuggestion {
  suggestedLeadTime: number; // days
  range: { min: number; max: number };
  confidence: number; // 0-1
  factors: string[];
}

/**
 * Analyze BOQ items and detect missing data
 */
export function detectMissingData(items: BOQLineItem[]): GapAnalysis[] {
  const gaps: GapAnalysis[] = [];

  for (const item of items) {
    const missingFields: string[] = [];
    let severity: "HIGH" | "MEDIUM" | "LOW" = "LOW";

    // Check for missing critical fields
    if (!item.unitPrice || item.unitPrice === 0) {
      missingFields.push("unitPrice");
      severity = "HIGH";
    }

    if (!item.supplier) {
      missingFields.push("supplier");
      severity = severity === "HIGH" ? "HIGH" : "MEDIUM";
    }

    if (!item.leadTime || item.leadTime === 0) {
      missingFields.push("leadTime");
      severity = severity === "HIGH" ? "HIGH" : "MEDIUM";
    }

    // Check for missing optional but useful fields
    if (!item.material) {
      missingFields.push("material");
    }

    if (!item.brand) {
      missingFields.push("brand");
    }

    if (missingFields.length > 0) {
      gaps.push({
        itemId: item.id,
        missingFields,
        severity,
        suggestions: {},
      });
    }
  }

  return gaps;
}

/**
 * Generate AI suggestions for unit prices based on item description and category
 */
export async function suggestUnitPrice(
  item: BOQLineItem,
  marketData?: Record<string, number>
): Promise<PriceSuggestion> {
  // First, check market data for similar items
  if (marketData && marketData[item.category]) {
    return {
      suggestedPrice: marketData[item.category],
      priceRange: {
        min: marketData[item.category] * 0.85,
        max: marketData[item.category] * 1.15,
      },
      confidence: 0.8,
      source: "Dubai Market Data",
      lastUpdated: new Date(),
    };
  }

  // Use LLM to generate price suggestion based on description
  const prompt = `Based on the following item description and category, suggest a reasonable unit price in AED for a luxury fit-out project in Dubai:

Item: ${item.description}
Category: ${item.category}
Unit: ${item.unit}
Quantity: ${item.quantity}
Material: ${item.material || "Not specified"}
Brand: ${item.brand || "Not specified"}

Provide a JSON response with:
{
  "suggestedPrice": <number>,
  "minPrice": <number>,
  "maxPrice": <number>,
  "reasoning": "<brief explanation>"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a fit-out project cost estimation expert for luxury projects in Dubai. Provide realistic pricing based on market rates.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "price_suggestion",
          strict: true,
          schema: {
            type: "object",
            properties: {
              suggestedPrice: { type: "number" },
              minPrice: { type: "number" },
              maxPrice: { type: "number" },
              reasoning: { type: "string" },
            },
            required: ["suggestedPrice", "minPrice", "maxPrice"],
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const parsed = typeof content === "string" ? JSON.parse(content) : content;

    return {
      suggestedPrice: parsed.suggestedPrice,
      priceRange: { min: parsed.minPrice, max: parsed.maxPrice },
      confidence: 0.75,
      source: "AI Analysis",
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("Error generating price suggestion:", error);
    // Return a fallback suggestion
    return {
      suggestedPrice: 0,
      priceRange: { min: 0, max: 0 },
      confidence: 0,
      source: "Error",
      lastUpdated: new Date(),
    };
  }
}

/**
 * Generate supplier suggestions based on item category and specifications
 */
export async function suggestSuppliers(
  item: BOQLineItem,
  supplierDatabase?: any[]
): Promise<SupplierSuggestion> {
  // Check local supplier database first
  if (supplierDatabase && supplierDatabase.length > 0) {
    const relevantSuppliers = supplierDatabase
      .filter(
        (s) =>
          s.specialization.includes(item.category) ||
          s.specialization.includes(item.material || "")
      )
      .slice(0, 3)
      .map((s) => ({
        name: s.name,
        rating: s.rating,
        leadTime: s.leadTime,
        minOrder: s.minOrder,
        pricePerUnit: s.pricePerUnit,
        contact: s.contact,
        specialization: s.specialization,
      }));

    if (relevantSuppliers.length > 0) {
      return {
        suppliers: relevantSuppliers,
        confidence: 0.85,
      };
    }
  }

  // Use LLM to generate supplier suggestions
  const prompt = `Suggest 3 reputable suppliers in Dubai for the following item:

Item: ${item.description}
Category: ${item.category}
Material: ${item.material || "Not specified"}
Brand: ${item.brand || "Not specified"}

For a luxury fit-out project, provide JSON response with:
{
  "suppliers": [
    {
      "name": "<supplier name>",
      "rating": <1-5>,
      "leadTime": <days>,
      "minOrder": <quantity>,
      "pricePerUnit": <AED>,
      "contact": "<email/phone>",
      "specialization": ["<category1>", "<category2>"]
    }
  ]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a procurement expert for luxury fit-out projects in Dubai. Suggest reliable suppliers with accurate lead times and pricing.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "supplier_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              suppliers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    rating: { type: "number" },
                    leadTime: { type: "number" },
                    minOrder: { type: "number" },
                    pricePerUnit: { type: "number" },
                    contact: { type: "string" },
                    specialization: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
            required: ["suppliers"],
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const parsed = typeof content === "string" ? JSON.parse(content) : content;

    return {
      suppliers: parsed.suppliers,
      confidence: 0.7,
    };
  } catch (error) {
    console.error("Error generating supplier suggestions:", error);
    return {
      suppliers: [],
      confidence: 0,
    };
  }
}

/**
 * Generate lead time suggestions based on item and supplier
 */
export async function suggestLeadTime(
  item: BOQLineItem,
  supplier?: string
): Promise<LeadTimeSuggestion> {
  const prompt = `Estimate the lead time for the following item from Dubai suppliers:

Item: ${item.description}
Category: ${item.category}
Material: ${item.material || "Not specified"}
Supplier: ${supplier || "Local supplier"}
Quantity: ${item.quantity}

Provide JSON response with:
{
  "leadTime": <days>,
  "minDays": <number>,
  "maxDays": <number>,
  "factors": ["<factor1>", "<factor2>"]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a supply chain expert for Dubai fit-out projects. Provide realistic lead time estimates based on item type and supplier.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lead_time_suggestion",
          strict: true,
          schema: {
            type: "object",
            properties: {
              leadTime: { type: "number" },
              minDays: { type: "number" },
              maxDays: { type: "number" },
              factors: { type: "array", items: { type: "string" } },
            },
            required: ["leadTime", "minDays", "maxDays"],
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const parsed = typeof content === "string" ? JSON.parse(content) : content;

    return {
      suggestedLeadTime: parsed.leadTime,
      range: { min: parsed.minDays, max: parsed.maxDays },
      confidence: 0.75,
      factors: parsed.factors || [],
    };
  } catch (error) {
    console.error("Error generating lead time suggestion:", error);
    return {
      suggestedLeadTime: 14,
      range: { min: 7, max: 21 },
      confidence: 0,
      factors: ["Error in estimation"],
    };
  }
}

/**
 * Generate comprehensive gap analysis with all suggestions
 */
export async function generateGapAnalysisWithSuggestions(
  items: BOQLineItem[],
  marketData?: Record<string, number>,
  supplierDatabase?: any[]
): Promise<GapAnalysis[]> {
  const gaps = detectMissingData(items);

  // Generate suggestions for each gap
  for (const gap of gaps) {
    const item = items.find((i) => i.id === gap.itemId);
    if (!item) continue;

    if (gap.missingFields.includes("unitPrice")) {
      gap.suggestions.unitPrice = await suggestUnitPrice(item, marketData);
    }

    if (gap.missingFields.includes("supplier")) {
      gap.suggestions.supplier = await suggestSuppliers(item, supplierDatabase);
    }

    if (gap.missingFields.includes("leadTime")) {
      gap.suggestions.leadTime = await suggestLeadTime(
        item,
        item.supplier
      );
    }
  }

  return gaps;
}

/**
 * Validate completed BOQ data
 */
export function validateBOQData(item: BOQLineItem): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!item.description || item.description.trim() === "") {
    errors.push("Description is required");
  }

  if (!item.quantity || item.quantity <= 0) {
    errors.push("Quantity must be greater than 0");
  }

  if (!item.unit || item.unit.trim() === "") {
    errors.push("Unit is required");
  }

  if (!item.unitPrice || item.unitPrice <= 0) {
    errors.push("Unit price must be greater than 0");
  }

  if (!item.supplier || item.supplier.trim() === "") {
    errors.push("Supplier is required");
  }

  if (!item.leadTime || item.leadTime <= 0) {
    errors.push("Lead time must be greater than 0");
  }

  if (!item.category || item.category.trim() === "") {
    errors.push("Category is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
