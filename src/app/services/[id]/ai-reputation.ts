'use server';

import { prisma } from '@/lib/prisma';
import { generateWithFallback } from '@/lib/gemini';

export async function summarizeProviderReputation(
    providerId: string
): Promise<{ summary?: string; error?: string }> {
    const provider = await prisma.user.findUnique({
        where: { id: providerId },
        select: {
            name: true,
            ratingAvg: true,
            ratingCount: true,
            reviewsReceived: {
                select: {
                    rating: true,
                    comment: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 15,
            },
        },
    });

    if (!provider) {
        return { error: 'Proveedor no encontrado.' };
    }

    if (provider.reviewsReceived.length === 0) {
        return { error: 'Este miembro aún no tiene valoraciones para analizar.' };
    }

    const formattedReviews = provider.reviewsReceived
        .map((r, i) => `- Reseña ${i + 1} (${r.rating}/5 estrellas): "${r.comment || 'Sin comentario escrito'}"`)
        .join('\n');

    try {
        const response = await generateWithFallback({
            contents: `Eres un analista de confianza para la plataforma de Banco de Tiempo ChronoShare.
Analiza las siguientes valoraciones recibidas por el usuario "${provider.name}" (nota media: ${provider.ratingAvg.toFixed(1)}/5 sobre ${provider.ratingCount} valoraciones):

${formattedReviews}

Redacta una síntesis objetiva, neutra y útil en español (de España) de máximo 3 frases que ayude a otros miembros a decidir si solicitar sus servicios. Destaca sus puntos fuertes recurrentes (puntualidad, claridad, trato, calidad) y menciona si existe algún aspecto a mejorar. No inventes datos que no estén en las reseñas.`,
        });

        if (!response.text) {
            return { error: 'No se pudo generar el resumen en este momento.' };
        }

        return { summary: response.text.trim() };
    } catch (err) {
        console.error('Error generando síntesis de reputación:', err);
        return { error: 'Error al conectar con Gemini. Inténtalo de nuevo en unos segundos.' };
    }
}