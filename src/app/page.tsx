import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Activity } from "lucide-react";
// Import the new component
import { PortfolioChart } from "@/components/portfolio-chart";
import { RecentActivity } from "@/components/recent-activity";

export default function Home() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      
      {/* Header and Stats Grid (Same as before) */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* ... (Keep your 3 statistic cards here unchanged) ... */}
        {/* If you want me to paste the full code again, let me know! */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€ 12,345.00</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold text-green-500">+ € 450.23</div>
            <p className="text-xs text-muted-foreground">+4.5% since yesterday</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Bitcoin, Ethereum, Solana...</p>
            </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        <PortfolioChart />

        {/* Recent Activity (Placeholder remains for now) */}
        <Card className="col-span-3 h-[400px]">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
             <RecentActivity />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}