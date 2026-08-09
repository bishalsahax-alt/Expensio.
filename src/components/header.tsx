'use client';

import { LogOut, Sparkles, User as UserIcon } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { CurrencySelect } from '@/components/currency-select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

type HeaderProps = {
  pageTitle: string;
};

export default function Header({ pageTitle }: HeaderProps) {
  const { user } = useUser();
  const auth = useAuth();

  const handleSignOut = async () => {
    try {
      if (auth) {
        await signOut(auth);
        toast({
          title: 'Signed Out',
          description: 'You have been signed out successfully.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign out.',
        variant: 'destructive',
      });
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/20 bg-card/10 px-4 md:px-6 no-print">
      {/* Dynamic Page Title */}
      <div className="flex items-center gap-4">
        <h2 className="text-base font-bold tracking-tight font-headline text-foreground md:text-lg">
          {pageTitle}
        </h2>

        {/* AI Status Indicator */}
        <div className="hidden items-center gap-1.2 rounded-full border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 sm:flex shadow-sm">
          <span className="relative flex h-1.5 w-1.5 mr-1">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          </span>
          <Sparkles className="h-3 w-3 inline mr-1 text-emerald-400" />
          <span>AI Active</span>
        </div>
      </div>

      {/* Header Controls: Currency Select, Theme Toggle & User Avatar */}
      <div className="flex items-center gap-2.5">
        <CurrencySelect />
        <ThemeToggle />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8.5 w-8.5 rounded-full border border-border/40 p-0 hover:bg-muted/50 transition-smooth">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                    {user.isAnonymous ? 'AN' : user.email?.slice(0, 2).toUpperCase() || 'US'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52 glass-card border-border/40" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold leading-none text-foreground">
                    {user.isAnonymous ? 'Anonymous Session' : 'Member Account'}
                  </p>
                  <p className="text-[10px] leading-none text-muted-foreground truncate max-w-[170px]">
                    UID: {user.uid.slice(0, 10)}...
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-[11px] py-1.5 cursor-pointer">
                <UserIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-[11px] py-1.5 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
