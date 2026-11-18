import type { RiskLevel } from '../types';

type MonthlyEntry = {
  name: string;
  [key: string]: string | number;
}

interface TrendEntry {
  name: string;
  reportes: number;
}

export const riskColor: Record<string, string> = {
  alto: "#ff4d6d",
  medio: "#ffb547",
  bajo: "#00e5b4",
};

export const riskBg: Record<string, string> = {
  alto: "rgba(255,77,109,0.12)",
  medio: "rgba(255,181,71,0.12)",
  bajo: "rgba(0,229,180,0.1)",
};

export function getRiskLevel(score: number): RiskLevel {
  const s = Number(score ?? 0);
  if (s >= 70) return "alto";
  if (s >= 40) return "medio";
  return "bajo";
}

export function buildMonthlyData(reports: Record<string, unknown>[]): MonthlyEntry[] {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const map: Record<string, MonthlyEntry> = {};
  months.forEach((m) => {
    map[m] = { name: m, alto: 0, medio: 0, bajo: 0 };
  });

  (reports || []).forEach((r: Record<string, unknown>) => {
    const date = new Date((r.creado_en as string) || (r.created_at as string) || Date.now());
    const key = months[date.getMonth()];
    const lvl = getRiskLevel((r.score_riesgo as number) ?? (r.risk_score as number) ?? 0);
    if (map[key]) (map[key][lvl] as number)++;
  });

  return Object.values(map);
}

export function buildTrendData(reports: Record<string, unknown>[]): TrendEntry[] {
  const days: Record<string, TrendEntry> = {};
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toLocaleDateString("es-CO", { weekday: "short" });
    days[key] = { name: key, reportes: 0 };
  }

  (reports || []).forEach((r: Record<string, unknown>) => {
    const d = new Date((r.creado_en as string) || (r.created_at as string) || Date.now());
    if (now - d.getTime() <= 7 * 86400000) {
      const key = d.toLocaleDateString("es-CO", { weekday: "short" });
      if (days[key]) days[key].reportes++;
    }
  });

  return Object.values(days);
}

