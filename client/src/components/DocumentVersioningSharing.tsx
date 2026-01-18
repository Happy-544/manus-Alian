/**
 * Document Versioning and Sharing Component
 * Handles document versions, sharing with team members, and permission management
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Share2,
  Download,
  Eye,
  Edit3,
  Lock,
  Clock,
  User,
  Mail,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react";

export interface DocumentVersion {
  id: number;
  versionNumber: string;
  createdAt: Date;
  createdBy: string;
  changes: string;
  fileSize: number;
  downloadUrl: string;
  isLatest: boolean;
}

export interface DocumentShare {
  id: number;
  sharedWith: string;
  email: string;
  permission: "view" | "edit" | "download";
  sharedAt: Date;
  sharedBy: string;
  expiresAt?: Date;
}

export interface DocumentVersioningSharingProps {
  documentId: number;
  documentName: string;
  versions: DocumentVersion[];
  shares: DocumentShare[];
  onAddVersion?: (version: DocumentVersion) => void;
  onShareDocument?: (share: DocumentShare) => void;
  onRevokeShare?: (shareId: number) => void;
  onDownloadVersion?: (versionId: number) => void;
}

export function DocumentVersioningSharing({
  documentId,
  documentName,
  versions,
  shares,
  onAddVersion,
  onShareDocument,
  onRevokeShare,
  onDownloadVersion,
}: DocumentVersioningSharingProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState<"view" | "edit" | "download">("view");
  const [shareExpiresIn, setShareExpiresIn] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleShareDocument = () => {
    if (!shareEmail) {
      alert("Please enter an email address");
      return;
    }

    const expiresAt = shareExpiresIn
      ? new Date(Date.now() + shareExpiresIn * 24 * 60 * 60 * 1000)
      : undefined;

    const newShare: DocumentShare = {
      id: Math.random(),
      sharedWith: shareEmail.split("@")[0],
      email: shareEmail,
      permission: sharePermission,
      sharedAt: new Date(),
      sharedBy: "Current User",
      expiresAt,
    };

    if (onShareDocument) {
      onShareDocument(newShare);
    }

    setShareEmail("");
    setSharePermission("view");
    setShareExpiresIn(null);
    setIsShareDialogOpen(false);
  };

  const handleCopyShareLink = (shareId: number) => {
    const shareLink = `${window.location.origin}/share/${documentId}/${shareId}`;
    navigator.clipboard.writeText(shareLink);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPermissionBadgeColor = (permission: string) => {
    switch (permission) {
      case "view":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "edit":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "download":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case "view":
        return <Eye className="w-4 h-4" />;
      case "edit":
        return <Edit3 className="w-4 h-4" />;
      case "download":
        return <Download className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Versions Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold" />
            <h3 className="text-lg font-bold text-foreground">Version History</h3>
          </div>
          <Badge variant="outline">{versions.length} versions</Badge>
        </div>

        <div className="space-y-3">
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No versions yet</p>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className={`p-4 rounded-lg border ${
                  version.isLatest
                    ? "bg-gold/5 border-gold/40"
                    : "bg-muted border-border hover:bg-muted/50"
                } transition-colors`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">v{version.versionNumber}</p>
                        {version.isLatest && (
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            Latest
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {version.createdAt.toLocaleDateString()} at{" "}
                        {version.createdAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownloadVersion?.(version.id)}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Created By</p>
                    <p className="font-medium text-foreground">{version.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">File Size</p>
                    <p className="font-medium text-foreground">
                      {(version.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                {version.changes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Changes</p>
                    <p className="text-sm text-foreground">{version.changes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Document Sharing Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-gold" />
            <h3 className="text-lg font-bold text-foreground">Shared With</h3>
          </div>
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Share2 className="w-4 h-4" />
                Share Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Share Document</DialogTitle>
                <DialogDescription>
                  Share {documentName} with team members and set permissions
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Email Address</label>
                  <Input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="colleague@example.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-1 block">Permission Level</label>
                  <div className="space-y-2">
                    {(["view", "edit", "download"] as const).map((perm) => (
                      <label key={perm} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="permission"
                          value={perm}
                          checked={sharePermission === perm}
                          onChange={(e) => setSharePermission(e.target.value as typeof perm)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium capitalize">{perm}</span>
                        <span className="text-xs text-muted-foreground">
                          {perm === "view" && "View only"}
                          {perm === "edit" && "View and edit"}
                          {perm === "download" && "View and download"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-1 block">Expiration (optional)</label>
                  <select
                    value={shareExpiresIn || ""}
                    onChange={(e) =>
                      setShareExpiresIn(e.target.value ? parseInt(e.target.value) : null)
                    }
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">No expiration</option>
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>

                <Button onClick={handleShareDocument} className="w-full">
                  Share Document
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {shares.length === 0 ? (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                This document hasn't been shared with anyone yet
              </AlertDescription>
            </Alert>
          ) : (
            shares.map((share) => (
              <div
                key={share.id}
                className="p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-gold" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{share.sharedWith}</p>
                      <p className="text-xs text-muted-foreground">{share.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRevokeShare?.(share.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Permission</p>
                    <Badge
                      variant="outline"
                      className={`gap-1 ${getPermissionBadgeColor(share.permission)}`}
                    >
                      {getPermissionIcon(share.permission)}
                      {share.permission.charAt(0).toUpperCase() + share.permission.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Shared</p>
                    <p className="font-medium text-foreground">
                      {share.sharedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {share.expiresAt && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Expires: {share.expiresAt.toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyShareLink(share.id)}
                    className="gap-2 flex-1"
                  >
                    {copiedId === share.id ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Sharing Guidelines */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <p className="font-semibold mb-2">Sharing Tips:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Use "View" permission for stakeholders who only need to review documents</li>
            <li>Use "Edit" permission for team members collaborating on the document</li>
            <li>Set expiration dates for temporary access to sensitive documents</li>
            <li>Revoke access immediately when team members leave the project</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
