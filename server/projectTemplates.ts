/**
 * Project Templates Service
 * Handles template creation, management, and cloning for project reuse
 */

import { getDb } from "./db";
import { projectTemplates, templateSuppliers, templateBOQItems } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

export interface ProjectTemplateData {
  name: string;
  description?: string;
  category: string;
  tags?: string[];
  isPublic: boolean;
  previewImage?: string;
  defaultSettings?: Record<string, unknown>;
}

export interface TemplateSupplierData {
  vendorId: number;
  isPrimary: boolean;
  notes?: string;
}

export interface TemplateBOQItemData {
  description: string;
  category: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice?: number;
  vendorId?: number;
}

/**
 * Create a new project template
 */
export async function createProjectTemplate(
  userId: number,
  data: ProjectTemplateData
) {
  try {
    const db = await getDb();
    const result = await db
      .insert(projectTemplates)
      .values({
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags?.join(",") || "",
        isPublic: data.isPublic,
        previewImage: data.previewImage,
        defaultSettings: JSON.stringify(data.defaultSettings || {}),
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return {
      success: true,
      template: result[0],
      message: "Template created successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create template",
    };
  }
}

/**
 * Get all templates for a user (created by them or public)
 */
export async function getUserTemplates(userId: number) {
  try {
    const db = await getDb();
    const templates = await db
      .select()
      .from(projectTemplates)
      .where(
        and(
          // Templates created by user OR public templates
          // We'll filter in application logic since Drizzle OR isn't straightforward
        )
      )
      .orderBy(desc(projectTemplates.createdAt));

    // Filter for user's templates or public templates
    return templates.filter(
      (t) => t.createdBy === userId || t.isPublic
    );
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch templates"
    );
  }
}

/**
 * Get template by ID
 */
export async function getTemplateById(templateId: number) {
  try {
    const db = await getDb();
    const result = await db
      .select()
      .from(projectTemplates)
      .where(eq(projectTemplates.id, templateId));

    return result[0] || null;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch template"
    );
  }
}

/**
 * Update a project template
 */
export async function updateProjectTemplate(
  templateId: number,
  userId: number,
  data: Partial<ProjectTemplateData>
) {
  try {
    // Verify ownership
    const template = await getTemplateById(templateId);
    if (!template || template.createdBy !== userId) {
      return {
        success: false,
        error: "Unauthorized: You can only edit your own templates",
      };
    }

    const db = await getDb();
    const result = await db
      .update(projectTemplates)
      .set({
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags?.join(","),
        isPublic: data.isPublic,
        previewImage: data.previewImage,
        defaultSettings: data.defaultSettings
          ? JSON.stringify(data.defaultSettings)
          : undefined,
        updatedAt: new Date(),
      })
      .where(eq(projectTemplates.id, templateId))
      .returning();

    return {
      success: true,
      template: result[0],
      message: "Template updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update template",
    };
  }
}

/**
 * Delete a project template
 */
export async function deleteProjectTemplate(
  templateId: number,
  userId: number
) {
  try {
    // Verify ownership
    const template = await getTemplateById(templateId);
    if (!template || template.createdBy !== userId) {
      return {
        success: false,
        error: "Unauthorized: You can only delete your own templates",
      };
    }

    const db = await getDb();
    // Delete associated suppliers and BOQ items
    await db
      .delete(templateSuppliers)
      .where(eq(templateSuppliers.templateId, templateId));

    await db
      .delete(templateBOQItems)
      .where(eq(templateBOQItems.templateId, templateId));

    // Delete template
    await db
      .delete(projectTemplates)
      .where(eq(projectTemplates.id, templateId));

    return {
      success: true,
      message: "Template deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete template",
    };
  }
}

/**
 * Add supplier to template
 */
export async function addSupplierToTemplate(
  templateId: number,
  vendorId: number,
  isPrimary: boolean = false,
  notes?: string
) {
  try {
    const db = await getDb();
    const result = await db
      .insert(templateSuppliers)
      .values({
        templateId,
        vendorId,
        isPrimary,
        notes,
      })
      .returning();

    return {
      success: true,
      supplier: result[0],
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add supplier to template",
    };
  }
}

/**
 * Get template suppliers
 */
export async function getTemplateSuppliers(templateId: number) {
  try {
    const db = await getDb();
    const suppliers = await db
      .select()
      .from(templateSuppliers)
      .where(eq(templateSuppliers.templateId, templateId));

    return suppliers;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch template suppliers"
    );
  }
}

/**
 * Remove supplier from template
 */
export async function removeSupplierFromTemplate(
  templateId: number,
  vendorId: number
) {
  try {
    const db = await getDb();
    await db
      .delete(templateSuppliers)
      .where(
        and(
          eq(templateSuppliers.templateId, templateId),
          eq(templateSuppliers.vendorId, vendorId)
        )
      );

    return {
      success: true,
      message: "Supplier removed from template",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to remove supplier from template",
    };
  }
}

/**
 * Add BOQ item to template
 */
export async function addBOQItemToTemplate(
  templateId: number,
  data: TemplateBOQItemData
) {
  try {
    const db = await getDb();
    const result = await db
      .insert(templateBOQItems)
      .values({
        templateId,
        description: data.description,
        category: data.category,
        quantity: data.quantity,
        unitOfMeasure: data.unitOfMeasure,
        unitPrice: data.unitPrice,
        vendorId: data.vendorId,
      })
      .returning();

    return {
      success: true,
      item: result[0],
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add BOQ item to template",
    };
  }
}

/**
 * Get template BOQ items
 */
export async function getTemplateBOQItems(templateId: number) {
  try {
    const db = await getDb();
    const items = await db
      .select()
      .from(templateBOQItems)
      .where(eq(templateBOQItems.templateId, templateId));

    return items;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch template BOQ items"
    );
  }
}

/**
 * Remove BOQ item from template
 */
export async function removeBOQItemFromTemplate(
  templateId: number,
  itemId: number
) {
  try {
    const db = await getDb();
    await db
      .delete(templateBOQItems)
      .where(
        and(
          eq(templateBOQItems.templateId, templateId),
          eq(templateBOQItems.id, itemId)
        )
      );

    return {
      success: true,
      message: "BOQ item removed from template",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to remove BOQ item from template",
    };
  }
}

/**
 * Clone a template to create a new project
 */
export async function cloneTemplateToProject(
  templateId: number,
  projectName: string,
  userId: number
) {
  try {
    const template = await getTemplateById(templateId);
    if (!template) {
      return {
        success: false,
        error: "Template not found",
      };
    }

    // Get template suppliers and BOQ items
    const suppliers = await getTemplateSuppliers(templateId);
    const boqItems = await getTemplateBOQItems(templateId);

    return {
      success: true,
      template,
      suppliers,
      boqItems,
      projectName,
      message: "Template cloned successfully. Use this data to create your project.",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to clone template",
    };
  }
}

/**
 * Get template statistics
 */
export async function getTemplateStats(templateId: number) {
  try {
    const suppliers = await getTemplateSuppliers(templateId);
    const boqItems = await getTemplateBOQItems(templateId);

    const totalBOQValue = boqItems.reduce((sum, item) => {
      return sum + (item.unitPrice || 0) * item.quantity;
    }, 0);

    return {
      suppliersCount: suppliers.length,
      boqItemsCount: boqItems.length,
      totalBOQValue,
      categoriesCount: new Set(boqItems.map((i) => i.category)).size,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch template stats"
    );
  }
}

/**
 * Search templates by name or category
 */
export async function searchTemplates(
  userId: number,
  query: string,
  category?: string
) {
  try {
    const templates = await getUserTemplates(userId);

    return templates.filter((t) => {
      const matchesQuery =
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.description?.toLowerCase().includes(query.toLowerCase()) ||
        t.tags.toLowerCase().includes(query.toLowerCase());

      const matchesCategory = !category || t.category === category;

      return matchesQuery && matchesCategory;
    });
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to search templates"
    );
  }
}
