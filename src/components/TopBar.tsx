import { Compass, Plus, Table2, Download, Route } from 'lucide-react';

interface TopBarProps {
  onOpenStopwatch: () => void;
  onOpenTable: () => void;
  onOpenExport: () => void;
  onOpenGpxImport: () => void;
  pointsCount: number;
}

export default function TopBar({
  onOpenStopwatch,
  onOpenTable,
  onOpenExport,
  onOpenGpxImport,
  pointsCount,
}: TopBarProps) {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
          <Compass className="w-4 h-4" />
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Orsjön Djupkarta
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation / Info items */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <span className="text-cyan-400 font-semibold">Lodningsanalys</span>
        <span>Blekinge / Olofström</span>
        <span>WGS84</span>
        <button
          onClick={onOpenTable}
          className="hover:text-slate-200 transition-colors"
        >
          Databas ({pointsCount} punkter)
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenGpxImport}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-sm"
          title="Importera förinspelat GPS-spår eller ekolodslogg (.gpx)"
        >
          <Route className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">GPX</span>
        </button>

        <button
          onClick={onOpenExport}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-sm"
          title="Exportera kartdata som CSV, GeoJSON eller JSON"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Exportera</span>
        </button>

        <button
          onClick={onOpenTable}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <Table2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Punkter</span>
          <span className="font-mono text-cyan-400">({pointsCount})</span>
        </button>

        <button
          onClick={onOpenStopwatch}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-md shadow-cyan-950/40"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Ny lodning</span>
        </button>
      </div>
    </header>
  );
}
