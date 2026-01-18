import React, { useState } from 'react';
import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { BurndownChart } from '@/components/BurndownChart';
import { VelocityChart } from '@/components/VelocityChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export function Analytics() {
  const { projectId } = useParams();
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const projectIdNum = projectId ? parseInt(projectId) : 0;

  // Fetch sprints for the project
  const { data: sprints, isLoading: sprintsLoading } = trpc.sprints.getByProject.useQuery(projectIdNum, {
    enabled: !!projectIdNum,
  });

  // Fetch velocity history
  const { data: velocityHistory, isLoading: velocityLoading } = trpc.sprints.getVelocityHistory.useQuery(
    { projectId: projectIdNum, limit: 10 },
    { enabled: !!projectIdNum }
  );

  // Fetch burndown data for selected sprint
  const selectedSprintIdNum = selectedSprintId ? parseInt(selectedSprintId) : null;
  const { data: burndownData, isLoading: burndownLoading } = trpc.sprints.getActive.useQuery(
    projectIdNum,
    { enabled: !!projectIdNum }
  );

  const activeSprint = sprints?.find((s: any) => s.status === 'active');
  const defaultSprintId = activeSprint?.id.toString() || sprints?.[0]?.id.toString() || '';

  const displaySprintId = selectedSprintId || defaultSprintId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Performance</h1>
        <p className="text-muted-foreground mt-2">
          Track sprint performance, team velocity, and project burndown metrics
        </p>
      </div>

      {/* Sprint Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Sprint</CardTitle>
          <CardDescription>Choose a sprint to view detailed analytics</CardDescription>
        </CardHeader>
        <CardContent>
          {sprintsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={displaySprintId} onValueChange={setSelectedSprintId}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Select a sprint" />
              </SelectTrigger>
              <SelectContent>
                {sprints?.map((sprint: any) => (
                  <SelectItem key={sprint.id} value={sprint.id.toString()}>
                    {sprint.name} ({sprint.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Burndown Chart */}
      <div>
        {burndownLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ) : (
          <BurndownChart
            data={burndownData || []}
            sprintDays={10}
            targetPoints={sprints?.find(s => s.id === selectedSprintIdNum)?.targetPoints || 100}
          />
        )}
      </div>

      {/* Velocity Trend Chart */}
      <div>
        {velocityLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ) : (
          <VelocityChart data={velocityHistory || []} />
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sprints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sprints?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Completed and active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Sprints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sprints?.filter(s => s.status === 'active').length || 0}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Velocity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {velocityHistory && velocityHistory.length > 0
                ? Math.round((velocityHistory.reduce((sum, v) => sum + v.completedPoints, 0) / velocityHistory.length) * 10) / 10
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Story points/sprint</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {velocityHistory && velocityHistory.length > 0
                ? Math.round((velocityHistory.reduce((sum, v) => sum + (v.completedTasks / Math.max(v.totalTasks, 1)), 0) / velocityHistory.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Average completion</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
