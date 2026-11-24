import { Suspense } from 'react';
import { login, signup } from './actions';

async function ErrorBanner({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;

    if (!error) return null;

    return (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
        </div>
    );
}

export default function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900">ChronoShare ⏳</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Intercambia talento por tiempo. Empieza con 2.0 horas gratis.
                    </p>
                </div>

                <Suspense fallback={null}>
                    <ErrorBanner searchParams={searchParams} />
                </Suspense>

                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            placeholder="tu.nombre@uni.es"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                        <input
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            placeholder="••••••••"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-3">
                        <p className="text-xs text-slate-400">
                            Si aún no tienes cuenta, completa también estos dos campos y pulsa &quot;Crear cuenta&quot;:
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Nombre completo</label>
                            <input
                                name="name"
                                type="text"
                                placeholder="Ej. Javier Arias"
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Campus o Barrio (opcional)
                            </label>
                            <input
                                name="universityOrArea"
                                type="text"
                                placeholder="Ej. Campus Moncloa"
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            formAction={login}
                            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                        >
                            Entrar
                        </button>
                        <button
                            formAction={signup}
                            className="flex-1 bg-slate-100 text-slate-800 py-2 px-4 rounded-lg text-sm font-medium hover:bg-slate-200 transition"
                        >
                            Crear cuenta
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}