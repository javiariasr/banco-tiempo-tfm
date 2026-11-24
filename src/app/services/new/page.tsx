import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import { createService } from './actions';

const CATEGORIES = ['Académico', 'Idiomas', 'Tecnología', 'Hogar', 'Otros'];

async function FormContent({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { error } = await searchParams;

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
            <div>
                <Link href="/" className="text-sm text-indigo-600 hover:underline">
                    ← Volver al catálogo
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 mt-2">Publicar un nuevo servicio</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Ofrece tus conocimientos o ayuda a la comunidad y gana horas en tu monedero.
                </p>
            </div>

            {/* Espacio reservado para el Asistente de IA (Fase 5) */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-indigo-900">
                        ✨ Asistente de Redacción con IA (Próximamente)
                    </p>
                    <p className="text-xs text-indigo-700 mt-0.5">
                        En la Fase 5 podrás escribir una idea breve y Gemini redactará el anuncio completo por ti.
                    </p>
                </div>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    {error}
                </div>
            )}

            <form action={createService} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Título del servicio</label>
                    <input
                        name="title"
                        type="text"
                        required
                        maxLength={100}
                        placeholder="Ej. Clases particulares de SQL y bases de datos"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Descripción detallada</label>
                    <textarea
                        name="description"
                        required
                        rows={4}
                        placeholder="Explica qué incluye tu servicio, nivel recomendado, herramientas que usáis..."
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Categoría</label>
                        <select
                            name="category"
                            defaultValue="Tecnología"
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Duración / Coste (horas)</label>
                        <select
                            name="hoursCost"
                            defaultValue="1.0"
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="0.5">0.5 horas (30 min)</option>
                            <option value="1.0">1.0 hora</option>
                            <option value="1.5">1.5 horas</option>
                            <option value="2.0">2.0 horas</option>
                            <option value="3.0">3.0 horas</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Modalidad</label>
                        <select
                            name="modality"
                            defaultValue="ONLINE"
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="ONLINE">💻 Online</option>
                            <option value="IN_PERSON">📍 Presencial</option>
                        </select>
                    </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                    <Link
                        href="/"
                        className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        Publicar servicio
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function NewServicePage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
                <Navbar />
            </Suspense>

            <main className="px-4 py-8">
                <Suspense fallback={<div className="text-center text-sm text-slate-500">Cargando formulario...</div>}>
                    <FormContent searchParams={searchParams} />
                </Suspense>
            </main>
        </div>
    );
}