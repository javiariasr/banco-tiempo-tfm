# ⏳ ChronoShare — Plataforma Inteligente de Banco de Tiempo

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20SDK-8E75B2?logo=google-gemini)](https://ai.google.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://banco-tiempo-tfm.vercel.app/)

**ChronoShare** es una plataforma web de economía colaborativa basada en el intercambio de tiempo donde **1 hora de cualquier servicio equivale exactamente a 1 hora de crédito**, independientemente de la disciplina o especialización.

> 🌐 **Demo en Producción (Hito MVP / Entrega FUNDAE):** [https://banco-tiempo-tfm.vercel.app/](https://banco-tiempo-tfm.vercel.app/)

---

## 🧪 Cuentas de Demostración (Entorno de Pruebas)

Para facilitar la evaluación inmediata del flujo completo de intercambio (solicitud con retención *Escrow*, aceptación, mensajería y valoración cruzada) sin necesidad de crear cuentas nuevas, se han habilitado dos usuarios de prueba en el entorno desplegado:

| Rol sugerido | Correo electrónico | Contraseña |
| :--- | :--- | :--- |
| **Usuario 1** | `susanatorio@gmail.com` | `123456` |
| **Usuario 2** | `carmelocoton@gmail.com` | `123456` |

*(También es posible registrar cualquier usuario nuevo desde `/login`, recibiendo automáticamente un bono inicial de **5.0 horas**).*

---

## 🎯 Visión del Proyecto

Este repositorio recoge la evolución completa de **ChronoShare** en el marco del Trabajo Fin de Máster (TFM):

1. **Hito 1 — MVP Funcional (Completado y Desplegado):** Plataforma operativa de extremo a extremo que resuelve los tres pilares críticos de un Banco de Tiempo moderno: **confianza transaccional** (sistema *Escrow* con libro contable inmutable), **reducción de fricción al publicar** (asistente generativo con salidas estructuradas) y **transparencia reputacional** (síntesis automática de valoraciones).
2. **Hito 2 — Evolución a Producto Escalable (En curso):** Transformación de la arquitectura hacia un producto listo para comunidades reales (universidades, ayuntamientos, asociaciones vecinales y redes profesionales), incorporando mensajería en tiempo real, moderación automatizada, búsqueda semántica por embeddings, analítica de impacto social y observabilidad completa.

---

## ✨ Funcionalidades Implementadas (MVP v1.0)

### 1. Identidad, Monedero Inicial y Control de Acceso
* Autenticación segura mediante **Supabase Auth** con sincronización automática de perfil en PostgreSQL.
* **Bono de bienvenida:** cada nuevo miembro recibe automáticamente **5.0 horas iniciales** para dinamizar el arranque de los intercambios sin sufrir el problema del "arranque en frío".
* Gestión de disponibilidad de anuncios (*Activo* / *Pausado*) por parte del proveedor.

### 2. Marketplace y Descubrimiento
* Catálogo público de servicios con renderizado híbrido de alto rendimiento (*Partial Prerendering* + *Server Components* en Next.js 16).
* Filtrado por categorías (*Académico*, *Idiomas*, *Tecnología*, *Hogar*, *Otros*) y búsqueda textual insensible a mayúsculas sobre título y descripción.
* Soporte para servicios **Online** y **Presenciales**.

### 3. Motor Transaccional *Escrow* y Libro Contable
* **Reserva con retención de saldo:** al solicitar un servicio, las horas pasan de `availableHours` a `heldHours` mediante transacciones atómicas (`prisma.$transaction`), impidiendo el doble gasto.
* **Ciclo de vida completo:** `PENDING` ➔ `ACCEPTED` ➔ `COMPLETED` (libera las horas al proveedor) o `CANCELLED` (reembolsa íntegramente al solicitante).
* **Auditoría financiera:** registro histórico de cada movimiento en la tabla `Transaction` (*bono inicial*, *retención*, *liberación* y *reembolso*).
* **Sala de coordinación y reputación:** chat integrado por intercambio y sistema de valoración de 1 a 5 estrellas con recálculo automático de reputación media.

### 4. Inteligencia Artificial Aplicada (`@google/genai`)
* **Asistente de Redacción de Servicios (`/services/new`):** a partir de una idea breve en lenguaje natural, Gemini genera una propuesta completa (título atractivo, descripción estructurada, categoría y estimación de horas) garantizando el contrato de datos mediante **Structured Outputs (JSON Schema)**.
* **Síntesis Inteligente de Reputación (`/services/[id]`):** analiza el histórico de reseñas y puntuaciones de un proveedor para generar un resumen objetivo y neutro que facilita la toma de decisiones.
* **Resiliencia en producción:** estrategia de *fallback* automático entre modelos (`gemini-3.8-flash` ➔ `gemini-3.8-flash-lite` ➔ `gemini-3.5-flash`) frente a picos de demanda (`503`) o límites de cuota (`429`).

---

## 🏗️ Arquitectura y Stack Tecnológico

| Capa | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Framework Full-Stack** | **Next.js 16 (App Router)** | Server Components, Server Actions y Partial Prerendering para minimizar JavaScript en cliente. |
| **Lenguaje** | **TypeScript** | Tipado estricto de extremo a extremo desde el esquema de base de datos hasta la interfaz. |
| **Base de Datos** | **PostgreSQL (Supabase)** | Integridad referencial, transacciones ACID para el motor *Escrow* y pooler de conexiones IPv4. |
| **ORM** | **Prisma** | Modelado declarativo, migraciones reproducibles y operaciones atómicas seguras. |
| **Autenticación** | **Supabase Auth (SSR)** | Gestión de sesiones basada en cookies seguras en servidor (`@supabase/ssr`). |
| **IA Generativa** | **Google GenAI SDK** | Structured Outputs (`responseSchema`) para formularios y síntesis textual de reputación. |
| **Estilos** | **Tailwind CSS** | Diseño *