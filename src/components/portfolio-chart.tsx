"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Mock data: Simulating portfolio value over the last 7 days
const data = [
  { day: "Mon", value: 11200 },
  { day: "Tue", value: 11800 },
  { day: "Wed", value: 11500 },
  { day: "Thu", value: 12100 },
  { day: "Fri", value: 12345 },
  { day: "Sat", value: 12600 },
  { day: "Sun", value: 12900 },
]

// Configuration for the chart colors and labels
const chartConfig = {
  value: {
    label: "Portfolio Value (€)",
    color: "hsl(var(--primary))", // Uses your Zinc theme primary color
  },
}

export function PortfolioChart() {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
        <CardDescription>Value over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent className="pl-0">
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <XAxis 
              dataKey="day" 
              stroke="#888888" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `€${value}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}