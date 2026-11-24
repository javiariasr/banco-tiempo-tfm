import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { ServiceModality, ServiceStatus } from '@prisma/client';
import Navbar from '@/components/Navbar';
import { toggleServiceStatus } from './actions';

async function ServiceDetailContent({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const service = await prisma.service.findUnique({
        where: { id },
        include: {
            provider: {
                include: {
                    reviewsReceived: {
                        include: {
                            author: { select: { name: true } },
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    },
                },
            },
        },
    });

    if (!service) {
        notFound();
    }

    const supabase = await createClient();
    const {
        data: { user: authUser },
    } = await supabase.auth.getUser();

    const currentUser = authUser
        ? await prisma.user.findUnique({
            where: { id: authUser.id },
            select: { id: true, availableHours: true },
        })
        : null;

    const isOwner = currentUser?.id === service.providerId;
    const hasEnoughHours = (currentUser?.availableHours ?? 0) >= service.hoursCost;

    const toggleAction = toggleServiceStatus.bind(null, service.id);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <Link href="/" className="text-sm text-indigo-600 hover:underline">
                    ← Volver al Marketplace
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna principal: Detalle del servicio */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700">
                            {service.category}
                        </span>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                            {service.modality === ServiceModality.ONLINE ? '💻 Online' : '📍 Presencial'}
                        </span>
                        {service.status === ServiceStatus.PAUSED && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-100 text-amber-800">
                                ⏸ Pausado
                            </span>
                        )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{service.title}</h1>

                    <div className="prose prose-slate max-w-none">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                            Descripción del servicio
                        </h3>
                        <p className="text-slate-600 whitespace-pre-line mt-2 leading-relaxed">
                            {service.description}
                        </p>
                    </div>

                    {/* Reseñas del proveedor */}
                    <div className="pt-6 border-t border-slate-100 space-y-4">
                        <h3 className="text-base font-bold text-slate-900">
                            Valoraciones de {service.provider.name} ({service.provider.ratingCount})
                        </h3>

                        {service.provider.reviewsReceived.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                Este miembro aún no tiene valoraciones registradas.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {service.provider.reviewsReceived.map((review) => (
                                    <div
                                        key={review.id}
                                        className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1"
                                    >
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-slate-800">{review.author.name}</span>
                                            <span className="text-amber-600 font-medium">{'⭐'.repeat(review.rating)}</span>
                                        </div>
                                        {review.comment && (
                                            <p className="text-sm text-slate-600">{review.comment}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Columna lateral: Tarjeta de acción y perfil */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm text-slate-500">Coste del servicio</span>
                            <span className="text-2xl font-bold text-indigo-600">
                                {service.hoursCost.toFixed(1)} horas
                            </span>
                        </div>

                        {isOwner ? (
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <p className="text-xs text-slate-500">Este servicio es tuyo.</p>
                                <form action={toggleAction}>
                                    <button
                                        type="submit"
                                        className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition ${service.status === ServiceStatus.ACTIVE
                                                ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                            }`}
                                    >
                                        {service.status === ServiceStatus.ACTIVE
                                            ? '⏸ Pausar anuncio'
                                            : '▶ Reactivar anuncio'}
                                    </button>
                                </form>
                            </div>
                        ) : !currentUser ? (
                            <Link
                                href="/login"
                                className="block w-full text-center bg-indigo-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                            >
                                Inicia sesión para solicitar
                            </Link>
                        ) : (
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <div className="text-xs text-slate-500 flex justify-between">
                                    <span>Tu saldo disponible:</span>
                                    <span className="font-semibold text-slate-800">
                                        {currentUser.availableHours.toFixed(1)}h
                                    </span>
                                </div>

                                {hasEnoughHours ? (
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full bg-indigo-600/90 text-white py-2.5 px-4 rounded-lg text-sm font-medium cursor-not-allowed"
                                        title="Se activará en la Fase 4 con el motor Escrow"
                                    >
                                        Solicitar intercambio (Fase 4)
                                    </button>
                                ) : (
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700">
                                        No tienes horas suficientes. Publica un servicio para ganar más tiempo.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Ficha del proveedor */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Ofrecido por
                        </h3>
                        <div>
                            <p className="font-bold text-slate-900">{service.provider.name}</p>
                            {service.provider.universityOrArea && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                    📍 {service.provider.universityOrArea}
                                </p>
                            )}
                            <p className="text-xs text-slate-600 mt-1">
                                {service.provider.ratingCount > 0
                                    ? `⭐ ${service.provider.ratingAvg.toFixed(1)} (${service.provider.ratingCount} valoraciones)`
                                    : 'Sin valoraciones todavía'}
                            </p>
                        </div>
                        {service.provider.bio && (
                            <p className="text-xs text-slate-600 pt-2 border-t border-slate-100 leading-relaxed">
                                {service.provider.bio}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ServiceDetailPage({
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
                <Suspense fallback={<div className="text-center text-sm text-slate-500">Cargando ficha del servicio...</div>}>
                    <ServiceDetailContent params={params} />
                </Suspense>
            </main>
        </div>
    );
}