'use server';

import { Type } from '@google/genai';
import { generateWithFallback } from '@/lib/gemini';
import { createClient } from '@/utils/supabase/server';

export interface GeneratedServiceDraft {
    title: string;
    description: string;
    category: 'Académico' | 'Idiomas' | 'Tecnología' | 'Hogar' | 'Otros';
    hoursCost: '0.5' | '1.0' | '1.5' | '2.0' | '3.0';
}

export async function generateServiceWithAI(
    idea: string
): Promise<{ data?: GeneratedServiceDraft; error?: string }> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Debes iniciar sesión para usar el asistente.' };
    }

    const cleanIdea = idea.trim();
    if (cleanIdea.length < 5) {
        return { error: 'Escribe una breve idea (al menos 5 caracteres) para generar el anuncio.' };
    }

    try {
        const response = await generateWithFallback({
            contents: `Eres un asistente para una plataforma universitaria y vecinal de Banco de Tiempo llamada ChronoShare.
Un usuario quiere ofrecer el siguiente servicio: "${cleanIdea}".

Redacta una propuesta de anuncio atractiva, clara y cercana en español (de España).
- title: título conciso y atractivo (máximo 80 caracteres).
- description: descripción detallada en 2 párrafos cortos explicando qué incluye la sesión, a quién va dirigida y qué se necesita.
- category: elige exactamente una entre Académico, Idiomas, Tecnología, Hogar u Otros.
- hoursCost: estima la duración típica de una sesión entre "0.5", "1.0", "1.5", "2.0" o "3.0".`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        category: {
                            type: Type.STRING,
                            enum: ['Académico', 'Idiomas', 'Tecnología', 'Hogar', 'Otros'],
                        },
                        hoursCost: {
                            type: Type.STRING,
                            enum: ['0.5', '1.0', '1.5', '2.0', '3.0'],
                        },
                    },
                    required: ['title', 'description', 'category', 'hoursCost'],
                },
            },
        });

        if (!response.text) {
            return { error: 'No se recibió respuesta del modelo.' };
        }

        const parsed = JSON.parse(response.text) as GeneratedServiceDraft;
        return { data: parsed };
    } catch (err) {
        console.error('Error generando servicio con Gemini:', err);
        return { error: 'No se pudo conectar con Gemini. Inténtalo de nuevo en unos segundos.' };
    }
}