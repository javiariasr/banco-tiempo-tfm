import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import NewServiceForm from './NewServiceForm';

async function FormContent({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    await connection();
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

            <NewServiceForm serverError={error} />
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