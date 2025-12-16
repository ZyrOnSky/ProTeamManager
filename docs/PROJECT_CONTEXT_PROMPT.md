# Contexto del Proyecto: LoL Team Manager (Sistema de Gestión de Equipos de Esports)

Este documento sirve como **Prompt Maestro** y contexto para el desarrollo asistido por IA del proyecto "LoL Team Manager". Contiene todos los requerimientos funcionales, no funcionales, estructura de datos y estado actual del desarrollo.

---

## 1. Descripción General
Estamos construyendo una aplicación web **Local-First** para la gestión integral de un equipo competitivo de League of Legends. El objetivo es centralizar herramientas que normalmente están dispersas (hojas de cálculo, notas, herramientas de draft externas) en una sola plataforma.
El sistema debe permitir a un Coach/Manager gestionar su roster, planificar estrategias, registrar resultados de scrims (entrenamientos) y analizar el rendimiento.

## 2. Stack Tecnológico
*   **Framework:** Next.js 16 (App Router)
*   **Lenguaje:** TypeScript
*   **Base de Datos:** PostgreSQL (Local)
*   **ORM:** Prisma (v5.22.0 - *Nota: Mantener en v5 por estabilidad*)
*   **Autenticación:** NextAuth.js (Credentials Provider)
*   **Estilos:** Tailwind CSS
*   **Iconos:** Lucide React
*   **Entorno:** Windows (PowerShell)

---

## 3. Requerimientos Funcionales

### A. Autenticación y Roles
*   **Login:** Sistema de usuario y contraseña.
*   **Roles:**
    *   `ADMIN/COACH`: Acceso total (Crear/Editar/Eliminar).
    *   `PLAYER`: Acceso de lectura a estrategias y calendario, edición limitada a su propio perfil.
*   **Seguridad:** Protección de rutas mediante Middleware y `getServerSession`.

### B. Módulo de Jugadores (Roster) - *[En Desarrollo]*
*   **Gestión de Perfiles:** Crear fichas de jugadores con:
    *   Nombre de Invocador, Nombre Real, Email.
    *   Posición Principal y Secundaria (Top, Jungle, Mid, ADC, Support).
*   **Champion Pool:**
    *   Registro de campeones por jugador.
    *   Clasificación de Maestría: `MAIN` (Confort), `POCKET` (Situacional), `LEARNING` (En práctica).
    *   Notas específicas por campeón.
*   **Estadísticas Individuales:** Visualización de KDA, Winrate, CS/min (calculado desde los datos de Scrims).

### C. Módulo de Scrims (Partidas) - *[Próximo Paso]*
*   **Registro de Partidas:**
    *   Fecha, Hora, Parche del juego (ej: 14.23).
    *   Equipo Rival (vinculado a base de datos de rivales).
    *   Resultado (Victoria/Derrota/Remake).
    *   Link al VOD (Grabación).
*   **Fase de Draft:**
    *   Registro de Bans (Azules/Rojos).
    *   Registro de Picks (Azules/Rojos) y orden de selección.
    *   "Modo OnlyDraft": Una vista simplificada para simular o registrar solo el draft rápidamente.
*   **Post-Game Analysis:**
    *   Notas por fases: Early Game, Mid Game, Late Game.
    *   Win Condition identificada vs Win Condition ejecutada.
    *   Errores clave y MVP del scrim.
*   **Estadísticas de Partida:**
    *   KDA, Oro, Daño por jugador (ingreso manual o futuro parseo).

### D. Módulo de Estrategia (Playbook)
*   **Composiciones:**
    *   Crear plantillas de composiciones (ej: "Protect the Carry", "1-3-1", "Hard Engage").
    *   Definir campeones ideales para cada rol en esa comp.
    *   Condiciones de victoria y dificultad de ejecución.
*   **Pizarra Táctica:**
    *   Herramienta visual (o subida de imágenes) para planificar invasiones de nivel 1, rotaciones y control de objetivos.

### E. Módulo de Calendario
*   Agenda interactiva para programar:
    *   Bloques de Scrims.
    *   Sesiones de VOD Review.
    *   Días libres o torneos.

### F. Módulo de Data & Scouting
*   **Base de Datos de Rivales:**
    *   Fichas de equipos enemigos.
    *   Historial de enfrentamientos contra ellos.
    *   Notas de scouting (sus picks más fuertes, debilidades).

---

## 4. Requerimientos No Funcionales
*   **Interfaz "Gamer" pero Profesional:** Estética oscura (Dark Mode por defecto), uso de colores de acento neón (Azul, Verde, Púrpura) pero manteniendo legibilidad y limpieza (estilo Dashboard SaaS).
*   **Rendimiento:** Cargas instantáneas, optimización de imágenes.
*   **Escalabilidad:** Estructura de base de datos relacional sólida para permitir futuras migraciones a la nube.
*   **Uso Local:** Debe funcionar perfectamente en `localhost` sin dependencias externas críticas.

---

## 5. Modelo de Datos (Schema Prisma Actual)
*Resumen de modelos clave:*
*   `User`: Usuarios del sistema.
*   `PlayerProfile`: Extensión del usuario con datos de juego.
*   `ChampionPool`: Relación N:M entre Jugador y Campeones.
*   `Team`: Equipos (propio y rivales).
*   `Match`: La entidad central de las partidas.
*   `MatchParticipant`: Detalles de cada jugador en una partida específica.
*   `Composition`: Plantillas de estrategia.

---

## 6. Estado Actual del Proyecto
*   ✅ Configuración inicial (Next.js, Prisma, Tailwind).
*   ✅ Base de datos PostgreSQL corriendo localmente.
*   ✅ Autenticación (Login) funcional.
*   ✅ Dashboard principal (UI).
*   ✅ Módulo de Jugadores (Listado y Creación).
*   ✅ Detalle de Jugador (Champion Pool Manager).
*   🚧 **Pendiente:** Módulo de Scrims, Estrategia y Análisis.

---

**Instrucción para el Agente:**
Utiliza este contexto para entender la arquitectura, el propósito de negocio y las restricciones técnicas al generar código o sugerir funcionalidades. Mantén la consistencia con el stack tecnológico mencionado (especialmente Prisma v5).
