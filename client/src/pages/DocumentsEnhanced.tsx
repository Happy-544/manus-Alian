"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import {
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle,
  Zap,
  FileJson,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";
import { Document, Packer, Paragraph, TextRun } from "docx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const documentTypeConfig = {
  drawing: { label: "Drawing", icon: FileImage, color: "bg-purple-100 text-purple-700" },
  contract: { label: "Contract", icon: FileText, color: "bg-blue-100 text-blue-700" },
  invoice: { label: "Invoice", icon: FileSpreadsheet, color: "bg-green-100 text-green-700" },
  permit: { label: "Permit", icon: File, color: "bg-amber-100 text-amber-700" },
  report: { label: "Report", icon: FileText, color: "bg-slate-100 text-slate-700" },
  specification: { label: "Specification", icon: FileText, color: "bg-cyan-100 text-cyan-700" },
  photo: { label: "Photo", icon: FileImage, color: "bg-pink-100 text-pink-700" },
  other: { label: "Other", icon: File, color: "bg-gray-100 text-gray-700" },
};

const documentGenerationTypes = [
  { id: 'baseline', label: 'Baseline Program', description: 'Schedule and timeline baseline' },
  { id: 'procurement', label: 'Procurement Log', description: 'Materials and vendor list' },
  { id: 'engineering', label: 'Engineering Log', description: 'Technical specifications' },
  { id: 'budget', label: 'Budget Estimation', description: 'Detailed cost breakdown' },
  { id: 'value_engineering', label: 'Value Engineering', description: 'Cost optimization recommendations' },
  { id: 'risk_assessment', label: 'Risk Assessment', description: 'Project risks and mitigation' },
];

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
  return File;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocumentsEnhanced() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: projects } = trpc.projects.list.useQuery();
  const { data: documents, isLoading, refetch } = trpc.documents.list.useQuery(
    { projectId: parseInt(selectedProjectId) },
    { enabled: !!selectedProjectId }
  );

  // File analysis
  const { data: fileAnalysis } = trpc.fileAnalysis.analyzeProjectFiles.useQuery(
    { projectId: parseInt(selectedProjectId) },
    { enabled: !!selectedProjectId }
  );

  const uploadDocument = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      setIsUploadOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload document");
    },
  });

  const deleteDocument = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete document");
    },
  });

  // Generation states
  const [isGenerationOpen, setIsGenerationOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<"idle" | "generating" | "completed" | "error">("idle");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isExporting, setIsExporting] = useState<"pdf" | "docx" | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [showInfoGathering, setShowInfoGathering] = useState(false);

  const generateDocuments = trpc.documentGeneration.generateComprehensive.useMutation({
    onSuccess: (result) => {
      setGeneratedContent(result.content);
      setGenerationStatus("completed");
      toast.success("Document generated successfully!");
    },
    onError: (error) => {
      setGenerationStatus("error");
      toast.error(error.message || "Failed to generate document");
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "other" as "drawing" | "contract" | "invoice" | "report" | "permit" | "photo" | "specification" | "other",
    fileData: "",
    fileName: "",
    fileSize: 0,
    mimeType: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "other",
      fileData: "",
      fileName: "",
      fileSize: 0,
      mimeType: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setFormData({
        ...formData,
        name: formData.name || file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileData: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fileData) {
      toast.error("Please select a file");
      return;
    }
    uploadDocument.mutate({
      projectId: parseInt(selectedProjectId),
      name: formData.name,
      description: formData.description,
      category: formData.category,
      fileData: formData.fileData,
      mimeType: formData.mimeType,
      fileSize: formData.fileSize,
    });
  };

  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileKey?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || doc.category === typeFilter;
    return matchesSearch && matchesType;
  });

  const groupedDocuments = filteredDocuments?.reduce((acc, doc) => {
    const type = doc.category || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  const handleGenerateDocument = (docType: string) => {
    setSelectedDocType(docType);
    
    // Check if we need to gather additional information
    if (!fileAnalysis?.hasBOQ || !fileAnalysis?.hasDrawings) {
      setShowInfoGathering(true);
    } else {
      setShowInfoGathering(false);
      startGeneration();
    }
  };

  const startGeneration = () => {
    if (!selectedDocType) return;
    
    setGenerationStatus("generating");
    setShowInfoGathering(false);
    
    const boqInfo = fileAnalysis?.boqFiles?.map(f => f.name).join(', ') || 'Not provided';
    const drawingInfo = fileAnalysis?.drawingFiles?.map(f => f.name).join(', ') || 'Not provided';
    
    generateDocuments.mutate({
      projectId: parseInt(selectedProjectId),
      boqContent: `BOQ Files: ${boqInfo}`,
      drawingsDescription: `Drawing Files: ${drawingInfo}. Additional info: ${additionalInfo}`,
      missingInfo: { documentType: selectedDocType },
    });
  };

  const exportToPDF = async () => {
    setIsExporting("pdf");
    try {
      const element = document.createElement("div");
      element.innerHTML = `<h1>${selectedDocType} - Project Documentation</h1><pre>${generatedContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
      const opt = {
        margin: 10,
        filename: `${selectedDocType}-documentation.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait" as const, unit: "mm" as const, format: "a4" },
      };
      await html2pdf().set(opt).from(element).save();
      toast.success("PDF exported successfully");
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    } finally {
      setIsExporting(null);
    }
  };

  const exportToDocx = async () => {
    setIsExporting("docx");
    try {
      const lines = generatedContent.split("\n");
      const children: Paragraph[] = [];

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${selectedDocType} - Project Documentation`,
              bold: true,
              size: 32,
            }),
          ],
        })
      );

      lines.forEach((line) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line || " ",
                size: 22,
              }),
            ],
          })
        );
      });

      const doc = new Document({
        sections: [
          {
            children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedDocType}-documentation.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Word document exported successfully");
    } catch (error) {
      toast.error("Failed to export Word document");
      console.error(error);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            Manage project files, drawings, and contracts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProjectId && (
            <>
              <Button onClick={() => setIsUploadOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </>
          )}
        </div>
      </div>

      {!selectedProjectId ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Project</h3>
            <p className="text-muted-foreground">
              Choose a project to view and manage its documents
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* File Status Alert */}
          {fileAnalysis && (
            <Alert className={fileAnalysis.missingDocuments.length > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}>
              <div className="flex items-start gap-3">
                {fileAnalysis.missingDocuments.length > 0 ? (
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold ${fileAnalysis.missingDocuments.length > 0 ? 'text-amber-900' : 'text-green-900'}`}>
                    {fileAnalysis.missingDocuments.length > 0 ? 'Missing Documents' : 'All Required Documents Found'}
                  </h3>
                  <p className={`text-sm ${fileAnalysis.missingDocuments.length > 0 ? 'text-amber-800' : 'text-green-800'}`}>
                    {fileAnalysis.missingDocuments.length > 0 
                      ? `Missing: ${fileAnalysis.missingDocuments.join(', ')}. Upload these files for better AI analysis.`
                      : `BOQ and Drawings detected. Ready for document generation.`}
                  </p>
                  {fileAnalysis.boqFiles.length > 0 && (
                    <p className="text-xs mt-2 text-muted-foreground">
                      BOQ: {fileAnalysis.boqFiles.map(f => f.name).join(', ')}
                    </p>
                  )}
                  {fileAnalysis.drawingFiles.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Drawings: {fileAnalysis.drawingFiles.map(f => f.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </Alert>
          )}

          {/* AI Document Generation Buttons */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Generate Documents with AI
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {documentGenerationTypes.map((docType) => (
                <Card 
                  key={docType.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleGenerateDocument(docType.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <FileJson className="h-5 w-5 text-blue-500 mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{docType.label}</p>
                        <p className="text-sm text-muted-foreground">{docType.description}</p>
                      </div>
                    </div>
                    <Button className="w-full mt-3" size="sm">
                      Generate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(documentTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Documents Grid */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : !filteredDocuments || filteredDocuments.length === 0 ? (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <File className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No documents found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || typeFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Upload your first document to get started"}
                </p>
                <Button onClick={() => setIsUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedDocuments || {}).map(([type, docs]) => {
                const config = documentTypeConfig[type as keyof typeof documentTypeConfig];
                const TypeIcon = config?.icon || File;

                return (
                  <div key={type}>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <TypeIcon className="h-4 w-4" />
                      {config?.label || type} ({docs?.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {docs?.map((doc) => {
                        const FileIcon = getFileIcon(doc.mimeType);
                        const typeConfig = documentTypeConfig[doc.category as keyof typeof documentTypeConfig];

                        return (
                          <Card key={doc.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`h-10 w-10 rounded-lg ${typeConfig?.color || "bg-gray-100"} flex items-center justify-center shrink-0`}>
                                  <FileIcon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="font-medium truncate">{doc.name}</p>
                                      <p className="text-sm text-muted-foreground truncate">
                                        {doc.fileKey}
                                      </p>
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => {
                                            if (doc.fileUrl) {
                                              window.open(doc.fileUrl, "_blank");
                                            }
                                          }}
                                        >
                                          <Download className="mr-2 h-4 w-4" />
                                          Download
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-destructive"
                                          onClick={() => {
                                            if (confirm("Are you sure you want to delete this document?")) {
                                              deleteDocument.mutate({ id: doc.id });
                                            }
                                          }}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      v{doc.version}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatFileSize(doc.fileSize)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(doc.createdAt), "MMM d, yyyy")}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={(open) => {
        setIsUploadOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a new document to this project (BOQ, Drawings, or other files)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                  accept=".xlsx,.xls,.pdf,.dwg,.dxf,.rvt"
                />
                {formData.fileName && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {formData.fileName} ({formatFileSize(formData.fileSize)})
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Document Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., BOQ - Villa 45 or Floor Plan"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="documentType">Type</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(documentTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploadDocument.isPending}>
                {uploadDocument.isPending ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Information Gathering Dialog */}
      <Dialog open={showInfoGathering} onOpenChange={setShowInfoGathering}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Additional Information Needed</DialogTitle>
            <DialogDescription>
              Some required documents are missing. Please provide additional information for better AI analysis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {fileAnalysis?.missingDocuments?.join(', ')} not found. Please provide details below.
              </AlertDescription>
            </Alert>
            <div className="grid gap-2">
              <Label htmlFor="additionalInfo">Project Details</Label>
              <Textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Describe materials, specifications, budget, timeline, or any other relevant project information..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowInfoGathering(false)}>
              Cancel
            </Button>
            <Button onClick={startGeneration} disabled={generateDocuments.isPending}>
              {generateDocuments.isPending ? "Generating..." : "Generate Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generation Result Dialog */}
      <Dialog open={generationStatus === "completed"} onOpenChange={(open) => {
        if (!open) {
          setGenerationStatus("idle");
          setGeneratedContent("");
          setSelectedDocType(null);
          setAdditionalInfo("");
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedDocType} Generated Successfully</DialogTitle>
            <DialogDescription>
              Your document has been generated. Review it below and export in your preferred format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">✓ Document Generated</h3>
              <p className="text-sm text-green-700">Your {selectedDocType} has been created based on project files and Dubai market data.</p>
            </div>
            <div className="max-h-96 overflow-y-auto bg-slate-50 p-4 rounded-lg border">
              <pre className="text-xs whitespace-pre-wrap font-mono">{generatedContent}</pre>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={exportToPDF}
                disabled={isExporting !== null}
                variant="outline"
                className="flex-1"
              >
                {isExporting === "pdf" ? "Exporting..." : "Export as PDF"}
              </Button>
              <Button
                onClick={exportToDocx}
                disabled={isExporting !== null}
                variant="outline"
                className="flex-1"
              >
                {isExporting === "docx" ? "Exporting..." : "Export as Word"}
              </Button>
              <Button
                onClick={() => {
                  setGenerationStatus("idle");
                  setGeneratedContent("");
                  setSelectedDocType(null);
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
