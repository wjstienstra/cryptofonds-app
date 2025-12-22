// src/types/index.ts

export interface Deposit {
  id: string; // We'll generate a random ID for internal use
  date: string;
  name: string;
  type: "Deposit" | "Withdrawal";
  amount: number;
}

export interface Holding {
  symbol: string; // e.g. "BTC"
  name: string;   // e.g. "Bitcoin"
  amount: number; // e.g. 0.5
  currentPrice?: number; // We'll fetch this from an API later
  value?: number;        // Calculated: amount * currentPrice
}

export interface PortfolioData {
  deposits: Deposit[];
  holdings: Holding[];
}