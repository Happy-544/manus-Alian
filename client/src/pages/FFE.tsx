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

const ffeCategories = [
  { value: "furniture", label: "Furniture" },
  { value: "fixtures", label: "Fixtures" },
  { value: "equipment", label: "Equipment" },
  { value: "appliances", label: "Appliances" },
  { value: "lighting", label: "Lighting" },
  { value: "hvac", label: "HVAC" },
  { value: "other", label: "Other" },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  ordered: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  installed: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function FFE() {
  const { user } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "furniture",
    type: "",
    quantity: 1,
    unit: "piece",
    estimatedUnitCost: 0,
    manufacturer: "",
    modelNumber: "",
    specificationNotes: "",
    installationNotes: "",
    requiredDate: "",
    status: "pending" as const,
    priority: "medium" as const,
  });

  // Get projects
  const { data: projects = [] } = trpc.projects.list.useQuery();
  
  // Get FF&E items for selected project
  const { data: ffeItems = [], refetch: refetchFFE } = trpc.ffe.list.useQuery(
    { projectId: selectedProjectId || 0 },
    { enabled: !!selectedProjectId }
  );

  const createFFE = trpc.ffe.create.useMutation({
    onSuccess: () => {
      toast.success("FF&E item added successfully");
      setIsAddOpen(false);
      setNewItem({
        name: "",
        description: "",
        category: "furniture",
        type: "",
        quantity: 1,
        unit: "piece",
        estimatedUnitCost: 0,
        manufacturer: "",
        modelNumber: "",
        specificationNotes: "",
        installationNotes: "",
        requiredDate: "",
        status: "pending",
        priority: "medium",
      });
      refetchFFE();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteFFE = trpc.ffe.delete.useMutation({
    onSuccess: () => {
      toast.success("FF&E item deleted");
      refetchFFE();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateFFE = trpc.ffe.update.useMutation({
    onSuccess: () => {
      toast.success("FF&E item updated");
      refetchFFE();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleCreateFFE = () => {
    if (!selectedProjectId || !newItem.name || !newItem.category) {
      toast.error("Please fill in required fields");
      return;
    }

    createFFE.mutate({
      projectId: selectedProjectId,
      ...newItem,
      quantity: Number(newItem.quantity),
      estimatedUnitCost: newItem.estimatedUnitCost ? Number(newItem.estimatedUnitCost) : undefined,
      requiredDate: newItem.requiredDate ? new Date(newItem.requiredDate) : undefined,
    });
  };

  const filteredFFE = useMemo(() => {
    return ffeItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "all" || item.category === filterCategory;
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [ffeItems, searchQuery, filterCategory, filterStatus]);

  const totalEstimatedCost = filteredFFE.reduce(
    (sum, item) => sum + (Number(item.totalEstimatedCost) || 0),
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">FF&E List</h1>
            <p className="text-muted-foreground">Track furniture, fixtures & equipment</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} disabled={!selectedProjectId}>
            <Plus className="h-4 w-4 mr-2" />
            Add FF&E Item
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
                <div className="text-2xl font-bold">{filteredFFE.length}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-2xl font-bold">{filteredFFE.filter(m => m.status === 'pending').length}</div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Installed</div>
                <div className="text-2xl font-bold">{filteredFFE.filter(m => m.status === 'installed').length}</div>
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
                  placeholder="Search FF&E items..."
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
                  {ffeCategories.map((cat) => (
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
                  <SelectItem value="installed">Installed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* FF&E Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
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
                  {filteredFFE.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No FF&E items found. Add items to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFFE.map((item) => (
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
                        <TableCell>{item.type || "-"}</TableCell>
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
                            onValueChange={(v: any) => updateFFE.mutate({ id: item.id, status: v })}
                          >
                            <SelectTrigger className="w-[120px]">
                              <Badge className={statusColors[item.status]}>{item.status}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="ordered">Ordered</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="installed">Installed</SelectItem>
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
                            onClick={() => deleteFFE.mutate({ id: item.id })}
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

        {/* Add FF&E Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add FF&E Item</DialogTitle>
              <DialogDescription>
                Add furniture, fixtures or equipment to your project
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Item Name *</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Executive Desk"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Item description"
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
                      {ffeCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Input
                    value={newItem.type}
                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                    placeholder="e.g., Executive"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                    placeholder="1"
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Manufacturer</Label>
                  <Input
                    value={newItem.manufacturer}
                    onChange={(e) => setNewItem({ ...newItem, manufacturer: e.target.value })}
                    placeholder="Manufacturer name"
                  />
                </div>
                <div>
                  <Label>Model Number</Label>
                  <Input
                    value={newItem.modelNumber}
                    onChange={(e) => setNewItem({ ...newItem, modelNumber: e.target.value })}
                    placeholder="Model #"
                  />
                </div>
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
              <div>
                <Label>Installation Notes</Label>
                <Textarea
                  value={newItem.installationNotes}
                  onChange={(e) => setNewItem({ ...newItem, installationNotes: e.target.value })}
                  placeholder="Installation instructions"
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
              <Button onClick={handleCreateFFE} disabled={createFFE.isPending}>
                {createFFE.isPending ? "Adding..." : "Add FF&E Item"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
