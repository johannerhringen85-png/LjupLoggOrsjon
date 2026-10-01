import React, { useRef } from 'react';
import { Upload, RotateCcw, Sliders, ChevronRight, Download, SlidersHorizontal, MapPin, Info } from 'lucide-react';
import { CalculatedPoint, DepthStats, LakePreset } from '../types';
import { ORSJON_PRESETS } from '../data/orsjonSampleData';

interface SidebarProps {
  stats: DepthStats;
  sinkRate: number;
  onSinkRateChange: (newRate: number) => void;
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRestoreSampleData: () => void;
  onExportJSON: () => void;
  filterDepthRange: [number, number];
  onFilterDepthRangeChange: (range: [number, number]) => void;
  onSelectPreset: (preset: LakePreset) => void;
  selectedPoint: CalculatedPoint | null;
  onDeselectPoint: () => void;
  onDeletePoint: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  stats,
  sinkRate,
  onSinkRateChange,
  onImportFile,
  onRestoreSampleData,
  onExportJSON,
  filterDepthRange,
  onFilterDepthRangeChange,
  onSelectPreset,
  selectedPoint,
  onDeselectPoint,
  onDeletePoint,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0 && val <= 5.0) {
      onSinkRateChange(parseFloat(val.toFixed(2)));
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSinkRateChange(parseFloat(val.toFixed(2)));
  };

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 z-20 shrink-0 select-none overflow-y-auto ${
        isCollapsed ? 'w-0 -ml-80 md:w-16 md:ml-0' : 'w-full md:w-84'
      }`}
    >
      {/* Title & Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-cyan-400 tracking-wider mb-0.5">DJUPKARTA</h1>
          <p className="text-[11px] text-slate-400 uppercase tracking-widest font-mono">
            Orsjön Lodningsanalys
          </p>
        </div>
        <button
          onClick={onToggleCollapse}
          className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800"
          title="Fäll in/ut sidomeny"
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Import & Data Source */}
        <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Importera Loggdata</span>
            <span className="text-[10px] text-slate-500 font-mono">JSON / CSV</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={onImportFile}
            className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
          />

          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={onRestoreSampleData}
              className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
              title="Ladda om de förinställda lodningspunkterna för Orsjön"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Återställ Orsjön-data</span>
            </button>

            <button
              onClick={onExportJSON}
              className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
              title="Spara ned punkterna som en JSON-fil"
            >
              <Download className="w-3 h-3" />
              <span>Spara fil</span>
            </button>
          </div>
        </div>

        {/* Real-Time Calibration (Sjunkhastighet) */}
        <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Kalibrering (Sjunkhastighet)</span>
            </h3>
            <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
              {sinkRate.toFixed(2)} m/s
            </span>
          </div>

          <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
            Hur många meter per sekund sjunker ett 20g bly? Djupvärden uppdateras direkt i realtid på kartan.
          </p>

          {/* Stepper + Unit input */}
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              value={sinkRate}
              onChange={handleRateInputChange}
              step="0.05"
              min="0.1"
              max="3.0"
              className="w-20 bg-slate-900 border border-slate-700 text-center text-cyan-300 font-mono font-bold rounded p-1.5 text-xs focus:outline-none focus:border-cyan-500"
            />
            <span className="text-xs text-slate-400 font-mono">m/s (referens 20g)</span>
          </div>

          {/* Precision Slider Rail */}
          <div className="space-y-1 mb-2">
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.05"
              value={sinkRate}
              onChange={handleSliderChange}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0.2 m/s (Långsamt)</span>
              <span>0.8 (Standard)</span>
              <span>2.0 m/s (Snabbt)</span>
            </div>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => onSinkRateChange(0.6)}
              className={`py-1 px-1.5 text-[10px] rounded border text-center font-mono transition-colors ${
                sinkRate === 0.6
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              0.60 m/s
            </button>
            <button
              onClick={() => onSinkRateChange(0.8)}
              className={`py-1 px-1.5 text-[10px] rounded border text-center font-mono transition-colors ${
                sinkRate === 0.8
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              0.80 m/s
            </button>
            <button
              onClick={() => onSinkRateChange(1.05)}
              className={`py-1 px-1.5 text-[10px] rounded border text-center font-mono transition-colors ${
                sinkRate === 1.05
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              1.05 m/s
            </button>
          </div>
        </div>

        {/* Selected Point Details Panel (if a point is selected on map) */}
        {selectedPoint && (
          <div className="bg-cyan-950/40 p-3.5 rounded-lg border border-cyan-500/50 shadow-lg animate-in fade-in">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-900/60">
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Markerad punkt</span>
              </span>
              <button
                onClick={onDeselectPoint}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                Stäng
              </button>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <span className="text-slate-400 text-xs">Aktuellt djup:</span>
              <span className="text-2xl font-mono font-bold text-cyan-300">
                {selectedPoint.calculatedDepth.toFixed(1)} m
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Sjunktid</span>
                <span className="text-emerald-400 font-bold">{selectedPoint.seconds} s</span>
              </div>
              <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Blyvikt</span>
                <span className="text-amber-400 font-bold">{selectedPoint.weight_g} g</span>
              </div>
            </div>

            {selectedPoint.note && (
              <p className="text-[11px] text-slate-300 italic mb-2 bg-slate-900/60 p-2 rounded border border-slate-800/60">
                "{selectedPoint.note}"
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-cyan-900/40 text-[10px] text-slate-400">
              <span>{selectedPoint.date} {selectedPoint.time}</span>
              <button
                onClick={() => onDeletePoint(selectedPoint.id)}
                className="text-rose-400 hover:text-rose-300"
              >
                Radera punkt
              </button>
            </div>
          </div>
        )}

        {/* Depth Filter Slider */}
        <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              <span>Djupfilter</span>
            </span>
            <span className="text-[11px] font-mono text-cyan-300">
              {filterDepthRange[0]}m – {filterDepthRange[1]}m
            </span>
          </div>
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max={Math.max(15, Math.ceil(stats.maxDepth))}
              step="0.5"
              value={filterDepthRange[1]}
              onChange={(e) => onFilterDepthRangeChange([filterDepthRange[0], parseFloat(e.target.value)])}
              className="w-full accent-blue-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>Visa alla &le; {filterDepthRange[1]}m</span>
              <button
                onClick={() => onFilterDepthRangeChange([0, 25])}
                className="text-cyan-400 hover:underline"
              >
                Återställ filter
              </button>
            </div>
          </div>
        </div>

        {/* Lake Presets & Zones */}
        <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
          <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Snabbnavigering Orsjön</span>
          </h4>
          <div className="space-y-1">
            {ORSJON_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onSelectPreset(preset)}
                className="w-full text-left p-1.5 rounded hover:bg-slate-800/80 text-xs text-slate-300 hover:text-cyan-300 flex items-center justify-between transition-colors group"
              >
                <div className="truncate">
                  <span className="font-medium block truncate">{preset.name}</span>
                  <span className="text-[10px] text-slate-500 truncate block">
                    {preset.description}
                  </span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lake Depth Stats Summary Card (Pinned to bottom of sidebar) */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 mt-auto">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Sjöstatistik</span>
          <span className="text-cyan-400 font-mono">Realtid</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Datapunkter</div>
            <div id="stat-points" className="text-xl font-mono text-emerald-400 font-bold tabular-nums">
              {stats.totalPoints}
            </div>
          </div>

          <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Maxdjup</div>
            <div id="stat-max" className="text-xl font-mono text-blue-400 font-bold tabular-nums">
              {stats.maxDepth > 0 ? `${stats.maxDepth.toFixed(1)}m` : '0m'}
            </div>
          </div>

          <div className="bg-slate-900 p-2 rounded border border-slate-800/80 col-span-1">
            <div className="text-[9px] text-slate-500 uppercase font-mono">Medeldjup</div>
            <div className="text-sm font-mono text-cyan-300 font-semibold tabular-nums">
              {stats.avgDepth > 0 ? `${stats.avgDepth.toFixed(1)}m` : '-'}
            </div>
          </div>

          <div className="bg-slate-900 p-2 rounded border border-slate-800/80 col-span-1">
            <div className="text-[9px] text-slate-500 uppercase font-mono">Djupa hålor (&gt;6m)</div>
            <div className="text-sm font-mono text-indigo-400 font-semibold tabular-nums">
              {stats.deepSpotsCount} st
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
