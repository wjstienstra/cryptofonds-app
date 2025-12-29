"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UploadCloud, AlertTriangle } from "lucide-react";
import { ExcelImport } from "@/components/excel-import";
import { PortfolioData, Holding, Transaction, Profile } from "@/types";

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // 1. Check if user is Admin on mount
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch profile to check role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(profile?.role === 'admin');
      }
      setLoadingProfile(false);
    };

    checkUserRole();
  }, []);

  // 2. Handler when ExcelImport component finishes parsing
  const handleDataLoaded = (importedData: PortfolioData) => {
    setData(importedData);
  };

  // 3. The Core Logic: Transform Excel Data & Sync to Supabase
  const syncToDatabase = async () => {
    if (!data) return;

    // Double check session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert("⛔️ Je moet ingelogd zijn om te syncen.");
        return;
    }

    setIsSaving(true);
    
    try {
      // --- STEP A: Fetch Profiles for Mapping ---
      console.log("🔍 Fetching profiles...");
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*'); 
      
      if (profileError) {
          console.error("❌ Profile Fetch Error:", profileError);
          throw new Error("Kon profielen niet ophalen. Check RLS policies.");
      }

      if (!profiles || profiles.length === 0) {
          console.error("⚠️ Geen profielen gevonden! Ben je wel admin?");
          alert("Fout: Geen gebruikersprofielen gevonden in de database.");
          setIsSaving(false);
          return;
      }

      console.log(`✅ ${profiles.length} Profiles found:`, profiles.map(p => p.full_name));

      const profileList = profiles as Profile[]; 

      // --- STEP B: Prepare Assets (Holdings) ---
      // Map JS 'currentPrice' (camelCase) to DB 'current_price' (snake_case)
      const uniqueHoldingsMap = new Map<string, Holding & { current_price: number }>();
      
      data.holdings.forEach((h) => {
        const key = h.symbol.toUpperCase().trim();
        const price = h.currentPrice || 0; 

        if (uniqueHoldingsMap.has(key)) {
          const existing = uniqueHoldingsMap.get(key)!;
          existing.amount += h.amount;
        } else {
          uniqueHoldingsMap.set(key, { 
              symbol: key, 
              name: h.name, 
              amount: h.amount,
              current_price: price 
          });
        }
      });
      const dbAssets = Array.from(uniqueHoldingsMap.values());

      // --- STEP C: Prepare Transactions ---
      const dbTransactions = data.transactions.map((t) => {
        // Find profile by name (case insensitive)
        const matchedProfile = profileList.find(p => 
            p.full_name?.toLowerCase().trim() === t.user_id.toLowerCase().trim()
        );

        if (!matchedProfile) {
          console.warn(`Skipping transaction: User '${t.user_id}' not found in profiles.`);
          return null;
        }

        return {
          user_id: matchedProfile.id,
          date: t.date,
          type: t.type,
          amount: t.amount
          // description is removed (YAGNI)
        };
      }).filter((t): t is Transaction => t !== null);

      // --- STEP D: Prepare User History (The Unpivot) ---
      interface DBHistoryRow {
          date: string;
          user_id: string;
          value: number;
          invested: number;
      }
      
      const dbHistory: DBHistoryRow[] = [];

      // Debug: Laat zien wat Excel ons geeft in de eerste rij
      if (data.history.length > 0) {
        console.log("📊 Excel Headers (First Row Sample):", Object.keys(data.history[0]));
      }

      data.history.forEach((row) => {
          const dateStr = String(row.date); 

          profileList.forEach(profile => {
              if (!profile.full_name) return;

              const cleanName = profile.full_name.toLowerCase().trim(); // bijv "willem"
              const firstName = cleanName.split(' ')[0]; // voor het geval "willem jansen"

              // Helper: Checkt of een key bestaat in de rij (bv: 'invested_willem' OF 'willem_invested')
              const findVal = (baseName: string, type: 'value' | 'invested') => {
                  // Optie 1: invested_willem (zoals in jouw Excel)
                  const optionA = row[`${type}_${baseName}`];
                  // Optie 2: willem_invested (fallback)
                  const optionB = row[`${baseName}_${type}`];
                  
                  return optionA ?? optionB;
              };

              // 1. Probeer met volledige naam (bijv "willem de vries")
              let val = findVal(cleanName, 'value');
              let inv = findVal(cleanName, 'invested');

              // 2. Probeer met voornaam (fallback, bijv "willem")
              if (val === undefined) val = findVal(firstName, 'value');
              if (inv === undefined) inv = findVal(firstName, 'invested');

              // Als we data vinden, voegen we het toe
              if (val !== undefined || inv !== undefined) {
                  dbHistory.push({
                      date: dateStr,
                      user_id: profile.id,
                      value: Number(val || 0),
                      invested: Number(inv || 0)
                  });
              }
          });
      });

      console.log(`📝 Prepared ${dbHistory.length} history records for DB.`);

      // --- STEP E: Database Operations (Wipe & Replace) ---
      console.log("💾 Writing to database...");
      
      // 1. Clear Tables
      // Assets uses 'symbol' as key, others use 'id' (UUID)
      const { error: delAssetErr } = await supabase.from('assets').delete().not('symbol', 'is', null);
      if (delAssetErr) throw delAssetErr;

      const { error: delTransErr } = await supabase.from('transactions').delete().not('id', 'is', null);
      if (delTransErr) throw delTransErr;

      const { error: delHistErr } = await supabase.from('user_portfolio_history').delete().not('id', 'is', null);
      if (delHistErr) throw delHistErr;

      // 2. Insert New Data
      if (dbAssets.length > 0) {
        const { error } = await supabase.from('assets').insert(dbAssets);
        if (error) throw error;
      }

      if (dbTransactions.length > 0) {
        const { error } = await supabase.from('transactions').insert(dbTransactions);
        if (error) throw error;
      }

      if (dbHistory.length > 0) {
        const { error } = await supabase.from('user_portfolio_history').insert(dbHistory);
        if (error) throw error;
      }

      alert(`✅ Success!\nSynced:\n- ${dbAssets.length} Assets\n- ${dbTransactions.length} Transactions\n- ${dbHistory.length} Historical Records`);
      
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Sync Error:", error);
      alert(`Sync failed: ${errMsg}`);
    } finally {
      setIsSaving(false);
    }
  };


  // --- UI RENDERING ---

  if (loadingProfile) {
      return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  }

  if (!isAdmin) {
      return (
          <div className="container mx-auto p-8 text-center text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <h2 className="text-xl font-bold">Access Denied</h2>
              <p>Only administrators can manage portfolio data.</p>
          </div>
      );
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio Management</h1>
        <p className="text-muted-foreground">Import Excel data to update the database.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Import Excel File</CardTitle>
        </CardHeader>
        <CardContent>
          <ExcelImport onDataLoaded={handleDataLoaded} />
        </CardContent>
      </Card>

      {data && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-400">2. Preview & Sync</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-card rounded shadow-sm">
                    <div className="text-sm text-muted-foreground">Assets Found</div>
                    <div className="text-2xl font-bold">{data.holdings.length}</div>
                </div>
                <div className="p-4 bg-white dark:bg-card rounded shadow-sm">
                    <div className="text-sm text-muted-foreground">Transactions Found</div>
                    <div className="text-2xl font-bold">{data.transactions.length}</div>
                </div>
                <div className="p-4 bg-white dark:bg-card rounded shadow-sm">
                    <div className="text-sm text-muted-foreground">History Points</div>
                    <div className="text-2xl font-bold">{data.history.length}</div>
                </div>
            </div>

            <Button 
                onClick={syncToDatabase} 
                disabled={isSaving} 
                className="w-full md:w-auto"
                size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving to Database...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Sync to Database
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}