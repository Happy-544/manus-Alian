/**
 * Budget Estimation Document Template
 * Professional template for project budget and cost analysis
 */

import { DocumentTemplate, DocumentSection, DocumentTable, DocumentHighlight, DocumentMetadata } from "../DocumentTemplate";

export interface BudgetItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitRate: number;
  amount: number;
  contingency?: number;
  notes?: string;
}

export interface BudgetTemplateProps {
  metadata: DocumentMetadata;
  items: BudgetItem[];
  contingencyPercentage?: number;
  profitMargin?: number;
  currency?: string;
}

export function BudgetTemplate({
  metadata,
  items,
  contingencyPercentage = 5,
  profitMargin = 10,
  currency = "AED",
}: BudgetTemplateProps) {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const contingency = subtotal * (contingencyPercentage / 100);
  const totalBeforeProfit = subtotal + contingency;
  const profit = totalBeforeProfit * (profitMargin / 100);
  const grandTotal = totalBeforeProfit + profit;

  const itemsByCategory = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, BudgetItem[]>
  );

  const categoryTotals = Object.entries(itemsByCategory).map(([category, categoryItems]) => ({
    category,
    total: categoryItems.reduce((sum, item) => sum + item.amount, 0),
  }));

  const footerContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-8">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">PREPARED BY</p>
          <p className="text-sm text-muted-foreground">_________________</p>
          <p className="text-xs text-muted-foreground mt-2">Signature & Date</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">REVIEWED BY</p>
          <p className="text-sm text-muted-foreground">_________________</p>
          <p className="text-xs text-muted-foreground mt-2">Signature & Date</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">APPROVED BY</p>
          <p className="text-sm text-muted-foreground">_________________</p>
          <p className="text-xs text-muted-foreground mt-2">Signature & Date</p>
        </div>
      </div>
    </div>
  );

  return (
    <DocumentTemplate
      metadata={metadata}
      footerContent={footerContent}
      showPageNumbers={true}
    >
      {/* Budget Summary */}
      <DocumentSection title="Budget Summary">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-semibold mb-2">Total Line Items</p>
            <p className="text-2xl font-bold text-foreground">{items.length}</p>
          </div>
          <div className="p-4 bg-gold/10 rounded-lg border border-gold/30">
            <p className="text-xs text-muted-foreground font-semibold mb-2">Grand Total</p>
            <p className="text-2xl font-bold text-gold">
              {currency} {grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </DocumentSection>

      {/* Category Summary */}
      <DocumentSection title="Budget by Category">
        <DocumentTable
          headers={["Category", "Items", "Total Amount", "% of Budget"]}
          rows={categoryTotals.map((cat) => [
            cat.category,
            itemsByCategory[cat.category].length,
            `${currency} ${cat.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            `${((cat.total / subtotal) * 100).toFixed(1)}%`,
          ])}
          footer={[
            "TOTAL",
            items.length,
            `${currency} ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            "100%",
          ]}
        />
      </DocumentSection>

      {/* Detailed Budget Items by Category */}
      {Object.entries(itemsByCategory).map(([category, categoryItems]) => {
        const categoryTotal = categoryItems.reduce((sum, item) => sum + item.amount, 0);
        return (
          <DocumentSection key={category} title={category}>
            <DocumentTable
              headers={["Description", "Qty", "Unit", "Unit Rate", "Amount"]}
              rows={categoryItems.map((item) => [
                item.description,
                item.quantity,
                item.unit,
                `${currency} ${item.unitRate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                `${currency} ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              ])}
              footer={[
                "Subtotal",
                "",
                "",
                "",
                `${currency} ${categoryTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              ]}
            />
          </DocumentSection>
        );
      })}

      {/* Cost Breakdown */}
      <DocumentSection title="Cost Breakdown & Summary">
        <div className="space-y-4">
          <div className="flex justify-end">
            <div className="w-96 space-y-3">
              <div className="flex justify-between text-sm border-b border-border pb-2">
                <span className="text-muted-foreground">Direct Costs (Materials & Labor):</span>
                <span className="font-semibold text-foreground">
                  {currency} {subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm border-b border-border pb-2">
                <span className="text-muted-foreground">Contingency ({contingencyPercentage}%):</span>
                <span className="font-semibold text-foreground">
                  {currency} {contingency.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm border-b border-border pb-2">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold text-foreground">
                  {currency} {totalBeforeProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm border-b border-border pb-2">
                <span className="text-muted-foreground">Profit Margin ({profitMargin}%):</span>
                <span className="font-semibold text-foreground">
                  {currency} {profit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-lg bg-gold/10 p-3 rounded border border-gold/30">
                <span className="font-bold text-foreground">Grand Total:</span>
                <span className="font-bold text-gold">
                  {currency} {grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DocumentSection>

      {/* Budget Notes */}
      <DocumentSection title="Budget Notes & Assumptions">
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-semibold text-foreground mb-2">Assumptions</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• All rates are based on current market conditions in Dubai</li>
              <li>• Contingency of {contingencyPercentage}% is included for unforeseen expenses</li>
              <li>• Profit margin of {profitMargin}% is included in the final quote</li>
              <li>• All materials and labor are subject to availability</li>
              <li>• Prices are valid for 30 days from the date of this estimate</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-2">Exclusions</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Permits and licenses (if applicable)</li>
              <li>• Site mobilization and demobilization</li>
              <li>• Insurance and bonds</li>
              <li>• Taxes and levies (if applicable)</li>
            </ul>
          </div>
        </div>
      </DocumentSection>

      {/* Payment Terms */}
      <DocumentHighlight
        type="info"
        title="Payment Terms"
        content={
          <div className="space-y-1 text-xs">
            <p>• 30% advance payment upon contract signing</p>
            <p>• 40% upon material delivery and commencement of work</p>
            <p>• 30% upon project completion and handover</p>
            <p>• All payments to be made in {currency}</p>
          </div>
        }
      />
    </DocumentTemplate>
  );
}
