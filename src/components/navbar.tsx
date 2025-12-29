"use client"

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard,
  PieChart, 
  Activity, 
  LogOut, 
  LogIn, 
  User as UserIcon 
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 1. Check huidige sessie bij het laden
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getUser();

    // 2. Luister naar veranderingen (Login / Logout events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_OUT') {
        router.refresh(); // Ververs de pagina data als je uitlogt
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Helper voor actieve link styling
  const isActive = (path: string) => pathname === path ? "text-primary font-bold" : "text-muted-foreground hover:text-primary";

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        
        {/* LINKS: Logo & Navigatie */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="bg-primary text-primary-foreground p-1 rounded">CF</span>
            <span className="hidden sm:inline-block">CryptoFonds</span>
          </Link>

          {/* Navigatie links (Alleen tonen als ingelogd, of Dashboard altijd) */}
          <div className="hidden md:flex gap-6 text-sm font-medium">
            
            <Link href="/" className={`flex items-center gap-2 ${isActive('/')}`}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>

            <Link href="/portfolio" className={`flex items-center gap-2 ${isActive('/portfolio')}`}>
              <PieChart className="h-4 w-4" />
              Portfolio
            </Link>
            
            {user && (
              <Link href="/activity" className={`flex items-center gap-2 ${isActive('/activity')}`}>
                <Activity className="h-4 w-4" />
                Activity
              </Link>
            )}
          </div>
        </div>

        {/* RECHTS: User Menu */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span className="truncate max-w-[150px]">{user.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" />
                Uitloggen
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Inloggen
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}