// 1. ASSET (Komt overeen met tabel 'assets')
// Dit is wat er fysiek in de database staat.
export interface Asset {
  symbol: string;   // Primary Key (bijv. "BTC")
  name: string;     // (bijv. "Bitcoin")
  amount: number;   // (bijv. 0.5)
}

// 2. HOLDING (Asset + Live Data)
// Dit is de 'verrijkte' versie die we in de UI gebruiken.
// Hij 'erft' alle eigenschappen van Asset (extends) en voegt prijsinfo toe.
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
  description?: string; // Optioneel
}

// 5. DATA CONTAINER (Voor imports/exports)
export interface PortfolioData {
  // We gebruiken hier nog even de oude structuur voor de Excel import,
  // maar we bereiden ons voor op de toekomst.
  holdings: Holding[];
  transactions?: Transaction[]; // Nu nog optioneel
}