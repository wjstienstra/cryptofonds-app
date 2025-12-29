// 1. ASSET (Komt overeen met tabel 'assets')
// Dit is wat er fysiek in de database staat.
export interface Asset {
  symbol: string;   // Primary Key (bijv. "BTC")
  name: string;     // (bijv. "Bitcoin")
  amount: number;   // (bijv. 0.5)
}

// 2. HOLDING (Komt overeen met tabel 'holdings')
export interface Holding extends Asset {
  currentPrice?: number; // Optioneel, want komt pas na API call
  value?: number;        // Optioneel, want is berekend (amount * price)
}

// 3. PROFILE (Komt overeen met tabel 'profiles')
// Wie zijn de investeerders?
export interface Profile {
  id: string;       // UUID uit Supabase Auth
  email: string;
  full_name: string;
  role: 'admin' | 'investor'; // Union type voor veiligheid
}

// 4. TRANSACTION (Komt overeen met tabel 'transactions')
// Vroeger 'Deposit', maar Transaction is een betere naam.
export interface Transaction {
  id: string;
  user_id: string;  // Link naar Profile (was eerst 'name')
  date: string;     // ISO datum string (2023-01-01)
  type: 'deposit' | 'withdrawal'; // Kleine letters, zoals in DB
  amount: number;
}

// NEW: Flexible interface for the wide Excel rows (Date, Willem_Value, Laura_Value...)
export interface HistoryRow {
  date: string | number; 
  // Allow dynamic keys for users (e.g., 'value_willem')
  [key: string]: string | number | undefined;
}

export interface PortfolioData {
  holdings: Holding[];
  transactions: Transaction[];
  history: HistoryRow[]; // <--- Added this field
}

export interface PortfolioSnapshot {
  id: string;
  created_at: string;
  total_value: number;
  total_invested: number;
  user_id?: string;
}