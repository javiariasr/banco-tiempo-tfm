'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { ServiceStatus, ExchangeStatus, TransactionType } from '@prisma/client';

export async function toggleServiceStatus(serviceId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { providerId: true, status: true },
    });

    if (!service || service.providerId !== user.id) {
        redirect('/');
    }

    const nextStatus =
        service.status === ServiceStatus.ACTIVE
            ? ServiceStatus.PAUSED
            : ServiceStatus.ACTIVE;

    await prisma.service.update({
        where: { id: serviceId },
        data: { status: nextStatus },
    });

    revalidatePath('/');
    revalidatePath(`/services/${serviceId}`);
}

export async function requestExchange(serviceId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const service = await prisma.service.findUnique({
        where: { id: serviceId },
    });

    if (!service || service.status !== ServiceStatus.ACTIVE || service.providerId === user.id) {
        redirect(`/services/${serviceId}`);
    }

    // Transacción atómica Escrow: verifica saldo, retiene horas, crea Exchange y registra movimiento
    const exchange = await prisma.$transaction(async (tx) => {
        const requester = await tx.user.findUnique({
            where: { id: user.id },
            select: { availableHours: true },
        });

        if (!requester || requester.availableHours < service.hoursCost) {
            throw new Error('Saldo insuficiente para solicitar este servicio.');
        }

        // 1. Mover horas de disponibles a retenidas (Escrow)
        await tx.user.update({
            where: { id: user.id },
            data: {
                availableHours: { decrement: service.hoursCost },
                heldHours: { increment: service.hoursCost },
            },
        });

        // 2. Crear el intercambio en estado PENDING
        const newExchange = await tx.exchange.create({
            data: {
                serviceId: service.id,
                requesterId: user.id,
                providerId: service.providerId,
                hoursAmount: service.hoursCost,
                status: ExchangeStatus.PENDING,
            },
        });

        // 3. Registrar asiento contable de retención
        await tx.transaction.create({
            data: {
                userId: user.id,
                exchangeId: newExchange.id,
                type: TransactionType.ESCROW_HOLD,
                amount: service.hoursCost,
                description: `Retención Escrow por solicitud: ${service.title}`,
            },
        });

        return newExchange;
    });

    revalidatePath('/', 'layout');
    redirect(`/exchanges/${exchange.id}`);
}