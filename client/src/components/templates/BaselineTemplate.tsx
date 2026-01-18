/**
 * Baseline Program Document Template
 * Professional template for project baseline schedules
 */

import { DocumentTemplate, DocumentSection, DocumentTable, DocumentHighlight, DocumentMetadata } from "../DocumentTemplate";

export interface BaselinePhase {
  id: string;
  phaseName: string;
  description: string;
  startDate: Date;
  endDate: Date;
  duration: number; // in days
  dependencies?: string[];
  resources?: string[];
  milestones?: string[];
}

export interface BaselineTemplateProps {
  metadata: DocumentMetadata;
  phases: BaselinePhase[];
  projectStartDate: Date;
  projectEndDate: Date;
  totalDuration: number;
  keyMilestones?: string[];
  risks?: string[];
}

export function BaselineTemplate({
  metadata,
  phases,
  projectStartDate,
  projectEndDate,
  totalDuration,
  keyMilestones,
  risks,
}: BaselineTemplateProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const footerContent = (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-8">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">PROJECT MANAGER</p>
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
      {/* Project Overview */}
      <DocumentSection title="Project Overview">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-semibold mb-2">Project Duration</p>
            <p className="text-lg font-bold text-foreground">{totalDuration} Days</p>
            <p className="text-xs text-muted-foreground mt-2">
              {formatDate(projectStartDate)} to {formatDate(projectEndDate)}
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-semibold mb-2">Total Phases</p>
            <p className="text-lg font-bold text-gold">{phases.length}</p>
            <p className="text-xs text-muted-foreground mt-2">Planned execution phases</p>
          </div>
        </div>
      </DocumentSection>

      {/* Phase Schedule */}
      <DocumentSection title="Project Phases & Schedule">
        <DocumentTable
          headers={["Phase", "Start Date", "End Date", "Duration", "Key Milestones"]}
          rows={phases.map((phase) => [
            phase.phaseName,
            formatDate(phase.startDate),
            formatDate(phase.endDate),
            `${phase.duration} days`,
            phase.milestones?.join(", ") || "-",
          ])}
        />
      </DocumentSection>

      {/* Detailed Phase Information */}
      {phases.map((phase, idx) => (
        <DocumentSection
          key={phase.id}
          title={`Phase ${idx + 1}: ${phase.phaseName}`}
          subtitle={`${formatDate(phase.startDate)} to ${formatDate(phase.endDate)} (${phase.duration} days)`}
        >
          <div className="space-y-4">
            {phase.description && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Description</p>
                <p className="text-sm text-muted-foreground">{phase.description}</p>
              </div>
            )}

            {phase.dependencies && phase.dependencies.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Dependencies</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {phase.dependencies.map((dep, i) => (
                    <li key={i}>• {dep}</li>
                  ))}
                </ul>
              </div>
            )}

            {phase.resources && phase.resources.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Required Resources</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {phase.resources.map((resource, i) => (
                    <li key={i}>• {resource}</li>
                  ))}
                </ul>
              </div>
            )}

            {phase.milestones && phase.milestones.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Key Milestones</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {phase.milestones.map((milestone, i) => (
                    <li key={i}>✓ {milestone}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DocumentSection>
      ))}

      {/* Key Milestones Summary */}
      {keyMilestones && keyMilestones.length > 0 && (
        <DocumentSection title="Key Project Milestones">
          <div className="space-y-3">
            {keyMilestones.map((milestone, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gold/5 rounded border border-gold/20">
                <div className="w-6 h-6 rounded-full bg-gold text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <p className="text-sm text-foreground pt-0.5">{milestone}</p>
              </div>
            ))}
          </div>
        </DocumentSection>
      )}

      {/* Risk Assessment */}
      {risks && risks.length > 0 && (
        <DocumentSection title="Identified Risks & Mitigation">
          <div className="space-y-3">
            {risks.map((risk, idx) => (
              <div key={idx} className="p-3 border-l-4 border-amber-500 bg-amber-500/5 rounded-r">
                <p className="text-sm font-semibold text-foreground mb-1">Risk {idx + 1}</p>
                <p className="text-sm text-muted-foreground">{risk}</p>
              </div>
            ))}
          </div>
        </DocumentSection>
      )}

      {/* Assumptions and Constraints */}
      <DocumentSection title="Assumptions & Constraints">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Assumptions</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• All materials and resources will be available as planned</li>
              <li>• No major design changes will occur during execution</li>
              <li>• Weather conditions will not significantly impact the schedule</li>
              <li>• All approvals and permits will be obtained on time</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Constraints</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Project must be completed by {formatDate(projectEndDate)}</li>
              <li>• Budget constraints may limit resource allocation</li>
              <li>• Site access may be limited during certain hours</li>
              <li>• Coordination with other trades is required</li>
            </ul>
          </div>
        </div>
      </DocumentSection>

      {/* Approval and Sign-off */}
      <DocumentHighlight
        type="info"
        title="Schedule Baseline Approval"
        content={
          <div className="space-y-2 text-xs">
            <p>This baseline schedule has been reviewed and approved by all stakeholders.</p>
            <p>Any changes to this schedule must be documented and approved through the change control process.</p>
            <p>Regular schedule updates will be provided to track progress against this baseline.</p>
          </div>
        }
      />
    </DocumentTemplate>
  );
}
