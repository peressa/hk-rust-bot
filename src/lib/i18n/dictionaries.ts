export type Language = 'en' | 'es' | 'pt';

export const dictionaries = {
  en: {
    nav: {
      ops: 'OPERATIONS',
      intel: 'INTEL',
      comms: 'COMMS',
      login: 'DEPLOY TERMINAL'
    },
    hero: {
      suite: '// CLAN INTELLIGENCE SUITE',
      title: 'RUST OPS',
      subtitle: 'TOTAL TACTICAL DOMINANCE. REAL-TIME SERVER DATA FOR HIGH-TIER OPERATIONS.',
      cta: 'RECLAIM ACCESS'
    },
    modules: {
      title: 'MISSION MODULES',
      radar: {
        title: 'FIELD RADAR',
        desc: 'Triangulate member positions and enemy signatures via secure satellite uplink.'
      },
      kia: {
        title: 'KIA ALERTS',
        desc: 'Instant Discord notifications on member casualties with precise enemy coordinates.'
      },
      raid: {
        title: 'RAID ALERT',
        desc: 'Stay connected 24/7. Detect nearby combat and unauthorized structure changes.'
      },
      smart: {
        title: 'SMART CONTROL',
        desc: 'Manage your base electrical grid and CCTV cameras from any remote terminal.'
      }
    },
    pricing: {
      title: 'SUBSCRIPTION PLANS',
      monthly: {
        type: 'RECURRING OP-SEC',
        title: 'TACTICAL MONTH',
        desc: 'Full access to all Sentinel modules. Billed every 30 days. Cancel anytime.',
        price: '$3.99',
        price_sub: '/ MONTH',
        cta: 'SUBSCRIBE NOW'
      },
      annual: {
        type: 'BEST VALUE (40% SAVINGS)',
        title: 'STRATEGIC ANNUAL',
        desc: 'The dedicated survivor\'s choice. 12 months of total dominance for $2.33/mo equivalent.',
        price: '$27.99',
        price_sub: '/ YEAR',
        cta: 'GET ANNUAL PASS'
      }
    },
    footer: {
      restrictions: 'RESTRICCIONES: ESTA HERRAMIENTA NO ESTÁ AFILIADA CON FACEPUNCH STUDIOS.',
      dev: 'Developed by peressa.dev'
    },
    unauthorized: {
      title: 'OFFLINE OPERATIONS',
      desc: 'ID-64 {id} HAS NO ACTIVE CONTRACT.',
      return: 'RETURN TO MAIN TERMINAL',
      loading: 'INITIALIZING SECURE LINK...'
    }
  },
  es: {
    nav: {
      ops: 'OPERACIONES',
      intel: 'INTEL',
      comms: 'COMMS',
      login: 'DESPLEGAR TERMINAL'
    },
    hero: {
      suite: '// SUITE DE INTELIGENCIA DE CLAN',
      title: 'RUST OPS',
      subtitle: 'DOMINIO TÁCTICO TOTAL. DATOS DE SERVIDOR EN TIEMPO REAL PARA OPERACIONES DE ALTO NIVEL.',
      cta: 'RECLAMAR ACCESO'
    },
    modules: {
      title: 'MÓDULOS DE MISIÓN',
      radar: {
        title: 'RADAR DE CAMPO',
        desc: 'Triangulación de posiciones de miembros y firmas enemigas mediante enlace satelital seguro.'
      },
      kia: {
        title: 'ALERTAS KIA',
        desc: 'Notificaciones instantáneas de Discord sobre bajas de miembros con coordenadas precisas del enemigo.'
      },
      raid: {
        title: 'ALERTA DE RAID',
        desc: 'Mantente conectado 24/7. Detecta combate cercano y cambios de estructura no autorizados.'
      },
      smart: {
        title: 'CONTROL INTELIGENTE',
        desc: 'Gestiona la red eléctrica de tu base y cámaras CCTV desde cualquier terminal remoto.'
      }
    },
    pricing: {
      title: 'PLANES DE SUSCRIPCIÓN',
      monthly: {
        type: 'OP-SEC RECURRENTE',
        title: 'MES TÁCTICO',
        desc: 'Acceso total a todos los módulos. Facturado cada 30 días. Cancela en cualquier momento.',
        price: '$3.99',
        price_sub: '/ MES',
        cta: 'SUSCRIBIRSE AHORA'
      },
      annual: {
        type: 'MEJOR VALOR (40% AHORRO)',
        title: 'ANUAL ESTRATÉGICO',
        desc: 'La elección del superviviente dedicado. 12 meses de dominio total por el equivalente a $2.33/mes.',
        price: '$27.99',
        price_sub: '/ AÑO',
        cta: 'OBTENER PASE ANUAL'
      }
    },
    footer: {
      restrictions: 'RESTRICCIONES: ESTA HERRAMIENTA NO ESTÁ AFILIADA CON FACEPUNCH STUDIOS.',
      dev: 'Desarrollado por peressa.dev'
    },
    unauthorized: {
      title: 'OPERACIONES OFFLINE',
      desc: 'ID-64 {id} NO TIENE UN CONTRATO ACTIVO.',
      return: 'VOLVER AL TERMINAL PRINCIPAL',
      loading: 'INICIALIZANDO ENLACE SEGURO...'
    }
  },
  pt: {
    nav: {
      ops: 'OPERAÇÕES',
      intel: 'INTEL',
      comms: 'COMMS',
      login: 'IMPLANTAR TERMINAL'
    },
    hero: {
      suite: '// SUÍTE DE INTELIGÊNCIA DE CLÃ',
      title: 'RUST OPS',
      subtitle: 'DOMÍNIO TÁTICO TOTAL. DADOS DO SERVIDOR EM TEMPO REAL PARA OPERAÇÕES DE ALTO NÍVEL.',
      cta: 'RECLAMAR ACESSO'
    },
    modules: {
      title: 'MÓDULOS DE MISSÃO',
      radar: {
        title: 'RADAR DE CAMPO',
        desc: 'Triangulação de posições de membros e assinaturas de inimigos via link de satélite seguro.'
      },
      kia: {
        title: 'ALERTAS KIA',
        desc: 'Notificações instantâneas de Discord sobre baixas de membros com coordenadas precisas do inimigo.'
      },
      raid: {
        title: 'ALERTA DE RAID',
        desc: 'Mantenha-se conectado 24/7. Detecte combate próximo e alterações estruturais não autorizadas.'
      },
      smart: {
        title: 'CONTROLE INTELIGENTE',
        desc: 'Gerencie a rede elétrica de sua base e câmeras CCTV de qualquer terminal remoto.'
      }
    },
    pricing: {
      title: 'PLANOS DE ASSINATURA',
      monthly: {
        type: 'OP-SEC RECORRENTE',
        title: 'MÊS TÁTICO',
        desc: 'Acesso total a todos os módulos. Faturado a cada 30 dias. Cancele a cualquier momento.',
        price: '$3.99',
        price_sub: '/ MÊS',
        cta: 'INSCREVA-SE AGORA'
      },
      annual: {
        type: 'MELHOR VALOR (40% ECONOMIA)',
        title: 'ANUAL ESTRATÉGICO',
        desc: 'A escolha do sobrevivente dedicado. 12 meses de domínio total pelo equivalente a $2.33/mês.',
        price: '$27.99',
        price_sub: '/ ANO',
        cta: 'OBTER PASSE ANUAL'
      }
    },
    footer: {
      restrictions: 'RESTRIÇÕES: ESTA FERRAMENTA NÃO É AFILIADA AO FACEPUNCH STUDIOS.',
      dev: 'Desenvolvido por peressa.dev'
    },
    unauthorized: {
      title: 'OPERAÇÕES OFFLINE',
      desc: 'ID-64 {id} NÃO TEM UM CONTRATO ATIVO.',
      return: 'VOLTAR AO TERMINAL PRINCIPAL',
      loading: 'INICIALIZANDO LINK SEGURO...'
    }
  }
};
