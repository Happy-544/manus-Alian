import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Package, Plus, Truck, Building2, Sparkles, Search, Filter, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, ShoppingCart } from "lucide-react";
import { Streamdown } from "streamdown";

const categories = [
  { value: "materials", label: "Materials" },
  { value: "equipment", label: "Equipment" },
  { value: "labor", label: "Labor" },
  { value: "services", label: "Services" },
  { value: "furniture", label: "Furniture" },
  { value: "fixtures", label: "Fixtures" },
  { value: "electrical", label: "Electrical" },
  { value: "plumbing", label: "Plumbing" },
  { value: "hvac", label: "HVAC" },
  { value: "other", label: "Other" },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  quoted: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  ordered: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function Procurement() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("items");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Dialog states
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAIGenerateOpen, setIsAIGenerateOpen] = useState(false);
  const [isVendorSuggestOpen, setIsVendorSuggestOpen] = useState(false);
  const [selectedItemForVendor, setSelectedItemForVendor] = useState<number | null>(null);
  const [isAlternativeVendorOpen, setIsAlternativeVendorOpen] = useState(false);
  const [alternativeVendorResult, setAlternativeVendorResult] = useState<any>(null);
  const [prioritizeFactor, setPrioritizeFactor] = useState<'price' | 'availability' | 'balanced'>('balanced');
  
  // Form states
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "materials" as const,
    quantity: "",
    unit: "pcs",
    estimatedUnitCost: "",
    priority: "medium" as const,
    requiredDate: "",
    specifications: "",
    notes: "",
  });
  
  const [newVendor, setNewVendor] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    category: "materials" as const,
    notes: "",
  });
  
  const [aiDescription, setAiDescription] = useState("");
  const [aiGeneratedItems, setAiGeneratedItems] = useState<any[]>([]);
  const [vendorRecommendations, setVendorRecommendations] = useState("");
  const [selectedItemForAlternative, setSelectedItemForAlternative] = useState<any>(null);
  
  // Queries
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: procurementItems, refetch: refetchItems } = trpc.procurement.list.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const { data: stats } = trpc.procurement.stats.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const { data: vendors, refetch: refetchVendors } = trpc.vendors.list.useQuery();
  const { data: deliveries } = trpc.deliveries.list.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  const { data: purchaseOrders } = trpc.purchaseOrders.list.useQuery(
    { projectId: selectedProjectId! },
    { enabled: !!selectedProjectId }
  );
  
  // Mutations
  const createItem = trpc.procurement.create.useMutation({
    onSuccess: () => {
      toast.success("Procurement item added");
      setIsAddItemOpen(false);
      resetItemForm();
      refetchItems();
    },
    onError: (error) => toast.error(error.message),
  });
  
  const updateItem = trpc.procurement.update.useMutation({
    onSuccess: () => {
      toast.success("Item updated");
      refetchItems();
    },
    onError: (error) => toast.error(error.message),
  });
  
  const deleteItem = trpc.procurement.delete.useMutation({
    onSuccess: () => {
      toast.success("Item deleted");
      refetchItems();
    },
    onError: (error) => toast.error(error.message),
  });
  
  const createVendor = trpc.vendors.create.useMutation({
    onSuccess: () => {
      toast.success("Vendor added");
      setIsAddVendorOpen(false);
      resetVendorForm();
      refetchVendors();
    },
    onError: (error) => toast.error(error.message),
  });
  
  const generateList = trpc.procurement.generateList.useMutation({
    onSuccess: (data) => {
      setAiGeneratedItems(data.items || []);
      if (data.items?.length === 0) {
        toast.error("No items generated. Try a more detailed description.");
      }
    },
    onError: (error) => toast.error(error.message),
  });
  
  const suggestVendors = trpc.procurement.suggestVendors.useMutation({
    onSuccess: (data) => {
      setVendorRecommendations(data.recommendations);
      setIsVendorSuggestOpen(true);
    },
    onError: (error) => toast.error(error.message),
  });
  
  const suggestAlternativeVendors = trpc.procurement.suggestAlternativeVendors.useMutation({
    onSuccess: (data) => {
      setAlternativeVendorResult(data);
      setIsAlternativeVendorOpen(true);
    },
    onError: (error) => toast.error(error.message),
  });
  
  const resetItemForm = () => {
    setNewItem({
      name: "",
      description: "",
      category: "materials",
      quantity: "",
      unit: "pcs",
      estimatedUnitCost: "",
      priority: "medium",
      requiredDate: "",
      specifications: "",
      notes: "",
    });
  };
  
  const resetVendorForm = () => {
    setNewVendor({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      category: "materials",
      notes: "",
    });
  };
  
  const handleCreateItem = () => {
    if (!selectedProjectId || !newItem.name || !newItem.quantity) {
      toast.error("Please fill in required fields");
      return;
    }
    createItem.mutate({
      projectId: selectedProjectId,
      ...newItem,
    });
  };
  
  const handleCreateVendor = () => {
    if (!newVendor.name) {
      toast.error("Vendor name is required");
      return;
    }
    createVendor.mutate(newVendor);
  };
  
  const handleAIGenerate = () => {
    if (!selectedProjectId || !aiDescription) {
      toast.error("Please select a project and enter requirements");
      return;
    }
    generateList.mutate({
      projectId: selectedProjectId,
      description: aiDescription,
    });
  };
  
  const handleAddGeneratedItem = async (item: any) => {
    if (!selectedProjectId) return;
    createItem.mutate({
      projectId: selectedProjectId,
      name: item.name,
      description: item.description,
      category: item.category,
      quantity: item.quantity?.toString() || "1",
      unit: item.unit || "pcs",
      estimatedUnitCost: item.estimatedUnitCost?.toString(),
      priority: item.priority || "medium",
      specifications: item.specifications,
    });
  };
  
  const handleSuggestVendors = (itemId: number) => {
    setSelectedItemForVendor(itemId);
    suggestVendors.mutate({ itemId });
  };
  
  // Filter items
  const filteredItems = procurementItems?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];
  
  // Set first project as default
  if (projects?.length && !selectedProjectId) {
    setSelectedProjectId(projects[0].id);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Procurement Log</h1>
            <p className="text-muted-foreground">Manage materials, vendors, and purchase orders</p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedProjectId?.toString() || ""}
              onValueChange={(v) => setSelectedProjectId(parseInt(v))}
            >
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
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">procurement items</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">awaiting action</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ordered</CardTitle>
                <ShoppingCart className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ordered}</div>
                <p className="text-xs text-muted-foreground">in transit</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${Number(stats.totalCost || 0).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">estimated</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="items" className="gap-2">
                <Package className="h-4 w-4" />
                Items
              </TabsTrigger>
              <TabsTrigger value="vendors" className="gap-2">
                <Building2 className="h-4 w-4" />
                Vendors
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="deliveries" className="gap-2">
                <Truck className="h-4 w-4" />
                Deliveries
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              {activeTab === "items" && (
                <>
                  <Dialog open={isAIGenerateOpen} onOpenChange={setIsAIGenerateOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Generate
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>AI Procurement List Generator</DialogTitle>
                        <DialogDescription>
                          Describe your project requirements and let AI generate a procurement list
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Project Requirements</Label>
                          <Textarea
                            placeholder="Describe what you need for your fit-out project. E.g., 'Office fit-out for 500 sqm space with 20 workstations, meeting rooms, and reception area'"
                            value={aiDescription}
                            onChange={(e) => setAiDescription(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <Button onClick={handleAIGenerate} disabled={generateList.isPending} className="w-full">
                          {generateList.isPending ? "Generating..." : "Generate List"}
                        </Button>
                        
                        {aiGeneratedItems.length > 0 && (
                          <div className="space-y-2">
                            <Label>Generated Items ({aiGeneratedItems.length})</Label>
                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                              {aiGeneratedItems.map((item, index) => (
                                <Card key={index} className="p-3">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="font-medium">{item.name}</p>
                                      <p className="text-sm text-muted-foreground">{item.description}</p>
                                      <div className="flex gap-2 mt-1">
                                        <Badge variant="outline">{item.category}</Badge>
                                        <Badge variant="outline">{item.quantity} {item.unit}</Badge>
                                        {item.estimatedUnitCost && (
                                          <Badge variant="outline">${item.estimatedUnitCost}/unit</Badge>
                                        )}
                                      </div>
                                    </div>
                                    <Button size="sm" onClick={() => handleAddGeneratedItem(item)}>
                                      Add
                                    </Button>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Procurement Item</DialogTitle>
                        <DialogDescription>Add a new item to the procurement list</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label>Item Name *</Label>
                            <Input
                              value={newItem.name}
                              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                              placeholder="e.g., Office Desk"
                            />
                          </div>
                          <div>
                            <Label>Category *</Label>
                            <Select
                              value={newItem.category}
                              onValueChange={(v: any) => setNewItem({ ...newItem, category: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Priority</Label>
                            <Select
                              value={newItem.priority}
                              onValueChange={(v: any) => setNewItem({ ...newItem, priority: v })}
                            >
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
                          <div>
                            <Label>Quantity *</Label>
                            <Input
                              type="number"
                              value={newItem.quantity}
                              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                              placeholder="10"
                            />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Input
                              value={newItem.unit}
                              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                              placeholder="pcs, m, kg, etc."
                            />
                          </div>
                          <div>
                            <Label>Est. Unit Cost</Label>
                            <Input
                              type="number"
                              value={newItem.estimatedUnitCost}
                              onChange={(e) => setNewItem({ ...newItem, estimatedUnitCost: e.target.value })}
                              placeholder="100.00"
                            />
                          </div>
                          <div>
                            <Label>Required Date</Label>
                            <Input
                              type="date"
                              value={newItem.requiredDate}
                              onChange={(e) => setNewItem({ ...newItem, requiredDate: e.target.value })}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Description</Label>
                            <Textarea
                              value={newItem.description}
                              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                              placeholder="Item description..."
                              rows={2}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Specifications</Label>
                            <Textarea
                              value={newItem.specifications}
                              onChange={(e) => setNewItem({ ...newItem, specifications: e.target.value })}
                              placeholder="Technical specifications..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateItem} disabled={createItem.isPending}>
                          {createItem.isPending ? "Adding..." : "Add Item"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              
              {activeTab === "vendors" && (
                <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Vendor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Vendor</DialogTitle>
                      <DialogDescription>Add a new vendor/supplier to your list</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                      <div>
                        <Label>Vendor Name *</Label>
                        <Input
                          value={newVendor.name}
                          onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                          placeholder="Company name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Contact Person</Label>
                          <Input
                            value={newVendor.contactPerson}
                            onChange={(e) => setNewVendor({ ...newVendor, contactPerson: e.target.value })}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Select
                            value={newVendor.category}
                            onValueChange={(v: any) => setNewVendor({ ...newVendor, category: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={newVendor.email}
                            onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                            placeholder="vendor@example.com"
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={newVendor.phone}
                            onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                            placeholder="+1 234 567 8900"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Address</Label>
                        <Textarea
                          value={newVendor.address}
                          onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
                          placeholder="Full address"
                          rows={2}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddVendorOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateVendor} disabled={createVendor.isPending}>
                        {createVendor.isPending ? "Adding..." : "Add Vendor"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
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
                  {categories.map((cat) => (
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
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Items Table */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Required Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No procurement items found. Add items manually or use AI to generate a list.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
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
                          {item.actualUnitCost 
                            ? `$${Number(item.actualUnitCost).toLocaleString()}`
                            : item.estimatedUnitCost 
                              ? `$${Number(item.estimatedUnitCost).toLocaleString()} (est)`
                              : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {item.totalCost ? `$${Number(item.totalCost).toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.status}
                            onValueChange={(v: any) => updateItem.mutate({ id: item.id, status: v })}
                          >
                            <SelectTrigger className="w-[120px]">
                              <Badge className={statusColors[item.status]}>{item.status}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="quoted">Quoted</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="ordered">Ordered</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
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
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Suggest Vendors"
                              onClick={() => handleSuggestVendors(item.id)}
                              disabled={suggestVendors.isPending}
                            >
                              <Sparkles className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Find Alternative Vendors"
                              onClick={() => {
                                setSelectedItemForAlternative(item);
                                suggestAlternativeVendors.mutate({
                                  itemId: item.id,
                                  currentVendorId: item.vendorId || undefined,
                                  prioritizeFactor: 'balanced',
                                });
                              }}
                              disabled={suggestAlternativeVendors.isPending}
                            >
                              <Building2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete Item"
                              onClick={() => deleteItem.mutate({ id: item.id })}
                            >
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!vendors?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No vendors added yet. Add your first vendor to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    vendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{vendor.category}</Badge>
                        </TableCell>
                        <TableCell>{vendor.contactPerson || "-"}</TableCell>
                        <TableCell>{vendor.email || "-"}</TableCell>
                        <TableCell>{vendor.phone || "-"}</TableCell>
                        <TableCell>
                          {vendor.rating ? `${vendor.rating}/5` : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!purchaseOrders?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No purchase orders yet. Create orders from approved procurement items.
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>{order.vendorName || "-"}</TableCell>
                        <TableCell>${Number(order.totalAmount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status] || "bg-gray-100"}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>
                          {order.expectedDeliveryDate 
                            ? new Date(order.expectedDeliveryDate).toLocaleDateString()
                            : "-"
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Deliveries Tab */}
          <TabsContent value="deliveries" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Delivery #</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Actual Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!deliveries?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No deliveries scheduled yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    deliveries.map((delivery) => (
                      <TableRow key={delivery.id}>
                        <TableCell className="font-medium">{delivery.deliveryNumber || "-"}</TableCell>
                        <TableCell>{delivery.orderNumber || "-"}</TableCell>
                        <TableCell>{delivery.vendorName || "-"}</TableCell>
                        <TableCell>
                          <Badge className={
                            delivery.status === "delivered" ? "bg-green-100 text-green-800" :
                            delivery.status === "in_transit" ? "bg-blue-100 text-blue-800" :
                            "bg-yellow-100 text-yellow-800"
                          }>
                            {delivery.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {delivery.scheduledDate 
                            ? new Date(delivery.scheduledDate).toLocaleDateString()
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {delivery.actualDate 
                            ? new Date(delivery.actualDate).toLocaleDateString()
                            : "-"
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Vendor Suggestions Dialog */}
        <Dialog open={isVendorSuggestOpen} onOpenChange={setIsVendorSuggestOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>AI Vendor Recommendations</DialogTitle>
              <DialogDescription>
                Based on item requirements and available vendors
              </DialogDescription>
            </DialogHeader>
            <div className="prose prose-sm max-h-[400px] overflow-y-auto">
              <Streamdown>{vendorRecommendations}</Streamdown>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsVendorSuggestOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alternative Vendor Suggestions Dialog */}
        <Dialog open={isAlternativeVendorOpen} onOpenChange={setIsAlternativeVendorOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Alternative Vendor Analysis
              </DialogTitle>
              <DialogDescription>
                Price and availability-based vendor recommendations
              </DialogDescription>
            </DialogHeader>
            
            {alternativeVendorResult && (
              <div className="space-y-6">
                {/* Item Info */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Analyzing Item</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {alternativeVendorResult.item?.name}</div>
                    <div><span className="text-muted-foreground">Category:</span> {alternativeVendorResult.item?.category}</div>
                    <div><span className="text-muted-foreground">Quantity:</span> {alternativeVendorResult.item?.quantity} {alternativeVendorResult.item?.unit}</div>
                    <div><span className="text-muted-foreground">Est. Cost:</span> ${alternativeVendorResult.item?.estimatedUnitCost || 'N/A'}</div>
                  </div>
                </div>

                {/* Current Vendor Analysis */}
                {alternativeVendorResult.currentVendorAnalysis && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Current Vendor Analysis
                    </h4>
                    <p className="text-sm text-muted-foreground">{alternativeVendorResult.currentVendorAnalysis}</p>
                  </div>
                )}

                {/* Potential Savings */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Potential Savings</div>
                    <div className="text-2xl font-bold text-green-600">
                      {alternativeVendorResult.potentialSavings?.percentage || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ~${(alternativeVendorResult.potentialSavings?.amount || 0).toLocaleString()}
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Risk Level</div>
                    <div className={`text-2xl font-bold ${
                      alternativeVendorResult.riskAssessment === 'low' ? 'text-green-600' :
                      alternativeVendorResult.riskAssessment === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {(alternativeVendorResult.riskAssessment || 'Unknown').toUpperCase()}
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Alternatives Found</div>
                    <div className="text-2xl font-bold">
                      {alternativeVendorResult.alternatives?.length || 0}
                    </div>
                  </Card>
                </div>

                {/* Alternative Vendors List */}
                <div>
                  <h4 className="font-semibold mb-3">Recommended Alternatives</h4>
                  <div className="space-y-3">
                    {alternativeVendorResult.alternatives?.map((alt: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h5 className="font-semibold flex items-center gap-2">
                              #{index + 1} {alt.vendorName}
                              <Badge variant="outline" className="ml-2">
                                Score: {alt.overallScore}/100
                              </Badge>
                            </h5>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Est. Price Range</div>
                            <div className="font-semibold text-green-600">
                              ${alt.estimatedPriceRange?.low?.toLocaleString()} - ${alt.estimatedPriceRange?.high?.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>Lead Time: {alt.leadTimeDays} days</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <span>Availability: {alt.availabilityScore}/10</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{alt.recommendation}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-green-600">Pros:</span>
                            <ul className="list-disc list-inside text-muted-foreground">
                              {alt.pros?.map((pro: string, i: number) => (
                                <li key={i}>{pro}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="font-medium text-red-600">Cons:</span>
                            <ul className="list-disc list-inside text-muted-foreground">
                              {alt.cons?.map((con: string, i: number) => (
                                <li key={i}>{con}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              if (selectedItemForAlternative) {
                                updateItem.mutate({
                                  id: selectedItemForAlternative.id,
                                  vendorId: alt.vendorId,
                                });
                                toast.success(`Vendor updated to ${alt.vendorName}`);
                              }
                            }}
                          >
                            Select This Vendor
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Overall Recommendation */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI Recommendation
                  </h4>
                  <p className="text-sm">{alternativeVendorResult.recommendation}</p>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAlternativeVendorOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
