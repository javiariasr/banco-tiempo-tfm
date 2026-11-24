import Link from 'next/link';
import { connection } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { signout } from '@/app/login/actions';

export default async function Navbar() {
    await connection();
    const supabase = await createClient();
    const {
        data: { user: authUser },
    } = await supabase.auth.getUser();

    const dbUser = authUser
        ? await prisma.user.findUnique({
            where: { id: authUser.id },
            select: { name: true, availableHours: true, heldHours: true },
        })
        : null;

    return (
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
                    <span>ChronoShare</span>
                    <span className="text-indigo-600">⏳</span>
                </Link>

                <nav className="flex items-center gap-4">
                    {dbUser ? (
                        <>
                            <div className="hidden sm:flex items-center gap-2 bg-indigo-50 text-indigo-800 px-3 py-1.5 rounded-full text-xs font-semibold border border-indigo-100">
                                <span>⏱️ {dbUser.availableHours.toFixed(1)}h disp.</span>
                                {dbUser.heldHours > 0 && (
                                    <span className="text-amber-700">({dbUser.heldHours.toFixed(1)}h ret.)</span>
                                )}
                            </div>

                            <Link
                                href="/exchanges"
                                className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition px-2 py-1"
                            >
                                Mis intercambios
                            </Link>

                            <Link
                                href="/services/new"
                                className="bg-indigo-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                            >
                                + Publicar servicio
                            </Link>

                            <span className="hidden md:inline text-sm text-slate-600 font-medium">
                                {dbUser.name}
                            </span>

                            <form action={signout}>
                                <button
                                    type="submit"
                                    className="text-sm text-slate-500 hover:text-red-600 transition px-2 py-1"
                                >
                                    Salir
                                </button>
                            </form>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                        >
                            Entrar / Registrarse
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}