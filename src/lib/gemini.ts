import { GoogleGenAI, GenerateContentParameters } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ Falta la variable de entorno GEMINI_API_KEY');
}

export const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export const GEMINI_MODELS = [
    'gemini-3.8-flash',
    'gemini-3.8-flash-lite',
    'gemini-3.5-flash',
];

export async function generateWithFallback(
    params: Omit<GenerateContentParameters, 'model'>
) {
    let lastError: unknown;

    for (const model of GEMINI_MODELS) {
        try {
            return await ai.models.generateContent({
                ...params,
                model,
            });
        } catch (error: unknown) {
            lastError = error;
            const msg = error instanceof Error ? error.message : String(error);
            // Si es sobrecarga temporal (503) o cuota (429) o modelo no disponible (404), probamos el siguiente
            if (msg.includes('503') || msg.includes('429') || msg.includes('404')) {
                console.warn(`⚠️ Modelo ${model} no disponible temporalmente, probando fallback...`);
                continue;
            }
            throw error;
        }
    }

    throw lastError;
}