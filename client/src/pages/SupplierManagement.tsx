/**
 * Supplier Management Page
 * Manage supplier database with CRUD operations, ratings, and specializations
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
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export interface Supplier {
  id: number;
  name: string;
  category: string;
  specializations: string[];
  location: string;
  phone: string;
  email: string;
  rating: number;
  leadTime: number; // in days
  minOrder?: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
}

export function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(generateSampleSuppliers());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<Supplier>>({});

  const categories = [
    "Flooring",
    "Partitioning",
    "Cladding",
    "Fenestration",
    "MEP",
    "Finishing",
    "Furniture",
    "Hardware",
  ];

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || supplier.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddSupplier = () => {
    if (!formData.name || !formData.category) {
      alert("Please fill in required fields");
      return;
    }

    const newSupplier: Supplier = {
      id: Math.max(...suppliers.map((s) => s.id), 0) + 1,
      name: formData.name,
      category: formData.category,
      specializations: formData.specializations || [],
      location: formData.location || "",
      phone: formData.phone || "",
      email: formData.email || "",
      rating: formData.rating || 4,
      leadTime: formData.leadTime || 14,
      minOrder: formData.minOrder,
      notes: formData.notes,
      isActive: true,
      createdAt: new Date(),
    };

    setSuppliers([...suppliers, newSupplier]);
    setFormData({});
    setIsAddingNew(false);
  };

  const handleUpdateSupplier = () => {
    if (!editingId || !formData.name || !formData.category) {
      alert("Please fill in required fields");
      return;
    }

    setSuppliers(
      suppliers.map((supplier) =>
        supplier.id === editingId
          ? {
              ...supplier,
              name: formData.name,
              category: formData.category,
              specializations: formData.specializations || supplier.specializations,
              location: formData.location || supplier.location,
              phone: formData.phone || supplier.phone,
              email: formData.email || supplier.email,
              rating: formData.rating || supplier.rating,
              leadTime: formData.leadTime || supplier.leadTime,
              minOrder: formData.minOrder || supplier.minOrder,
              notes: formData.notes || supplier.notes,
            }
          : supplier
      )
    );
    setFormData({});
    setEditingId(null);
  };

  const handleDeleteSupplier = (id: number) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      setSuppliers(suppliers.filter((supplier) => supplier.id !== id));
    }
  };

  const handleEditClick = (supplier: Supplier) => {
    setFormData(supplier);
    setEditingId(supplier.id);
  };

  const handleRatingChange = (id: number, newRating: number) => {
    setSuppliers(
      suppliers.map((supplier) =>
        supplier.id === id ? { ...supplier, rating: newRating } : supplier
      )
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Supplier Management</h1>
          <p className="text-muted-foreground">
            Manage your supplier database with ratings, specializations, and lead times
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <p className="text-sm text-blue-600 font-semibold mb-1">Total Suppliers</p>
            <p className="text-2xl font-bold text-blue-900">{suppliers.length}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <p className="text-sm text-green-600 font-semibold mb-1">Active</p>
            <p className="text-2xl font-bold text-green-900">
              {suppliers.filter((s) => s.isActive).length}
            </p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-gold/20 to-gold/30 border-gold/40">
            <p className="text-sm text-gold font-semibold mb-1">Avg. Rating</p>
            <p className="text-2xl font-bold text-gold">
              {(suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1)}
            </p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <p className="text-sm text-amber-600 font-semibold mb-1">Avg. Lead Time</p>
            <p className="text-2xl font-bold text-amber-900">
              {Math.round(suppliers.reduce((sum, s) => sum + s.leadTime, 0) / suppliers.length)} days
            </p>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Supplier</DialogTitle>
                    <DialogDescription>
                      Enter supplier details and specializations
                    </DialogDescription>
                  </DialogHeader>
                  <SupplierForm
                    supplier={formData as Supplier}
                    categories={categories}
                    onSubmit={handleAddSupplier}
                    onCancel={() => {
                      setFormData({});
                      setIsAddingNew(false);
                    }}
                    onChange={setFormData}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Suppliers List */}
        <div className="space-y-4">
          {filteredSuppliers.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No suppliers found</p>
            </Card>
          ) : (
            filteredSuppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onEdit={handleEditClick}
                onDelete={handleDeleteSupplier}
                onRatingChange={handleRatingChange}
                editingId={editingId}
                formData={formData}
                onFormChange={setFormData}
                onUpdate={handleUpdateSupplier}
                onCancelEdit={() => {
                  setEditingId(null);
                  setFormData({});
                }}
                categories={categories}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Supplier Card Component
 */
interface SupplierCardProps {
  supplier: Supplier;
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: number) => void;
  onRatingChange: (id: number, rating: number) => void;
  editingId: number | null;
  formData: Partial<Supplier>;
  onFormChange: (data: Partial<Supplier>) => void;
  onUpdate: () => void;
  onCancelEdit: () => void;
  categories: string[];
}

function SupplierCard({
  supplier,
  onEdit,
  onDelete,
  onRatingChange,
  editingId,
  formData,
  onFormChange,
  onUpdate,
  onCancelEdit,
  categories,
}: SupplierCardProps) {
  const isEditing = editingId === supplier.id;

  if (isEditing) {
    return (
      <Card className="p-6 border-gold/40 bg-gold/5">
        <SupplierForm
          supplier={formData as Supplier}
          categories={categories}
          onSubmit={onUpdate}
          onCancel={onCancelEdit}
          onChange={onFormChange}
          isEditing
        />
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-foreground">{supplier.name}</h3>
            {supplier.isActive ? (
              <Badge className="bg-green-100 text-green-800 border-green-300">Active</Badge>
            ) : (
              <Badge variant="outline">Inactive</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{supplier.category}</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => onEdit(supplier)}>
                <Edit2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Supplier</DialogTitle>
              </DialogHeader>
              <SupplierForm
                supplier={formData as Supplier}
                categories={categories}
                onSubmit={() => {
                  onUpdate();
                }}
                onCancel={onCancelEdit}
                onChange={onFormChange}
                isEditing
              />
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(supplier.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Specializations */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Specializations</p>
        <div className="flex gap-2 flex-wrap">
          {supplier.specializations.map((spec) => (
            <Badge key={spec} variant="secondary" className="text-xs">
              {spec}
            </Badge>
          ))}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Location</p>
          <div className="flex items-center gap-1 text-sm font-medium">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            {supplier.location}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Lead Time</p>
          <p className="text-sm font-medium">{supplier.leadTime} days</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Rating</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => onRatingChange(supplier.id, star)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-4 h-4 ${
                    star <= supplier.rating
                      ? "fill-gold text-gold"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Contact</p>
          <div className="flex items-center gap-1 text-sm font-medium">
            <Phone className="w-4 h-4 text-muted-foreground" />
            {supplier.phone}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Mail className="w-4 h-4" />
        {supplier.email}
      </div>
    </Card>
  );
}

/**
 * Supplier Form Component
 */
interface SupplierFormProps {
  supplier: Partial<Supplier>;
  categories: string[];
  onSubmit: () => void;
  onCancel: () => void;
  onChange: (data: Partial<Supplier>) => void;
  isEditing?: boolean;
}

function SupplierForm({
  supplier,
  categories,
  onSubmit,
  onCancel,
  onChange,
  isEditing = false,
}: SupplierFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-semibold mb-1 block">Supplier Name *</label>
        <Input
          value={supplier.name || ""}
          onChange={(e) => onChange({ ...supplier, name: e.target.value })}
          placeholder="Enter supplier name"
        />
      </div>

      <div>
        <label className="text-sm font-semibold mb-1 block">Category *</label>
        <select
          value={supplier.category || ""}
          onChange={(e) => onChange({ ...supplier, category: e.target.value })}
          className="w-full px-3 py-2 border rounded-md text-sm"
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold mb-1 block">Location</label>
        <Input
          value={supplier.location || ""}
          onChange={(e) => onChange({ ...supplier, location: e.target.value })}
          placeholder="e.g., Dubai, UAE"
        />
      </div>

      <div>
        <label className="text-sm font-semibold mb-1 block">Phone</label>
        <Input
          value={supplier.phone || ""}
          onChange={(e) => onChange({ ...supplier, phone: e.target.value })}
          placeholder="+971 4 XXX XXXX"
        />
      </div>

      <div>
        <label className="text-sm font-semibold mb-1 block">Email</label>
        <Input
          type="email"
          value={supplier.email || ""}
          onChange={(e) => onChange({ ...supplier, email: e.target.value })}
          placeholder="supplier@example.com"
        />
      </div>

      <div>
        <label className="text-sm font-semibold mb-1 block">Lead Time (days)</label>
        <Input
          type="number"
          value={supplier.leadTime || 14}
          onChange={(e) => onChange({ ...supplier, leadTime: parseInt(e.target.value) })}
          placeholder="14"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={onSubmit} className="flex-1">
          {isEditing ? "Update" : "Add"} Supplier
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/**
 * Generate sample suppliers for demonstration
 */
function generateSampleSuppliers(): Supplier[] {
  return [
    {
      id: 1,
      name: "Al Futtaim Ceramics",
      category: "Flooring",
      specializations: ["Ceramic Tiles", "Porcelain", "Natural Stone"],
      location: "Dubai, UAE",
      phone: "+971 4 XXX XXXX",
      email: "sales@alfuttaim.ae",
      rating: 5,
      leadTime: 7,
      minOrder: 100,
      notes: "Premium quality, excellent customer service",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 2,
      name: "Emirates Gypsum",
      category: "Partitioning",
      specializations: ["Gypsum Board", "Metal Studs", "Acoustic Panels"],
      location: "Abu Dhabi, UAE",
      phone: "+971 2 XXX XXXX",
      email: "info@emiratesgypsum.ae",
      rating: 4,
      leadTime: 5,
      minOrder: 50,
      notes: "Fast delivery, competitive pricing",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 3,
      name: "Gulf Aluminum",
      category: "Fenestration",
      specializations: ["Aluminum Frames", "Glass", "Hardware"],
      location: "Sharjah, UAE",
      phone: "+971 6 XXX XXXX",
      email: "sales@gulfaluminum.ae",
      rating: 4,
      leadTime: 14,
      minOrder: 20,
      notes: "Wide range of profiles and finishes",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 4,
      name: "Nippon Paint",
      category: "Finishing",
      specializations: ["Interior Paint", "Exterior Paint", "Protective Coatings"],
      location: "Dubai, UAE",
      phone: "+971 4 XXX XXXX",
      email: "sales@nipponpaint.ae",
      rating: 5,
      leadTime: 3,
      minOrder: 10,
      notes: "Eco-friendly options available",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 5,
      name: "Emirates Marble",
      category: "Cladding",
      specializations: ["Marble", "Granite", "Limestone"],
      location: "Dubai, UAE",
      phone: "+971 4 XXX XXXX",
      email: "info@emiratesmarble.ae",
      rating: 4,
      leadTime: 21,
      minOrder: 50,
      notes: "Premium natural stone supplier",
      isActive: true,
      createdAt: new Date(),
    },
  ];
}
