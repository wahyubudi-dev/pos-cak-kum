import { Suspense } from "react";

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-pearl px-6 py-14">
      <div className="w-full max-w-sm">
        <Suspense>
          <LoginForm redirectTo={redirectTo} errorMessage={error} />
        </Suspense>
      </div>
    </main>
  );
}
