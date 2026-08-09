'use client';

import { Suspense } from 'react';
import Header from '@/components/header';
import Dashboard from '@/components/dashboard';
import Loading from './loading';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase';
import Image from "next/image";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const renderContent = () => {
    if (isUserLoading) {
      return <Loading />;
    }

    if (!user) {
      return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background grid-background px-4 py-12">
          {/* Glowing background orbs */}
          <div className="glowing-orb bg-primary w-[320px] h-[320px] -top-20 -left-20 animate-pulse-glow" />
          <div className="glowing-orb bg-accent w-[300px] h-[300px] -bottom-20 -right-20 animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

          <div className="relative z-10 w-full max-w-md glass-card rounded-2xl p-8 border border-white/5 bg-slate-900/40 text-center backdrop-blur-xl">
            <div className="flex justify-center mb-6">
              <div className="relative h-16 w-16 p-3 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5 group transition-smooth hover:scale-105">
                <Image src="/logo.png" alt="logo" width={40} height={40} className="animate-float" />
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-headline bg-gradient-to-r from-white via-indigo-200 to-primary bg-clip-text text-transparent mb-2">
              Expensio
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              Smart AI-powered financial companion. Track budgets and analyze spending habits instantly.
            </p>

            <Button
              onClick={() => initiateAnonymousSignIn(auth)}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-smooth shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99]"
              size="lg"
            >
              Sign In Anonymously
            </Button>

            <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-3 gap-2 text-left">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[11px] font-semibold text-primary">AI Insights</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">Forecasts and patterns</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[11px] font-semibold text-accent">Smart Budget</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">Dynamic alerts</p>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-[11px] font-semibold text-indigo-400">Anonymous</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">Secure instant login</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background grid-background">
        <Suspense fallback={<Loading />}>
          <Dashboard userId={user.uid} />
        </Suspense>
      </div>
    );
  };

  return <>{renderContent()}</>;
}
