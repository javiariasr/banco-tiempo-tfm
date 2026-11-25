'use client';

import { useState, useTransition } from 'react';
import { summarizeProviderReputation } from '@/app/services/[id]/ai-reputation';

export default function ReputationSummary({
    providerId,
    ratingCount,
}: {
    providerId: string;
    ratingCount: number;
}) {
    const [summary, setSummary] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    if (ratingCount === 0) {
        return null;
    }

    const handleSummarize = () => {
        setError(null);
        startTransition(async () => {
            const result = await summarizeProviderReputation(providerId);
            if (result.error) {
                setError(result.error);
            } else if (result.summary) {
                setSummary(result.summary);
            }
        });
    };

    return (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/90 to-violet-50/90 border border-indigo-100 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    ✨ Síntesis de Reputación (Gemini IA)
                </span>

                {!summary && (
                    <button
                        type="button"
                        onClick={handleSummarize}
                        disabled={isPending}
                        className="text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                    >
                        {isPending ? 'Analizando reseñas...' : 'Analizar opiniones'}
                    </button>
                )}
            </div>

            {summary && (
                <p className="text-sm text-indigo-950/90 leading-relaxed bg-white/80 p-3 rounded-lg border border-indigo-100/80">
                    {summary}
                </p>
            )}

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        </div>
    );
}