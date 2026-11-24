'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

export async function login(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        redirect('/login?error=' + encodeURIComponent(error.message));
    }

    revalidatePath('/', 'layout');
    redirect('/');
}

export async function signup(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const universityOrArea = (formData.get('universityOrArea') as string) || null;

    // 1. Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error || !data.user) {
        redirect('/login?error=' + encodeURIComponent(error?.message || 'Error al registrar usuario'));
    }

    // 2. Crear perfil en Prisma + bono inicial de 2.0 horas (transacción atómica)
    await prisma.$transaction(async (tx) => {
        await tx.user.create({
            data: {
                id: data.user!.id, // Mismo UUID que en Supabase Auth
                email,
                name,
                universityOrArea,
                availableHours: 2.0,
                heldHours: 0.0,
            },
        });

        await tx.transaction.create({
            data: {
                userId: data.user!.id,
                type: TransactionType.WELCOME_BONUS,
                amount: 2.0,
                description: 'Bono de bienvenida por registro en ChronoShare',
            },
        });
    });

    revalidatePath('/', 'layout');
    redirect('/');
}

export async function signout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    redirect('/login');
}