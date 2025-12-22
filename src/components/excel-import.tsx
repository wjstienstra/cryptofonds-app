"use client"

import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2 } from "lucide-react";
import { Transaction, Holding, PortfolioData } from "@/types";

const generateId = () => Math.random().toString(36).substr(2, 9);

interface ExcelImportProps {
  onDataLoaded: (data: PortfolioData) => void;
}

// Type definitie voor een ruwe rij
type RawRow = Record<string, unknown>;

export function ExcelImport({ onDataLoaded }: ExcelImportProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessed, setIsProcessed] = useState(false);

  // Helper: Maakt sleutels schoon en typed de output
  const normalizeRow = (row: RawRow) => {
    const newRow: Record<string, unknown> = {};
    Object.keys(row).forEach(key => {
      const cleanKey = key.toLowerCase().trim();
      newRow[cleanKey] = row[key];
    });
    return newRow;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    // Gebruik ArrayBuffer (modern) in plaats van BinaryString
    reader.readAsArrayBuffer(file);

    reader.onload = (evt) => {
      const arrayBuffer = evt.target?.result;
      if (!arrayBuffer) return;

      // Lees de buffer
      const wb = XLSX.read(arrayBuffer, { type: "array" });

      // 1. Parse 'Stortingen'
      const depositSheetName = wb.SheetNames.find(n => n.toLowerCase().includes("storting")) || wb.SheetNames[0];
      const depositWs = wb.Sheets[depositSheetName];
      const rawDeposits = XLSX.utils.sheet_to_json(depositWs) as RawRow[];

      const transactions: Transaction[] = rawDeposits.map((rawRow) => {
        const row = normalizeRow(rawRow);

        const rawType = String(row["type"] || "Deposit");
        const type = (rawType.toLowerCase() === "opname" || rawType.toLowerCase() === "withdrawal") 
          ? "withdrawal" 
          : "deposit";

        return {
          id: generateId(),
          user_id: String(row["naam"] || "unknown-user"),
          date: String(row["datum"] || ""),
          type: type,
          amount: Number(row["bedrag"] || 0),
          description: String(row["opmerking"] || ""),
        };
      });

      // 2. Parse 'Holdings'
      const holdingSheetName = wb.SheetNames.find(n => n.toLowerCase().includes("holding")) || wb.SheetNames[1];
      let holdings: Holding[] = [];

      if (holdingSheetName && wb.Sheets[holdingSheetName]) {
        const holdingWs = wb.Sheets[holdingSheetName];
        const rawHoldings = XLSX.utils.sheet_to_json(holdingWs) as RawRow[];
        
        holdings = rawHoldings.map((rawRow) => {
          const row = normalizeRow(rawRow);
          
          return {
            symbol: String(row["symbol"] || row["ticker"] || row["name"] || "UNKNOWN"),
            name: String(row["name"] || row["naam"] || "Unknown Asset"),
            amount: Number(row["amount"] || row["aantal"] || row["quantity"] || row["balance"] || 0),
          };
        });
      }

      console.log("✅ Parsed Data:", { transactions, holdings });
      onDataLoaded({ transactions, holdings });
      setIsProcessed(true);
    };
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        accept=".xlsx, .xls"
        className="hidden"
        id="excel-upload"
        onChange={handleFileUpload}
      />
      <label htmlFor="excel-upload">
        <Button 
            variant={isProcessed ? "default" : "outline"} 
            className="cursor-pointer transition-all" 
            asChild
        >
          <span>
            {isProcessed ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
            {isProcessed ? "Data Loaded" : fileName ? fileName : "Upload Excel"}
          </span>
        </Button>
      </label>
    </div>
  );
}