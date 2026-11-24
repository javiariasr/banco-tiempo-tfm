import { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ServiceStatus, ServiceModality } from '@prisma/client';
import Navbar from '@/components/Navbar';

const CATEGORIES = ['Todas', 'Académico', 'Idiomas', 'Tecnología', 'Hogar', 'Otros'];

async function ServicesGrid({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const activeCategory = category && category !== 'Todas' ? category : undefined;

  const services = await prisma.service.findMany({
    where: {
      status: ServiceStatus.ACTIVE,
      ...(activeCategory ? { category: activeCategory } : {}),
      ...(q
        ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
        : {}),
    },
    include: {
      provider: {
        select: {
          name: true,
          universityOrArea: true,
          ratingAvg: true,
          ratingCount: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda y filtros por categoría */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = (category || 'Todas') === cat;
            const href = cat === 'Todas' ? '/' : `/?category=${encodeURIComponent(cat)}`;
            return (
              <Link
                key={cat}
                href={href}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition ${isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>

        <form action="/" method="GET" className="flex gap-2 w-full md:w-80">
          {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
          <input
            type="text"
            name="q"
            defaultValue={q || ''}
            placeholder="Buscar clases, Excel, inglés..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-700 transition"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Listado de tarjetas */}
      {services.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-base">
            No se encontraron servicios con esos filtros.
          </p>
          <Link href="/" className="text-indigo-600 text-sm font-medium hover:underline mt-2 inline-block">
            Ver todos los servicios
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700">
                    {service.category}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                    {service.modality === ServiceModality.ONLINE ? '💻 Online' : '📍 Presencial'}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 line-clamp-2">
                  {service.title}
                </h2>

                <p className="text-sm text-slate-600 line-clamp-3">
                  {service.description}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{service.provider.name}</p>
                  <p className="text-xs text-slate-500">
                    {service.provider.ratingCount > 0
                      ? `⭐ ${service.provider.ratingAvg.toFixed(1)} (${service.provider.ratingCount})`
                      : 'Nuevo miembro'}
                    {service.provider.universityOrArea ? ` · ${service.provider.universityOrArea}` : ''}
                  </p>
                </div>

                <Link
                  href={`/services/${service.id}`}
                  className="bg-slate-900 text-white px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition"
                >
                  {service.hoursCost}h · Ver
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
        <Navbar />
      </Suspense>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 sm:p-8 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Marketplace de Talento y Tiempo
          </h1>
          <p className="text-indigo-100 mt-2 max-w-2xl text-sm sm:text-base">
            Aprende habilidades nuevas, resuelve dudas académicas o recibe ayuda en casa pagando únicamente con tus horas.
          </p>
        </section>

        <Suspense fallback={<div className="text-slate-500 text-sm">Cargando catálogo de servicios...</div>}>
          <ServicesGrid searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}