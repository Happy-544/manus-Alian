import React, { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VelocityData {
  completedPoints: number;
  plannedPoints: number;
  completedTasks: number;
  totalTasks: number;
  velocityScore: number;
  recordedAt: Date;
}

interface VelocityChartProps {
  data: VelocityData[];
}

export function VelocityChart({ data }: VelocityChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((item, index) => ({
      sprint: `Sprint ${index + 1}`,
      completedPoints: item.completedPoints,
      plannedPoints: item.plannedPoints,
      velocityScore: Math.round(item.velocityScore * 100),
      completionRate: item.totalTasks > 0 ? Math.round((item.completedTasks / item.totalTasks) * 100) : 0,
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Velocity Trend</CardTitle>
          <CardDescription>No velocity data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Complete sprints to see velocity trends
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Velocity Trend</CardTitle>
        <CardDescription>Sprint performance and completion rates</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprint" />
            <YAxis yAxisId="left" label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Percentage (%)', angle: 90, position: 'insideRight' }} />
            <Tooltip 
              formatter={(value) => typeof value === 'number' ? value.toFixed(0) : value}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="completedPoints" fill="#10b981" name="Completed Points" />
            <Bar yAxisId="left" dataKey="plannedPoints" fill="#3b82f6" name="Planned Points" />
            <Line yAxisId="right" type="monotone" dataKey="velocityScore" stroke="#f59e0b" name="Velocity Score (%)" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
