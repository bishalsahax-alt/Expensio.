'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Mail, Lock, UserCheck, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '@/firebase';
import { initiateAnonymousSignIn, initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { toast } from '@/hooks/use-toast';

type AuthDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthDialog({ isOpen, onClose }: AuthDialogProps) {
  const auth = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email || !password) return;

    if (isSignUp) {
      initiateEmailSignUp(auth, email, password);
      toast({
        title: 'Account Registration Triggered',
        description: 'Creating your secure Expensio user account...',
      });
    } else {
      initiateEmailSignIn(auth, email, password);
      toast({
        title: 'Signing In',
        description: 'Authenticating credentials...',
      });
    }
    onClose();
  };

  const handleGuestSignIn = () => {
    if (!auth) return;
    initiateAnonymousSignIn(auth);
    toast({
      title: 'Anonymous Session Active',
      description: 'Logged in securely with temporary local credentials.',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card border-border/40 space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold font-headline">
                {isSignUp ? 'Create Expensio Account' : 'Welcome Back to Expensio'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Sync your expenses securely across devices with Firebase Auth.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 text-xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Password</label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 text-xs"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white text-xs h-9 mt-2">
            {isSignUp ? 'Register Account' : 'Sign In with Email'}
          </Button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/30" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or Continue With</span>
          </div>
        </div>

        <Button
          onClick={handleGuestSignIn}
          variant="outline"
          className="w-full text-xs h-9 border-border/40 gap-2 hover:bg-muted/30"
        >
          <UserCheck className="h-4 w-4 text-accent" />
          <span>Anonymous Guest Session</span>
        </Button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-primary hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
