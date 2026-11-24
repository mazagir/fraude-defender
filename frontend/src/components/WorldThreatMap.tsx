import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { FaGlobe } from "react-icons/fa";
import { API_BASE } from "../constants/riskConfig";
import "leaflet/dist/leaflet.css";

interface Hotspot {
  id: number;
  lat: number;
  lng: number;
  label: string;
  count: number;
  risk: string;
}

const COUNTRY_COORDS: Record<string, { lat: number; lng: number }> = {
  Colombia: { lat: 4.711, lng: -74.072 },
  México: { lat: 19.4326, lng: -99.1332 },
  Mexico: { lat: 19.4326, lng: -99.1332 },
  Argentina: { lat: -34.6037, lng: -58.3816 },
  Chile: { lat: -33.4489, lng: -70.6693 },
  Perú: { lat: -12.0464, lng: -77.0428 },
  Peru: { lat: -12.0464, lng: -77.0428 },
  Brasil: { lat: -23.5505, lng: -46.6333 },
  Ecuador: { lat: -0.1807, lng: -78.4678 },
  Uruguay: { lat: -34.9011, lng: -56.1645 },
  "Costa Rica": { lat: 9.9281, lng: -84.0907 },
  Guatemala: { lat: 14.6349, lng: -90.5069 },
  Paraguay: { lat: -25.2637, lng: -57.5759 },
  Panamá: { lat: 8.9824, lng: -79.5199 },
  Panama: { lat: 8.9824, lng: -79.5199 },
  "República Dominicana": { lat: 18.4861, lng: -69.9312 },
  Bolivia: { lat: -16.5, lng: -68.15 },
};

const riskColors: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#00e5b4",
};

function MapAnimator() {
  const map = useMap();
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      map.setView([0, -60], 2.5, { animate: true });
    }
  }, [map]);
  return null;
}

export default function WorldThreatMap(): React.ReactElement {
  const [beacons, setBeacons] = useState<Hotspot[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchThreats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/threat-intel?limit=100`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const events = Array.isArray(data.events) ? data.events : [];
        const countryAgg = new Map<string, { count: number; maxSeverity: string }>();

        events.forEach((ev: { country?: string; severity?: string }) => {
          const rawCountry = String(ev.country || "").trim();
          if (!rawCountry || rawCountry === "LATAM") return;
          const severity = ev.severity || "MEDIUM";
          const entry = countryAgg.get(rawCountry) || { count: 0, maxSeverity: "LOW" };
          entry.count += 1;
          if (severity === "CRITICAL") entry.maxSeverity = "CRITICAL";
          else if (severity === "HIGH" && entry.maxSeverity !== "CRITICAL") entry.maxSeverity = "HIGH";
          else if (severity === "MEDIUM" && entry.maxSeverity === "LOW") entry.maxSeverity = "MEDIUM";
          countryAgg.set(rawCountry, entry);
        });

        const newBeacons: Hotspot[] = [];
        countryAgg.forEach((entry, country) => {
          const coords = COUNTRY_COORDS[country];
          if (!coords) return;
          newBeacons.push({
            id: newBeacons.length + 1,
            lat: coords.lat + (Math.random() - 0.5) * 0.5,
            lng: coords.lng + (Math.random() - 0.5) * 0.5,
            label: `${country} (${entry.count})`,
            count: entry.count,
            risk: entry.maxSeverity,
          });
        });

        if (newBeacons.length > 0) setBeacons(newBeacons);
      } catch { /* offline */ }
    };

    fetchThreats();
    const interval = setInterval(fetchThreats, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <div className="w-full relative bg-[#070911] border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col h-[320px]">
      <div className="flex items-center justify-between px-5 py-3 z-10 border-b border-slate-800/50">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <FaGlobe className="text-blue-500 animate-spin-slow" /> Mapa de Amenazas LATAM
        </h3>
        <div className="flex gap-3 text-[9px] font-mono">
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> Crítico
          </span>
          <span className="flex items-center gap-1 text-orange-400">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Alto
          </span>
          <span className="flex items-center gap-1 text-yellow-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Medio
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Bajo
          </span>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        <MapContainer
          center={[0, -60]}
          zoom={2.5}
          zoomControl={false}
          attributionControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
          keyboard={false}
          className="w-full h-full"
          style={{ background: "#070911" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapAnimator />
          {beacons.map((b) => (
            <CircleMarker
              key={b.id}
              center={[b.lat, b.lng]}
              radius={Math.max(6, Math.min(12, b.count * 2))}
              pathOptions={{
                color: riskColors[b.risk] || "#eab308",
                fillColor: riskColors[b.risk] || "#eab308",
                fillOpacity: 0.4,
                weight: 2,
              }}
            >
              <Tooltip
                permanent
                direction="top"
                offset={[0, -10]}
                className="bg-slate-950/90 border border-slate-800 text-[9px] font-mono font-bold text-slate-300 px-2 py-1 rounded shadow-lg"
              >
                {b.label}
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
