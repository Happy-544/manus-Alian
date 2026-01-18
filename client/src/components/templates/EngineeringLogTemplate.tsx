/**
 * Engineering Log Document Template
 * Professional template for technical documentation and site records
 */

import { DocumentTemplate, DocumentSection, DocumentTable, DocumentHighlight, DocumentMetadata } from "../DocumentTemplate";

export interface EngineeringEntry {
  id: string;
  date: Date;
  category: string;
  title: string;
  description: string;
  findings: string;
  recommendations: string;
  status: "open" | "resolved" | "pending_approval";
  assignedTo?: string;
  priority: "low" | "medium" | "high" | "critical";
  attachments?: string[];
}

export interface EngineeringLogTemplateProps {
  metadata: DocumentMetadata;
  entries: EngineeringEntry[];
  summary?: string;
}

export function EngineeringLogTemplate({
  metadata,
  entries,
  summary,
}: EngineeringLogTemplateProps) {
  const priorityColors = {
    low: "text-blue-600",
    medium: "text-amber-600",
    high: "text-orange-600",
    critical: "text-red-600",
  };

  const priorityBg = {
    low: "bg-blue-500/5 border-blue-500/30",
    medium: "bg-amber-500/5 border-amber-500/30",
    high: "bg-orange-500/5 border-orange-500/30",
    critical: "bg-red-500/5 border-red-500/30",
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const entriesByCategory = entries.reduce(
    (acc, entry) => {
      if (!acc[entry.category]) {
        acc[entry.category] = [];
      }
      acc[entry.category].push(entry);
      return acc;
    },
    {} as Record<string, EngineeringEntry[]>
  );

  const openIssues = entries.filter((e) => e.status === "open").length;
  const resolvedIssues = entries.filter((e) => e.status === "resolved").length;
  const criticalIssues = entries.filter((e) => e.priority === "critical").length;

  const footerContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-8">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">SITE ENGINEER</p>
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
      {/* Executive Summary */}
      {summary && (
        <DocumentSection title="Executive Summary">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{summary}</p>
        </DocumentSection>
      )}

      {/* Status Overview */}
      <DocumentSection title="Status Overview">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Total Entries</p>
            <p className="text-2xl font-bold text-foreground">{entries.length}</p>
          </div>
          <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/30">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{resolvedIssues}</p>
          </div>
          <div className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/30">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Open Issues</p>
            <p className="text-2xl font-bold text-amber-600">{openIssues}</p>
          </div>
          <div className="p-4 bg-red-500/5 rounded-lg border border-red-500/30">
            <p className="text-xs text-muted-foreground font-semibold mb-1">Critical</p>
            <p className="text-2xl font-bold text-red-600">{criticalIssues}</p>
          </div>
        </div>
      </DocumentSection>

      {/* Entries by Category */}
      {Object.entries(entriesByCategory).map(([category, categoryEntries]) => (
        <DocumentSection key={category} title={`${category} (${categoryEntries.length})`}>
          <div className="space-y-4">
            {categoryEntries.map((entry, idx) => (
              <div
                key={entry.id}
                className={`p-4 border-l-4 rounded-r-lg ${priorityBg[entry.priority]}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">{entry.title}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${priorityColors[entry.priority]}`}>
                        {entry.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded capitalize ${entry.status === "open" ? "text-amber-600" : entry.status === "resolved" ? "text-green-600" : "text-blue-600"}`}>
                    {entry.status.replace("_", " ")}
                  </span>
                </div>

                {entry.description && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                  </div>
                )}

                {entry.findings && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Findings</p>
                    <p className="text-sm text-muted-foreground">{entry.findings}</p>
                  </div>
                )}

                {entry.recommendations && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Recommendations</p>
                    <p className="text-sm text-muted-foreground">{entry.recommendations}</p>
                  </div>
                )}

                {entry.assignedTo && (
                  <div className="pt-3 border-t border-current/20">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">Assigned to:</span> {entry.assignedTo}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DocumentSection>
      ))}

      {/* Issues Summary Table */}
      {entries.length > 0 && (
        <DocumentSection title="Issues Summary">
          <DocumentTable
            headers={["Date", "Category", "Title", "Priority", "Status"]}
            rows={entries.map((entry) => [
              formatDate(entry.date),
              entry.category,
              entry.title,
              entry.priority.charAt(0).toUpperCase() + entry.priority.slice(1),
              entry.status.replace("_", " ").charAt(0).toUpperCase() + entry.status.replace("_", " ").slice(1),
            ])}
          />
        </DocumentSection>
      )}

      {/* Critical Issues Alert */}
      {criticalIssues > 0 && (
        <DocumentHighlight
          type="critical"
          title="Critical Issues Requiring Immediate Action"
          content={
            <ul className="space-y-1 text-xs">
              {entries
                .filter((e) => e.priority === "critical")
                .map((entry) => (
                  <li key={entry.id}>• {entry.title} - {entry.status}</li>
                ))}
            </ul>
          }
        />
      )}

      {/* Open Issues Alert */}
      {openIssues > 0 && (
        <DocumentHighlight
          type="warning"
          title="Open Issues Pending Resolution"
          content={
            <p className="text-xs">
              There are {openIssues} open issue(s) that require attention and follow-up action. Please review and update status regularly.
            </p>
          }
        />
      )}

      {/* Compliance and Standards */}
      <DocumentSection title="Compliance & Standards">
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-foreground mb-1">Standards Followed</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• UAE Building Code and Regulations</li>
              <li>• Dubai Municipality Requirements</li>
              <li>• International Construction Standards (ISO)</li>
              <li>• Project Specifications and Drawings</li>
            </ul>
          </div>
        </div>
      </DocumentSection>
    </DocumentTemplate>
  );
}
