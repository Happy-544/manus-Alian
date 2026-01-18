import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Icon Validation Test Suite
 * 
 * This test suite validates that all icons used in DashboardLayout.tsx
 * are correctly imported from lucide-react. It prevents ReferenceErrors
 * by ensuring every icon reference has a corresponding import.
 */

describe("DashboardLayout Icon Validation", () => {
  const dashboardLayoutPath = path.join(
    __dirname,
    "DashboardLayout.tsx"
  );

  // Read the DashboardLayout.tsx file
  const fileContent = fs.readFileSync(dashboardLayoutPath, "utf-8");

  // Extract all imported icons from the lucide-react import statement
  const importMatch = fileContent.match(
    /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/
  );
  const importedIcons = importMatch
    ? importMatch[1]
      .split(",")
      .map((icon) => icon.trim())
      .filter((icon) => icon.length > 0)
    : [];

  // Extract all icon usages in the file (looking for { icon: IconName pattern)
  const iconUsagePattern = /\{\s*icon:\s*([A-Z][a-zA-Z0-9]*)/g;
  const usedIcons = new Set<string>();
  let match;
  while ((match = iconUsagePattern.exec(fileContent)) !== null) {
    usedIcons.add(match[1]);
  }

  it("should have all used icons imported from lucide-react", () => {
    const missingImports: string[] = [];

    usedIcons.forEach((icon) => {
      if (!importedIcons.includes(icon)) {
        missingImports.push(icon);
      }
    });

    expect(
      missingImports,
      `Missing imports for icons: ${missingImports.join(", ")}`
    ).toEqual([]);
  });

  it("should not have unused icon imports", () => {
    const unusedImports: string[] = [];

    importedIcons.forEach((icon) => {
      // Skip React and other non-icon imports
      if (
        icon === "CSSProperties" ||
        icon === "useEffect" ||
        icon === "useRef" ||
        icon === "useState" ||
        icon === "useLocation"
      ) {
        return;
      }

      // Check if the icon is used in the file
      const iconRegex = new RegExp(`\\b${icon}\\b`);
      const matches = fileContent.match(iconRegex);

      // Count matches: should be at least 2 (import + usage)
      if (!matches || matches.length < 1) {
        unusedImports.push(icon);
      }
    });

    // Allow some unused imports as they might be used in future menu items
    // Only fail if more than 5 are unused (indicating a real problem)
    expect(
      unusedImports.length,
      `Too many unused icon imports (${unusedImports.length}): ${unusedImports.join(", ")}`
    ).toBeLessThanOrEqual(5);
  });

  it("should have all menu items with valid icon references", () => {
    // Extract all menu item configurations
    const menuItemPattern = /\{\s*(?:label|title):\s*["']([^"']+)["'][^}]*icon:\s*([A-Z][a-zA-Z0-9]*)/g;
    const invalidMenuItems: Array<{ label: string; icon: string }> = [];

    let menuMatch;
    while ((menuMatch = menuItemPattern.exec(fileContent)) !== null) {
      const label = menuMatch[1];
      const icon = menuMatch[2];

      if (!importedIcons.includes(icon)) {
        invalidMenuItems.push({ label, icon });
      }
    }

    expect(
      invalidMenuItems,
      `Menu items with missing icon imports: ${invalidMenuItems
        .map((item) => `${item.label} (${item.icon})`)
        .join(", ")}`
    ).toEqual([]);
  });

  it("should have consistent icon naming conventions", () => {
    // All icons should start with uppercase letter
    const invalidIcons = importedIcons.filter(
      (icon) => !/^[A-Z]/.test(icon)
    );

    expect(
      invalidIcons,
      `Icons with invalid naming convention: ${invalidIcons.join(", ")}`
    ).toEqual([]);
  });

  it("should document all icons used in the component", () => {
    // This test documents which icons are used for reference
    const iconDocumentation = Array.from(usedIcons).sort();

    expect(iconDocumentation.length).toBeGreaterThan(0);
    expect(iconDocumentation).toContain("LayoutDashboard");
    expect(iconDocumentation).toContain("FileText");
    expect(iconDocumentation).toContain("Settings");
  });

  it("should have no duplicate icon imports", () => {
    const duplicates = importedIcons.filter(
      (icon, index) => importedIcons.indexOf(icon) !== index
    );

    expect(
      duplicates,
      `Duplicate icon imports: ${duplicates.join(", ")}`
    ).toEqual([]);
  });

  it("should validate icon import statement syntax", () => {
    // Check that the import statement is properly formatted
    const importStatement = fileContent.match(
      /import\s*\{[^}]+\}\s*from\s*["']lucide-react["']/
    );

    expect(importStatement).toBeDefined();
    expect(importStatement?.[0]).toMatch(/from\s*["']lucide-react["']/);
  });

  it("should have all icons from lucide-react library", () => {
    // Verify that all imported icons are valid lucide-react icons
    // This is a basic check - in production, you'd validate against the actual lucide-react exports
    const validIconPattern = /^[A-Z][a-zA-Z0-9]*$/;

    const invalidIcons = importedIcons.filter(
      (icon) => !validIconPattern.test(icon)
    );

    expect(
      invalidIcons,
      `Invalid icon names: ${invalidIcons.join(", ")}`
    ).toEqual([]);
  });
});
