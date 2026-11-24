'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { ExchangeStatus } from '@prisma/client';

export async function sendMessage(exchangeId: string, formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const content = (formData.get('content') as string)?.trim();
    if (!content) return;

    const exchange = await prisma.exchange.findUnique({
        where: { id: exchangeId },
        select: { requesterId: true, providerId: true },
    });

    if (
        !exchange ||
        (exchange.requesterId !== user.id && exchange.providerId !== user.id)
    ) {
        redirect('/exchanges');
    }

    await prisma.message.create({
        data: {
            exchangeId,
            senderId: user.id,
            content,
        },
    });

    revalidatePath(`/exchanges/${exchangeId}`);
}

export async function submitReview(exchangeId: string, formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const rating = parseInt(formData.get('rating') as string, 10);
    const comment = (formData.get('comment') as string)?.trim() || null;

    if (isNaN(rating) || rating < 1 || rating > 5) return;

    await prisma.$transaction(async (tx) => {
        const exchange = await tx.exchange.findUnique({
            where: { id: exchangeId },
            include: { reviews: true },
        });

        if (
            !exchange ||
            exchange.status !== ExchangeStatus.COMPLETED ||
            (exchange.requesterId !== user.id && exchange.providerId !== user.id)
        ) {
            throw new Error('No se puede valorar este intercambio.');
        }

        // Evitar doble reseña del mismo autor en este intercambio
        const alreadyReviewed = exchange.reviews.some((r) => r.authorId === user.id);
        if (alreadyReviewed) return;

        const targetId =
            exchange.requesterId === user.id ? exchange.providerId : exchange.requesterId;

        // 1. Crear la reseña
        await tx.review.create({
            data: {
                exchangeId,
                authorId: user.id,
                targetId,
                rating,
                comment,
            },
        });

        // 2. Recalcular ratingAvg y ratingCount del usuario valorado
        const targetUser = await tx.user.findUnique({
            where: { id: targetId },
            select: { ratingAvg: true, ratingCount: true },
        });

        if (targetUser) {
            const newCount = targetUser.ratingCount + 1;
            const newAvg =
                (targetUser.ratingAvg * targetUser.ratingCount + rating) / newCount;

            await tx.user.update({
                where: { id: targetId },
                data: {
                    ratingCount: newCount,
                    ratingAvg: Number(newAvg.toFixed(2)),
                },
            });
        }
    });

    revalidatePath('/');
    revalidatePath(`/exchanges/${exchangeId}`);
}