"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : error.message
      );
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-card border border-line rounded-2xl p-8">
        <h1 className="font-display font-bold text-3xl mb-1">Mi Planificador</h1>
        <p className="text-inksoft text-sm mb-6">Entrá para ver tus cuentas.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-inksoft mb-1">
              Correo
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-line bg-white focus:outline-gold"
              placeholder="vos@correo.com"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-inksoft mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-line bg-white focus:outline-gold"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-green text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="text-sm text-inksoft mt-6 text-center">
          ¿Todavía no tenés cuenta?{" "}
          <Link href="/register" className="text-green font-semibold">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
