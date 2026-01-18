/**
 * Unit tests for GapCompletionForm component
 * Tests form rendering, validation, and user interactions
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GapCompletionForm, type BOQLineItem, type GapAnalysisResult } from "./GapCompletionForm";

describe("GapCompletionForm Component", () => {
  const mockItem: BOQLineItem = {
    id: "1",
    description: "Premium Ceramic Tiles",
    quantity: 100,
    unit: "sqm",
    category: "Finishes",
    location: "Main Hall",
  };

  const mockGap: GapAnalysisResult = {
    itemId: "1",
    missingFields: ["unitPrice", "supplier"],
    severity: "HIGH",
    suggestions: {
      unitPrice: {
        suggestedPrice: 250,
        priceRange: { min: 200, max: 300 },
        confidence: 0.85,
        source: "Dubai Market Data",
      },
      supplier: {
        suppliers: [
          {
            name: "Supplier A",
            rating: 4.5,
            leadTime: 7,
            minOrder: 50,
            pricePerUnit: 250,
            contact: "supplier@a.com",
            specialization: ["Ceramics", "Tiles"],
          },
          {
            name: "Supplier B",
            rating: 4.2,
            leadTime: 10,
            minOrder: 100,
            pricePerUnit: 240,
            contact: "supplier@b.com",
            specialization: ["Tiles"],
          },
        ],
        confidence: 0.8,
      },
    },
  };

  describe("Rendering", () => {
    it("should render the form with item description", () => {
      const mockOnComplete = vi.fn();
      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText("Premium Ceramic Tiles")).toBeInTheDocument();
      expect(screen.getByText(/100 sqm/)).toBeInTheDocument();
    });

    it("should display severity badge", () => {
      const mockOnComplete = vi.fn();
      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText("HIGH Priority")).toBeInTheDocument();
    });

    it("should display missing fields count", () => {
      const mockOnComplete = vi.fn();
      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/2 fields need to be completed/)).toBeInTheDocument();
    });

    it("should render input fields for missing data", () => {
      const mockOnComplete = vi.fn();
      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByPlaceholderText("Enter unit price")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter supplier name")).toBeInTheDocument();
    });

    it("should display completion progress bar", () => {
      const mockOnComplete = vi.fn();
      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText("Completion")).toBeInTheDocument();
      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should validate unit price field", async () => {
      const mockOnComplete = vi.fn();
      const user = userEvent.setup();

      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      const submitButton = screen.getByText("Complete Item");
      await user.click(submitButton);

      expect(screen.getByText("Unit price is required")).toBeInTheDocument();
    });

    it("should reject zero unit price", async () => {
      const mockOnComplete = vi.fn();
      const user = userEvent.setup();

      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      const priceInput = screen.getByPlaceholderText("Enter unit price");
      await user.type(priceInput, "0");

      const submitButton = screen.getByText("Complete Item");
      await user.click(submitButton);

      expect(
        screen.getByText("Unit price must be greater than 0")
      ).toBeInTheDocument();
    });

    it("should validate supplier field", async () => {
      const mockOnComplete = vi.fn();
      const user = userEvent.setup();

      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      const submitButton = screen.getByText("Complete Item");
      await user.click(submitButton);

      expect(screen.getByText("Supplier is required")).toBeInTheDocument();
    });

    it("should enable submit button when all fields are filled", async () => {
      const mockOnComplete = vi.fn();
      const user = userEvent.setup();

      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      const priceInput = screen.getByPlaceholderText("Enter unit price");
      const supplierInput = screen.getByPlaceholderText("Enter supplier name");

      await user.type(priceInput, "250");
      await user.type(supplierInput, "Supplier A");

      const submitButton = screen.getByText("Complete Item");
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("User Interactions", () => {
    it("should update form data when user types in price field", async () => {
      const mockOnComplete = vi.fn();
      const user = userEvent.setup();

      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      const priceInput = screen.getByPlaceholderText("Enter unit price") as HTMLInputElement;
      await user.type(priceInput, "300");

      expect(priceInput.value).toBe("300");
    });

    it("should update form data when user types in supplier field", async () => {
      const mockOnComplete = vi.fn();
      const user = userEvent.setup();

      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      const supplierInput = screen.getByPlaceholderText(
        "Enter supplier name"
      ) as HTMLInputElement;
      await user.type(supplierInput, "Premium Supplier");

      expect(supplierInput.value).toBe("Premium Supplier");
    });

    it("should call onComplete callback with filled data", async () => {
      const mockOnComplete = vi.fn();
      const user = userEvent.setup();

      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      const priceInput = screen.getByPlaceholderText("Enter unit price");
      const supplierInput = screen.getByPlaceholderText("Enter supplier name");

      await user.type(priceInput, "250");
      await user.type(supplierInput, "Supplier A");

      const submitButton = screen.getByText("Complete Item");
      await user.click(submitButton);

      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "1",
          unitPrice: 250,
          supplier: "Supplier A",
        })
      );
    });
  });

  describe("AI Suggestions", () => {
    it("should display unit price suggestion", () => {
      const mockOnComplete = vi.fn();
      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText("AED 250.00")).toBeInTheDocument();
      expect(screen.getByText(/85% confidence/)).toBeInTheDocument();
    });

    it("should display price range", () => {
      const mockOnComplete = vi.fn();
      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/Range: AED 200.00 - AED 300.00/)).toBeInTheDocument();
    });

    it("should display suggested suppliers", () => {
      const mockOnComplete = vi.fn();
      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText("Supplier A")).toBeInTheDocument();
      expect(screen.getByText("Supplier B")).toBeInTheDocument();
    });

    it("should allow using suggestion for unit price", async () => {
      const mockOnComplete = vi.fn();
      const user = userEvent.setup();

      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      const useButtons = screen.getAllByText("Use Suggestion");
      await user.click(useButtons[0]); // Click first "Use Suggestion" button for price

      const priceInput = screen.getByPlaceholderText("Enter unit price") as HTMLInputElement;
      expect(priceInput.value).toBe("250");
    });
  });

  describe("Progress Tracking", () => {
    it("should update completion percentage when fields are filled", async () => {
      const mockOnComplete = vi.fn();
      const user = userEvent.setup();

      const { rerender } = render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText("0%")).toBeInTheDocument();

      const priceInput = screen.getByPlaceholderText("Enter unit price");
      await user.type(priceInput, "250");

      // After filling one of two fields, should show 50%
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("should show 100% completion when all fields are filled", async () => {
      const mockOnComplete = vi.fn();
      const user = userEvent.setup();

      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
        />
      );

      const priceInput = screen.getByPlaceholderText("Enter unit price");
      const supplierInput = screen.getByPlaceholderText("Enter supplier name");

      await user.type(priceInput, "250");
      await user.type(supplierInput, "Supplier A");

      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should show loading state when isLoading is true", () => {
      const mockOnComplete = vi.fn();
      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
          isLoading={true}
        />
      );

      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("should disable submit button when loading", () => {
      const mockOnComplete = vi.fn();
      render(
        <GapCompletionForm
          item={mockItem}
          gap={mockGap}
          onComplete={mockOnComplete}
          isLoading={true}
        />
      );

      const submitButton = screen.getByText("Saving...");
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle items with only one missing field", () => {
      const mockOnComplete = vi.fn();
      const singleFieldGap: GapAnalysisResult = {
        ...mockGap,
        missingFields: ["unitPrice"],
      };

      render(
        <GapCompletionForm
          item={mockItem}
          gap={singleFieldGap}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/1 field needs to be completed/)).toBeInTheDocument();
    });

    it("should handle items with multiple missing fields", () => {
      const mockOnComplete = vi.fn();
      const multiFieldGap: GapAnalysisResult = {
        ...mockGap,
        missingFields: ["unitPrice", "supplier", "leadTime", "material", "brand"],
      };

      render(
        <GapCompletionForm
          item={mockItem}
          gap={multiFieldGap}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/5 fields need to be completed/)).toBeInTheDocument();
    });

    it("should handle MEDIUM severity items", () => {
      const mockOnComplete = vi.fn();
      const mediumGap: GapAnalysisResult = {
        ...mockGap,
        severity: "MEDIUM",
      };

      render(
        <GapCompletionForm
          item={mockItem}
          gap={mediumGap}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText("MEDIUM Priority")).toBeInTheDocument();
    });

    it("should handle LOW severity items", () => {
      const mockOnComplete = vi.fn();
      const lowGap: GapAnalysisResult = {
        ...mockGap,
        severity: "LOW",
      };

      render(
        <GapCompletionForm
          item={mockItem}
          gap={lowGap}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText("LOW Priority")).toBeInTheDocument();
    });
  });
});
