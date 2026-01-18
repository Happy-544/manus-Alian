/**
 * Template Suggestion Service
 * Uses LLM to analyze project descriptions and suggest relevant templates
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { projectTemplates } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface TemplateSuggestion {
  templateId: number;
  templateName: string;
  category: string;
  description: string;
  confidenceScore: number;
  matchingReasons: string[];
  previewImage: string | undefined;
}

export interface SuggestionRequest {
  projectName: string;
  projectDescription: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  location?: string;
  userId: number;
}

/**
 * Analyze project description and suggest relevant templates
 */
export async function suggestTemplatesForProject(
  request: SuggestionRequest
): Promise<TemplateSuggestion[]> {
  try {
    // Get all available templates for the user
    const db = await getDb();
    if (!db) return [];

    const userTemplates = await db
      .select()
      .from(projectTemplates)
      .where(eq(projectTemplates.createdBy, request.userId));

    if (userTemplates.length === 0) {
      return [];
    }

    // Prepare template descriptions for LLM analysis
    const templateDescriptions = userTemplates
      .map(
        (t) =>
          `Template: ${t.name}\nCategory: ${t.category}\nDescription: ${t.description || "No description"}\nTags: ${t.tags || "No tags"}`
      )
      .join("\n---\n");

    // Create LLM prompt for template matching
    const prompt = `You are an expert project management consultant specializing in construction and fit-out projects.

Analyze the following project details and match them against available templates. Return a JSON array of suggestions with confidence scores (0-100) and matching reasons.

PROJECT DETAILS:
- Name: ${request.projectName}
- Description: ${request.projectDescription}
${request.projectType ? `- Type: ${request.projectType}` : ""}
${request.budget ? `- Budget: ${request.budget}` : ""}
${request.timeline ? `- Timeline: ${request.timeline}` : ""}
${request.location ? `- Location: ${request.location}` : ""}

AVAILABLE TEMPLATES:
${templateDescriptions}

For each template that matches the project:
1. Analyze semantic similarity between project description and template
2. Consider project type, budget, timeline, and location
3. Evaluate category and tags relevance
4. Assign a confidence score (0-100)
5. Provide 2-3 specific reasons for the match

Return ONLY a valid JSON array with this structure:
[
  {
    "templateName": "string",
    "confidenceScore": number,
    "matchingReasons": ["reason1", "reason2", "reason3"]
  }
]

Sort by confidence score (highest first). Include only templates with confidence >= 40.`;

    // Call LLM for analysis
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a JSON-generating assistant. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Parse LLM response
    let suggestions: Array<{
      templateName: string;
      confidenceScore: number;
      matchingReasons: string[];
    }> = [];

    try {
      const responseText =
        typeof response.choices[0].message.content === "string"
          ? response.choices[0].message.content
          : "";

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse LLM response:", parseError);
      return [];
    }

    // Map suggestions to template data
    const result: TemplateSuggestion[] = suggestions
      .map((suggestion) => {
        const template = userTemplates.find(
          (t) => t.name === suggestion.templateName
        );
        if (!template) return null;

        return {
          templateId: template.id,
          templateName: template.name,
          category: template.category,
          description: template.description || "",
          confidenceScore: suggestion.confidenceScore,
          matchingReasons: suggestion.matchingReasons,
          previewImage: template.previewImage || undefined,
        };
      })
      .filter((s): s is TemplateSuggestion => s !== null)
      .sort((a, b) => (b?.confidenceScore || 0) - (a?.confidenceScore || 0))
      .slice(0, 5); // Return top 5 suggestions

    return result;
  } catch (error) {
    console.error("Error suggesting templates:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to suggest templates for project"
    );
  }
}

/**
 * Get template details for display
 */
export async function getTemplateForSuggestion(templateId: number) {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(projectTemplates)
      .where(eq(projectTemplates.id, templateId));

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching template:", error);
    return null;
  }
}

/**
 * Calculate similarity score between two strings (simple implementation)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 100;

  const editDistance = getEditDistance(longer, shorter);
  return (
    ((longer.length - editDistance) / longer.length) * 100
  );
}

/**
 * Calculate Levenshtein distance between two strings
 */
function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
}
