"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  /**
   * Path to return to after the OAuth round trip completes. Defaults to
   * /menu when omitted, matching PRD AUTH-04.
   */
  redirectTo?: string;
  /**
   * Surface-level error message from a previous OAuth attempt, passed
   * through the URL by the auth callback when something fails.
   */
  errorMessage?: string;
};

const FALLBACK_REDIRECT = "/menu";

export function LoginForm({ redirectTo, errorMessage }: LoginFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setIsPending(true);
    setLocalError(null);

    const supabase = createClient();
    const next = redirectTo ?? FALLBACK_REDIRECT;
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          // Force account chooser so users can pick the right Google account
          // even if they're already signed in to one.
          prompt: "select_account",
        },
      },
    });

    if (error) {
      setLocalError(error.message);
      setIsPending(false);
    }
    // On success Supabase redirects the browser; no need to clear isPending.
  }

  const displayedError = localError ?? errorMessage ?? null;

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-7 shadow-subtle">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Masuk ke Kedai Cak Kum
        </h1>
        <p className="text-sm text-muted-foreground">
          Pakai akun Google kamu untuk pesan dan simpan pesanan favorit.
        </p>
      </header>

      <Button
        type="button"
        onClick={signInWithGoogle}
        disabled={isPending}
        className="w-full"
        size="cta"
            variant="primary"
          >
        {isPending ? "Mengarahkan ke Google..." : "Lanjutkan dengan Google"}
      </Button>

      {displayedError ? (
        <p
          role="alert"
          className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {displayedError}
        </p>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        Dengan masuk, kamu setuju agar pesanan dan profil dasar disimpan untuk
        kebutuhan pemesanan.
      </p>
    </div>
  );
}
