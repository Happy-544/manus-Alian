/**
 * Procurement Log Document Template
 * Professional template for procurement tracking and supplier management
 */

import { DocumentTemplate, DocumentSection, DocumentTable, DocumentHighlight, DocumentMetadata } from "../DocumentTemplate";

export interface ProcurementItem {
  id: string;
  srNo: number;
  itemDescription: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  supplier: string;
  leadTime: number;
  status: "pending" | "ordered" | "received" | "installed";
  orderDate?: Date;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  notes?: string;
}

export interface ProcurementTemplateProps {
  metadata: DocumentMetadata;
  items: ProcurementItem[];
  totalBudget: number;
  currency?: string;
  approvalRequired?: boolean;
}

export function ProcurementTemplate({
  metadata,
  items,
  totalBudget,
  currency = "AED",
  approvalRequired = true,
}: ProcurementTemplateProps) {
  const totalCommitted = items.reduce((sum, item) => sum + item.estimatedCost, 0);
  const remainingBudget = totalBudget - totalCommitted;
  const budgetUtilization = (totalCommitted / totalBudget) * 100;

  const statusColors = {
    pending: "text-amber-600",
    ordered: "text-blue-600",
    received: "text-green-600",
    installed: "text-green-700",
  };

  const itemsByStatus = items.reduce(
    (acc, item) => {
      if (!acc[item.status]) {
        acc[item.status] = [];
      }
      acc[item.status].push(item);
      return acc;
    },
    {} as Record<string, ProcurementItem[]>
  );

  const footerContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-8">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">PROCUREMENT MANAGER</p>
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
      {/* Budget Overview */}
      <DocumentSection title="Budget Overview">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Total Budget</p>
            <p className="text-xl font-bold text-foreground">
              {currency} {totalBudget.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Committed</p>
            <p className="text-xl font-bold text-gold">
              {currency} {totalCommitted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Remaining</p>
            <p className={`text-xl font-bold ${remainingBudget >= 0 ? "text-green-600" : "text-red-600"}`}>
              {currency} {remainingBudget.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-gold/10 rounded-lg border border-gold/30">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Utilization</p>
            <p className="text-xl font-bold text-gold">{budgetUtilization.toFixed(1)}%</p>
          </div>
        </div>
      </DocumentSection>

      {/* Procurement Status Summary */}
      <DocumentSection title="Procurement Status Summary">
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(itemsByStatus).map(([status, statusItems]) => (
            <div key={status} className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground font-semibold mb-1 capitalize">{status}</p>
              <p className={`text-2xl font-bold ${statusColors[status as keyof typeof statusColors]}`}>
                {statusItems.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{statusItems.length} item(s)</p>
            </div>
          ))}
        </div>
      </DocumentSection>

      {/* Detailed Procurement Log */}
      <DocumentSection title="Detailed Procurement Log">
        <DocumentTable
          headers={[
            "Sr. No.",
            "Item Description",
            "Category",
            "Qty",
            "Unit",
            "Est. Cost",
            "Supplier",
            "Lead Time",
            "Status",
          ]}
          rows={items.map((item) => [
            item.srNo,
            item.itemDescription,
            item.category,
            item.quantity,
            item.unit,
            `${currency} ${item.estimatedCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            item.supplier,
            `${item.leadTime} days`,
            item.status.charAt(0).toUpperCase() + item.status.slice(1),
          ])}
          footer={[
            "TOTAL",
            "",
            "",
            "",
            "",
            `${currency} ${totalCommitted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            "",
            "",
            `${items.length} items`,
          ]}
        />
      </DocumentSection>

      {/* Items by Status */}
      {Object.entries(itemsByStatus).map(([status, statusItems]) => (
        <DocumentSection key={status} title={`${status.charAt(0).toUpperCase() + status.slice(1)} Items (${statusItems.length})`}>
          <div className="space-y-3">
            {statusItems.map((item) => (
              <div key={item.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{item.itemDescription}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.quantity} {item.unit} • {item.category}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded capitalize ${statusColors[status as keyof typeof statusColors]}`}>
                    {status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mt-3 pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Supplier</p>
                    <p className="text-foreground">{item.supplier}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Lead Time</p>
                    <p className="text-foreground">{item.leadTime} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Est. Cost</p>
                    <p className="text-gold font-semibold">
                      {currency} {item.estimatedCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                {item.notes && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{item.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DocumentSection>
      ))}

      {/* Supplier List */}
      <DocumentSection title="Supplier Directory">
        <div className="space-y-2">
          {Array.from(new Set(items.map((item) => item.supplier))).map((supplier, idx) => {
            const supplierItems = items.filter((item) => item.supplier === supplier);
            const totalValue = supplierItems.reduce((sum, item) => sum + item.estimatedCost, 0);
            return (
              <div key={idx} className="p-3 bg-muted rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{supplier}</p>
                    <p className="text-xs text-muted-foreground mt-1">{supplierItems.length} item(s)</p>
                  </div>
                  <p className="text-gold font-semibold">
                    {currency} {totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </DocumentSection>

      {/* Critical Items Alert */}
      {items.some((item) => item.leadTime > 30) && (
        <DocumentHighlight
          type="warning"
          title="Long Lead Time Items"
          content={
            <div className="space-y-1 text-xs">
              <p>The following items have lead times exceeding 30 days and should be ordered immediately:</p>
              <ul className="mt-2 space-y-1">
                {items
                  .filter((item) => item.leadTime > 30)
                  .map((item) => (
                    <li key={item.id}>• {item.itemDescription} ({item.leadTime} days)</li>
                  ))}
              </ul>
            </div>
          }
        />
      )}

      {/* Budget Alert */}
      {remainingBudget < 0 && (
        <DocumentHighlight
          type="critical"
          title="Budget Exceeded"
          content={
            <p className="text-xs">
              The procurement budget has been exceeded by {currency}{" "}
              {Math.abs(remainingBudget).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Approval required for additional spending.
            </p>
          }
        />
      )}
    </DocumentTemplate>
  );
}
