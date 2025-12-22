import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Holding } from "@/types";

interface PortfolioTableProps {
  data: Holding[];
}

export function PortfolioTable({ data }: PortfolioTableProps) {
  if (!data || data.length === 0) {
    return <div className="p-4 text-muted-foreground">No data loaded yet.</div>;
  }

  // LOGICA 1: Slimme opmaak voor prijzen
  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === 0) return "-";
    
    // Minder dan 1 cent? Dan 6 decimalen (bijv. €0.000045)
    if (price < 0.01) return `€${price.toFixed(6)}`;
    // Minder dan 1 euro? Dan 4 decimalen
    if (price < 1) return `€${price.toFixed(4)}`;
    
    // Standaard Euro notatie
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(price);
  };

  // LOGICA 2: Slimme opmaak voor aantallen (balances)
  const formatBalance = (amount: number, symbol: string) => {
    const sym = symbol.toUpperCase();
    
    // Crypto's met hoge waarde (en dus vaak kleine aantallen) -> 6 decimalen
    if (["BTC", "ETH", "YFI", "PAXG"].includes(sym)) {
        return amount.toFixed(6);
    }
    
    // Stablecoins of Fiat -> 2 decimalen
    if (["USDT", "USDC", "EUR", "USD"].includes(sym)) {
        return amount.toFixed(2);
    }

    // Voor "goedkope" coins waar je er duizenden van hebt (XVG, VET, SHIB)
    // Als het getal groter is dan 1000, hoeven we geen decimalen te zien.
    if (amount > 1000) {
        return amount.toLocaleString("nl-NL", { maximumFractionDigits: 0 });
    }

    // Default
    return amount.toFixed(4);
  };

  // Helper voor Totaal Waarde (altijd geld, dus altijd 2 decimalen)
  const formatValue = (val: number | undefined) => {
    if (val === undefined) return "€0.00";
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(val);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((asset) => (
            <TableRow key={asset.symbol}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-base">{asset.symbol}</span>
                    <span className="text-muted-foreground text-xs hidden md:inline">{asset.name}</span>
                </div>
              </TableCell>
              
              {/* Hier gebruiken we de nieuwe formatter */}
              <TableCell>{formatBalance(asset.amount, asset.symbol)}</TableCell>
              
              <TableCell>{formatPrice(asset.currentPrice)}</TableCell>
              
              <TableCell className="text-right font-bold">
                {formatValue(asset.value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}