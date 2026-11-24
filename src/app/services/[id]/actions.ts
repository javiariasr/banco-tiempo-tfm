'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { ServiceStatus } from '@prisma/client';

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