'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { createService } from './actions';
import { generateServiceWithAI } from './ai-actions';

const CATEGORIES = ['Académico', 'Idiomas', 'Tecnología', 'Hogar', 'Otros'];

export default function NewServiceForm({ serverError }: { serverError?: string }) {
    const [idea, setIdea] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Tecnología');
    const [hoursCost, setHoursCost] = useState('1.0');
    const [aiError, setAiError] = useState<string | null>(null);
    const [isGenerating, startTransition] = useTransition();

    const handleGenerate = () => {
        setAiError(null);
        startTransition(async () => {
            const result = await generateServiceWithAI(idea);
            if (result.error) {
                setAiError(result.error);
                return;
            }
            if (result.data) {
                setTitle(result.data.title);
                setDescription(result.data.description);
                setCategory(result.data.category);
                setHoursCost(result.data.hoursCost);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Asistente de Redacción con Gemini */}
            <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200/80 space-y-3">
                <div>
                    <p className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                        <span>✨ Asistente de Redacción con Gemini</span>
                    </p>
                    <p className="text-xs text-indigo-800 mt-0.5">
                        Describe en una frase qué sabes hacer y la IA redactará el título, la descripción y sugerirá categoría y duración.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        placeholder="Ej. Puedo ayudar a preparar el examen de cálculo o arreglar bicis..."
                        className="flex-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating || !idea.trim()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer whitespace-nowrap"
                    >
                        {isGenerating ? '✨ Redactando...' : '✨ Autocompletar'}
                    </button>
                </div>

                {aiError && <p className="text-xs text-red-600 font-medium">{aiError}</p>}
            </div>

            {serverError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    {serverError}
                </div>
            )}

            <form action={createService} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Título del servicio</label>
                    <input
                        name="title"
                        type="text"
                        required
                        maxLength={100}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej. Clases particulares de SQL y bases de datos"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700">Descripción detallada</label>
                    <textarea
                        name="description"
                        required
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Explica qué incluye tu servicio, nivel recomendado, herramientas que usáis..."
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Categoría</label>
                        <select
                            name="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Duración / Coste (horas)</label>
                        <select
                            name="hoursCost"
                            value={hoursCost}
                            onChange={(e) => setHoursCost(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="0.5">0.5 horas (30 min)</option>
                            <option value="1.0">1.0 hora</option>
                            <option value="1.5">1.5 horas</option>
                            <option value="2.0">2.0 horas</option>
                            <option value="3.0">3.0 horas</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Modalidad</label>
                        <select
                            name="modality"
                            defaultValue="ONLINE"
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="ONLINE">💻 Online</option>
                            <option value="IN_PERSON">📍 Presencial</option>
                        </select>
                    </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                    <Link
                        href="/"
                        className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition cursor-pointer"
                    >
                        Publicar servicio
                    </button>
                </div>
            </form>
        </div>
    );
}