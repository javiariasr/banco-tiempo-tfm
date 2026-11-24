'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { ServiceModality } from '@prisma/client';

export async function createService(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const title = (formData.get('title') as string).trim();
    const description = (formData.get('description') as string).trim();
    const category = formData.get('category') as string;
    const hoursCost = parseFloat(formData.get('hoursCost') as string);
    const modality =
        formData.get('modality') === 'IN_PERSON'
            ? ServiceModality.IN_PERSON
            : ServiceModality.ONLINE;

    if (!title || !description || isNaN(hoursCost) || hoursCost <= 0) {
        redirect('/services/new?error=' + encodeURIComponent('Por favor, revisa los datos del formulario.'));
    }

    await prisma.service.create({
        data: {
            title,
            description,
            category,
            hoursCost,
            modality,
            providerId: user.id,
        },
    });

    revalidatePath('/');
    redirect('/');
}