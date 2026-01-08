import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BurndownData {
  day: number;
  remainingPoints: number;
  completedPoints: number;
  recordedAt: Date;
}

interface BurndownChartProps {
  data: BurndownData[];
  sprintDays?: number;
  targetPoints?: number;
}

export function BurndownChart({ data, sprintDays = 10, targetPoints = 100 }: BurndownChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Calculate ideal burndown line
    const idealBurndown = Array.from({ length: sprintDays + 1 }, (_, i) => ({
      day: i,
      idealPoints: Math.max(0, targetPoints - (targetPoints / sprintDays) * i),
    }));

    // Merge actual data with ideal burndown
    const merged = idealBurndown.map(ideal => {
      const actual = data.find(d => d.day === ideal.day);
      return {
        day: ideal.day,
        idealPoints: ideal.idealPoints,
        remainingPoints: actual?.remainingPoints ?? null,
        completedPoints: actual?.completedPoints ?? 0,
      };
    });

    return merged;
  }, [data, sprintDays, targetPoints]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sprint Burndown</CardTitle>
          <CardDescription>No burndown data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Start tracking sprint progress to see burndown chart
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sprint Burndown Chart</CardTitle>
        <CardDescription>Remaining points vs ideal burndown line</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="day" 
              label={{ value: 'Sprint Day', position: 'insideBottomRight', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value) => value !== null ? value.toFixed(0) : 'N/A'}
              labelFormatter={(label) => `Day ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="idealPoints" 
              stroke="#888" 
              strokeDasharray="5 5"
              name="Ideal Burndown"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="remainingPoints" 
              stroke="#ef4444" 
              name="Actual Remaining"
              strokeWidth={2}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
