export type LockedSectionId = 'riskScore' | 'amenazas' | 'insignias' | 'trends' | 'mapa' | 'leaderboard' | 'historial';

export interface LockedSectionItem {
  ctaText: string;
  benefitText: string;
}

export const LOCKED_SECTIONS: Record<LockedSectionId, LockedSectionItem> = {
  riskScore: {
    ctaText: "Calcular Mi Riesgo",
    benefitText: "Monitorea tu nivel de exposición en tiempo real",
  },
  amenazas: {
    ctaText: "Monitorear Filtraciones",
    benefitText: "Rastrea si tus credenciales están en la Dark Web",
  },
  insignias: {
    ctaText: "Reclamar Mis +30 XP",
    benefitText: "Sube de nivel en la comunidad de seguridad",
  },
  trends: {
    ctaText: "Ver Estadísticas Completas",
    benefitText: "Accede al análisis predictivo de vectores de ataque",
  },
  mapa: {
    ctaText: "Desbloquear Mapa en Vivo",
    benefitText: "Visualiza ataques de phishing geolocalizados en LATAM",
  },
  leaderboard: {
    ctaText: "Ver Ranking Completos",
    benefitText: "Compite protegiendo a tu comunidad local",
  },
  historial: {
    ctaText: "Guardar Mi Historial",
    benefitText: "Nunca pierdas el rastro de los enlaces verificados",
  },
};
