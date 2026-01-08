import React, { useState } from 'react';
import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Target, Users, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export function Sprints() {
  const { projectId } = useParams();
  const projectIdNum = projectId ? parseInt(projectId) : 0;
  const [isOpen, setIsOpen] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [targetPoints, setTargetPoints] = useState('100');
  const [sprintDays, setSprintDays] = useState('10');

  // Fetch sprints
  const { data: sprints, isLoading } = trpc.sprints.listByProject.useQuery(projectIdNum, {
    enabled: !!projectIdNum,
  });

  const utils = trpc.useUtils();

  // Create sprint mutation
  const createSprintMutation = trpc.sprints.create.useMutation({
    onSuccess: () => {
      utils.sprints.listByProject.invalidate(projectIdNum);
      setSprintName('');
      setTargetPoints('100');
      setSprintDays('10');
      setIsOpen(false);
      toast.success('Sprint created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create sprint');
    },
  });

  // Delete sprint mutation
  const deleteSprintMutation = trpc.sprints.delete.useMutation({
    onSuccess: () => {
      utils.sprints.listByProject.invalidate(projectIdNum);
      toast.success('Sprint deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete sprint');
    },
  });

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName.trim()) {
      toast.error('Sprint name is required');
      return;
    }

    createSprintMutation.mutate({
      projectId: projectIdNum,
      name: sprintName,
      targetPoints: parseInt(targetPoints),
      durationDays: parseInt(sprintDays),
      status: 'planning',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sprints</h1>
          <p className="text-muted-foreground mt-2">
            Manage project sprints and track team velocity
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Sprint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Sprint</DialogTitle>
              <DialogDescription>
                Set up a new sprint for your project with target story points and duration
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSprint} className="space-y-4">
              <div>
                <Label htmlFor="sprint-name">Sprint Name</Label>
                <Input
                  id="sprint-name"
                  placeholder="e.g., Sprint 1 - Phase 1"
                  value={sprintName}
                  onChange={(e) => setSprintName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target-points">Target Points</Label>
                  <Input
                    id="target-points"
                    type="number"
                    placeholder="100"
                    value={targetPoints}
                    onChange={(e) => setTargetPoints(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="sprint-days">Duration (Days)</Label>
                  <Input
                    id="sprint-days"
                    type="number"
                    placeholder="10"
                    value={sprintDays}
                    onChange={(e) => setSprintDays(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSprintMutation.isPending}>
                  {createSprintMutation.isPending ? 'Creating...' : 'Create Sprint'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sprints Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sprints && sprints.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sprints.map((sprint) => (
            <Card key={sprint.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{sprint.name}</CardTitle>
                    <Badge className={`mt-2 ${getStatusColor(sprint.status)}`}>
                      {sprint.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Target Points</p>
                      <p className="font-semibold">{sprint.targetPoints}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-semibold">{sprint.durationDays}d</p>
                    </div>
                  </div>
                </div>

                {sprint.startDate && (
                  <div className="text-xs text-muted-foreground">
                    <p>Started: {new Date(sprint.startDate).toLocaleDateString()}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2 text-destructive hover:text-destructive"
                    onClick={() => deleteSprintMutation.mutate(sprint.id)}
                    disabled={deleteSprintMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sprints yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first sprint to start tracking team velocity and project progress
            </p>
            <Button onClick={() => setIsOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Sprint
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
