"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { Loader2 } from "lucide-react";

// Kleurenpalet voor de gebruikers (max 5 users voor nu)
const COLORS = ["#2563eb", "#16a34a", "#db2777", "#ea580c", "#7c3aed"];

interface ChartDataPoint {
  date: string;
  displayDate: string;
  [key: string]: string | number; // Dynamische keys voor namen (bijv. "Willem")
}

export function HistoryChart() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [userNames, setUserNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Haal profielen op (om UUIDs naar Namen te vertalen)
        const { data: profiles } = await supabase.from('profiles').select('id, full_name');
        
        // Maak een map: UUID -> "Willem"
        const idToName = new Map<string, string>();
        profiles?.forEach(p => {
            if(p.full_name) idToName.set(p.id, p.full_name);
        });

        // 2. Haal de historie op
        const { data: history } = await supabase
          .from('user_portfolio_history')
          .select('date, user_id, value')
          .order('date', { ascending: true });

        if (!history || history.length === 0) {
            setIsLoading(false);
            return;
        }

        // 3. Transformeer data: Van "DB Rows" naar "Chart Objects"
        // We groeperen alles per datum.
        const groupedByDate = new Map<string, ChartDataPoint>();

        history.forEach(record => {
            const dateKey = record.date; // string YYYY-MM-DD
            
            // Als deze datum nog niet bestaat, maak hem aan
            if (!groupedByDate.has(dateKey)) {
                groupedByDate.set(dateKey, {
                    date: dateKey,
                    displayDate: new Date(dateKey).toLocaleDateString('nl-NL', { month: 'short', year: '2-digit' })
                });
            }

            // Voeg de waarde van deze user toe aan het datum-object
            const entry = groupedByDate.get(dateKey)!;
            const userName = idToName.get(record.user_id) || 'Unknown';
            
            // Sla de waarde op onder de naam van de user (bijv entry["Willem"] = 500)
            entry[userName] = Number(record.value);
        });

        // Zet de Map om naar een Array voor Recharts
        const chartData = Array.from(groupedByDate.values());
        
        // Sla de unieke namen op zodat we weten hoeveel lijnen we moeten tekenen
        const uniqueNames = Array.from(idToName.values());
        
        setData(chartData);
        setUserNames(uniqueNames);

      } catch (error) {
        console.error("Error loading chart data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <div className="h-[350px] flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  if (data.length === 0) return <div className="h-[350px] flex items-center justify-center text-muted-foreground">Nog geen historie beschikbaar.</div>;

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {/* Definieer gradients voor een moderne look */}
            {userNames.map((name, index) => (
                <linearGradient key={name} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0}/>
                </linearGradient>
            ))}
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          
          <XAxis 
            dataKey="displayDate" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            minTickGap={30}
          />
          
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            tickFormatter={(value) => `€${value/1000}k`} 
          />
          
          <Tooltip 
            formatter={(value: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value)}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          
          <Legend wrapperStyle={{ paddingTop: '20px' }} />

          {/* Genereer dynamisch een Area per gebruiker */}
          {userNames.map((name, index) => (
            <Area 
                key={name}
                type="monotone" 
                dataKey={name} 
                stackId="1" // Haal dit weg als je ze NIET op elkaar gestapeld wilt hebben
                stroke={COLORS[index % COLORS.length]} 
                fill={`url(#color-${index})`}
                strokeWidth={2}
            />
          ))}

        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}