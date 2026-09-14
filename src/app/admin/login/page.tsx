"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";
import Logo from "@/components/Logo";

const initialState = { error: "" };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface border border-[var(--border)] rounded-xl p-8 shadow-sm">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h1 className="text-center font-heading font-bold text-lg mb-6">
          تسجيل الدخول إلى لوحة التحكم
        </h1>
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              name="email"
              required
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">كلمة المرور</label>
            <input
              type="password"
              name="password"
              required
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-brand text-white rounded-lg py-2.5 font-heading font-bold hover:bg-brand-dark transition disabled:opacity-60"
          >
            {pending ? "جارٍ الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
