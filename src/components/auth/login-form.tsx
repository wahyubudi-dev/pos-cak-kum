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
    <div className="flex flex-col gap-6 rounded-3xl border border-mist bg-white p-7 shadow-subtle">
      <header className="flex flex-col gap-2 text-center">
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: "var(--color-brand-teal)" }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={1.5}
            className="h-6 w-6"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </span>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-midnight-ink">
          Masuk ke Kedai Cak Kum
        </h1>
        <p className="text-sm text-zinc-500-x">
          Pakai akun Google kamu untuk pesan dan simpan pesanan favorit.
        </p>
      </header>

      <Button
        type="button"
        onClick={signInWithGoogle}
        disabled={isPending}
        className="w-full rounded-2xl"
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

      <p className="text-center text-xs text-zinc-500-x leading-relaxed">
        Dengan masuk, kamu setuju agar pesanan dan profil dasar disimpan untuk
        kebutuhan pemesanan.
      </p>
    </div>
  );
}
