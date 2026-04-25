# Plan de Modernización Táctica - Rust Ops

Este documento detalla las fases para elevar el bot al estándar de producción y SaaS, basándose en la arquitectura de los mejores bots de Rust+ actuales.

---

## Fase 1: Estabilidad Táctica y Resiliencia (Infraestructura)
*Objetivo: Un bot "siempre online" con consumo eficiente de recursos.*

1.  **Heartbeat Pasivo y Adaptativo**: 
    *   En lugar de pings constantes a todos, implementaremos un sistema que monitorea la actividad del socket. Si el socket recibe eventos (muertes, chat, etc.), el bot sabe que está vivo sin preguntar.
    *   Solo si hay silencio total por 5 minutos, se envía un mini-paquete de verificación. Esto reduce el tráfico un 90% comparado con el sistema de 30s.
2.  **Persistencia de FCM de Grado Militar**: 
    *   Implementar el almacenamiento definitivo del `DeviceId` y los tokens de Firebase en la base de datos SQLite.
    *   Esto evita que Facepunch nos bloquee por "múltiples registros" al reiniciar el bot, permitiendo reinicios instantáneos sin perder las notificaciones de muerte/raid.
3.  **Ejecución Paralela No Bloqueante (Async Dispatcher)**:
    *   En lugar de una cola que retrasa mensajes, usaremos un despachador asíncrono. El bot dispara las alertas de raid al instante en hilos paralelos, mientras que los logs secundarios se procesan en segundo plano sin detener la lógica de combate.
    *   Prioridad: Alertas de Raid (Nivel 1) > Muertes (Nivel 2) > Logs (Nivel 3).
4.  **Auto-Reconexión Inteligente (Exponential Backoff)**:
    *   Si un servidor se cae, el bot no intentará conectar 100 veces por segundo. Usará un algoritmo que espera 1s, luego 2s, luego 4s... hasta encontrar el servidor, protegiendo la CPU del VPS.

---

## Fase 2: Inteligencia de Combate y Alertas (Funcionalidad)
*Objetivo: Convertir el bot en una ventaja táctica real.*

1.  **Detección Inteligente de Raids**: 
    *   No solo avisar de una explosión, sino analizar la frecuencia. "Múltiples explosiones en cuadrante H2 - ¡Posible Raid!".
2.  **Alertas de Vida de Base**: Monitorear el decay de los armarios (TC) y avisar cuando el mantenimiento baje de 12 horas.
3.  **Smart Alarm Integration**: Crear un sistema donde el usuario pueda configurar "Si suena la alarma X, manda mensaje a este canal de Discord con la ubicación".
4.  **Registro de Combate (Killfeed)**: Un canal dedicado donde se muestren todas las muertes del equipo con distancia y arma utilizada.

---

## Fase 3: Dashboard y Experiencia de Usuario (UI/UX)
*Objetivo: Que el dashboard se sienta como un centro de mando premium.*

1.  **Map Markers Dinámicos**: 
    *   Mostrar rutas de los miembros del equipo en tiempo real (líneas de movimiento).
    *   Iconos personalizados para Vending Machines con filtros de precio.
2.  **Editor de Plantillas de Mensajes**: Una interfaz en el Dashboard para que el usuario pueda escribir: `[Rust Ops] ¡{player} ha muerto en {grid}!` y el bot use esa plantilla.
3.  **Sistema de Logs en Tiempo Real**: Una consola en el dashboard para ver qué está haciendo el bot en cada servidor sin entrar al servidor Linux.

---

---

## Fase 4: Panel de Administración y Gestión (Control)
*Objetivo: Gestionar la infraestructura global del bot.*

1.  **Panel de Administración Global**: Para que tú (el dueño) puedas ver cuántos servidores hay activos, cuántas alertas se envían y gestionar usuarios. (Implementado en `/dashboard/admin`).
2.  **Configuración de Bot por Servidor**: Editor de prefijos y plantillas (Implementado).

---

## Fase 5: Inteligencia de Datos Nativa (Estrategia Pro)
*Objetivo: Ofrecer funciones de élite sin necesidad de instalar plugins en los servidores.*

1.  **Detector de Bases Enemigas**: Basado en el historial de movimiento (`playerHistory`), el bot marcará zonas probables donde los enemigos tienen sus bases (puntos donde los jugadores enemigos aparecen/desaparecen o pasan mucho tiempo quietos).
2.  **Predicción de Dirección de Raid**: Analizar si la secuencia de explosiones se mueve linealmente para avisar hacia qué dirección están rompiendo la base.
3.  **Heatmap de Combate Local**: Visualizar en el mapa las zonas de mayor mortalidad del equipo en las últimas 12 horas.
