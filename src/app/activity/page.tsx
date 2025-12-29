"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

// We definiëren hier lokaal even een type voor wat we uit de DB halen
// omdat dit een 'joined' resultaat is (transactie + profielnaam)
type TransactionWithUser = {
  id: string;
  date: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  description?: string;
  profiles: {
    full_name: string;
  } | null;
};

export default function ActivityPage() {
  const [transactions, setTransactions] = useState<TransactionWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // 1. Check wie er kijkt (voor de UI titel)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         // Haal rol op (optioneel, voor UI tweaks)
         const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
         setCurrentUserRole(profile?.role || 'investor');
      }

      // 2. Haal transacties op
      // .select('*, profiles(full_name)') is de magie: haal alles van transactie op PLUS de naam uit profiel
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles ( full_name )
        `)
        .order('date', { ascending: false });

      if (error) {
        console.error("Error fetching data:", error);
      } else {
        // We moeten even casten omdat Supabase types soms lastig zijn met joins
        setTransactions(data as unknown as TransactionWithUser[]);
      }
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Helpers voor formatting
  const formatEuro = (val: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(val);
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('nl-NL', { year: 'numeric', month: 'short', day: 'numeric' });

  // Bereken totaal (netto inleg)
  const totalNetDeposit = transactions.reduce((acc, t) => {
    return t.type === 'deposit' ? acc + t.amount : acc - t.amount;
  }, 0);

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* Header Stat */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
            <p className="text-muted-foreground">
              Overzicht van alle stortingen en opnames.
              {currentUserRole === 'admin' && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Admin View</span>}
            </p>
        </div>
        
        {/* Totaal kaartje */}
        <div className="bg-card border rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="p-2 bg-primary/10 rounded-full">
                <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Netto Inleg</p>
                <p className="text-2xl font-bold">{formatEuro(totalNetDeposit)}</p>
            </div>
        </div>
      </div>

      {/* Tabel */}
      <div className="rounded-md border bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Datum</th>
              <th className="px-6 py-3">Naam</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3 text-right">Bedrag</th>
              <th className="px-6 py-3 hidden md:table-cell">Omschrijving</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.length === 0 ? (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        Geen transacties gevonden.
                    </td>
                </tr>
            ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                        {formatDate(t.date)}
                    </td>
                    <td className="px-6 py-4 font-medium">
                        {t.profiles?.full_name || "Onbekend"}
                    </td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            t.type === 'deposit' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                            {t.type === 'deposit' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                            {t.type === 'deposit' ? 'Storting' : 'Opname'}
                        </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-mono font-medium ${
                        t.type === 'deposit' ? 'text-foreground' : 'text-red-600'
                    }`}>
                        {t.type === 'withdrawal' && "- "}{formatEuro(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground hidden md:table-cell italic truncate max-w-[200px]">
                        {t.description || "-"}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}