"use client"

import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, FileSpreadsheet } from "lucide-react";
import { PortfolioData, Holding, Transaction, HistoryRow } from "@/types";

// Helper type for input rows where keys are unknown strings and values are unknown
type RawRow = Record<string, unknown>;

// Helper function to clean row keys (lowercase + trim spaces)
const normalizeKeys = (row: RawRow): RawRow => {
  const newRow: RawRow = {};
  Object.keys(row).forEach((key) => {
    const cleanKey = key.toLowerCase().trim();
    newRow[cleanKey] = row[key];
  });
  return newRow;
};

// Smart date parser that handles Excel serial numbers, strings, or Date objects
const parseExcelDate = (input: string | number | Date | null | undefined): string => {
  if (input === null || input === undefined) return new Date().toISOString();

  // Case A: Excel serial number (e.g., 42343)
  if (typeof input === 'number') {
     // Excel starts counting from Dec 30, 1899
     const excelEpoch = new Date(Date.UTC(1899, 11, 30)); 
     const date = new Date(excelEpoch.getTime() + input * 24 * 60 * 60 * 1000);
     return date.toISOString();
  }

  // Case B: Already a Date object
  if (input instanceof Date) {
      return input.toISOString();
  }

  // Case C: String (e.g., "2023-01-01")
  const date = new Date(input);
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }

  // Fallback
  return new Date().toISOString();
};

const generateId = () => Math.random().toString(36).substring(2, 9);

interface ExcelImportProps {
  onDataLoaded: (data: PortfolioData) => void;
}

export function ExcelImport({ onDataLoaded }: ExcelImportProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    const reader = new FileReader();

    // Use ArrayBuffer (modern standard) instead of BinaryString
    reader.readAsArrayBuffer(file);

    reader.onload = (evt) => {
      try {
        const arrayBuffer = evt.target?.result;
        if (!arrayBuffer) return;

        const wb = XLSX.read(arrayBuffer, { type: "array" });

        // --- 1. PARSE DEPOSITS (TRANSACTIONS) ---
        const depositSheetName = wb.SheetNames.find(n => n.toLowerCase().includes("storting")) || wb.SheetNames[0];
        const depositWs = wb.Sheets[depositSheetName];
        
        const rawDeposits = XLSX.utils.sheet_to_json<RawRow>(depositWs, { raw: true });

        const transactions: Transaction[] = rawDeposits.map((rawRow) => {
          const row = normalizeKeys(rawRow);
          
          const rawType = String(row["type"] || "deposit");
          const isWithdrawal = rawType.toLowerCase().includes("opname") || rawType.toLowerCase().includes("withdrawal");
          const finalType = (isWithdrawal ? "withdrawal" : "deposit") as 'deposit' | 'withdrawal';

          return {
            id: generateId(),
            user_id: String(row["naam"] || row["name"] || "unknown-user"), 
            date: parseExcelDate(row["datum"] as string | number | undefined), 
            type: finalType,
            amount: Number(row["bedrag"] || row["amount"] || 0),
          };
        }).filter(t => t.amount > 0);


        // --- 2. PARSE HOLDINGS (PORTFOLIO) ---
        const holdingsSheetName = wb.SheetNames.find(n => 
            n.toLowerCase().includes("holding") || 
            n.toLowerCase().includes("portfolio") || 
            n.toLowerCase().includes("asset")
        ) || wb.SheetNames[0];

        const holdingsWs = wb.Sheets[holdingsSheetName];
        const rawHoldings = XLSX.utils.sheet_to_json<RawRow>(holdingsWs);

        const holdings: Holding[] = rawHoldings.map((rawRow) => {
          const row = normalizeKeys(rawRow);
          
          return {
            symbol: String(row["symbol"] || row["ticker"] || row["munt"] || "???").toUpperCase(),
            name: String(row["name"] || row["naam"] || ""),
            amount: Number(row["amount"] || row["aantal"] || 0),
            currentPrice: row["price"] ? Number(row["price"]) : undefined
          };
        }).filter(h => h.symbol !== "???" && h.amount > 0);


        // --- 3. PARSE HISTORY (SNAPSHOTS) ---
        // Look for "snapshots" or "history" tab
        const historySheetName = wb.SheetNames.find(n => 
            n.toLowerCase().includes("snapshot") || n.toLowerCase().includes("histor")
        );

        let history: HistoryRow[] = [];
        
        if (historySheetName) {
            const historyWs = wb.Sheets[historySheetName];
            // Read as raw to preserve column names like 'Willem_Value'
            const rawHistory = XLSX.utils.sheet_to_json<RawRow>(historyWs, { raw: true });
            
            // Normalize keys (lowercase) so 'Willem_Value' becomes 'willem_value'
            history = rawHistory.map(row => normalizeKeys(row) as unknown as HistoryRow);
        }

        console.log(`✅ Import Success: ${transactions.length} tx, ${holdings.length} holdings, ${history.length} snapshots.`);
        
        onDataLoaded({
            holdings,
            transactions,
            history // Passing the new data up!
        });

      } catch (error: unknown) {
        let errorMessage = "Unknown error parsing Excel";
        if (error instanceof Error) errorMessage = error.message;
        
        console.error("Excel parse error:", errorMessage);
        alert("Fout bij inlezen bestand. Check de console.");
      } finally {
        setIsLoading(false);
      }
    };
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="hidden"
        id="excel-upload"
      />
      <Button variant="outline" disabled={isLoading} asChild>
        <label htmlFor="excel-upload" className="cursor-pointer">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
          Import Excel
        </label>
      </Button>
    </div>
  );
}