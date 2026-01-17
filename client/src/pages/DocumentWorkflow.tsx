import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  ChevronRight,
  Download,
  Share2,
} from "lucide-react";

type WorkflowStep = "upload" | "analyze" | "conflicts" | "gaps" | "generate";

export default function DocumentWorkflow() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("upload");
  const [uploadedFiles, setUploadedFiles] = useState<{ boq?: File; drawings?: File }>({});
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const steps: { id: WorkflowStep; label: string; description: string }[] = [
    { id: "upload", label: "Upload Files", description: "Upload BOQ and Drawings" },
    { id: "analyze", label: "Analyze", description: "AI analyzes files" },
    { id: "conflicts", label: "Resolve Conflicts", description: "Review discrepancies" },
    { id: "gaps", label: "Complete Gaps", description: "Fill missing information" },
    { id: "generate", label: "Generate", description: "Create documents" },
  ];

  const stepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const handleFileUpload = (type: "boq" | "drawings", file: File) => {
    setUploadedFiles((prev) => ({ ...prev, [type]: file }));
  };

  const handleNextStep = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handlePreviousStep = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Create New Document</h1>
          <p className="text-muted-foreground">Follow the steps to generate professional project documents</p>
        </div>

        {/* Progress Indicator */}
        <Card className="mb-8 border-gold/20">
          <CardHeader>
            <CardTitle className="text-lg">Progress</CardTitle>
            <Progress value={progress} className="mt-4" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {stepIndex + 1} of {steps.length}
            </p>
          </CardHeader>
        </Card>

        {/* Steps Navigation */}
        <div className="grid grid-cols-5 gap-2 mb-8">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => index <= stepIndex && setCurrentStep(step.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                step.id === currentStep
                  ? "border-gold bg-gold/10"
                  : index < stepIndex
                    ? "border-green-500 bg-green-500/10"
                    : "border-border bg-background"
              }`}
              disabled={index > stepIndex}
            >
              <div className="text-center">
                {index < stepIndex ? (
                  <CheckCircle className="w-5 h-5 mx-auto text-green-500 mb-1" />
                ) : (
                  <div className="w-5 h-5 mx-auto mb-1 rounded-full border-2 border-current flex items-center justify-center text-xs">
                    {index + 1}
                  </div>
                )}
                <p className="text-xs font-semibold truncate">{step.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle>{steps[stepIndex].label}</CardTitle>
            <CardDescription>{steps[stepIndex].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === "upload" && (
              <div className="space-y-6">
                {/* BOQ Upload */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Bill of Quantities (BOQ)</label>
                  <div className="border-2 border-dashed border-gold/30 rounded-lg p-8 text-center hover:border-gold/60 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto text-gold mb-2" />
                    <p className="text-sm font-medium">Upload BOQ file</p>
                    <p className="text-xs text-muted-foreground">Excel (.xlsx) or PDF (.pdf)</p>
                    <input
                      type="file"
                      accept=".xlsx,.pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload("boq", e.target.files[0])}
                      className="hidden"
                      id="boq-upload"
                    />
                    <label htmlFor="boq-upload" className="block mt-4">
                      <Button variant="outline" className="mx-auto">
                        Choose File
                      </Button>
                    </label>
                    {uploadedFiles.boq && (
                      <p className="text-xs text-green-600 mt-2">✓ {uploadedFiles.boq.name}</p>
                    )}
                  </div>
                </div>

                {/* Drawings Upload */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Drawings</label>
                  <div className="border-2 border-dashed border-gold/30 rounded-lg p-8 text-center hover:border-gold/60 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto text-gold mb-2" />
                    <p className="text-sm font-medium">Upload Drawings</p>
                    <p className="text-xs text-muted-foreground">PDF (.pdf) or CAD (.dwg, .dxf)</p>
                    <input
                      type="file"
                      accept=".pdf,.dwg,.dxf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload("drawings", e.target.files[0])}
                      className="hidden"
                      id="drawings-upload"
                    />
                    <label htmlFor="drawings-upload" className="block mt-4">
                      <Button variant="outline" className="mx-auto">
                        Choose File
                      </Button>
                    </label>
                    {uploadedFiles.drawings && (
                      <p className="text-xs text-green-600 mt-2">✓ {uploadedFiles.drawings.name}</p>
                    )}
                  </div>
                </div>

                {uploadedFiles.boq && uploadedFiles.drawings && (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600">
                      Both files uploaded successfully. Ready to analyze.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {currentStep === "analyze" && (
              <div className="space-y-4">
                <Alert className="border-blue-500/50 bg-blue-500/10">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-600">
                    AI is analyzing your BOQ and Drawings...
                  </AlertDescription>
                </Alert>
                <div className="space-y-3">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-semibold">Analysis Results</p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>✓ BOQ parsed: 150 line items</li>
                      <li>✓ Drawings analyzed: 12 sheets</li>
                      <li>✓ Total area calculated: 5,200 m²</li>
                      <li>⚠ 3 conflicts detected</li>
                      <li>⚠ 5 gaps identified</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {currentStep === "conflicts" && (
              <div className="space-y-4">
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-600">
                    3 conflicts found between BOQ and Drawings. Review and resolve them.
                  </AlertDescription>
                </Alert>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-amber-500/20">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm">Conflict #{i}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Wall area mismatch: BOQ shows 450m² but drawings show 420m²
                            </p>
                          </div>
                          <Badge variant="outline" className="border-amber-500 text-amber-600">
                            2% difference
                          </Badge>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline">
                            Use BOQ Value
                          </Button>
                          <Button size="sm" variant="outline">
                            Use Drawing Value
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "gaps" && (
              <div className="space-y-4">
                <Alert className="border-blue-500/50 bg-blue-500/10">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-600">
                    5 gaps identified. Please provide the missing information.
                  </AlertDescription>
                </Alert>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 bg-muted rounded-lg">
                      <label className="block text-sm font-semibold mb-2">Gap #{i}</label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Missing unit price for item: Ceramic Tiles (Premium Grade)
                      </p>
                      <input
                        type="number"
                        placeholder="Enter unit price (AED)"
                        className="w-full px-3 py-2 border border-border rounded-md text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === "generate" && (
              <div className="space-y-4">
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    All validations passed! Ready to generate documents.
                  </AlertDescription>
                </Alert>
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Select documents to generate:</p>
                  {[
                    "Initial Baseline Program",
                    "Procurement Log",
                    "Engineering Log",
                    "Budget Estimation",
                    "Value Engineering",
                    "Risk Assessment",
                  ].map((doc) => (
                    <label key={doc} className="flex items-center p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                      <input type="checkbox" defaultChecked className="mr-3" />
                      <span className="text-sm">{doc}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            disabled={stepIndex === 0}
          >
            Previous
          </Button>
          <Button
            onClick={handleNextStep}
            disabled={stepIndex === steps.length - 1 || (currentStep === "upload" && !uploadedFiles.boq)}
            className="bg-gold text-primary hover:bg-gold/90"
          >
            Next <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Generate Button */}
        {currentStep === "generate" && (
          <div className="mt-4">
            <Button className="w-full bg-gold text-primary hover:bg-gold/90 h-12">
              <Download className="w-4 h-4 mr-2" />
              Generate & Download Documents
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
