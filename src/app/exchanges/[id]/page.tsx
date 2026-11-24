import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { ExchangeStatus } from '@prisma/client';
import Navbar from '@/components/Navbar';
import { acceptExchange, completeExchange, cancelExchange } from '../actions';
import { sendMessage, submitReview } from './actions';

const STATUS_BADGES: Record<ExchangeStatus, { label: string; style: string }> = {
    PENDING: { label: '⏳ Pendiente (Horas retenidas)', style: 'bg-amber-100 text-amber-800' },
    ACCEPTED: { label: '🤝 Aceptado', style: 'bg-blue-100 text-blue-800' },
    COMPLETED: { label: '✅ Completado', style: 'bg-emerald-100 text-emerald-800' },
    CANCELLED: { label: '❌ Cancelado', style: 'bg-slate-100 text-slate-600' },
    DISPUTED: { label: '⚠️ En disputa', style: 'bg-red-100 text-red-800' },
};

async function ExchangeRoomContent({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const exchange = await prisma.exchange.findUnique({
        where: { id },
        include: {
            service: true,
            requester: { select: { id: true, name: true } },
            provider: { select: { id: true, name: true } },
            messages: {
                include: { sender: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'asc' },
            },
            reviews: {
                include: { author: { select: { name: true } } },
            },
        },
    });

    if (!exchange) notFound();

    if (exchange.requesterId !== user.id && exchange.providerId !== user.id) {
        redirect('/exchanges');
    }

    const isRequester = exchange.requesterId === user.id;
    const isProvider = exchange.providerId === user.id;
    const badge = STATUS_BADGES[exchange.status];
    const isActive =
        exchange.status === ExchangeStatus.PENDING ||
        exchange.status === ExchangeStatus.ACCEPTED;

    const myReview = exchange.reviews.find((r) => r.authorId === user.id);
    const otherUserName = isRequester ? exchange.provider.name : exchange.requester.name;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <Link href="/exchanges" className="text-sm text-indigo-600 hover:underline">
                    ← Volver a Mis Intercambios
                </Link>
            </div>

            {/* Cabecera del intercambio y botones Escrow */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${badge.style}`}>
                            {badge.label}
                        </span>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 pt-1">
                            {exchange.service.title}
                        </h1>
                        <p className="text-sm text-slate-500">
                            {isRequester
                                ? `Proveedor: ${exchange.provider.name}`
                                : `Solicitante: ${exchange.requester.name}`}
                            {' · '}
                            <span className="font-semibold text-indigo-600">
                                {exchange.hoursAmount.toFixed(1)} horas en juego
                            </span>
                        </p>
                    </div>

                    {isActive && (
                        <div className="flex flex-wrap gap-2">
                            {isProvider && exchange.status === ExchangeStatus.PENDING && (
                                <form action={acceptExchange.bind(null, exchange.id)}>
                                    <button
                                        type="submit"
                                        className="bg-indigo-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                                    >
                                        ✓ Aceptar solicitud
                                    </button>
                                </form>
                            )}

                            {isRequester && (
                                <form action={completeExchange.bind(null, exchange.id)}>
                                    <button
                                        type="submit"
                                        className="bg-emerald-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                                    >
                                        ✅ Confirmar entrega y pagar
                                    </button>
                                </form>
                            )}

                            <form action={cancelExchange.bind(null, exchange.id)}>
                                <button
                                    type="submit"
                                    className="bg-white border border-slate-300 text-slate-700 text-xs font-medium px-4 py-2 rounded-lg hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                                >
                                    Cancelar
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Bloque de Valoración (solo visible cuando el intercambio está COMPLETED) */}
            {exchange.status === ExchangeStatus.COMPLETED && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                    <h2 className="text-base font-bold text-slate-900">
                        Valoración de la experiencia con {otherUserName}
                    </h2>

                    {myReview ? (
                        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                            <p className="text-xs font-semibold text-emerald-800">
                                Tu valoración enviada: {'⭐'.repeat(myReview.rating)}
                            </p>
                            {myReview.comment && (
                                <p className="text-sm text-slate-700">{myReview.comment}</p>
                            )}
                        </div>
                    ) : (
                        <form action={submitReview.bind(null, exchange.id)} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700">
                                        Puntuación (1 a 5)
                                    </label>
                                    <select
                                        name="rating"
                                        defaultValue="5"
                                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                                    >
                                        <option value="5">⭐⭐⭐⭐⭐ (5 - Excelente)</option>
                                        <option value="4">⭐⭐⭐⭐ (4 - Muy bien)</option>
                                        <option value="3">⭐⭐⭐ (3 - Correcto)</option>
                                        <option value="2">⭐⭐ (2 - Mejorable)</option>
                                        <option value="1">⭐ (1 - Mala experiencia)</option>
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-slate-700">
                                        Comentario sobre el intercambio
                                    </label>
                                    <input
                                        name="comment"
                                        type="text"
                                        required
                                        placeholder={`¿Cómo fue la sesión con ${otherUserName}?`}
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="bg-indigo-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                            >
                                Publicar valoración
                            </button>
                        </form>
                    )}
                </div>
            )}

            {/* Chat interno del intercambio */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <h2 className="text-base font-bold text-slate-900">
                    Chat de coordinación con {otherUserName}
                </h2>

                <div className="space-y-3 max-h-96 overflow-y-auto p-4 bg-slate-50 rounded-xl border border-slate-100">
                    {exchange.messages.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">
                            Aún no hay mensajes. Escribe abajo para acordar día, hora o enlace de reunión.
                        </p>
                    ) : (
                        exchange.messages.map((msg) => {
                            const isMine = msg.senderId === user.id;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col max-w-[80%] ${isMine ? 'ml-auto items-end' : 'mr-auto items-start'
                                        }`}
                                >
                                    <span className="text-[11px] text-slate-400 mb-1">
                                        {isMine ? 'Tú' : msg.sender.name}
                                    </span>
                                    <div
                                        className={`px-4 py-2.5 rounded-2xl text-sm ${isMine
                                                ? 'bg-indigo-600 text-white rounded-br-xs'
                                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <form action={sendMessage.bind(null, exchange.id)} className="flex gap-2">
                    <input
                        name="content"
                        type="text"
                        required
                        placeholder="Escribe un mensaje para coordinar el servicio..."
                        className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition cursor-pointer"
                    >
                        Enviar
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ExchangeRoomPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
                <Navbar />
            </Suspense>

            <main className="px-4 py-8">
                <Suspense
                    fallback={
                        <div className="text-center text-sm text-slate-500">
                            Cargando sala de intercambio...
                        </div>
                    }
                >
                    <ExchangeRoomContent params={params} />
                </Suspense>
            </main>
        </div>
    );
}