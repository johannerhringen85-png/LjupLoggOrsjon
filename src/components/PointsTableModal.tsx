import { useState, useMemo } from 'react';
import { CalculatedPoint } from '../types';
import { X, Search, Trash2, ArrowUpDown, Download, Crosshair, FileSpreadsheet } from 'lucide-react';
import { exportToCSV } from '../utils/depthCalc';

interface PointsTableModalProps {
  points: CalculatedPoint[];
  sinkRate: number;
  selectedPointId: string | null;
  onSelectPoint: (point: CalculatedPoint) => void;
  onDeletePoint: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  onExportJSON: () => void;
}

export default function PointsTableModal({
  points,
  sinkRate,
  selectedPointId,
  onSelectPoint,
  onDeletePoint,
  onClearAll,
  onClose,
  onExportJSON,
}: PointsTableModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'depth' | 'seconds' | 'weight' | 'date'>('depth');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredPoints = useMemo(() => {
    let result = points.filter((p) => {
      const query = searchTerm.toLowerCase();
      return (
        p.id.toLowerCase().includes(query) ||
        (p.note && p.note.toLowerCase().includes(query)) ||
        p.date.includes(query) ||
        p.calculatedDepth.toString().includes(query)
      );
    });

    result.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortField === 'depth') {
        valA = a.calculatedDepth;
        valB = b.calculatedDepth;
      } else if (sortField === 'seconds') {
        valA = a.seconds;
        valB = b.seconds;
      } else if (sortField === 'weight') {
        valA = a.weight_g;
        valB = b.weight_g;
      } else if (sortField === 'date') {
        valA = `${a.date} ${a.time}`;
        valB = `${b.date} ${b.time}`;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [points, searchTerm, sortField, sortOrder]);

  const toggleSort = (field: 'depth' | 'seconds' | 'weight' | 'date') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    const csvStr = exportToCSV(points, sinkRate);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orsjon_djupdata_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-100">Datapunkter ({points.length} st)</h2>
            <span className="text-xs text-slate-400 font-mono">
              Kalibrering: {sinkRate.toFixed(2)} m/s
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportera CSV</span>
            </button>
            <button
              onClick={onExportJSON}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exportera JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Sök på anteckning, datum, djup..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Är du säker på att du vill radera samtliga lodningspunkter?')) {
                  onClearAll();
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded hover:bg-rose-950/40 border border-rose-900/50 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Rensa alla</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {filteredPoints.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              Inga lodningspunkter matchar din sökning.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 sticky top-0 text-[11px] uppercase tracking-wider text-slate-400">
                  <th
                    onClick={() => toggleSort('depth')}
                    className="py-3 px-4 cursor-pointer hover:text-cyan-300 font-semibold"
                  >
                    <div className="flex items-center gap-1">
                      <span>Djup</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('seconds')}
                    className="py-3 px-3 cursor-pointer hover:text-cyan-300 font-semibold"
                  >
                    <div className="flex items-center gap-1">
                      <span>Sjunktid</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('weight')}
                    className="py-3 px-3 cursor-pointer hover:text-cyan-300 font-semibold"
                  >
                    <div className="flex items-center gap-1">
                      <span>Blyvikt</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 font-semibold">Koordinater</th>
                  <th
                    onClick={() => toggleSort('date')}
                    className="py-3 px-3 cursor-pointer hover:text-cyan-300 font-semibold"
                  >
                    <div className="flex items-center gap-1">
                      <span>Tid & Datum</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-semibold">Anteckning</th>
                  <th className="py-3 px-3 text-right font-semibold">Åtgärd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPoints.map((point) => {
                  const isSelected = point.id === selectedPointId;
                  return (
                    <tr
                      key={point.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-cyan-950/40 text-cyan-200' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono font-bold text-cyan-300 text-sm">
                        {point.calculatedDepth.toFixed(1)} m
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400">
                        {point.seconds.toFixed(1)} s
                      </td>
                      <td className="py-2.5 px-3 font-mono text-amber-400">
                        {point.weight_g} g
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                        {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {point.date} {point.time}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 max-w-xs truncate" title={point.note}>
                        {point.note || <span className="text-slate-600 italic">-</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              onSelectPoint(point);
                              onClose();
                            }}
                            title="Visa på kartan"
                            className="p-1 hover:text-cyan-400 text-slate-400 rounded hover:bg-slate-800"
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeletePoint(point.id)}
                            title="Radera punkt"
                            className="p-1 hover:text-rose-400 text-slate-500 rounded hover:bg-slate-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
