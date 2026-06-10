import { useState } from 'react';

export default function useStreak() {
  const [streak, setStreak] = useState(() =>
    parseInt(localStorage.getItem('aegis_streak') || '0')
  );

  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('aegis_last_scan_date');
    if (lastDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = lastDate === yesterday.toDateString();
    const newStreak = isConsecutive ? streak + 1 : 1;
    setStreak(newStreak);
    localStorage.setItem('aegis_streak', String(newStreak));
    localStorage.setItem('aegis_last_scan_date', today);
  };

  return { streak, updateStreak };
}
