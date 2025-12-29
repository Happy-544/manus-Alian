import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, Plus, Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";

const materialCategories = [
  { value: "concrete", label: "Concrete" },
  { value: "steel", label: "Steel" },
  { value: "paint", label: "Paint" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "hvac", label: "HVAC" },
  { value: "flooring", label: "Flooring" },
  { value: "insulation", label: "Insulation" },
  { value: "other", label: "Other" },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  ordered: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  used: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function Materials() {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "concrete",
    quantity: 0,
    unit: "kg",
    estimatedUnitCost: 0,
    supplier: "",
    specificationNotes: "",
    requiredDate: "",
    status: "pending" as const,
    priority: "medium" as const,
  });

  // Get projects
  const { data: projects = [] } = trpc.projects.list.useQuery();
  
  // Get materials for selected project
  const { data: materials = [], refetch: refetchMaterials } = trpc.materials.list.useQuery(
    { projectId: selectedProjectId || 0 },
    { enabled: !!selectedProjectId }
  );

  const createMaterial = trpc.materials.create.useMutation({
    onSuccess: () => {
      toast.success("Material added successfully");
      setIsAddOpen(false);
      setNewItem({
        name: "",
        description: "",
        category: "concrete",
        quantity: 0,
        unit: "kg",
        estimatedUnitCost: 0,
        supplier: "",
        specificationNotes: "",
        requiredDate: "",
        status: "pending",
        priority: "medium",
      });
      refetchMaterials();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMaterial = trpc.materials.delete.useMutation({
    onSuccess: () => {
      toast.success("Material deleted");
      refetchMaterials();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMaterial = trpc.materials.update.useMutation({
    onSuccess: () => {
      toast.success("Material updated");
      refetchMaterials();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleCreateMaterial = () => {
    if (!selectedProjectId || !newItem.name || !newItem.category) {
      toast.error("Please fill in required fields");
      return;
    }

    createMaterial.mutate({
      projectId: selectedProjectId,
      ...newItem,
      quantity: Number(newItem.quantity),
      estimatedUnitCost: newItem.estimatedUnitCost ? Number(newItem.estimatedUnitCost) : undefined,
      requiredDate: newItem.requiredDate ? new Date(newItem.requiredDate) : undefined,
    });
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "all" || item.category === filterCategory;
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [materials, searchQuery, filterCategory, filterStatus]);

  const totalEstimatedCost = filteredMaterials.reduce(
    (sum, item) => sum + (Number(item.totalEstimatedCost) || 0),
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Material List</h1>
            <p className="text-muted-foreground">Track and manage construction materials</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} disabled={!selectedProjectId}>
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>

        {/* Project Selector */}
        <Card className="p-4">
          <Label className="mb-2 block">Select Project</Label>
          <Select value={selectedProjectId?.toString() || ""} onValueChange={(v) => setSelectedProjectId(Number(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a project..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {selectedProjectId && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Total Items</div>
                <div className="text-2xl font-bold">{filteredMaterials.length}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-2xl font-bold">{filteredMaterials.filter(m => m.status === 'pending').length}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Delivered</div>
                <div className="text-2xl font-bold">{filteredMaterials.filter(m => m.status === 'delivered').length}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Est. Total Cost</div>
                <div className="text-2xl font-bold">${totalEstimatedCost.toLocaleString()}</div>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {materialCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Materials Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Required Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No materials found. Add materials to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMaterials.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>{item.quantity} {item.unit}</TableCell>
                        <TableCell>
                          {item.estimatedUnitCost 
                            ? `$${Number(item.estimatedUnitCost).toLocaleString()}`
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {item.totalEstimatedCost ? `$${Number(item.totalEstimatedCost).toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.status}
                            onValueChange={(v: any) => updateMaterial.mutate({ id: item.id, status: v })}
                          >
                            <SelectTrigger className="w-[120px]">
                              <Badge className={statusColors[item.status]}>{item.status}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="ordered">Ordered</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="used">Used</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityColors[item.priority]}>{item.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.requiredDate 
                            ? new Date(item.requiredDate).toLocaleDateString()
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMaterial.mutate({ id: item.id })}
                          >
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </>
        )}

        {/* Add Material Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Material</DialogTitle>
              <DialogDescription>
                Add a new material to your project
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Material Name *</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Portland Cement"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Material description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <Select value={newItem.category} onValueChange={(v) => setNewItem({ ...newItem, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {materialCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Unit *</Label>
                  <Input
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="kg, m3, liters, etc."
                  />
                </div>
                <div>
                  <Label>Unit Cost</Label>
                  <Input
                    type="number"
                    value={newItem.estimatedUnitCost}
                    onChange={(e) => setNewItem({ ...newItem, estimatedUnitCost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label>Supplier</Label>
                <Input
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>
              <div>
                <Label>Specification Notes</Label>
                <Textarea
                  value={newItem.specificationNotes}
                  onChange={(e) => setNewItem({ ...newItem, specificationNotes: e.target.value })}
                  placeholder="Technical specifications"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Required Date</Label>
                  <Input
                    type="date"
                    value={newItem.requiredDate}
                    onChange={(e) => setNewItem({ ...newItem, requiredDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={newItem.priority} onValueChange={(v: any) => setNewItem({ ...newItem, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateMaterial} disabled={createMaterial.isPending}>
                {createMaterial.isPending ? "Adding..." : "Add Material"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
