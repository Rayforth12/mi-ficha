"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-card border border-line rounded-2xl p-8 text-center">
          <h1 className="font-display font-bold text-2xl mb-3">¡Listo! 🎉</h1>
          <p className="text-inksoft text-sm mb-6">
            Te enviamos un correo de confirmación a <b>{email}</b>. Confirmá tu
            cuenta y después iniciá sesión.
          </p>
          <Link href="/login" className="text-green font-semibold">
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-card border border-line rounded-2xl p-8">
        <h1 className="font-display font-bold text-3xl mb-1">Creá tu cuenta</h1>
        <p className="text-inksoft text-sm mb-6">
          Cada persona ve solo sus propios movimientos.
        </p>

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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-line bg-white focus:outline-gold"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {error && <p className="text-red text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-green text-white font-semibold py-2.5 rounded-lg disabled:opacity-50"
          >
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <p className="text-sm text-inksoft mt-6 text-center">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-green font-semibold">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
