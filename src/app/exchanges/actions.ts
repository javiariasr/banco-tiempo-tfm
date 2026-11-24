'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { ExchangeStatus, TransactionType } from '@prisma/client';

// 1. El proveedor acepta la solicitud (pasa de PENDING a ACCEPTED)
export async function acceptExchange(exchangeId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const exchange = await prisma.exchange.findUnique({
        where: { id: exchangeId },
    });

    if (
        !exchange ||
        exchange.providerId !== user.id ||
        exchange.status !== ExchangeStatus.PENDING
    ) {
        redirect('/exchanges');
    }

    await prisma.exchange.update({
        where: { id: exchangeId },
        data: { status: ExchangeStatus.ACCEPTED },
    });

    revalidatePath('/', 'layout');
    revalidatePath(`/exchanges/${exchangeId}`);
}

// 2. El solicitante confirma que el servicio se realizó (pasa a COMPLETED y transfiere horas)
export async function completeExchange(exchangeId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    await prisma.$transaction(async (tx) => {
        const exchange = await tx.exchange.findUnique({
            where: { id: exchangeId },
            include: { service: { select: { title: true } } },
        });

        if (
            !exchange ||
            exchange.requesterId !== user.id ||
            (exchange.status !== ExchangeStatus.PENDING &&
                exchange.status !== ExchangeStatus.ACCEPTED)
        ) {
            throw new Error('No se puede completar este intercambio.');
        }

        // a) Liberar horas retenidas del solicitante
        await tx.user.update({
            where: { id: exchange.requesterId },
            data: { heldHours: { decrement: exchange.hoursAmount } },
        });

        // b) Acreditar horas disponibles al proveedor
        await tx.user.update({
            where: { id: exchange.providerId },
            data: { availableHours: { increment: exchange.hoursAmount } },
        });

        // c) Marcar intercambio como COMPLETED
        await tx.exchange.update({
            where: { id: exchangeId },
            data: { status: ExchangeStatus.COMPLETED },
        });

        // d) Registrar ambos asientos contables en el libro mayor
        await tx.transaction.createMany({
            data: [
                {
                    userId: exchange.requesterId,
                    exchangeId: exchange.id,
                    type: TransactionType.EXPENSE,
                    amount: exchange.hoursAmount,
                    description: `Pago completado por: ${exchange.service.title}`,
                },
                {
                    userId: exchange.providerId,
                    exchangeId: exchange.id,
                    type: TransactionType.INCOME,
                    amount: exchange.hoursAmount,
                    description: `Cobro recibido por: ${exchange.service.title}`,
                },
            ],
        });
    });

    revalidatePath('/', 'layout');
    revalidatePath(`/exchanges/${exchangeId}`);
}

// 3. Cancelación por cualquiera de las partes (pasa a CANCELLED y devuelve horas retenidas)
export async function cancelExchange(exchangeId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    await prisma.$transaction(async (tx) => {
        const exchange = await tx.exchange.findUnique({
            where: { id: exchangeId },
            include: { service: { select: { title: true } } },
        });

        if (
            !exchange ||
            (exchange.requesterId !== user.id && exchange.providerId !== user.id) ||
            (exchange.status !== ExchangeStatus.PENDING &&
                exchange.status !== ExchangeStatus.ACCEPTED)
        ) {
            throw new Error('No se puede cancelar este intercambio.');
        }

        // a) Devolver horas de heldHours a availableHours al solicitante
        await tx.user.update({
            where: { id: exchange.requesterId },
            data: {
                heldHours: { decrement: exchange.hoursAmount },
                availableHours: { increment: exchange.hoursAmount },
            },
        });

        // b) Marcar como CANCELLED
        await tx.exchange.update({
            where: { id: exchangeId },
            data: { status: ExchangeStatus.CANCELLED },
        });

        // c) Registrar liberación Escrow en Transaction
        await tx.transaction.create({
            data: {
                userId: exchange.requesterId,
                exchangeId: exchange.id,
                type: TransactionType.ESCROW_RELEASE,
                amount: exchange.hoursAmount,
                description: `Devolución Escrow por cancelación: ${exchange.service.title}`,
            },
        });
    });

    revalidatePath('/', 'layout');
    revalidatePath(`/exchanges/${exchangeId}`);
}