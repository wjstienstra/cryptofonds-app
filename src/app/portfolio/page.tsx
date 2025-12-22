"use client"

import { useState, useEffect } from "react";
import { PortfolioTable } from "@/components/portfolio-table";
import { PortfolioDistribution } from "@/components/portfolio-distribution";
import { ExcelImport } from "@/components/excel-import";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { PortfolioData, Holding } from "@/types";
import { getLivePrices } from "@/lib/price-service";
import { supabase } from "@/lib/supabase";

// Definieer wat we als 'Cash' en 'Goud' beschouwen
const CASH_ASSETS = ["EUR", "USD", "USDT", "USDC", "DAI"];
const GOLD_ASSETS = ["PAXG"];

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  // We houden één master-lijst, maar in de render filteren we
  const [allHoldings, setAllHoldings] = useState<Holding[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- 1. CORE LOGIC ---
  const processPortfolioData = async (importedData: PortfolioData) => {
    setIsLoading(true);
    
    try {
      const pricesMap = await getLivePrices(importedData.holdings);

      const updatedHoldings = importedData.holdings.map(asset => {
        const currentPrice = pricesMap[asset.symbol] || 0;
        return {
          ...asset,
          currentPrice: currentPrice,
          value: asset.amount * currentPrice
        };
      })
      .sort((a, b) => (b.value || 0) - (a.value || 0));

      setData(importedData);
      setAllHoldings(updatedHoldings);
    } catch (error) {
      console.error("Error processing portfolio data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. EFFECT: Load from Database ---
  useEffect(() => {
    const loadFromDatabase = async () => {
      setIsLoading(true);
      
      try {
        const { data: dbAssets, error } = await supabase
          .from('assets')
          .select('*');

        if (error) throw error;

        if (dbAssets && dbAssets.length > 0) {
          console.log("☁️ Loaded from Supabase:", dbAssets.length, "assets");
          
          const reconstructedData: PortfolioData = {
            deposits: [], 
            holdings: dbAssets.map((asset) => ({
               symbol: asset.symbol,
               name: asset.name,
               amount: Number(asset.amount)
            }))
          };

          await processPortfolioData(reconstructedData);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to load from DB:", error);
        setIsLoading(false);
      }
    };

    loadFromDatabase();
  }, []);

  // --- 3. HANDLER: Sync to Supabase ---
  const syncToDatabase = async () => {
    if (!data || !data.holdings) return;
    setIsSaving(true);
    
    try {
      const uniqueHoldingsMap = new Map<string, { symbol: string, name: string, amount: number }>();
      data.holdings.forEach(h => {
        const key = h.symbol.toUpperCase().trim();
        if (uniqueHoldingsMap.has(key)) {
          uniqueHoldingsMap.get(key)!.amount += h.amount;
        } else {
          uniqueHoldingsMap.set(key, { symbol: key, name: h.name, amount: h.amount });
        }
      });
      const dbRows = Array.from(uniqueHoldingsMap.values());

      const { error: deleteError } = await supabase.from('assets').delete().not('symbol', 'is', null); 
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase.from('assets').insert(dbRows);
      if (insertError) throw insertError;

      alert("✅ Database updated successfully.");
    } catch (error: unknown) {
      console.error("Sync Error:", error);
      alert("Sync failed. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataLoaded = (importedData: PortfolioData) => processPortfolioData(importedData);

  // --- HULPFUNCTIES VOOR WEERGAVE ---
  // Filter de lijsten voor de aparte tabellen
  const cashHoldings = allHoldings.filter(h => CASH_ASSETS.includes(h.symbol.toUpperCase()));
  const goldHoldings = allHoldings.filter(h => GOLD_ASSETS.includes(h.symbol.toUpperCase()));
  const cryptoHoldings = allHoldings.filter(h => 
    !CASH_ASSETS.includes(h.symbol.toUpperCase()) && 
    !GOLD_ASSETS.includes(h.symbol.toUpperCase())
  );

  // Bereken totaalwaardes voor de kopjes
  const totalValue = allHoldings.reduce((sum, h) => sum + (h.value || 0), 0);
  const cashValue = cashHoldings.reduce((sum, h) => sum + (h.value || 0), 0);
  const goldValue = goldHoldings.reduce((sum, h) => sum + (h.value || 0), 0);
  const cryptoValue = cryptoHoldings.reduce((sum, h) => sum + (h.value || 0), 0);

  const formatEuro = (val: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(val);

  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Portfolio</h2>
            <p className="text-muted-foreground">
              Total Balance: <span className="font-bold text-foreground">{formatEuro(totalValue)}</span>
            </p>
        </div>
        <div className="flex gap-2">
            <ExcelImport onDataLoaded={handleDataLoaded} />
            {data && (
              <Button onClick={syncToDatabase} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save to DB
              </Button>
            )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* LINKER KOLOM: De Tabellen */}
        <div className="md:col-span-2 space-y-8">
            {isLoading ? (
                <div className="flex items-center justify-center h-40 border rounded bg-muted/10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : (
                <>
                  {/* 1. CASH & STABLECOINS */}
                  {cashHoldings.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-end border-b pb-2">
                         <h3 className="text-xl font-semibold flex items-center gap-2">💶 Cash & Stablecoins</h3>
                         <span className="font-mono font-bold text-green-600">{formatEuro(cashValue)}</span>
                      </div>
                      <PortfolioTable data={cashHoldings} />
                    </div>
                  )}

                  {/* 2. GOLD / COMMODITIES */}
                  {goldHoldings.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-end border-b pb-2">
                         <h3 className="text-xl font-semibold flex items-center gap-2">🏆 Gold & Commodities</h3>
                         <span className="font-mono font-bold text-yellow-600">{formatEuro(goldValue)}</span>
                      </div>
                      <PortfolioTable data={goldHoldings} />
                    </div>
                  )}

                  {/* 3. CRYPTO */}
                  <div className="space-y-2">
                      <div className="flex justify-between items-end border-b pb-2">
                         <h3 className="text-xl font-semibold flex items-center gap-2">🚀 Crypto Assets</h3>
                         <span className="font-mono font-bold text-blue-600">{formatEuro(cryptoValue)}</span>
                      </div>
                      <PortfolioTable data={cryptoHoldings} />
                  </div>
                </>
            )}
        </div>

        {/* RECHTER KOLOM: Grafiek */}
        <div className="md:col-span-1">
            
            
            {/* Klein overzichtje eronder */}
            {!isLoading && (
              <div className="mb-4 p-4 border rounded-lg bg-card text-sm space-y-2">
                 <div className="flex justify-between">
                    <span>Cash Ratio:</span>
                    <span className="font-bold">{((cashValue / totalValue) * 100).toFixed(1)}%</span>
                 </div>
                 <div className="flex justify-between">
                    <span>Gold Ratio:</span>
                    <span className="font-bold">{((goldValue / totalValue) * 100).toFixed(1)}%</span>
                 </div>
                 <div className="flex justify-between">
                    <span>Crypto Ratio:</span>
                    <span className="font-bold">{((cryptoValue / totalValue) * 100).toFixed(1)}%</span>
                 </div>
              </div>
            )}
            {/* We sturen 'allHoldings' naar de grafiek zodat de verdeling van ALLES zichtbaar is */}
            <PortfolioDistribution data={allHoldings} />
        </div>
      </div>
    </div>
  );
}