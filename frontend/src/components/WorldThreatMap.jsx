import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { FaGlobe } from "react-icons/fa";
import "leaflet/dist/leaflet.css";

const HOTSPOTS = [
  { id: 1, lat: 4.711, lng: -74.072, label: "Colombia (Bogotá Hub)", risk: "alto" },
  { id: 2, lat: 40.7128, lng: -74.006, label: "EE.UU. (East Coast)", risk: "alto" },
  { id: 3, lat: 50.1109, lng: 8.6821, label: "Alemania (Frankfurt)", risk: "medio" },
  { id: 4, lat: 35.6762, lng: 139.6503, label: "Japón (Tokyo)", risk: "bajo" },
  { id: 5, lat: -23.5505, lng: -46.6333, label: "Brasil (São Paulo)", risk: "alto" },
  { id: 6, lat: 19.4326, lng: -99.1332, label: "México (CDMX)", risk: "alto" },
  { id: 7, lat: -34.6037, lng: -58.3816, label: "Argentina (Buenos Aires)", risk: "medio" },
  { id: 8, lat: 14.5995, lng: 120.9842, label: "Filipinas (Manila)", risk: "medio" },
  { id: 9, lat: 19.076, lng: 72.8777, label: "India (Mumbai)", risk: "bajo" },
];

const riskColors = { alto: "#ef4444", medio: "#eab308", bajo: "#00e5b4" };

function MapAnimator() {
  const map = useMap();
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      map.setView([15, 0], 1.8, { animate: true });
    }
  }, [map]);
  return null;
}

export default function WorldThreatMap() {
  const [beacons, setBeacons] = useState(HOTSPOTS);

  useEffect(() => {
    const interval = setInterval(() => {
      setBeacons((prev) =>
        prev.map((b) => ({
          ...b,
          risk: Math.random() > 0.7
            ? (["alto", "medio", "bajo"].filter((r) => r !== b.risk)[Math.floor(Math.random() * 2)] ?? b.risk)
            : b.risk,
        }))
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative bg-[#070911] border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col h-[320px]">
      <div className="flex items-center justify-between px-5 py-3 z-10 border-b border-slate-800/50">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <FaGlobe className="text-blue-500 animate-spin-slow" /> Threat Hotspot Map
        </h3>
        <div className="flex gap-3 text-[9px] font-mono">
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> Alto
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
          center={[15, 0]}
          zoom={1.8}
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
              radius={8}
              pathOptions={{
                color: riskColors[b.risk],
                fillColor: riskColors[b.risk],
                fillOpacity: 0.35,
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
