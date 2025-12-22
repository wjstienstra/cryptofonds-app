"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Holding } from "@/types" // Importeer je type!

// Kleurenpalet voor de grafiek (zodat elk partje een andere kleur krijgt)
const COLORS = ["#f7931a", "#627eea", "#14f195", "#26a17b", "#e11d48", "#0ea5e9", "#8b5cf6"];

interface PortfolioDistributionProps {
  data?: Holding[]; // Accepteer de nieuwe data structuur
}

export function PortfolioDistribution({ data }: PortfolioDistributionProps) {
  // Als er geen data is, gebruik placeholders of toon niks
  if (!data || data.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center p-6 text-muted-foreground">
        No data available
      </Card>
    );
  }

  // Transformeer jouw Holdings naar data voor de grafiek
  const chartData = data
    .filter(h => h.value && h.value > 0) // Filter items zonder waarde eruit
    .map((h, index) => ({
      name: h.symbol,
      value: h.value || 0,
      color: COLORS[index % COLORS.length] // Roulleer door de kleuren
    }));

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Allocation</CardTitle>
        <CardDescription>Based on current market value</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `€${value.toFixed(2)}`}
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Dynamische Legenda */}
        <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: item.color }} 
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              {/* Bereken percentage voor weergave */}
              <span className="font-medium">
                {/* Totaal waarde berekenen we even inline voor de display */}
                {((item.value / chartData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}