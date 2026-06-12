import { Suspense } from "react";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

type SearchParams = Promise<{
  redirectTo?: string;
  error?: string;
}>;

export const metadata = {
  title: "Masuk · Kedai Cak Kum",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { redirectTo, error } = await searchParams;

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-pearl px-6">
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -left-48 -top-48 h-[26rem] w-[26rem] rounded-full opacity-20"
        style={{ background: "var(--color-mint-wash)" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[22rem] w-[22rem] rounded-full opacity-15"
        style={{ background: "var(--color-brand-teal)" }}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm">
        <Suspense>
          <LoginForm redirectTo={redirectTo} errorMessage={error} />
        </Suspense>

        <p className="mt-6 text-center text-xs text-fog-gray">
          <Link href="/" className="underline-offset-2 hover:underline">
            Kembali ke beranda
          </Link>
        </p>
      </div>
    </main>
  );
}
