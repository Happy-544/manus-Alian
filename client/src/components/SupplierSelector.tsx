/**
 * Supplier Selector Component
 * Displays suppliers from the database with filtering, search, and ratings
 * Integrates with suppliersRouter for real-time supplier data
 */

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Star, MapPin, Phone, Mail, Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";

export interface Supplier {
  id: number;
  name: string;
  category: string;
  rating: number;
  leadTime: number;
  minOrder: number;
  pricePerUnit?: number;
  specialization?: string[];
  location?: string;
  phone?: string;
  email?: string;
  contact?: string;
}

interface SupplierSelectorProps {
  category?: string;
  onSelect: (supplier: Supplier) => void;
  selectedSupplierId?: number;
  maxResults?: number;
  showSearch?: boolean;
  showFavorites?: boolean;
}

export function SupplierSelector({
  category,
  onSelect,
  selectedSupplierId,
  maxResults = 5,
  showSearch = true,
  showFavorites = true,
}: SupplierSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(category || "");
  const [sortBy, setSortBy] = useState<"rating" | "leadTime" | "price">("rating");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Fetch all suppliers
  const { data: allSuppliers = [], isLoading: suppliersLoading } = trpc.suppliers.getAll.useQuery();

  // Fetch suppliers by category if category is provided
  const { data: categorySuppliers = [], isLoading: categoryLoading } = trpc.suppliers.getByCategory.useQuery(
    { category: selectedCategory },
    { enabled: !!selectedCategory }
  );

  // Fetch top-rated suppliers
  const { data: topSuppliers = [], isLoading: topLoading } = trpc.suppliers.getTopRated.useQuery({
    limit: maxResults,
  });

  // Fetch user's favorite suppliers
  const { data: favoriteSuppliers = [], isLoading: favoritesLoading } = trpc.supplierFavorites.getFavorites.useQuery();
  const { data: favoriteIds = { ids: [] } } = trpc.supplierFavorites.getFavoriteIds.useQuery();

  // Mutations for favorites
  const toggleFavoriteMutation = trpc.supplierFavorites.toggleFavorite.useMutation();

  // Determine which suppliers to display
  const suppliers = useMemo(() => {
    let source = allSuppliers;

    if (selectedCategory && categorySuppliers.length > 0) {
      source = categorySuppliers;
    }

    // Filter by favorites if toggled
    if (showFavoritesOnly) {
      source = source.filter((s) => favoriteIds.ids.includes(s.id));
    }

    // Filter by search term
    if (searchTerm.trim()) {
      source = source.filter(
        (s: any) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.specialization || []).some((spec: any) =>
            spec.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Sort suppliers
    const sorted = [...source].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "leadTime":
          return a.leadTime - b.leadTime;
        case "price":
          return (a.pricePerUnit || 0) - (b.pricePerUnit || 0);
        default:
          return 0;
      }
    });

    return sorted.slice(0, maxResults);
  }, [allSuppliers, categorySuppliers, selectedCategory, searchTerm, sortBy, maxResults, showFavoritesOnly, favoriteIds.ids]);

  const isLoading = suppliersLoading || categoryLoading || topLoading || favoritesLoading;

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-amber-600";
    return "text-red-600";
  };

  const handleToggleFavorite = (supplierId: number) => {
    toggleFavoriteMutation.mutate({ supplierId });
  };

  const isFavorite = (supplierId: number) => {
    return favoriteIds.ids.includes(supplierId);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Section */}
      {showSearch && (
        <div className="space-y-3">
          {/* Search Input */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              Search Suppliers
            </label>
            <Input
              placeholder="Search by name, category, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Category Filter */}
          {!category && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-8 px-2 border border-border rounded-md text-sm bg-background"
              >
                <option value="">All Categories</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="HVAC">HVAC</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Painting">Painting</option>
                <option value="Flooring">Flooring</option>
                <option value="Doors & Windows">Doors & Windows</option>
                <option value="Hardware">Hardware</option>
                <option value="Fixtures">Fixtures</option>
                <option value="Materials">Materials</option>
              </select>
            </div>
          )}

          {/* Sort Options */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              Sort By
            </label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={sortBy === "rating" ? "default" : "outline"}
                onClick={() => setSortBy("rating")}
                className="text-xs h-7"
              >
                Rating
              </Button>
              <Button
                size="sm"
                variant={sortBy === "leadTime" ? "default" : "outline"}
                onClick={() => setSortBy("leadTime")}
                className="text-xs h-7"
              >
                Lead Time
              </Button>
              <Button
                size="sm"
                variant={sortBy === "price" ? "default" : "outline"}
                onClick={() => setSortBy("price")}
                className="text-xs h-7"
              >
                Price
              </Button>
            </div>
          </div>

          {/* Favorites Toggle */}
          {showFavorites && (
            <Button
              size="sm"
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="w-full text-xs h-7"
            >
              <Heart className={`w-3 h-3 mr-1 ${showFavoritesOnly ? "fill-current" : ""}`} />
              {showFavoritesOnly ? "Showing Favorites" : "Show Favorites"}
            </Button>
          )}
        </div>
      )}

      {/* Suppliers List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground bg-muted rounded-md">
            {showFavoritesOnly
              ? "No favorite suppliers yet. Star suppliers to add them to your favorites."
              : "No suppliers found. Try adjusting your search or filters."}
          </div>
        ) : (
          suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className={`p-3 border rounded-md transition-all cursor-pointer ${
                selectedSupplierId === supplier.id
                  ? "border-gold bg-gold/10"
                  : "border-border hover:border-gold/50 hover:bg-muted/50"
              }`}
            >
              {/* Header: Name and Rating */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{supplier.name}</p>
                  <p className="text-xs text-muted-foreground">{supplier.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  {showFavorites && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(supplier.id);
                      }}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFavorite(supplier.id)
                            ? "fill-red-500 text-red-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className={`w-3 h-3 fill-current ${getRatingColor(supplier.rating)}`} />
                    <span className={`text-xs font-semibold ${getRatingColor(supplier.rating)}`}>
                      {supplier.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-2 mb-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-semibold">Lead Time:</span> {supplier.leadTime} days
                </div>
                <div>
                  <span className="font-semibold">Min Order:</span> {supplier.minOrder} units
                </div>
                {supplier.pricePerUnit && (
                  <div>
                    <span className="font-semibold">Price:</span> AED {supplier.pricePerUnit.toFixed(2)}/unit
                  </div>
                )}
              </div>

              {/* Specializations */}
              {supplier.specialization && supplier.specialization.length > 0 && (
                <div className="flex gap-1 mb-2 flex-wrap">
                  {supplier.specialization.slice(0, 3).map((spec, i) => (
                    <Badge key={i} variant="outline" className="text-xs h-5">
                      {spec}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Contact Info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {supplier.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{supplier.location}</span>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{supplier.email}</span>
                  </div>
                )}
              </div>

              {/* Select Button */}
              <Button
                size="sm"
                variant={selectedSupplierId === supplier.id ? "default" : "outline"}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(supplier);
                }}
                className="mt-2 h-7 text-xs w-full"
              >
                {selectedSupplierId === supplier.id ? "✓ Selected" : "Select Supplier"}
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Results Count */}
      {suppliers.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {suppliers.length} of {allSuppliers.length} suppliers
        </p>
      )}
    </div>
  );
}
