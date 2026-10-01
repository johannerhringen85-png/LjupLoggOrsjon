import React, { useState, useMemo } from 'react';
import { DepthPoint } from '../types';
import { parseGPX, SAMPLE_ORSJON_GPX, GpxParsedSummary, GpxImportOptions } from '../utils/gpxParser';
import { Upload, X, Check, FileCode, AlertCircle, Compass, Radio, Layers } from 'lucide-react';

interface GpxImportModalProps {
  currentPointsCount: number;
  sinkRate: number;
  onImportGpxPoints: (newPoints: DepthPoint[], mode: 'append' | 'replace') => void;
  onClose: () => void;
}

export default function GpxImportModal({
  currentPointsCount,
  sinkRate,
  onImportGpxPoints,
  onClose,
}: GpxImportModalProps) {
  const [gpxText, setGpxText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [leadWeight, setLeadWeight] = useState<number>(20);
  const [defaultSeconds, setDefaultSeconds] = useState<number>(5.0);
  const [thinningFactor, setThinningFactor] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File upload reader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setGpxText(text);
    };
    reader.onerror = () => {
      setErrorMessage('Kunde inte läsa in filen.');
    };
    reader.readAsText(file);
  };

  // Load sample GPX
  const handleLoadSample = () => {
    setGpxText(SAMPLE_ORSJON_GPX);
    setFileName('orsjon_batlogg_var2026.gpx');
    setErrorMessage(null);
  };

  // Options memo
  const options: GpxImportOptions = useMemo(() => ({
    leadWeight,
    defaultSeconds,
    sinkRate,
    thinningFactor,
  }), [leadWeight, defaultSeconds, sinkRate, thinningFactor]);

  // Parse result memo
  const parsedSummary: GpxParsedSummary | null = useMemo(() => {
    if (!gpxText.trim()) return null;
    try {
      setErrorMessage(null);
      return parseGPX(gpxText, options);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kunde inte tolka GPX-filen.';
      setErrorMessage(msg);
      return null;
    }
  }, [gpxText, options]);

  const handleConfirmImport = () => {
    if (!parsedSummary || parsedSummary.points.length === 0) {
      alert('Inga giltiga punkter att importera.');
      return;
    }

    onImportGpxPoints(parsedSummary.points, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Importera GPX-Spårlogg</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  GPS-data
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Läs in förinspelade GPS-spår och ekolodsloggar direkt till Orsjön
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

        {/* Body content */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {/* File Picker / Drop Zone */}
          {!gpxText ? (
            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-6 text-center bg-slate-950/60 transition-colors">
              <FileCode className="w-10 h-10 text-cyan-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-slate-200 mb-1">
                Välj eller släpp en .gpx spårfil här
              </p>
              <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                Stöder GPX från Garmin, Lowrance, Humminbird, OsmAnd, fiskekartor och handhållna GPS-enheter.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <label className="cursor-pointer px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition-all">
                  <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Bläddra efter GPX-fil</span>
                  <input
                    type="file"
                    accept=".gpx,application/gpx+xml,text/xml"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>Testa med Orsjön exempellogg (.gpx)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block truncate max-w-xs sm:max-w-md">
                    {fileName || 'Vald GPX-fil'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {parsedSummary ? `${parsedSummary.points.length} giltiga punkter identifierade` : 'Läser in...'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setGpxText('');
                  setFileName('');
                }}
                className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800"
              >
                Byt fil
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Parsed Summary & Import Settings */}
          {parsedSummary && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-mono">Spårpunkter</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {parsedSummary.points.length} st
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-mono">Spårnamn</span>
                  <span className="text-xs font-semibold text-cyan-300 block truncate" title={parsedSummary.trackName}>
                    {parsedSummary.trackName || 'Orsjön spår'}
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-mono">Tidsperiod</span>
                  <span className="text-[11px] text-slate-300 font-mono block truncate">
                    {parsedSummary.timeRange ? `${parsedSummary.timeRange.start.slice(5, 10)} ${parsedSummary.timeRange.start.slice(11, 16)}` : 'Ej angiven'}
                  </span>
                </div>
              </div>

              {/* Settings Grid */}
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-3 text-xs">
                <div className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                  Konverteringsinställningar
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">
                      Blyvikt vid lodning:
                    </label>
                    <select
                      value={leadWeight}
                      onChange={(e) => setLeadWeight(parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="15">15 gram</option>
                      <option value="20">20 gram (Standard)</option>
                      <option value="25">25 gram</option>
                      <option value="30">30 gram</option>
                      <option value="40">40 gram</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">
                      Punktglesning (Gallring):
                    </label>
                    <select
                      value={thinningFactor}
                      onChange={(e) => setThinningFactor(parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="1">Alla punkter (100% densitet)</option>
                      <option value="2">Varannan punkt (50% avlastning)</option>
                      <option value="3">Var 3:e punkt (33% snabbvy)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block text-[11px] mb-1">
                    Standard sjunktid om djup saknas i spåret:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="30"
                      value={defaultSeconds}
                      onChange={(e) => setDefaultSeconds(parseFloat(e.target.value) || 5.0)}
                      className="w-24 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-center font-mono text-cyan-300 text-xs focus:outline-none focus:border-cyan-500"
                    />
                    <span className="text-[11px] text-slate-500">sekunder (används om punkten saknar höjd/djup)</span>
                  </div>
                </div>
              </div>

              {/* Import Mode: Append vs Replace */}
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2 text-xs">
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] block">
                  Importera till kartan:
                </span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gpx-mode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="accent-cyan-400"
                    />
                    <span className="text-slate-200">
                      Lägg till ({currentPointsCount} befintliga behålls)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="gpx-mode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="accent-cyan-400"
                    />
                    <span className="text-slate-200">
                      Ersätt alla befintliga punkter i kartan
                    </span>
                  </label>
                </div>
              </div>

              {/* Preview table snippet */}
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1.5">
                  Förhandsgranskning av första punkterna
                </span>
                <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden max-h-32 overflow-y-auto">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="py-1 px-2.5">Lat</th>
                        <th className="py-1 px-2.5">Lng</th>
                        <th className="py-1 px-2.5">Tid (s)</th>
                        <th className="py-1 px-2.5">Anteckning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {parsedSummary.points.slice(0, 5).map((pt, i) => (
                        <tr key={i}>
                          <td className="py-1 px-2.5">{pt.lat.toFixed(4)}</td>
                          <td className="py-1 px-2.5">{pt.lng.toFixed(4)}</td>
                          <td className="py-1 px-2.5 text-emerald-400">{pt.seconds.toFixed(1)}s</td>
                          <td className="py-1 px-2.5 truncate max-w-xs text-slate-400">{pt.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTAs */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            {parsedSummary && (
              <span>
                Totalt att importera: <strong className="text-cyan-300">{parsedSummary.points.length}</strong> punkter
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={!parsedSummary || parsedSummary.points.length === 0}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-950/50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Importera till Orsjön ({parsedSummary?.points.length || 0})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
