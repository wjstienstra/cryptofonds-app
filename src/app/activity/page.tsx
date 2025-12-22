import { TransactionsTable } from "@/components/transactions-table";


export default function ActivityPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Activity</h2>
        <p className="text-muted-foreground">
          View your recent transactions and order history.
        </p>
      </div>
      <TransactionsTable />
    </div>
  );
}