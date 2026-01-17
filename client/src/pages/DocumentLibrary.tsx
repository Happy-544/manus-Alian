import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Download,
  Share2,
  MoreVertical,
  Search,
  Filter,
  Calendar,
  User,
  Eye,
  Copy,
  Trash2,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: "baseline" | "procurement" | "engineering" | "budget" | "value" | "risk";
  status: "completed" | "draft" | "processing";
  createdAt: Date;
  createdBy: string;
  size: string;
  shared: boolean;
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "VFS Wafi - Baseline Program",
    type: "baseline",
    status: "completed",
    createdAt: new Date("2024-01-15"),
    createdBy: "Mohamed Ali",
    size: "2.4 MB",
    shared: true,
  },
  {
    id: "2",
    name: "VFS Wafi - Procurement Log",
    type: "procurement",
    status: "completed",
    createdAt: new Date("2024-01-15"),
    createdBy: "Mohamed Ali",
    size: "1.8 MB",
    shared: false,
  },
  {
    id: "3",
    name: "VFS Wafi - Engineering Log",
    type: "engineering",
    status: "completed",
    createdAt: new Date("2024-01-14"),
    createdBy: "Mohamed Ali",
    size: "3.1 MB",
    shared: true,
  },
  {
    id: "4",
    name: "VFS Wafi - Budget Estimation",
    type: "budget",
    status: "draft",
    createdAt: new Date("2024-01-10"),
    createdBy: "Mohamed Ali",
    size: "1.2 MB",
    shared: false,
  },
];

export default function DocumentLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  const documentTypes = [
    { value: "baseline", label: "Baseline Program" },
    { value: "procurement", label: "Procurement Log" },
    { value: "engineering", label: "Engineering Log" },
    { value: "budget", label: "Budget Estimation" },
    { value: "value", label: "Value Engineering" },
    { value: "risk", label: "Risk Assessment" },
  ];

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || doc.type === filterType;
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      baseline: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      procurement: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      engineering: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      budget: "bg-green-500/10 text-green-600 border-green-500/20",
      value: "bg-pink-500/10 text-pink-600 border-pink-500/20",
      risk: "bg-red-500/10 text-red-600 border-red-500/20",
    };
    return colors[type] || "bg-gray-500/10 text-gray-600 border-gray-500/20";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-green-500/10 text-green-600 border-green-500/20",
      draft: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    };
    return colors[status] || "bg-gray-500/10 text-gray-600 border-gray-500/20";
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Document Library</h1>
          <p className="text-muted-foreground">Manage and access all your generated project documents</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 border-gold/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Document Type</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="size">Largest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="border-gold/20 hover:border-gold/40 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <FileText className="w-5 h-5 text-gold mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{doc.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="w-3 h-3" />
                            {doc.createdAt.toLocaleDateString()}
                          </div>
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Type and Status Badges */}
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={`border ${getTypeColor(doc.type)}`}>
                        {documentTypes.find((t) => t.value === doc.type)?.label}
                      </Badge>
                      <Badge className={`border ${getStatusColor(doc.status)}`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </Badge>
                      {doc.shared && (
                        <Badge variant="outline" className="border-gold/50 text-gold">
                          <Share2 className="w-3 h-3 mr-1" />
                          Shared
                        </Badge>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {doc.createdBy}
                      </div>
                      <div>{doc.size}</div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Share2 className="w-3 h-3 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-gold/20">
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">No documents found</p>
              <Button className="bg-gold text-primary hover:bg-gold/90">
                Create Your First Document
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <Card className="border-gold/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Total Documents</p>
              <p className="text-2xl font-bold text-gold">{filteredDocuments.length}</p>
            </CardContent>
          </Card>
          <Card className="border-gold/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredDocuments.filter((d) => d.status === "completed").length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-gold/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Shared</p>
              <p className="text-2xl font-bold text-blue-600">
                {filteredDocuments.filter((d) => d.shared).length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-gold/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Total Size</p>
              <p className="text-2xl font-bold text-purple-600">8.5 MB</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
