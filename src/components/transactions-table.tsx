"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input" // Zorg dat je input al hebt, anders: npx shadcn@latest add input

// Mock Data: Transaction History
const transactions = [
  {
    id: "TX-001",
    date: "2024-03-20",
    type: "Deposit",
    asset: "EUR",
    amount: "€ 5,000.00",
    status: "Completed",
  },
  {
    id: "TX-002",
    date: "2024-03-21",
    type: "Buy",
    asset: "Bitcoin",
    amount: "0.08 BTC",
    status: "Completed",
  },
  {
    id: "TX-003",
    date: "2024-03-22",
    type: "Buy",
    asset: "Ethereum",
    amount: "1.5 ETH",
    status: "Processing",
  },
  {
    id: "TX-004",
    date: "2024-03-25",
    type: "Sell",
    asset: "Solana",
    amount: "50 SOL",
    status: "Completed",
  },
  {
    id: "TX-005",
    date: "2024-03-28",
    type: "Withdrawal",
    asset: "EUR",
    amount: "€ 200.00",
    status: "Failed",
  },
]

export function TransactionsTable() {
  return (
    <div className="space-y-4">
      
      {/* Filters Toolbar */}
      <div className="flex items-center justify-between">
        <Input 
            placeholder="Search transactions..." 
            className="max-w-sm" 
        />
        <div className="flex items-center gap-2">
            <Select>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposits</SelectItem>
                    <SelectItem value="trade">Trades</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      {/* The Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{tx.date}</TableCell>
                <TableCell>
                    <span className="font-medium">{tx.type}</span>
                </TableCell>
                <TableCell>{tx.asset}</TableCell>
                <TableCell>{tx.amount}</TableCell>
                <TableCell>
                  {/* Dynamic Badge Styling based on status */}
                  <Badge variant={
                    tx.status === "Completed" ? "default" : 
                    tx.status === "Processing" ? "secondary" : "destructive"
                  }>
                    {tx.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}