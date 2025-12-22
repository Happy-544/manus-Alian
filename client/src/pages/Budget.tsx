import { Badge } from "@/components/ui/badge";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const expenseStatusConfig = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: AlertTriangle },
  paid: { label: "Paid", color: "bg-blue-100 text-blue-700", icon: DollarSign },
};

export default function Budget() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery();
  
  const { data: expenses, refetch: refetchExpenses } = trpc.expenses.list.useQuery(
    { projectId: parseInt(selectedProjectId) },
    { enabled: !!selectedProjectId }
  );
  
  const { data: expenseStats } = trpc.expenses.stats.useQuery(
    { projectId: parseInt(selectedProjectId) },
    { enabled: !!selectedProjectId }
  );
  
  const { data: categories, refetch: refetchCategories } = trpc.budget.categories.useQuery(
    { projectId: parseInt(selectedProjectId) },
    { enabled: !!selectedProjectId }
  );

  const selectedProject = projects?.find((p) => p.id.toString() === selectedProjectId);

  const createExpense = trpc.expenses.create.useMutation({
    onSuccess: () => {
      toast.success("Expense added successfully");
      setIsExpenseDialogOpen(false);
      refetchExpenses();
      resetExpenseForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add expense");
    },
  });

  const createCategory = trpc.budget.createCategory.useMutation({
    onSuccess: () => {
      toast.success("Category created successfully");
      setIsCategoryDialogOpen(false);
      refetchCategories();
      resetCategoryForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create category");
    },
  });

  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    categoryId: "",
    vendor: "",
    invoiceNumber: "",
    expenseDate: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    allocatedAmount: "",
    color: "#3b82f6",
  });

  const resetExpenseForm = () => {
    setExpenseForm({
      description: "",
      amount: "",
      categoryId: "",
      vendor: "",
      invoiceNumber: "",
      expenseDate: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    });
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
      description: "",
      allocatedAmount: "",
      color: "#3b82f6",
    });
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpense.mutate({
      projectId: parseInt(selectedProjectId),
      ...expenseForm,
      categoryId: expenseForm.categoryId ? parseInt(expenseForm.categoryId) : undefined,
    });
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCategory.mutate({
      projectId: parseInt(selectedProjectId),
      ...categoryForm,
    });
  };

  // Calculate budget metrics
  const budgetMetrics = useMemo(() => {
    if (!selectedProject) return null;
    
    const totalBudget = parseFloat(selectedProject.budget || "0");
    const totalSpent = parseFloat(expenseStats?.approved?.toString() || "0");
    const pendingAmount = parseFloat(expenseStats?.pending?.toString() || "0");
    const remaining = totalBudget - totalSpent;
    const utilizationPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    return {
      totalBudget,
      totalSpent,
      pendingAmount,
      remaining,
      utilizationPercent,
      isOverBudget: remaining < 0,
    };
  }, [selectedProject, expenseStats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Budget</h2>
          <p className="text-muted-foreground">
            Track project expenses and budget utilization
          </p>
        </div>
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a project" />
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

      {!selectedProjectId ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Wallet className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Project</h3>
            <p className="text-muted-foreground">
              Choose a project to view and manage its budget
            </p>
          </CardContent>
        </Card>
      ) : projectsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          {/* Budget Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${budgetMetrics?.totalBudget.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedProject?.currency || "USD"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${budgetMetrics?.totalSpent.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {budgetMetrics?.utilizationPercent.toFixed(1)}% utilized
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                <ArrowUpRight className={`h-4 w-4 ${budgetMetrics?.isOverBudget ? "text-destructive" : "text-green-500"}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${budgetMetrics?.isOverBudget ? "text-destructive" : ""}`}>
                  ${Math.abs(budgetMetrics?.remaining || 0).toLocaleString()}
                  {budgetMetrics?.isOverBudget && " over"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {budgetMetrics?.isOverBudget ? "Over budget" : "Available"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${budgetMetrics?.pendingAmount.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Budget Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    ${budgetMetrics?.totalSpent.toLocaleString()} of ${budgetMetrics?.totalBudget.toLocaleString()}
                  </span>
                  <span className={budgetMetrics?.isOverBudget ? "text-destructive font-medium" : ""}>
                    {budgetMetrics?.utilizationPercent.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(budgetMetrics?.utilizationPercent || 0, 100)}
                  className={`h-3 ${budgetMetrics?.isOverBudget ? "[&>div]:bg-destructive" : ""}`}
                />
                {budgetMetrics?.isOverBudget && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Budget exceeded by ${Math.abs(budgetMetrics.remaining).toLocaleString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Categories and Expenses */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Budget Categories */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Categories</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </CardHeader>
              <CardContent>
                {!categories || categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No categories yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {categories.map((category) => {
                      const allocated = parseFloat(category.allocatedAmount || "0");
                      const spent = parseFloat(category.spentAmount || "0");
                      const percent = allocated > 0 ? (spent / allocated) * 100 : 0;
                      
                      return (
                        <div key={category.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: category.color || "#3b82f6" }}
                              />
                              <span className="text-sm font-medium">{category.name}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              ${spent.toLocaleString()} / ${allocated.toLocaleString()}
                            </span>
                          </div>
                          <Progress value={Math.min(percent, 100)} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Expenses */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Expenses</CardTitle>
                <Button size="sm" onClick={() => setIsExpenseDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Expense
                </Button>
              </CardHeader>
              <CardContent>
                {!expenses || expenses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No expenses recorded yet
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.slice(0, 10).map((expense) => {
                        const status = expenseStatusConfig[expense.status as keyof typeof expenseStatusConfig];
                        return (
                          <TableRow key={expense.id}>
                            <TableCell className="font-medium">{expense.description}</TableCell>
                            <TableCell>{expense.vendor || "-"}</TableCell>
                            <TableCell>{format(new Date(expense.expenseDate), "MMM d, yyyy")}</TableCell>
                            <TableCell>
                              <Badge className={status?.color}>{status?.label}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${parseFloat(expense.amount).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Add Expense Dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={(open) => {
        setIsExpenseDialogOpen(open);
        if (!open) resetExpenseForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>
              Record a new expense for this project
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleExpenseSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="e.g., Concrete materials"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={expenseForm.categoryId}
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    value={expenseForm.vendor}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                    placeholder="Vendor name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expenseDate">Date *</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createExpense.isPending}>
                {createExpense.isPending ? "Adding..." : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
        setIsCategoryDialogOpen(open);
        if (!open) resetCategoryForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Budget Category</DialogTitle>
            <DialogDescription>
              Create a new budget category for this project
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="categoryName">Category Name *</Label>
                <Input
                  id="categoryName"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g., Materials, Labor, Equipment"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="categoryDescription">Description</Label>
                <Input
                  id="categoryDescription"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="allocatedAmount">Allocated Amount</Label>
                  <Input
                    id="allocatedAmount"
                    type="number"
                    step="0.01"
                    value={categoryForm.allocatedAmount}
                    onChange={(e) => setCategoryForm({ ...categoryForm, allocatedAmount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCategory.isPending}>
                {createCategory.isPending ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
