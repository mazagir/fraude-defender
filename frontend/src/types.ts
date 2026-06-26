export type RiskLevel = 'critical' | 'alto' | 'medio' | 'bajo';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ScanType = 'url' | 'whatsapp' | 'mensaje' | 'message' | 'correo' | 'email' | 'qr';

export interface ScanResult {
  score: number;
  level: Severity;
  explanation: string;
  recommendations: string[];
  indicators: string[];
}

export interface UserData {
  email: string;
  nombre: string;
  rol: string;
}

export interface FraudReport {
  id: number;
  titulo: string;
  tipo: string;
  descripcion: string;
  url?: string;
  riesgo: string;
  score: number;
  creado_en: string;
  usuario_id?: number;
  ubicacion?: string;
  pais?: string;
}

export interface ScanHistoryEntry {
  id: number;
  tipo: string;
  contenido: string;
  score: number;
  nivel_riesgo: string;
  creado_en: string;
}

export interface ThreatIntel {
  total_threats: number;
  active_iocs: number;
  countries_monitored: number;
  top_threats: { tipo: string; count: number }[];
  recent_events: ThreatEvent[];
}

export interface ThreatEvent {
  id?: string;
  tipo: string;
  severidad: string;
  origen: string;
  pais: string;
  timestamp: string;
  indicador: string;
  score: number;
  descripcion?: string;
}

export interface TelemetryEvent {
  id?: string;
  type: string;
  severity: string;
  source: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}

export interface TelemetryMetrics {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface GamificationState {
  reputation: number;
  badges: string[];
  level?: string;
}

export interface LoginResponse {
  access_token: string;
  token?: string;
  usuario?: {
    email: string;
    nombre: string;
    rol: string;
  };
}


