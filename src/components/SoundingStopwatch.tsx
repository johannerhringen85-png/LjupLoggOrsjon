import { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, Anchor, MapPin, Check, Plus } from 'lucide-react';
import { calculateDepth } from '../utils/depthCalc';
import { DepthPoint } from '../types';

interface SoundingStopwatchProps {
  sinkRate: number;
  onSavePoint: (newPoint: Omit<DepthPoint, 'id'>) => void;
  pendingCoords: { lat: number; lng: number } | null;
  onTriggerMapPick: () => void;
  onClose: () => void;
}

export default function SoundingStopwatch({
  sinkRate,
  onSavePoint,
  pendingCoords,
  onTriggerMapPick,
  onClose,
}: SoundingStopwatchProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds with decimal
  const [weight, setWeight] = useState(20); // grams
  const [note, setNote] = useState('');
  const [latInput, setLatInput] = useState(pendingCoords ? pendingCoords.lat.toFixed(5) : '56.2805');
  const [lngInput, setLngInput] = useState(pendingCoords ? pendingCoords.lng.toFixed(5) : '14.5020');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (pendingCoords) {
      setLatInput(pendingCoords.lat.toFixed(5));
      setLngInput(pendingCoords.lng.toFixed(5));
    }
  }, [pendingCoords]);

  // Stopwatch ticking
  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now() - elapsedTime * 1000;
      timerRef.current = window.setInterval(() => {
        const now = performance.now();
        const diff = (now - startTimeRef.current) / 1000;
        setElapsedTime(parseFloat(diff.toFixed(1)));
      }, 50);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
  };

  const currentCalculatedDepth = calculateDepth(elapsedTime, weight, sinkRate);

  const handleSave = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Ange giltiga koordinater (latitud och longitud).');
      return;
    }

    if (elapsedTime <= 0) {
      alert('Sjunktiden måste vara större än 0 sekunder.');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);

    onSavePoint({
      lat,
      lng,
      seconds: elapsedTime,
      weight_g: weight,
      date: dateStr,
      time: timeStr,
      note: note.trim() || undefined,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-md p-5 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Anchor className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">Live Lodningsur</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
          >
            Stäng (Esc)
          </button>
        </div>

        {/* Stopwatch Visual Display */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center mb-4 relative overflow-hidden">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">
            Sjunktid till bottenkontakt
          </div>
          <div className="text-4xl font-mono font-bold text-cyan-300 tracking-tight">
            {elapsedTime.toFixed(1)} <span className="text-lg font-sans font-normal text-slate-500">sek</span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Beräknat djup</span>
              <span className="text-xl font-bold text-emerald-400">{currentCalculatedDepth.toFixed(1)} m</span>
            </div>
            <div className="border-l border-slate-800 pl-4">
              <span className="text-slate-500 block text-[10px] uppercase">Aktuell kalibrering</span>
              <span className="text-slate-300">{sinkRate.toFixed(2)} m/s (20g)</span>
            </div>
          </div>
        </div>

        {/* Stopwatch Controls */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={handleToggleTimer}
            className={`py-2.5 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/40'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Bottenkänning!</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Starta släpp</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={isRunning}
            className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 text-sm font-medium flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Nollställ</span>
          </button>
        </div>

        {/* Lead Weight Picker */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Sänkblyets vikt (gram)
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {[10, 15, 20, 25, 30, 40].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeight(w)}
                className={`py-1.5 text-xs font-mono rounded border transition-colors ${
                  weight === w
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {w}g
              </button>
            ))}
          </div>
        </div>

        {/* Coordinates Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Plats på kartan
            </label>
            <button
              type="button"
              onClick={onTriggerMapPick}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" />
              <span>Peka ut på kartan</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5">Latitud</span>
              <input
                type="text"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5">Longitud</span>
              <input
                type="text"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Note / Description */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Anteckning (valfritt)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="T.ex. Brant kant utanför udden, hård stenbotten"
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Save CTA */}
        <button
          onClick={handleSave}
          disabled={elapsedTime <= 0 || savedSuccess}
          className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
            savedSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Sparad i djupkartan!</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Spara lodningspunkt ({currentCalculatedDepth.toFixed(1)}m)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
