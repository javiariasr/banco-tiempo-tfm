import { PrismaClient, ServiceModality, ExchangeStatus, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seeding de ChronoShare...');

    // Limpiar datos previos en orden inverso a las relaciones
    await prisma.review.deleteMany();
    await prisma.message.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.exchange.deleteMany();
    await prisma.service.deleteMany();
    await prisma.user.deleteMany();

    // 1. Crear usuarios de prueba (Ana, Carlos y Lucía)
    const ana = await prisma.user.create({
        data: {
            email: 'ana.garcia@uni.es',
            name: 'Ana García',
            bio: 'Estudiante de 3º de Ingeniería Informática. Apasionada por el desarrollo web y el diseño UI.',
            universityOrArea: 'Campus Moncloa',
            availableHours: 1.0, // Empezó con 2.0h y gastó 1.0h en inglés
            heldHours: 0.0,
            ratingAvg: 0.0,
            ratingCount: 0,
        },
    });

    const carlos = await prisma.user.create({
        data: {
            email: 'carlos.ruiz@uni.es',
            name: 'Carlos Ruiz',
            bio: 'Bilingüe español-inglés (C2). Ayudo con conversación, preparación de exámenes y redacción académica.',
            universityOrArea: 'Campus Somosaguas',
            availableHours: 3.0, // Empezó con 2.0h y ganó 1.0h dando clase a Ana
            heldHours: 0.0,
            ratingAvg: 5.0,
            ratingCount: 1,
        },
    });

    const lucia = await prisma.user.create({
        data: {
            email: 'lucia.mendez@uni.es',
            name: 'Lucía Méndez',
            bio: 'Estudiante de Administración y Finanzas. Experta en Excel, Power BI y organización de estudios.',
            universityOrArea: 'Barrio Centro',
            availableHours: 2.0, // Bono de bienvenida intacto
            heldHours: 0.0,
            ratingAvg: 0.0,
            ratingCount: 0,
        },
    });

    // 2. Crear servicios en el catálogo
    const servicioIngles = await prisma.service.create({
        data: {
            title: 'Conversación en Inglés y preparación B2/C1',
            description:
                'Sesiones prácticas enfocadas en fluidez oral, vocabulario real y simulación de examen Speaking.',
            category: 'Idiomas',
            hoursCost: 1.0,
            modality: ServiceModality.ONLINE,
            providerId: carlos.id,
        },
    });

    await prisma.service.create({
        data: {
            title: 'Clases de React, Next.js y TypeScript desde cero',
            description:
                'Te ayudo a montar tu primer proyecto full-stack o a desbloquear errores en tus prácticas de programación.',
            category: 'Tecnología',
            hoursCost: 2.0,
            modality: ServiceModality.ONLINE,
            providerId: ana.id,
        },
    });

    await prisma.service.create({
        data: {
            title: 'Dominio de Excel: Tablas dinámicas y fórmulas avanzadas',
            description:
                'Aprende a automatizar hojas de cálculo para tus trabajos universitarios o proyectos personales.',
            category: 'Académico',
            hoursCost: 1.5,
            modality: ServiceModality.IN_PERSON,
            providerId: lucia.id,
        },
    });

    // 3. Crear un intercambio completado (Ana contrató 1h de inglés a Carlos)
    const intercambioCompletado = await prisma.exchange.create({
        data: {
            serviceId: servicioIngles.id,
            requesterId: ana.id,
            providerId: carlos.id,
            hoursAmount: 1.0,
            status: ExchangeStatus.COMPLETED,
            scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // Hace 2 días
        },
    });

    // 4. Registrar movimientos en el libro contable (siempre en positivo, el tipo indica si suma o resta)
    await prisma.transaction.createMany({
        data: [
            {
                userId: ana.id,
                type: TransactionType.WELCOME_BONUS,
                amount: 2.0,
                description: 'Bono de bienvenida por registro',
            },
            {
                userId: carlos.id,
                type: TransactionType.WELCOME_BONUS,
                amount: 2.0,
                description: 'Bono de bienvenida por registro',
            },
            {
                userId: lucia.id,
                type: TransactionType.WELCOME_BONUS,
                amount: 2.0,
                description: 'Bono de bienvenida por registro',
            },
            {
                userId: ana.id,
                exchangeId: intercambioCompletado.id,
                type: TransactionType.EXPENSE,
                amount: 1.0,
                description: 'Pago por sesión: Conversación en Inglés y preparación B2/C1',
            },
            {
                userId: carlos.id,
                exchangeId: intercambioCompletado.id,
                type: TransactionType.INCOME,
                amount: 1.0,
                description: 'Cobro por sesión: Conversación en Inglés y preparación B2/C1',
            },
        ],
    });

    // 5. Añadir reseña real
    await prisma.review.create({
        data: {
            exchangeId: intercambioCompletado.id,
            authorId: ana.id,
            targetId: carlos.id,
            rating: 5,
            comment:
                'Carlos explica con muchísima paciencia y la hora se pasa volando. Totalmente recomendable.',
        },
    });

    console.log('✅ Seeding completado: 3 usuarios, 3 servicios, 1 intercambio, 5 transacciones y 1 reseña.');
}

main()
    .catch((e) => {
        console.error('❌ Error en seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });