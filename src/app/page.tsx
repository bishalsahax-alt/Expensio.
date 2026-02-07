'use client';

import { Suspense } from 'react';
import Header from '@/components/header';
import Dashboard from '@/components/dashboard';
import Loading from './loading';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const renderContent = () => {
    if (isUserLoading) {
      return <Loading />;
    }

    if (!user) {
      return (
        <div className="flex h-full flex-col items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">Expensio</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Please sign in to continue
            </p>
            <Button
              onClick={() => initiateAnonymousSignIn(auth)}
              className="mt-6"
            >
              Sign In Anonymously
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Suspense fallback={<Loading />}>
            <Dashboard userId={user.uid} />
          </Suspense>
        </main>
      </div>
    );
  };

  return <>{renderContent()}</>;
}
