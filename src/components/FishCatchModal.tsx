import React, { useState } from 'react';
import { FishCatch, FishSpecies } from '../types';
import { playSound } from '../utils/audio';
import { X, Check, Fish, Sparkles, MapPin } from 'lucide-react';

interface FishCatchModalProps {
  initialLat: number;
  initialLng: number;
  estimatedDepth: number | null;
  onSaveCatch: (catchItem: Omit<FishCatch, 'id'>) => void;
  onClose: () => void;
}

export default function FishCatchModal({
  initialLat,
  initialLng,
  estimatedDepth,
  onSaveCatch,
  onClose,
}: FishCatchModalProps) {
  const [species, setSpecies] = useState<FishSpecies>('Abborre');
  const [lengthCm, setLengthCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [depthM, setDepthM] = useState<string>(estimatedDepth ? estimatedDepth.toFixed(1) : '4.0');
  const [lure, setLure] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);

    playSound('catch');

    onSaveCatch({
      lat: initialLat,
      lng: initialLng,
      species,
      length_cm: lengthCm ? parseFloat(lengthCm) : undefined,
      weight_kg: weightKg ? parseFloat(weightKg) : undefined,
      depth_m: parseFloat(depthM) || 0,
      date: dateStr,
      time: timeStr,
      lure: lure.trim() || undefined,
      note: note.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-950/80 to-slate-900 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/60 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
              <Fish className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>Registrera Hugg / Fångst</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Plats: {initialLat.toFixed(4)}°N, {initialLng.toFixed(4)}°E
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Quick Species Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Fiskart
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Abborre', 'Gädda', 'Gös', 'Öring'] as FishSpecies[]).map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => setSpecies(sp)}
                  className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all text-center ${
                    species === sp
                      ? 'bg-emerald-950 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-950/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* Depth at catch */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs font-medium text-slate-300 block">Fångstdjup (meter)</span>
                <span className="text-[10px] text-slate-500">
                  {estimatedDepth ? `Uppskattat sjödjup här: ~${estimatedDepth.toFixed(1)}m` : 'Manuellt djup'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={depthM}
                onChange={(e) => setDepthM(e.target.value)}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-cyan-300 text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-slate-400 font-mono">m</span>
            </div>
          </div>

          {/* Size: Length & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Längd (cm)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="T.ex. 42"
                value={lengthCm}
                onChange={(e) => setLengthCm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                Vikt (kg)
              </label>
              <input
                type="number"
                step="0.05"
                placeholder="T.ex. 1.05"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Bait / Lure */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Bete / Metod
            </label>
            <input
              type="text"
              placeholder="T.ex. Dropshot kräfta, Shadjigg 14cm, Ned rig, Vobbler"
              value={lure}
              onChange={(e) => setLure(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
            {/* Quick bait tags */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {['Jigg', 'Dropshot', 'Ned rig', 'Vobbler', 'Spinnare'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setLure(b)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  +{b}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
              Anteckning om hugget
            </label>
            <input
              type="text"
              placeholder="T.ex. Tog på andra vevtaget på brantkanten"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Spara fångst på kartan ({species})</span>
          </button>
        </form>
      </div>
    </div>
  );
}
