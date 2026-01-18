/**
 * BOQ (Bill of Quantities) Document Template
 * Professional template for BOQ documents with itemized costs
 */

import { DocumentTemplate, DocumentSection, DocumentTable, DocumentHighlight, DocumentMetadata } from "../DocumentTemplate";

export interface BOQItem {
  id: string;
  srNo: number;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  amount: number;
  category: string;
  notes?: string;
}

export interface BOQTemplateProps {
  metadata: DocumentMetadata;
  items: BOQItem[];
  notes?: string;
  terms?: string;
  currency?: string;
}

export function BOQTemplate({
  metadata,
  items,
  notes,
  terms,
  currency = "AED",
}: BOQTemplateProps) {
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const contingency = subtotal * 0.05; // 5% contingency
  const total = subtotal + contingency;

  // Group items by category
  const itemsByCategory = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, BOQItem[]>
  );

  const footerContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-8">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">PREPARED BY</p>
          <p className="text-sm font-medium text-foreground">{metadata.generatedBy}</p>
          <p className="text-xs text-muted-foreground mt-1">{metadata.generatedDate.toLocaleDateString()}</p>
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
      {/* Executive Summary */}
      <DocumentSection title="Executive Summary">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Total Line Items</p>
            <p className="text-2xl font-bold text-gold">{items.length}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Total Quantity</p>
            <p className="text-2xl font-bold text-foreground">
              {items.reduce((sum, item) => sum + item.quantity, 0).toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-gold/10 rounded-lg border border-gold/30">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-gold">
              {currency} {total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </DocumentSection>

      {/* Detailed BOQ by Category */}
      {Object.entries(itemsByCategory).map(([category, categoryItems]) => (
        <DocumentSection key={category} title={category}>
          <DocumentTable
            headers={["Sr. No.", "Description", "Unit", "Qty", "Unit Rate", "Amount"]}
            rows={categoryItems.map((item) => [
              item.srNo,
              item.description,
              item.unit,
              item.quantity.toFixed(2),
              `${currency} ${item.unitRate.toFixed(2)}`,
              `${currency} ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            ])}
            footer={[
              "Subtotal",
              "",
              "",
              "",
              "",
              `${currency} ${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            ]}
          />
        </DocumentSection>
      ))}

      {/* Summary and Totals */}
      <DocumentSection title="Cost Summary">
        <div className="space-y-4">
          <div className="flex justify-end">
            <div className="w-80 space-y-3">
              <div className="flex justify-between text-sm border-b border-border pb-2">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold text-foreground">
                  {currency} {subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-sm border-b border-border pb-2">
                <span className="text-muted-foreground">Contingency (5%):</span>
                <span className="font-semibold text-foreground">
                  {currency} {contingency.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-lg bg-gold/10 p-3 rounded border border-gold/30">
                <span className="font-bold text-foreground">Total:</span>
                <span className="font-bold text-gold">
                  {currency} {total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DocumentSection>

      {/* Notes and Terms */}
      {(notes || terms) && (
        <DocumentSection title="Notes & Terms">
          {notes && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-foreground mb-2">Notes:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
            </div>
          )}
          {terms && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Terms & Conditions:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{terms}</p>
            </div>
          )}
        </DocumentSection>
      )}

      {/* Disclaimer */}
      <DocumentHighlight
        type="info"
        title="Document Information"
        content={
          <div className="space-y-1 text-xs">
            <p>This Bill of Quantities is prepared based on the drawings and specifications provided.</p>
            <p>All rates are subject to market conditions and supplier availability.</p>
            <p>This document is confidential and for authorized use only.</p>
          </div>
        }
      />
    </DocumentTemplate>
  );
}
