"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/");
      } else {
        setAuthReady(true);
      }
    });
  }, [router]);

  async function signIn() {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage("メールアドレスかパスワードが間違っています。");
      return;
    }
    router.replace("/");
  }

  if (!authReady) {
    return <main className="min-h-screen bg-white" />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <section className="w-full max-w-sm space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Home Budget</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">ログイン</h1>
        </div>
        <input className="h-12 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-emerald-600" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="h-12 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-emerald-600" type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="h-12 w-full rounded-xl bg-zinc-900 text-sm font-semibold text-white" onClick={signIn}>ログイン</button>
        <p className="text-xs text-zinc-500">{message}</p>
      </section>
    </main>
  );
}
