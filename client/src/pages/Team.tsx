import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import {
  Building2,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleConfig = {
  project_manager: { label: "Project Manager", color: "bg-purple-100 text-purple-700" },
  site_engineer: { label: "Site Engineer", color: "bg-blue-100 text-blue-700" },
  architect: { label: "Architect", color: "bg-cyan-100 text-cyan-700" },
  contractor: { label: "Contractor", color: "bg-amber-100 text-amber-700" },
  consultant: { label: "Consultant", color: "bg-green-100 text-green-700" },
  viewer: { label: "Viewer", color: "bg-slate-100 text-slate-700" },
};

export default function Team() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const { data: projects } = trpc.projects.list.useQuery();
  const { data: members, isLoading, refetch } = trpc.projectMembers.list.useQuery(
    { projectId: parseInt(selectedProjectId) },
    { enabled: !!selectedProjectId }
  );

  const addMember = trpc.projectMembers.add.useMutation({
    onSuccess: () => {
      toast.success("Team member added successfully");
      setIsAddMemberOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add team member");
    },
  });

  const removeMember = trpc.projectMembers.remove.useMutation({
    onSuccess: () => {
      toast.success("Team member removed");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove team member");
    },
  });

  // Note: updateRole mutation not available in current router
  // Would need to be added to server/routers.ts if needed

  const [formData, setFormData] = useState({
    userId: "",
    role: "viewer" as keyof typeof roleConfig,
  });

  const resetForm = () => {
    setFormData({
      userId: "",
      role: "viewer",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMember.mutate({
      projectId: parseInt(selectedProjectId),
      userId: parseInt(formData.userId),
      role: formData.role,
    });
  };

  const filteredMembers = members?.filter((member: any) => {
    const matchesSearch =
      member.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Group members by role
  const membersByRole = filteredMembers?.reduce((acc: Record<string, any[]>, member: any) => {
    const role = member.role || "viewer";
    if (!acc[role]) acc[role] = [];
    acc[role].push(member);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team</h2>
          <p className="text-muted-foreground">
            Manage project team members and roles
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
            <Button onClick={() => setIsAddMemberOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          )}
        </div>
      </div>

      {!selectedProjectId ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Project</h3>
            <p className="text-muted-foreground">
              Choose a project to view and manage its team members
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Team Members */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : !filteredMembers || filteredMembers.length === 0 ? (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No team members</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "No members match your search"
                    : "Add team members to collaborate on this project"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsAddMemberOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Team Member
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(membersByRole || {}).map(([role, roleMembers]) => {
                const config = roleConfig[role as keyof typeof roleConfig];

                return (
                  <div key={role}>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Badge className={config?.color}>{config?.label || role}</Badge>
                      <span className="text-muted-foreground text-sm">
                        ({roleMembers?.length})
                      </span>
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {roleMembers?.map((member: any) => (
                        <Card key={member.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {member.userName?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium truncate">
                                      {member.userName || "Unknown User"}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {member.userJobTitle || "No title"}
                                    </p>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                          if (confirm("Remove this team member?")) {
                                            removeMember.mutate({ projectId: parseInt(selectedProjectId), userId: member.userId });
                                          }
                                        }}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remove
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="mt-3 space-y-1">
                                  {member.userEmail && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate">{member.userEmail}</span>
                                    </div>
                                  )}
                                  {member.userPhone && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      <span>{member.userPhone}</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={(open) => {
        setIsAddMemberOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Invite a user to join this project team
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="userId">User ID *</Label>
                <Input
                  id="userId"
                  type="number"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  placeholder="Enter user ID"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the ID of an existing user
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMember.isPending}>
                {addMember.isPending ? "Adding..." : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
