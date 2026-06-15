"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type LoginFormProps = {
  redirectTo?: string;
  errorMessage?: string;
};

export function LoginForm({ redirectTo, errorMessage }: LoginFormProps) {
  const router = useRouter();
  const next = redirectTo ?? "/menu";

  const signInWithGoogle = useCallback(() => {
    const params = new URLSearchParams({ next });
    router.push(`/auth/signin?${params}`);
  }, [next, router]);

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
        className="w-full rounded-2xl"
        size="cta"
        variant="primary"
      >
        Lanjutkan dengan Google
      </Button>

      {errorMessage ? (
        <p
          role="alert"
          className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}

      <p className="text-center text-xs text-zinc-500-x leading-relaxed">
        Dengan masuk, kamu setuju agar pesanan dan profil dasar disimpan untuk
        kebutuhan pemesanan.
      </p>
    </div>
  );
}
