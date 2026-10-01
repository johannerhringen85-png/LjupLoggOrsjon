import { useState, useMemo } from 'react';
import { CalculatedPoint } from '../types';
import { exportToCSV, exportToGeoJSON, exportToNativeJSON } from '../utils/depthCalc';
import { Download, X, Copy, Check, FileCode, FileSpreadsheet, FileText } from 'lucide-react';

export type ExportFormat = 'geojson' | 'csv' | 'json';

interface ExportModalProps {
  displayedPoints: CalculatedPoint[];
  allPoints: CalculatedPoint[];
  sinkRate: number;
  onClose: () => void;
}

export default function ExportModal({
  displayedPoints,
  allPoints,
  sinkRate,
  onClose,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('geojson');
  const [exportScope, setExportScope] = useState<'displayed' | 'all'>('displayed');
  const [copied, setCopied] = useState(false);

  const activePoints = exportScope === 'displayed' ? displayedPoints : allPoints;

  const exportedContent = useMemo(() => {
    if (selectedFormat === 'geojson') {
      return exportToGeoJSON(activePoints, sinkRate);
    }
    if (selectedFormat === 'csv') {
      return exportToCSV(activePoints, sinkRate);
    }
    return exportToNativeJSON(activePoints, sinkRate);
  }, [activePoints, selectedFormat, sinkRate]);

  const fileExtension = selectedFormat === 'geojson' ? 'geojson' : selectedFormat === 'csv' ? 'csv' : 'json';
  const mimeType =
    selectedFormat === 'geojson'
      ? 'application/geo+json'
      : selectedFormat === 'csv'
      ? 'text/csv;charset=utf-8;'
      : 'application/json';

  const fileName = `orsjon_djupdata_${exportScope === 'displayed' ? 'visade' : 'alla'}_${new Date()
    .toISOString()
    .slice(0, 10)}.${fileExtension}`;

  const handleDownload = () => {
    const blob = new Blob([exportedContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
      alert('Kunde inte kopiera till urklipp.');
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden text-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Exportera Kartdata</h2>
              <p className="text-xs text-slate-400">Välj format och ladda ned lodningsdata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {/* Format Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Välj exportformat
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* GeoJSON */}
              <button
                type="button"
                onClick={() => setSelectedFormat('geojson')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedFormat === 'geojson'
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 shadow-md shadow-cyan-950/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold">GeoJSON</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  För GIS, QGIS, ArcGIS och navigationssystem (WGS84).
                </p>
              </button>

              {/* CSV */}
              <button
                type="button"
                onClick={() => setSelectedFormat('csv')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedFormat === 'csv'
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">CSV</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  För Excel, kalkylark, Lowrance &amp; Garmin-import.
                </p>
              </button>

              {/* Native JSON */}
              <button
                type="button"
                onClick={() => setSelectedFormat('json')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedFormat === 'json'
                    ? 'bg-blue-950/70 border-blue-500 text-blue-200 shadow-md shadow-blue-950/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold">JSON</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Strukturerad lodningslogg för återimport i kartan.
                </p>
              </button>
            </div>
          </div>

          {/* Scope Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              2. Välj datamängd
            </label>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="export-scope"
                  checked={exportScope === 'displayed'}
                  onChange={() => setExportScope('displayed')}
                  className="accent-cyan-400"
                />
                <span className="text-slate-200">
                  Endast för närvarande visade/filtrerade kartdata ({displayedPoints.length} punkter)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="export-scope"
                  checked={exportScope === 'all'}
                  onChange={() => setExportScope('all')}
                  className="accent-cyan-400"
                />
                <span className="text-slate-200">
                  Samtliga datapunkter i Orsjön ({allPoints.length} punkter)
                </span>
              </label>
            </div>
          </div>

          {/* File Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Förhandsgranskning ({fileName})
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopierat!' : 'Kopiera text'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap select-all leading-snug">
              {exportedContent.slice(0, 800)}
              {exportedContent.length > 800 && '\n... [fler rader]'}
            </pre>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono">
            <span>Kalibrering: </span>
            <span className="text-cyan-400 font-bold">{sinkRate.toFixed(2)} m/s</span>
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
              onClick={handleDownload}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-950/50"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Ladda ned {fileExtension.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
