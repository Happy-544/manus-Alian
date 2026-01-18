/**
 * Bulk Import Service
 * Handles parallel processing of multiple project descriptions for template suggestions
 */

import { getDb } from "./db";
import { bulkImports, bulkImportItems, bulkImportResults } from "../drizzle/schema";
import { suggestTemplatesForProject } from "./templateSuggestions";
import { eq, and } from "drizzle-orm";

export interface BulkImportProject {
  projectName: string;
  projectDescription: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  location?: string;
}

export interface BulkImportProgress {
  bulkImportId: number;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  status: "pending" | "processing" | "completed" | "failed";
  errorMessage?: string;
}

/**
 * Parse CSV file content
 */
export function parseCSV(content: string): BulkImportProject[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV file must contain at least a header row and one data row");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const requiredHeaders = ["projectname", "projectdescription"];

  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(
      `CSV missing required columns: ${missingHeaders.join(", ")}. Required: projectName, projectDescription`
    );
  }

  const projects: BulkImportProject[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = line.split(",").map((v) => v.trim());
    const projectNameIdx = headers.indexOf("projectname");
    const projectDescIdx = headers.indexOf("projectdescription");
    const projectTypeIdx = headers.indexOf("projecttype");
    const budgetIdx = headers.indexOf("budget");
    const timelineIdx = headers.indexOf("timeline");
    const locationIdx = headers.indexOf("location");

    const projectName = values[projectNameIdx];
    const projectDescription = values[projectDescIdx];

    if (!projectName || !projectDescription) {
      throw new Error(
        `Row ${i + 1}: projectName and projectDescription are required`
      );
    }

    projects.push({
      projectName,
      projectDescription,
      projectType: projectTypeIdx >= 0 ? values[projectTypeIdx] : undefined,
      budget: budgetIdx >= 0 ? values[budgetIdx] : undefined,
      timeline: timelineIdx >= 0 ? values[timelineIdx] : undefined,
      location: locationIdx >= 0 ? values[locationIdx] : undefined,
    });
  }

  if (projects.length === 0) {
    throw new Error("No valid projects found in CSV file");
  }

  return projects;
}

/**
 * Parse JSON file content
 */
export function parseJSON(content: string): BulkImportProject[] {
  let data: unknown;

  try {
    data = JSON.parse(content);
  } catch (error) {
    throw new Error("Invalid JSON format");
  }

  if (!Array.isArray(data)) {
    throw new Error("JSON must contain an array of projects");
  }

  if (data.length === 0) {
    throw new Error("JSON array must contain at least one project");
  }

  const projects: BulkImportProject[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    if (typeof item !== "object" || item === null) {
      throw new Error(`Item ${i + 1}: must be an object`);
    }

    const { projectName, projectDescription, projectType, budget, timeline, location } = item as Record<string, unknown>;

    if (!projectName || typeof projectName !== "string") {
      throw new Error(`Item ${i + 1}: projectName is required and must be a string`);
    }

    if (!projectDescription || typeof projectDescription !== "string") {
      throw new Error(
        `Item ${i + 1}: projectDescription is required and must be a string`
      );
    }

    projects.push({
      projectName: projectName as string,
      projectDescription: projectDescription as string,
      projectType: typeof projectType === "string" ? projectType : undefined,
      budget: typeof budget === "string" ? budget : undefined,
      timeline: typeof timeline === "string" ? timeline : undefined,
      location: typeof location === "string" ? location : undefined,
    });
  }

  return projects;
}

/**
 * Create a bulk import record
 */
export async function createBulkImport(
  userId: number,
  fileName: string,
  fileSize: number,
  fileType: "csv" | "json",
  projects: BulkImportProject[]
): Promise<number> {
  const db = getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  const result = await db.insert(bulkImports).values({
    userId,
    fileName,
    fileSize,
    fileType,
    status: "pending",
    totalItems: projects.length,
    processedItems: 0,
    successfulItems: 0,
    failedItems: 0,
  });

  const bulkImportId = Number(result[0].insertId);

  // Insert individual items
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    await db.insert(bulkImportItems).values({
      bulkImportId,
      rowIndex: i + 1,
      projectName: project.projectName,
      projectDescription: project.projectDescription,
      projectType: project.projectType,
      budget: project.budget,
      timeline: project.timeline,
      location: project.location,
      status: "pending",
    });
  }

  return bulkImportId;
}

/**
 * Get bulk import progress
 */
export async function getBulkImportProgress(
  bulkImportId: number
): Promise<BulkImportProgress> {
  const db = getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  const bulkImport = await db
    .select()
    .from(bulkImports)
    .where(eq(bulkImports.id, bulkImportId))
    .limit(1);

  if (bulkImport.length === 0) {
    throw new Error("Bulk import not found");
  }

  const record = bulkImport[0];

  return {
    bulkImportId: record.id,
    totalItems: record.totalItems,
    processedItems: record.processedItems,
    successfulItems: record.successfulItems,
    failedItems: record.failedItems,
    status: record.status as "pending" | "processing" | "completed" | "failed",
    errorMessage: record.errorMessage || undefined,
  };
}

/**
 * Process bulk import with parallel processing
 * Processes up to 5 items concurrently
 */
export async function processBulkImport(
  bulkImportId: number,
  userId: number,
  maxConcurrent: number = 5
): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  // Update status to processing
  await db
    .update(bulkImports)
    .set({
      status: "processing",
      startedAt: new Date(),
    })
    .where(eq(bulkImports.id, bulkImportId));

  try {
    // Get all pending items
    const items = await db
      .select()
      .from(bulkImportItems)
      .where(
        and(
          eq(bulkImportItems.bulkImportId, bulkImportId),
          eq(bulkImportItems.status, "pending")
        )
      );

    if (items.length === 0) {
      await db
        .update(bulkImports)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(bulkImports.id, bulkImportId));
      return;
    }

    // Process items in parallel batches
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < items.length; i += maxConcurrent) {
      const batch = items.slice(i, i + maxConcurrent);

      const results = await Promise.allSettled(
        batch.map((item) => processBulkImportItem(item, bulkImportId, userId))
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          successCount++;
        } else {
          failureCount++;
        }
      }

      // Update progress
      await db
        .update(bulkImports)
        .set({
          processedItems: i + batch.length,
          successfulItems: successCount,
          failedItems: failureCount,
        })
        .where(eq(bulkImports.id, bulkImportId));
    }

    // Mark as completed
    await db
      .update(bulkImports)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(bulkImports.id, bulkImportId));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    await db
      .update(bulkImports)
      .set({
        status: "failed",
        errorMessage,
        completedAt: new Date(),
      })
      .where(eq(bulkImports.id, bulkImportId));

    throw error;
  }
}

/**
 * Process a single bulk import item
 */
async function processBulkImportItem(
  item: typeof bulkImportItems.$inferSelect,
  bulkImportId: number,
  userId: number
): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    // Update item status to processing
    await db
      .update(bulkImportItems)
      .set({ status: "processing" })
      .where(eq(bulkImportItems.id, item.id));

    // Get template suggestions
    const suggestions = await suggestTemplatesForProject({
      projectName: item.projectName,
      projectDescription: item.projectDescription,
      projectType: item.projectType,
      budget: item.budget,
      timeline: item.timeline,
      location: item.location,
      userId,
    });

    // Store results
    if (suggestions.length > 0) {
      for (const suggestion of suggestions) {
        await db.insert(bulkImportResults).values({
          bulkImportItemId: item.id,
          templateId: suggestion.templateId,
          templateName: suggestion.templateName,
          category: suggestion.category,
          description: suggestion.description,
          confidenceScore: suggestion.confidenceScore,
          matchingReasons: suggestion.matchingReasons,
          previewImage: suggestion.previewImage,
        });
      }
    }

    // Mark item as completed
    await db
      .update(bulkImportItems)
      .set({ status: "completed" })
      .where(eq(bulkImportItems.id, item.id));
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Mark item as failed
    await db
      .update(bulkImportItems)
      .set({
        status: "failed",
        errorMessage,
      })
      .where(eq(bulkImportItems.id, item.id));

    throw error;
  }
}

/**
 * Get bulk import results
 */
export async function getBulkImportResults(bulkImportId: number) {
  const db = getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  const items = await db
    .select()
    .from(bulkImportItems)
    .where(eq(bulkImportItems.bulkImportId, bulkImportId));

  const results = [];

  for (const item of items) {
    const itemResults = await db
      .select()
      .from(bulkImportResults)
      .where(eq(bulkImportResults.bulkImportItemId, item.id));

    results.push({
      item,
      suggestions: itemResults,
    });
  }

  return results;
}

/**
 * Delete bulk import and related data
 */
export async function deleteBulkImport(bulkImportId: number): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  // Get all items for this import
  const items = await db
    .select()
    .from(bulkImportItems)
    .where(eq(bulkImportItems.bulkImportId, bulkImportId));

  // Delete results for all items
  for (const item of items) {
    await db
      .delete(bulkImportResults)
      .where(eq(bulkImportResults.bulkImportItemId, item.id));
  }

  // Delete items
  await db
    .delete(bulkImportItems)
    .where(eq(bulkImportItems.bulkImportId, bulkImportId));

  // Delete import record
  await db
    .delete(bulkImports)
    .where(eq(bulkImports.id, bulkImportId));
}
