# ⏳ ChronoShare — Banco de Tiempo Universitario y Local

> **Trabajo Fin de Máster (TFM)** — Máster de Desarrollo con IA (BIG school)[cite: 1]  
> **Estado del proyecto:** 🚧 Fase 1: Arquitectura, Diseño y Estructura Base (Entrega Fundae)

---

## 1. Descripción General del Proyecto

**ChronoShare** es una plataforma web de economía colaborativa basada en el intercambio de servicios utilizando el **tiempo como única moneda de cambio** (1 hora ofrecida = 1 hora recibida, independientemente de la complejidad del servicio).

Está diseñada específicamente para **comunidades universitarias y entornos locales** (barrios o asociaciones), permitiendo que estudiantes y vecinos intercambien habilidades —como clases particulares, idiomas, diseño gráfico, reparaciones domésticas o soporte informático— sin necesidad de dinero y fomentando la confianza mutua.

### El problema que resuelve
Los bancos de tiempo tradicionales suelen fracasar por dos motivos: **falta de confianza** entre desconocidos y **fricción en la gestión de saldos**. ChronoShare soluciona esto mediante un sistema de **retención preventiva de horas (*Escrow*)**, perfiles verificados y un historial contable transparente.

---

## 2. Funcionalidades Principales (MVP)

* **Monedero de Tiempo y Bono de Bienvenida:** Cada usuario recibe `2.0 horas` gratuitas al registrarse para dinamizar los primeros intercambios. El saldo se divide en *Horas Disponibles* y *Horas Retenidas*.
* **Marketplace de Servicios:** Catálogo con búsqueda predictiva y filtros por categoría (Académico, Tecnología, Idiomas, Hogar), modalidad (Online / Presencial) y coste en horas.
* **Sistema de Intercambio Seguro (Flujo de Estados):**
  1. `PENDING`: El solicitante pide un servicio y sus horas quedan bloqueadas preventivamente.
  2. `ACCEPTED`: El proveedor acepta la solicitud y se habilita el chat interno.
  3. `COMPLETED`: Tras realizar el servicio, ambos confirman y las horas se transfieren oficialmente al monedero del proveedor.
  4. `CANCELLED`: Si se cancela antes de realizarse, las horas retenidas vuelven automáticamente al solicitante.
* **Libro Contable Transparente:** Historial detallado estilo bancario con todos los movimientos de ingresos, gastos y retenciones.
* **Sistema de Reputación Cruzada:** Valoraciones de 1 a 5 estrellas y comentarios obligatorios tras finalizar cada intercambio.

---

## 3. Stack Tecnológico

El proyecto está construido bajo una arquitectura *Full-Stack* tipada de extremo a extremo, optimizada para el desarrollo asistido por IA:

* **Frontend & Backend:** [Next.js](https://nextjs.org/) (App Router) + [TypeScript](https://www.typescriptlang.org/)
* **Estilos e Interfaz (UI):** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
* **Base de Datos y Autenticación:** [Supabase](https://supabase.com/) (PostgreSQL)
* **ORM:** [Prisma](https://www.prisma.io/) (Gestión de esquema y transacciones ACID)
* **Entorno de Desarrollo:** Google Antigravity IDE
* **Despliegue (CI/CD):** [Vercel](https://vercel.com/)

---

## 4. Arquitectura y Modelo de Datos

El núcleo del sistema garantiza la integridad de los saldos mediante transacciones atómicas en PostgreSQL.

```mermaid
erDiagram
    User ||--o{ Service : "ofrece"
    User ||--o{ Exchange : "solicita / provee"
    User ||--o{ Transaction : "registra"
    User ||--o{ Review : "escribe / recibe"
    Service ||--o{ Exchange : "genera"
    Exchange ||--o{ Transaction : "origina"
    Exchange ||--o{ Message : "contiene"
    Exchange ||--o{ Review : "evalúa"

    User {
        string id PK
        string email
        string name
        float availableHours
        float heldHours
        float ratingAvg
    }
    Service {
        string id PK
        string title
        string category
        float hoursCost
        enum modality
    }
    Exchange {
        string id PK
        float hoursAmount
        enum status
        datetime scheduledAt
    }
    Transaction {
        string id PK
        enum type
        float amount
        datetime createdAt
    }