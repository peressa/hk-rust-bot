const translations = {
    en: {
        "nav.features": "Features",
        "nav.monitor": "Monitor",
        "nav.pricing": "Plans",
        "nav.faq": "FAQ",
        "nav.cta": "Login",
        "hero.badge": "Multi-platform Intelligence Tool",
        "hero.h1a": "Total",
        "hero.h1b": " Wipe Control",
        "hero.h1c": "Web, Discord &",
        "hero.h1d": " In-Game.",
        "hero.h1e": "In Real",
        "hero.h1f": " Time.",
        "hero.sub": "The only intelligence platform that connects your entire team via Web, Discord, and Rust server. Monitor events, scan players, and own every wipe from a single command center.",
        "hero.cta1": "Get Started",
        "hero.cta2": "View Features",
        "hero.stat1": "Active Players",
        "hero.stat2": "Monitored Servers",
        "hero.stat3": "Uptime",
        "hero.stat4": "Avg Latency",
        "platform.web": "Web Dashboard",
        "platform.discord": "Discord Integration",
        "platform.game": "In-Game Sync",
        "platform.realtime": "Real-time Events",
        "platform.secure": "Anti-Cheat Integration",
        "features.label": "Core Modules",
        "features.title": "Everything your team needs. Nothing else.",
        "features.sub": "Four precision modules designed to give your team a decisive edge — from the moment you spawn to the final hour of the wipe.",
        "feat1.tag": "Team Bridge",
        "feat1.title": "Cross-platform Chat",
        "feat1.desc": "Unify all team communication into a single flow. Messages sent in Discord appear in-game, and vice versa, with zero delay and full context.",
        "feat1.b1": "Team → Discord sync",
        "feat1.b2": "Custom command prefix",
        "feat1.b3": "Role-based routing",
        "feat1.b4": "Message history logging",
        "feat2.tag": "A2S Protocol",
        "feat2.title": "Server Intelligence Monitor",
        "feat2.desc": "Live server polling via A2S. Track player count, queue size, active wipe timer, and server health in your dashboard in real time.",
        "feat2.b1": "A2S real-time polling",
        "feat2.b2": "Wipe countdown tracker",
        "feat2.b3": "Queue & population graphs",
        "feat2.b4": "Custom alert thresholds",
        "feat3.tag": "Smart Alerts",
        "feat3.title": "Event Notifications",
        "feat3.desc": "Be first to every high-value event. Instant alerts for Locked Crates, Oil Rigs, Cargo Ship, Heli Patrol, and Bradley — pushed to Discord and Web.",
        "feat3.b1": "Locked Crate & CH47",
        "feat3.b2": "Oil Rig activation",
        "feat3.b3": "Cargo Ship route",
        "feat3.b4": "Bradley & Patrol Heli",
        "feat4.tag": "Intel Scanner",
        "feat4.title": "Player Profile Scanner",
        "feat4.desc": "Deep-scan any Steam profile. Cross-reference bans (VAC, EAC, Game), hours played, alt accounts, and KDA stats before you trust anyone.",
        "feat4.b1": "VAC / EAC / Game bans",
        "feat4.b2": "Steam hours & games",
        "feat4.b3": "KDA & raid history",
        "feat4.b4": "Alt account detection",
        "monitor.label": "Live Intelligence",
        "monitor.title": "Your server, decoded in real time.",
        "monitor.sub": "The RustPlusPlus intelligence engine processes server events in under 4ms, delivering actionable data to every node in your team's network simultaneously.",
        "monitor.f1t": "Sub-5ms event pipeline",
        "monitor.f1s": "From server event to your notification",
        "monitor.f2t": "Multi-node redundancy",
        "monitor.f2s": "99.98% uptime guaranteed SLA",
        "monitor.f3t": "Encrypted data layer",
        "monitor.f3s": "All intel streams are end-to-end encrypted",
        "pricing.label": "Plans",
        "pricing.title": "Simple Choice. Maximum Intel.",
        "pricing.sub": "Subscriptions are managed privately. Contact an administrator to activate your plan.",
        "plan1.name": "Scout",
        "plan1.period": "Limited Access",
        "plan1.f1": "1 server monitor",
        "plan1.f2": "Basic chat bridge",
        "plan1.f3": "5 player scans / day",
        "plan1.f4": "Smart event alerts",
        "plan1.f5": "Standard support",
        "plan1.cta": "Login to Start",
        "plan2.badge": "Most Popular",
        "plan2.name": "Raider",
        "plan2.period": "Contact for activation",
        "plan2.f1": "Up to 5 servers",
        "plan2.f2": "Full chat bridge",
        "plan2.f3": "Unlimited player scans",
        "plan2.f4": "All smart event alerts",
        "plan2.f5": "Priority 24/7 support",
        "plan2.cta": "Contact Admin",
        "plan3.name": "Warlord",
        "plan3.period": "Enterprise / Team",
        "plan3.f1": "Unlimited servers",
        "plan3.f2": "Multi-team management",
        "plan3.f3": "Advanced analytics",
        "plan3.f4": "Custom webhook endpoints",
        "plan3.f5": "Dedicated account manager",
        "plan3.cta": "Contact Admin",
        "faq.label": "FAQ",
        "faq.title": "Common questions.",
        "faq.q1": "What platforms does RustPlusPlus support?",
        "faq.a1": "RustPlusPlus is a fully multi-platform intelligence tool. It runs as a Web dashboard accessible from any browser, integrates natively with Discord for team notifications, and syncs with your Rust game server in real time.",
        "faq.q2": "How does the server monitoring work?",
        "faq.a2": "We use the A2S (UDP) query protocol to poll your Rust server every few seconds. This gives us live player count, queue size, map, wipe timer, and server metadata — without requiring any server-side plugin installation.",
        "faq.q3": "Do I need admin access to my Rust server?",
        "faq.a3": "For basic monitoring and event alerts, no admin access is required — just the server IP and port. For advanced features like in-game chat bridging, you'll need RCON access or to install our lightweight plugin.",
        "faq.q4": "How accurate is the Player Scanner?",
        "faq.a4": "The scanner cross-references Steam's public API, EAC ban records, and community-sourced databases. It detects VAC, EAC, and Game bans, checks account age, playtime, and flags suspicious patterns that may indicate an alt account.",
        "faq.q5": "Is the platform available in other languages?",
        "faq.a5": "Yes. RustPlusPlus is fully localized in English, Portuguese (Brazil), and Spanish (LATAM). Use the language selector in the top navigation to switch. All interface text adapts to your selected language.",
        "cta.title": "Ready to own every wipe?",
        "cta.sub": "Join thousands of teams already running the most complete Rust intelligence platform. Contact us to get started.",
        "cta.btn1": "Get Started Now",
        "cta.btn2": "View All Features",
        "footer.privacy": "Privacy",
        "footer.terms": "Terms",
        "footer.docs": "Docs",
        "footer.status": "Status",
        "footer.copy": "© 2026 RustPlusPlus. All rights reserved."
    },

    pt: {
        "nav.features": "Recursos",
        "nav.monitor": "Monitor",
        "nav.pricing": "Planos",
        "nav.faq": "FAQ",
        "nav.cta": "Entrar",
        "hero.badge": "Ferramenta de Inteligência Multi-plataforma",
        "hero.h1a": "Controle",
        "hero.h1b": " Total do Wipe",
        "hero.h1c": "Web, Discord &",
        "hero.h1d": " In-Game.",
        "hero.h1e": "Em Tempo",
        "hero.h1f": " Real.",
        "hero.sub": "A única plataforma de inteligência que conecta todo o seu time via Web, Discord e servidor Rust. Monitore eventos, escaneie jogadores e domine cada wipe a partir de um único centro de comando.",
        "hero.cta1": "Começar",
        "hero.cta2": "Ver Recursos",
        "hero.stat1": "Jogadores Ativos",
        "hero.stat2": "Servidores Monitorados",
        "hero.stat3": "Disponibilidade",
        "hero.stat4": "Latência Média",
        "platform.web": "Dashboard Web",
        "platform.discord": "Integração Discord",
        "platform.game": "Sync In-Game",
        "platform.realtime": "Eventos em Tempo Real",
        "platform.secure": "Integração Anti-Cheat",
        "features.label": "Módulos Principales",
        "features.title": "Tudo que seu time precisa. Nada além disso.",
        "features.sub": "Quatro módulos de precisão que dão ao seu time uma vantagem decisiva — do momento em que você spawna até a última hora do wipe.",
        "feat1.tag": "Ponte de Time",
        "feat1.title": "Chat Multi-plataforma",
        "feat1.desc": "Unifique toda a comunicação do time em um fluxo só. Mensagens enviadas no Discord aparecem in-game, e vice-versa, com zero delay e contexto completo.",
        "feat1.b1": "Sync Time → Discord",
        "feat1.b2": "Prefixo de comando customizado",
        "feat1.b3": "Roteamento por cargo",
        "feat1.b4": "Log de histórico de mensagens",
        "feat2.tag": "Protocolo A2S",
        "feat2.title": "Monitor de Servidor Inteligente",
        "feat2.desc": "Polling ao vivo via A2S. Acompanhe contagem de jogadores, fila, timer de wipe e saúde do servidor em tempo real no seu dashboard.",
        "feat2.b1": "Polling em tempo real A2S",
        "feat2.b2": "Contador regressivo do wipe",
        "feat2.b3": "Gráficos de fila e população",
        "feat2.b4": "Limites de alerta customizados",
        "feat3.tag": "Alertas Inteligentes",
        "feat3.title": "Notificaciones de Eventos",
        "feat3.desc": "Seja o primeiro em cada evento de alto valor. Alertas instantâneos para Caixas Trancadas, Plataformas de Petróleo, Cargo Ship, Patrulha Heli e Bradley.",
        "feat3.b1": "Crate Trancado & CH47",
        "feat3.b2": "Ativação da Plataforma de Petróleo",
        "feat3.b3": "Rota do Cargo Ship",
        "feat3.b4": "Bradley & Heli de Patrulha",
        "feat4.tag": "Scanner de Intel",
        "feat4.title": "Scanner de Perfil de Jogador",
        "feat4.desc": "Escaneie qualquer perfil Steam em profundidade. Cruze bans (VAC, EAC, Game), horas jogadas, contas alternativas e stats de KDA antes de confiar em alguém.",
        "feat4.b1": "Bans VAC / EAC / Game",
        "feat4.b2": "Horas Steam & jogos",
        "feat4.b3": "KDA & histórico de raids",
        "feat4.b4": "Detecção de conta alternativa",
        "monitor.label": "Inteligência ao Vivo",
        "monitor.title": "Seu servidor, decodificado em tempo real.",
        "monitor.sub": "O motor de inteligência do RustPlusPlus processa eventos do servidor em menos de 4ms, entregando dados acionáveis a cada nó da rede do seu time simultaneamente.",
        "monitor.f1t": "Pipeline de eventos sub-5ms",
        "monitor.f1s": "Do evento do servidor à sua notificação",
        "monitor.f2t": "Redundância multi-nó",
        "monitor.f2s": "SLA garantido de 99,98% de uptime",
        "monitor.f3t": "Camada de dados criptografada",
        "monitor.f3s": "Todos os fluxos de intel são criptografados",
        "pricing.label": "Planos",
        "pricing.title": "Escolha Simples. Intel Máxima.",
        "pricing.sub": "As assinaturas são gerenciadas de forma privada. Entre em contato com um administrador para ativar seu plano.",
        "plan1.name": "Batedor",
        "plan1.period": "Acesso Limitado",
        "plan1.f1": "1 monitor de servidor",
        "plan1.f2": "Ponte de chat básica",
        "plan1.f3": "5 scans de jogadores / dia",
        "plan1.f4": "Alertas de eventos inteligentes",
        "plan1.f5": "Suporte padrão",
        "plan1.cta": "Entrar para Começar",
        "plan2.badge": "Mais Popular",
        "plan2.name": "Raider",
        "plan2.period": "Contato para ativação",
        "plan2.f1": "Até 5 servidores",
        "plan2.f2": "Ponte de chat completa",
        "plan2.f3": "Scans de jogadores ilimitados",
        "plan2.f4": "Todos os alertas de eventos",
        "plan2.f5": "Suporte prioritário 24/7",
        "plan2.cta": "Contatar Admin",
        "plan3.name": "Senhor da Guerra",
        "plan3.period": "Empresarial / Time",
        "plan3.f1": "Servidores ilimitados",
        "plan3.f2": "Gestão multi-time",
        "plan3.f3": "Analytics avançados",
        "plan3.f4": "Endpoints webhook customizados",
        "plan3.f5": "Gerente de conta dedicado",
        "plan3.cta": "Contatar Admin",
        "faq.label": "Perguntas Frequentes",
        "faq.title": "Dúvidas comuns.",
        "faq.q1": "Quais plataformas o RustPlusPlus suporta?",
        "faq.a1": "RustPlusPlus é uma ferramenta de inteligência totalmente multi-plataforma. Funciona como dashboard Web acessível por qualquer navegador, integra-se nativamente com Discord e sincroniza com seu servidor Rust.",
        "faq.q2": "Como funciona o monitoramento de servidor?",
        "faq.a2": "Usamos o protocolo de consulta A2S (UDP) para fazer polling do seu servidor Rust a cada poucos segundos, fornecendo contagem de jogadores, fila, mapa, timer de wipe e metadados.",
        "faq.q3": "Preciso de acesso admin no meu servidor Rust?",
        "faq.a3": "Para monitoramento básico e alertas de eventos, não é necessário acesso admin — apenas o IP e porta do servidor.",
        "faq.q4": "Quão preciso é o Scanner de Jogadores?",
        "faq.a4": "O scanner cruza a API pública do Steam, registros de ban do EAC e bancos de dados da comunidade.",
        "faq.q5": "A plataforma está disponível em outros idiomas?",
        "faq.a5": "Sim. O RustPlusPlus é totalmente localizado em inglês, português (Brasil) e espanhol (LATAM).",
        "cta.title": "Pronto para dominar cada wipe?",
        "cta.sub": "Junte-se a milhares de times já usando a plataforma de inteligência Rust mais completa. Entre em contato para começar.",
        "cta.btn1": "Começar Agora",
        "cta.btn2": "Ver Todos os Recursos",
        "footer.privacy": "Privacidade",
        "footer.terms": "Termos",
        "footer.docs": "Documentação",
        "footer.status": "Status",
        "footer.copy": "© 2026 RustPlusPlus. Todos os direitos reservados."
    },

    es: {
        "nav.features": "Funciones",
        "nav.monitor": "Monitor",
        "nav.pricing": "Precios",
        "nav.faq": "FAQ",
        "nav.cta": "Ingresar",
        "hero.badge": "Herramienta de Inteligencia Multi-plataforma",
        "hero.h1a": "Control",
        "hero.h1b": " Total del Wipe",
        "hero.h1c": "Web, Discord &",
        "hero.h1d": " In-Game.",
        "hero.h1e": "En Tiempo",
        "hero.h1f": " Real.",
        "hero.sub": "La única plataforma de inteligencia que conecta a todo tu equipo a través de Web, Discord y el servidor Rust. Monitoreá eventos, escaneá jugadores y dominá cada wipe desde un único centro de comando.",
        "hero.cta1": "Empezar",
        "hero.cta2": "Ver Funciones",
        "hero.stat1": "Jugadores Activos",
        "hero.stat2": "Servidores Monitoreados",
        "hero.stat3": "Disponibilidad",
        "hero.stat4": "Latencia Promedio",
        "platform.web": "Dashboard Web",
        "platform.discord": "Integración Discord",
        "platform.game": "Sync In-Game",
        "platform.realtime": "Eventos en Tiempo Real",
        "platform.secure": "Integración Anti-Cheat",
        "features.label": "Módulos Principales",
        "features.title": "Todo lo que tu equipo necesita. Nada más.",
        "features.sub": "Cuatro módulos de precisión que le dan a tu equipo una ventaja decisiva — desde el momento en que spawnás hasta la última hora del wipe.",
        "feat1.tag": "Puente de Equipo",
        "feat1.title": "Chat Multi-plataforma",
        "feat1.desc": "Unificá toda la comunicación del equipo en un solo flujo. Los mensajes enviados en Discord aparecen in-game, y viceversa, con cero delay y contexto completo.",
        "feat1.b1": "Sync Equipo → Discord",
        "feat1.b2": "Prefijo de comando personalizado",
        "feat1.b3": "Enrutamiento por rol",
        "feat1.b4": "Log de historial de mensajes",
        "feat2.tag": "Protocolo A2S",
        "feat2.title": "Monitor de Servidor Inteligente",
        "feat2.desc": "Polling en vivo vía A2S. Seguí el conteo de jugadores, cola, timer de wipe y salud del servidor en tiempo real en tu dashboard.",
        "feat2.b1": "Polling en tiempo real A2S",
        "feat2.b2": "Contador regresivo del wipe",
        "feat2.b3": "Gráficos de cola y población",
        "feat2.b4": "Umbrales de alerta personalizados",
        "feat3.tag": "Alertas Inteligentes",
        "feat3.title": "Notificaciones de Eventos",
        "feat3.desc": "Sé el primero en cada evento de alto valor. Alertas instantáneas para Cajas Bloqueadas, Petroleras, Cargo Ship, Patrulla Heli y Bradley.",
        "feat3.b1": "Crate Bloqueado & CH47",
        "feat3.b2": "Activación de Petrolera",
        "feat3.b3": "Ruta del Cargo Ship",
        "feat3.b4": "Bradley & Heli de Patrulla",
        "feat4.tag": "Scanner de Intel",
        "feat4.title": "Scanner de Perfil de Jugador",
        "feat4.desc": "Escaneá cualquier perfil Steam en profundidad. Cruzá bans (VAC, EAC, Game), horas jugadas, cuentas alternativas y stats de KDA antes de confiar en alguien.",
        "feat4.b1": "Bans VAC / EAC / Game",
        "feat4.b2": "Horas Steam & juegos",
        "feat4.b3": "KDA & historial de raids",
        "feat4.b4": "Detección de cuenta alternativa",
        "monitor.label": "Inteligencia en Vivo",
        "monitor.title": "Tu servidor, decodificado en tiempo real.",
        "monitor.sub": "El motor de inteligencia de RustPlusPlus procesa eventos del servidor en menos de 4ms, entregando datos accionables a cada nodo de la red de tu equipo simultáneamente.",
        "monitor.f1t": "Pipeline de eventos sub-5ms",
        "monitor.f1s": "Del evento del servidor a tu notificación",
        "monitor.f2t": "Redundancia multi-nodo",
        "monitor.f2s": "SLA garantizado de 99,98% de uptime",
        "monitor.f3t": "Capa de datos cifrada",
        "monitor.f3s": "Todos los flujos de intel están cifrados",
        "pricing.label": "Planes",
        "pricing.title": "Elección Simple. Intel Máxima.",
        "pricing.sub": "Las suscripciones se gestionan de forma privada. Contactá con un administrador para activar tu plan.",
        "plan1.name": "Explorador",
        "plan1.period": "Acceso Limitado",
        "plan1.f1": "1 monitor de servidor",
        "plan1.f2": "Puente de chat básico",
        "plan1.f3": "5 scans de jugadores / día",
        "plan1.f4": "Alertas de eventos inteligentes",
        "plan1.f5": "Soporte estándar",
        "plan1.cta": "Ingresar para Empezar",
        "plan2.badge": "Más Popular",
        "plan2.name": "Raider",
        "plan2.period": "Contacto para activación",
        "plan2.f1": "Hasta 5 servidores",
        "plan2.f2": "Puente de chat completo",
        "plan2.f3": "Scans de jugadores ilimitados",
        "plan2.f4": "Todas las alertas de eventos",
        "plan2.f5": "Soporte prioritario 24/7",
        "plan2.cta": "Contactar Admin",
        "plan3.name": "Señor de la Guerra",
        "plan3.period": "Enterprise / Equipo",
        "plan3.f1": "Servidores ilimitados",
        "plan3.f2": "Gestión multi-equipo",
        "plan3.f3": "Analytics avanzados",
        "plan3.f4": "Endpoints webhook personalizados",
        "plan3.f5": "Gerente de cuenta dedicado",
        "plan3.cta": "Contactar Admin",
        "faq.label": "Preguntas Frecuentes",
        "faq.title": "Dudas comunes.",
        "faq.q1": "¿Qué plataformas soporta RustPlusPlus?",
        "faq.a1": "RustPlusPlus es una herramienta de inteligencia completamente multi-plataforma. Funciona como dashboard Web accesible desde cualquier navegador, se integra con Discord y sincroniza con tu servidor Rust.",
        "faq.q2": "¿Cómo funciona el monitoreo de servidores?",
        "faq.a2": "Usamos el protocolo de consulta A2S (UDP) para hacer polling de tu servidor Rust cada pocos segundos, entregando datos en tiempo real sin necesidad de plugins.",
        "faq.q3": "¿Necesito acceso de admin a mi servidor Rust?",
        "faq.a3": "Para monitoreo básico y alertas de eventos, no se requiere acceso admin — solo el IP y puerto del servidor.",
        "faq.q4": "¿Qué tan preciso es el Scanner de Jugadores?",
        "faq.a4": "El scanner cruza la API pública de Steam, registros de ban de EAC y bases de datos de la comunidad.",
        "faq.q5": "¿La plataforma está disponible en otros idiomas?",
        "faq.a5": "Sí. RustPlusPlus está completamente localizado en inglés, portugués (Brasil) y español (LATAM).",
        "cta.title": "¿Listo para dominar cada wipe?",
        "cta.sub": "Unite a miles de equipos que ya usan la plataforma de inteligencia Rust más completa. Contactanos para empezar.",
        "cta.btn1": "Empezar Ahora",
        "cta.btn2": "Ver Todas las Funciones",
        "footer.privacy": "Privacidad",
        "footer.terms": "Términos",
        "footer.docs": "Documentación",
        "footer.status": "Estado",
        "footer.copy": "© 2026 RustPlusPlus. Todos los derechos reservados."
    }
};

const langMeta = {
    en: { flag: '🇺🇸', code: 'EN', label: 'English' },
    pt: { flag: '🇧🇷', code: 'PT', label: 'Português (BR)' },
    es: { flag: '🇦🇷', code: 'ES', label: 'Español (LATAM)' }
};

let currentLang = 'en';

function applyTranslations(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-419' : 'en';
}

function setLang(lang) {
    const meta = langMeta[lang];
    document.getElementById('currentFlag').textContent = meta.flag;
    document.getElementById('currentLangCode').textContent = meta.code;
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.lang === lang);
    });
    applyTranslations(lang);
    if (document.getElementById('langSelector')) {
        document.getElementById('langSelector').classList.remove('open');
    }
}

// Lang selector toggle
if (document.getElementById('langBtn')) {
    document.getElementById('langBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('langSelector').classList.toggle('open');
    });
}

document.querySelectorAll('.lang-option').forEach(opt => {
    opt.addEventListener('click', () => setLang(opt.dataset.lang));
});

document.addEventListener('click', () => {
    if (document.getElementById('langSelector')) {
        document.getElementById('langSelector').classList.remove('open');
    }
});

/* ═══════════════════
   FAQ TOGGLE
═══════════════════ */
window.toggleFAQ = function(id) {
    const item = document.getElementById(id);
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
};

/* ═══════════════════
   COUNTER ANIMATION
═══════════════════ */
function animateCounters() {
    document.querySelectorAll('.count-up').forEach(el => {
        const target = parseInt(el.dataset.target);
        const duration = 1800;
        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = Math.floor(current).toLocaleString();
        }, 16);
    });
}

const heroStatsEl = document.querySelector('.hero-stats');
if (heroStatsEl) {
    const heroObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            animateCounters();
            heroObserver.disconnect();
        }
    }, { threshold: 0.3 });
    heroObserver.observe(heroStatsEl);
}

/* ═══════════════════
   WIPE COUNTDOWN
═══════════════════ */
let wipeSeconds = 9841;
setInterval(() => {
    wipeSeconds = Math.max(0, wipeSeconds - 1);
    const h = String(Math.floor(wipeSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((wipeSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(wipeSeconds % 60).padStart(2, '0');
    const el = document.getElementById('wipeCountdown');
    if (el) el.textContent = `${h}:${m}:${s}`;
}, 1000);

/* ═══════════════════
   TERMINAL LIVE FEED
═══════════════════ */
const liveEvents = [
    { time: null, tag: '[ALERT]', tagClass: 't-tag', msg: 'CH47 incoming — ETA ', val: '90s' },
    { time: null, tag: '[SCAN]', tagClass: 't-tag-p', msg: 'Player ', val: 'ghost_zero', extra: ' — clean profile' },
    { time: null, tag: '[A2S]', tagClass: 't-tag-b', msg: 'Server pop ', val: '194/200' },
    { time: null, tag: '[CHAT]', tagClass: 't-tag-g', msg: 'Discord → Team: ', val: '"rotate north!"' },
    { time: null, tag: '[OIL]', tagClass: 't-tag', msg: 'Small Oil Rig active — ', val: 'scientists spawned' },
];
let evIdx = 0;

setInterval(() => {
    const termBody = document.getElementById('terminalBody');
    if (!termBody) return;
    const now = new Date();
    const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const ev = liveEvents[evIdx % liveEvents.length];
    evIdx++;
    const lines = termBody.querySelectorAll('.t-line');
    if (lines.length >= 12) lines[0].remove();
    const newLine = document.createElement('div');
    newLine.className = 't-line';
    newLine.style.animation = 'fadeIn 0.4s ease';
    newLine.innerHTML = `<span class="t-time">${t}</span> <span class="${ev.tagClass}">${ev.tag}</span> <span class="t-msg">${ev.msg}<span class="t-val">${ev.val}</span>${ev.extra || ''}</span>`;
    const lastLine = termBody.querySelector('.t-line:last-child');
    if (lastLine) termBody.insertBefore(newLine, lastLine);
    else termBody.appendChild(newLine);
}, 3200);

/* ═══════════════════
   SMOOTH NAV SCROLL
═══════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

/* init */
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations('es'); // Default to Spanish as requested
    setLang('es');
});
