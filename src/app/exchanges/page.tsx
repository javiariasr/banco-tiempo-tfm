import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { ExchangeStatus, TransactionType } from '@prisma/client';
import Navbar from '@/components/Navbar';
import { acceptExchange, completeExchange, cancelExchange } from './actions';

const STATUS_BADGES: Record<ExchangeStatus, { label: string; style: string }> = {
    PENDING: { label: '⏳ Pendiente (Escrow)', style: 'bg-amber-100 text-amber-800' },
    ACCEPTED: { label: '🤝 Aceptado', style: 'bg-blue-100 text-blue-800' },
    COMPLETED: { label: '✅ Completado', style: 'bg-emerald-100 text-emerald-800' },
    CANCELLED: { label: '❌ Cancelado', style: 'bg-slate-100 text-slate-600' },
    DISPUTED: { label: '⚠️ En disputa', style: 'bg-red-100 text-red-800' },
};

const TX_LABELS: Record<TransactionType, { label: string; sign: string; color: string }> = {
    WELCOME_BONUS: { label: 'Bono bienvenida', sign: '+', color: 'text-emerald-600' },
    ESCROW_HOLD: { label: 'Retención Escrow', sign: '-', color: 'text-amber-600' },
    ESCROW_RELEASE: { label: 'Liberación Escrow', sign: '+', color: 'text-blue-600' },
    INCOME: { label: 'Horas ganadas', sign: '+', color: 'text-emerald-600' },
    EXPENSE: { label: 'Horas gastadas', sign: '-', color: 'text-red-600' },
};

async function ExchangesDashboard() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const [dbUser, exchanges, transactions] = await Promise.all([
        prisma.user.findUnique({
            where: { id: user.id },
            select: { availableHours: true, heldHours: true },
        }),
        prisma.exchange.findMany({
            where: {
                OR: [{ requesterId: user.id }, { providerId: user.id }],
            },
            include: {
                service: { select: { title: true, modality: true } },
                requester: { select: { id: true, name: true } },
                provider: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.transaction.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 15,
        }),
    ]);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Cabecera y Resumen de Monedero */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Mis Intercambios y Monedero</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Gestiona tus solicitudes activas, confirma entregas y consulta tus movimientos de tiempo.
                    </p>
                </div>

                {dbUser && (
                    <div className="flex gap-3">
                        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                            <p className="text-xs text-slate-500">Saldo disponible</p>
                            <p className="text-xl font-bold text-indigo-600">
                                {dbUser.availableHours.toFixed(1)}h
                            </p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                            <p className="text-xs text-slate-500">Retenido (Escrow)</p>
                            <p className="text-xl font-bold text-amber-600">
                                {dbUser.heldHours.toFixed(1)}h
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna izquierda (2/3): Listado de Intercambios */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold text-slate-900">Actividad de Intercambios</h2>

                    {exchanges.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
                            <p className="text-slate-600 font-medium">Aún no tienes intercambios.</p>
                            <Link href="/" className="text-sm text-indigo-600 hover:underline inline-block">
                                Explorar el catálogo de servicios →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {exchanges.map((ex) => {
                                const isRequester = ex.requesterId === user.id;
                                const isProvider = ex.providerId === user.id;
                                const badge = STATUS_BADGES[ex.status];
                                const isActive =
                                    ex.status === ExchangeStatus.PENDING ||
                                    ex.status === ExchangeStatus.ACCEPTED;

                                return (
                                    <div
                                        key={ex.id}
                                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <span
                                                    className={`text-xs font-semibold px-2.5 py-1 rounded-md ${badge.style}`}
                                                >
                                                    {badge.label}
                                                </span>
                                                <h3 className="text-base font-bold text-slate-900 mt-2">
                                                    {ex.service.title}
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {isRequester
                                                        ? `Solicitado a ${ex.provider.name}`
                                                        : `Solicitado por ${ex.requester.name}`}
                                                    {' · '}
                                                    <span className="font-semibold text-slate-700">
                                                        {ex.hoursAmount.toFixed(1)} horas
                                                    </span>
                                                </p>
                                            </div>

                                            <Link
                                                href={`/exchanges/${ex.id}`}
                                                className="text-xs font-semibold bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition"
                                            >
                                                💬 Abrir sala / Chat
                                            </Link>
                                        </div>

                                        {/* Botones de acción según el rol y estado */}
                                        {isActive && (
                                            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                                                {isProvider && ex.status === ExchangeStatus.PENDING && (
                                                    <form action={acceptExchange.bind(null, ex.id)}>
                                                        <button
                                                            type="submit"
                                                            className="bg-indigo-600 text-white text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                                                        >
                                                            ✓ Aceptar solicitud
                                                        </button>
                                                    </form>
                                                )}

                                                {isRequester && (
                                                    <form action={completeExchange.bind(null, ex.id)}>
                                                        <button
                                                            type="submit"
                                                            className="bg-emerald-600 text-white text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                                                        >
                                                            ✅ Confirmar servicio realizado (Liberar pago)
                                                        </button>
                                                    </form>
                                                )}

                                                <form action={cancelExchange.bind(null, ex.id)}>
                                                    <button
                                                        type="submit"
                                                        className="bg-white border border-slate-300 text-slate-700 text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition cursor-pointer"
                                                    >
                                                        Cancelar intercambio
                                                    </button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Columna derecha (1/3): Libro Contable */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900">Extracto de Horas</h2>

                    <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-2xs">
                        {transactions.length === 0 ? (
                            <p className="p-6 text-sm text-slate-500">Sin movimientos registrados.</p>
                        ) : (
                            transactions.map((tx) => {
                                const meta = TX_LABELS[tx.type];
                                return (
                                    <div key={tx.id} className="p-4 flex items-start justify-between gap-3">
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-semibold text-slate-800">{meta.label}</p>
                                            <p className="text-xs text-slate-500 line-clamp-2">{tx.description}</p>
                                            <p className="text-[11px] text-slate-400">
                                                {new Date(tx.createdAt).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                        <span className={`text-sm font-bold whitespace-nowrap ${meta.color}`}>
                                            {meta.sign}
                                            {tx.amount.toFixed(1)}h
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ExchangesPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
                <Navbar />
            </Suspense>

            <main className="px-4 py-8">
                <Suspense
                    fallback={
                        <div className="text-center text-sm text-slate-500">
                            Cargando tus intercambios y movimientos...
                        </div>
                    }
                >
                    <ExchangesDashboard />
                </Suspense>
            </main>
        </div>
    );
}