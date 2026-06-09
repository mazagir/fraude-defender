import { useEffect, useState } from "react";
import { FaGlobe } from "react-icons/fa";

export default function WorldThreatMap() {
  const [beacons, setBeacons] = useState([
    { id: 1, x: 220, y: 150, risk: "alto", name: "EE.UU. (East)" },
    { id: 2, x: 310, y: 260, risk: "alto", name: "Colombia (Bogotá Hub)" },
    { id: 3, x: 480, y: 120, risk: "medio", name: "Alemania (Frankfurt)" },
    { id: 4, x: 720, y: 180, risk: "bajo", name: "Japón (Tokyo Server)" },
    { id: 5, x: 350, y: 310, risk: "alto", name: "Brasil (São Paulo)" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBeacons((prev) =>
        prev.map((b) => {
          if (Math.random() > 0.6) {
            const risks = ["alto", "medio", "bajo"];
            return { ...b, risk: risks[Math.floor(Math.random() * risks.length)] };
          }
          return b;
        })
      );
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full relative bg-[#070911] border border-slate-800/80 rounded-2xl p-5 overflow-hidden flex flex-col justify-between h-[300px]">
      <div className="absolute inset-0 cyber-grid-dots opacity-20 pointer-events-none" />
      <div className="flex justify-between items-center mb-2 z-10">
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

      <div className="flex-1 w-full flex items-center justify-center relative">
        <svg viewBox="0 0 900 400" className="w-full h-full max-h-[220px] opacity-25">
          <path
            d="M120 70 L 190 60 L 260 80 L 280 140 L 240 180 L 180 160 L 160 110 Z"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="1"
          />
          <path
            d="M260 210 L 310 220 L 360 270 L 340 360 L 310 370 L 280 290 Z"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="1"
          />
          <path
            d="M430 70 L 490 60 L 530 110 L 480 160 L 440 120 Z"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="1"
          />
          <path
            d="M440 180 L 510 180 L 560 230 L 530 320 L 490 320 L 460 230 Z"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="1"
          />
          <path
            d="M540 60 L 780 70 L 820 180 L 760 270 L 680 280 L 580 220 L 540 150 Z"
            fill="#1e293b"
            stroke="#334155"
            strokeWidth="1"
          />
          <path
            d="M 310 260 Q 400 100 480 120"
            fill="none"
            stroke="#2563eb"
            strokeWidth="1.5"
            strokeDasharray="5 5"
            className="animate-pulse"
          />
          <path
            d="M 220 150 Q 260 200 310 260"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <path
            d="M 310 260 Q 500 280 720 180"
            fill="none"
            stroke="#00e5b4"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </svg>

        {beacons.map((b) => (
          <div
            key={b.id}
            className="absolute"
            style={{
              left: `${(b.x / 900) * 100}%`,
              top: `${(b.y / 400) * 100}%`,
            }}
          >
            <span className="flex h-4 w-4 relative items-center justify-center -translate-x-1/2 -translate-y-1/2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${
                  b.risk === "alto" ? "bg-red-500" : b.risk === "medio" ? "bg-yellow-500" : "bg-emerald-500"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  b.risk === "alto" ? "bg-red-500" : b.risk === "medio" ? "bg-yellow-500" : "bg-emerald-500"
                } shadow-md`}
              />
            </span>
            <div className="absolute left-3 -top-2 scale-75 origin-left bg-slate-950/90 border border-slate-800 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded text-slate-300 hidden md:block select-none pointer-events-none">
              {b.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

