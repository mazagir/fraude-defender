import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function UrgencyCTA() {
  const [count, setCount] = useState(37);
  useEffect(() => {
    const iv = setInterval(() => {
      setCount((prev) => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 8000);
    return () => clearInterval(iv);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-slate-400"
    >
      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
      <span className="text-red-400">{count}</span> amenazas críticas detectadas hoy en LATAM
    </motion.div>
  );
}
