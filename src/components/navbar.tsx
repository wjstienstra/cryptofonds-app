import Link from "next/link";
import { Button } from "@/components/ui/button";
// We import a simple icon to use as a logo
import { LineChart } from "lucide-react";

export function Navbar() {
  return (
    // Main container with a border at the bottom and background color
    <nav className="border-b bg-background">
      <div className="flex h-16 items-center px-4 container mx-auto">
        
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl mr-8">
          <LineChart className="h-6 w-6" />
          <span>CryptoFonds</span>
        </Link>

        {/* Navigation Links - Hidden on small mobile screens for now */}
        <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link href="/portfolio" className="hover:text-foreground transition-colors">
            Portfolio
          </Link>
          <Link href="/activity" className="hover:text-foreground transition-colors">
            Activity
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center gap-4">
          <Button variant="outline" size="sm">
            Log In
          </Button>
          <Button size="sm">
            Connect Wallet
          </Button>
        </div>
      </div>
    </nav>
  );
}