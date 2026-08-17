import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { AuthForm } from "./AuthForm.jsx";
import { OrderHistory } from "./OrderHistory.jsx";

export default function AccountApp() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-surface-page">
      <header className="border-b border-border-subtle bg-surface-card px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between">
          <a href="/" className="font-display text-lg font-bold tracking-tight text-text-primary">
            aboustate<span className="text-accent">.</span>tech
          </a>
          <a
            href="/"
            className="font-body text-small text-text-secondary hover:text-text-accent"
          >
            &larr; Back to site
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] px-4 py-12 sm:px-6">
        {session === undefined ? (
          <p className="text-center font-body text-small text-text-secondary">Loading…</p>
        ) : session === null ? (
          <>
            <h1 className="mb-2 text-center font-display text-h2 font-bold tracking-tight text-text-primary">
              Sign in to track your requests
            </h1>
            <p className="mb-8 text-center font-body text-small text-text-secondary">
              Optional — you can always submit a request without an account.
            </p>
            <AuthForm />
          </>
        ) : (
          <OrderHistory user={session.user} onSignOut={handleSignOut} />
        )}
      </main>
    </div>
  );
}
