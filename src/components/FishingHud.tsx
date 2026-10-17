import { useState, useEffect, useRef } from 'react';
import { BoatPosition, CalculatedPoint } from '../types';
import { calculateDepth, estimateDepthAtLocation } from '../utils/depthCalc';
import { playSound } from '../utils/audio';
import { Navigation, Anchor, Fish, Locate, X, Check, Compass, AlertCircle } from 'lucide-react';

interface FishingHudProps {
  boatPosition: BoatPosition | null;
  points: CalculatedPoint[];
  sinkRate: number;
  onRecordSounding: (seconds: number, weight: number, lat: number, lng: number) => void;
  onOpenCatchLogger: (lat: number, lng: number, depth: number | null) => void;
  isAutoFollow: boolean;
  onToggleAutoFollow: () => void;
  onClose: () => void;
}

export default function FishingHud({
  boatPosition,
  points,
  sinkRate,
  onRecordSounding,
  onOpenCatchLogger,
  isAutoFollow,
  onToggleAutoFollow,
  onClose,
}: FishingHudProps) {
  // Drop sounding stopwatch
  const [isTiming, setIsTiming] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [leadWeight, setLeadWeight] = useState(20);
  const [justSavedDepth, setJustSavedDepth] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Depth under boat estimate
  const boatDepth = boatPosition
    ? estimateDepthAtLocation(boatPosition.lat, boatPosition.lng, points)
    : null;

  useEffect(() => {
    if (isTiming) {
      startTimeRef.current = performance.now();
      timerRef.current = window.setInterval(() => {
        const diff = (performance.now() - startTimeRef.current) / 1000;
        setSeconds(parseFloat(diff.toFixed(1)));
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
  }, [isTiming]);

  const handleStartDrop = () => {
    playSound('start');
    setSeconds(0);
    setIsTiming(true);
    setJustSavedDepth(null);
  };

  const handleBottomHit = () => {
    if (!isTiming) return;
    playSound('stop');
    setIsTiming(false);

    // Calculate depth
    const calcDepth = calculateDepth(seconds, leadWeight, sinkRate);
    const targetLat = boatPosition ? boatPosition.lat : 56.2805;
    const targetLng = boatPosition ? boatPosition.lng : 14.5020;

    onRecordSounding(seconds, leadWeight, targetLat, targetLng);
    setJustSavedDepth(calcDepth);

    setTimeout(() => {
      setJustSavedDepth(null);
      setSeconds(0);
    }, 2800);
  };

  const handleRecordCatch = () => {
    playSound('tap');
    const targetLat = boatPosition ? boatPosition.lat : 56.2805;
    const targetLng = boatPosition ? boatPosition.lng : 14.5020;
    onOpenCatchLogger(targetLat, targetLng, boatDepth);
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-[1050] pointer-events-none p-3 sm:p-4 flex flex-col items-center">
      {/* Container */}
      <div className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto text-slate-200">
        {/* Top telemetry bar */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-cyan-400">
              <Navigation className="w-4 h-4 fill-cyan-400/20" />
              <span>BÅTLÄGE</span>
            </span>

            {boatPosition ? (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>GPS Låst</span>
                {boatPosition.speedKnots !== null && boatPosition.speedKnots !== undefined && (
                  <span className="text-slate-400 ml-1">({boatPosition.speedKnots.toFixed(1)} kn)</span>
                )}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Väntar på GPS-signal...</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleAutoFollow}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 border transition-colors ${
                isAutoFollow
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Centrera kartan automatiskt när båten rör sig"
            >
              <Locate className="w-3 h-3" />
              <span>Följ båt</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              title="Lämna båtläge"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Depth under boat display & target zone */}
        <div className="px-4 py-3 bg-slate-900 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center border-b border-slate-800/80 text-center">
          {/* Depth under boat */}
          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Djup under båt</span>
            <span className="text-2xl font-bold font-mono text-cyan-300">
              {boatDepth !== null ? `${boatDepth.toFixed(1)}m` : '--'}
            </span>
          </div>

          {/* Sinker rate calibration */}
          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Sjunkfart (20g)</span>
            <span className="text-sm font-bold font-mono text-slate-200 block mt-1">
              {sinkRate.toFixed(2)} m/s
            </span>
          </div>

          {/* Quick Target Species depth guide */}
          <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 col-span-2 text-left">
            <span className="text-[10px] text-slate-400 uppercase font-mono block mb-0.5">
              Huggzoner Orsjön idag
            </span>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-emerald-400 font-semibold">Abborre: 3–5.5m</span>
              <span className="text-amber-400 font-semibold">Gädda: 1.5–3.5m</span>
              <span className="text-cyan-400 font-semibold">Gös: 7–10m</span>
            </div>
          </div>
        </div>

        {/* Big Action Buttons for Cold Hands / Boat Navigation */}
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60">
          {/* Quick Drop Sinker Action */}
          <div className="flex flex-col gap-2">
            {!isTiming ? (
              <button
                type="button"
                onClick={handleStartDrop}
                className="w-full py-4 px-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 active:scale-[0.98] text-slate-950 font-black rounded-xl text-base flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/60 transition-all cursor-pointer"
              >
                <Anchor className="w-5 h-5 stroke-[2.5]" />
                <span>SLÄPP SÄNKE (STARTA)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBottomHit}
                className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 active:scale-[0.98] text-white font-black rounded-xl text-base flex items-center justify-center gap-2 shadow-2xl animate-pulse cursor-pointer"
              >
                <span className="font-mono text-xl">{seconds.toFixed(1)}s</span>
                <span>— BOTTENKÄNNING!</span>
              </button>
            )}

            {/* Sinker weight selector */}
            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span>Blyvikt:</span>
              <div className="flex items-center gap-1 font-mono">
                {[15, 20, 25, 30].map((w) => (
                  <button
                    key={w}
                    onClick={() => setLeadWeight(w)}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      leadWeight === w
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {w}g
                  </button>
                ))}
              </div>
            </div>

            {justSavedDepth !== null && (
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs text-center font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Placerade lodning på {justSavedDepth.toFixed(1)}m vid båten!</span>
              </div>
            )}
          </div>

          {/* Quick Fish Strike / Catch Button */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleRecordCatch}
              className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.98] text-slate-950 font-black rounded-xl text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition-all cursor-pointer"
            >
              <Fish className="w-5 h-5 stroke-[2.5]" />
              <span>MARKERA HUGG / FÅNGST!</span>
            </button>

            <div className="text-[11px] text-slate-400 px-1 text-center">
              Sparar plats, djup och art (Abborre / Gädda / Gös) direkt på kartan.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
