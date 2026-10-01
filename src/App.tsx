import { useState, useMemo, useEffect, useCallback } from 'react';
import { DepthPoint, CalculatedPoint, LakePreset } from './types';
import { INITIAL_ORSJON_DATA } from './data/orsjonSampleData';
import { calculateDepth, calculateStats, parseCSV } from './utils/depthCalc';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import DepthMap from './components/DepthMap';
import SoundingStopwatch from './components/SoundingStopwatch';
import PointsTableModal from './components/PointsTableModal';
import ExportModal from './components/ExportModal';
import GpxImportModal from './components/GpxImportModal';

const STORAGE_KEY_POINTS = 'orsjon_depth_points_v1';
const STORAGE_KEY_SINKRATE = 'orsjon_sink_rate_v1';

export default function App() {
  // Load persisted points or initial sample dataset
  const [points, setPoints] = useState<DepthPoint[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_POINTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_ORSJON_DATA;
  });

  // Base sink rate for 20g lead (m/s)
  const [sinkRate, setSinkRate] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SINKRATE);
      if (stored) {
        const parsed = parseFloat(stored);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return 0.8;
  });

  // UI States
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [isStopwatchOpen, setIsStopwatchOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGpxModalOpen, setIsGpxModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [filterDepthRange, setFilterDepthRange] = useState<[number, number]>([0, 30]);
  const [showDepthLabels, setShowDepthLabels] = useState(false);
  const [showBathymetrySurface, setShowBathymetrySurface] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapRadius, setHeatmapRadius] = useState(35);

  // Persist points when updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_POINTS, JSON.stringify(points));
    } catch {
      // Storage quota or private browsing
    }
  }, [points]);

  // Persist sink rate when updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SINKRATE, sinkRate.toString());
    } catch {
      // Storage quota
    }
  }, [sinkRate]);

  // Real-Time Depth recalculation
  // SPEC REQUIREMENT: When sink rate is adjusted, dynamically update depth values for all points and max depth!
  const calculatedPoints: CalculatedPoint[] = useMemo(() => {
    return points.map((p) => {
      const depth = calculateDepth(p.seconds, p.weight_g, sinkRate);
      return {
        ...p,
        calculatedDepth: depth,
      };
    });
  }, [points, sinkRate]);

  // Filtered points currently visible/displayed on the map
  const displayedPoints = useMemo(() => {
    return calculatedPoints.filter(
      (p) => p.calculatedDepth >= filterDepthRange[0] && p.calculatedDepth <= filterDepthRange[1]
    );
  }, [calculatedPoints, filterDepthRange]);

  // Real-time lake depth statistics
  const stats = useMemo(() => {
    return calculateStats(calculatedPoints);
  }, [calculatedPoints]);

  // Selected point object
  const selectedPoint = useMemo(() => {
    if (!selectedPointId) return null;
    return calculatedPoints.find((p) => p.id === selectedPointId) || null;
  }, [selectedPointId, calculatedPoints]);

  // File import handler (JSON / CSV)
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let newPoints: DepthPoint[] = [];

        if (file.name.endsWith('.csv')) {
          newPoints = parseCSV(text);
        } else {
          // JSON
          const data = JSON.parse(text);
          if (!Array.isArray(data)) {
            throw new Error('Filen innehåller inte en giltig array av lodningspunkter.');
          }

          newPoints = data.map((item, index) => {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lng);
            const seconds = parseFloat(item.seconds);
            const weight_g = item.weight_g !== undefined ? parseFloat(item.weight_g) : 20;

            if (isNaN(lat) || isNaN(lng) || isNaN(seconds)) {
              throw new Error(`Ogiltiga data på rad/index ${index + 1}`);
            }

            return {
              id: item.id ? String(item.id) : `p-${Date.now()}-${index}`,
              lat,
              lng,
              seconds,
              weight_g: isNaN(weight_g) ? 20 : weight_g,
              date: item.date || new Date().toISOString().slice(0, 10),
              time: item.time || '12:00',
              note: item.note || undefined,
            };
          });
        }

        if (newPoints.length === 0) {
          alert('Inga giltiga punkter hittades i filen.');
          return;
        }

        setPoints(newPoints);
        setSelectedPointId(null);
        alert(`Klart! Laddade in ${newPoints.length} lodningspunkter.`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Kunde inte läsa filen.';
        alert(`Fel vid import: ${message}`);
      }
    };

    reader.readAsText(file);
    // Reset file input value so user can upload same file after edit if desired
    e.target.value = '';
  };

  // Restore sample Orsjön dataset
  const handleRestoreSampleData = () => {
    if (confirm('Vill du återställa till standard lodningsdata för Orsjön? Eventuella egna osparade punkter skrivs över.')) {
      setPoints(INITIAL_ORSJON_DATA);
      setSelectedPointId(null);
    }
  };

  // Export current dataset to JSON
  const handleExportJSON = () => {
    const jsonString = JSON.stringify(points, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orsjon_djupkarta_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Add new sounding point from Stopwatch or Map Click
  const handleSaveNewPoint = (newPointData: Omit<DepthPoint, 'id'>) => {
    const newPoint: DepthPoint = {
      ...newPointData,
      id: `pt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setPoints((prev) => [newPoint, ...prev]);
    setSelectedPointId(newPoint.id);
  };

  // Delete a point
  const handleDeletePoint = (id: string) => {
    setPoints((prev) => prev.filter((p) => p.id !== id));
    if (selectedPointId === id) {
      setSelectedPointId(null);
    }
  };

  // Clear all points
  const handleClearAll = () => {
    setPoints([]);
    setSelectedPointId(null);
  };

  // GPX import handler
  const handleImportGpxPoints = (newPoints: DepthPoint[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setPoints(newPoints);
    } else {
      setPoints((prev) => [...newPoints, ...prev]);
    }
    setSelectedPointId(null);
  };

  // Trigger map coordinate picker mode
  const handleTriggerMapPick = () => {
    setIsStopwatchOpen(false);
    setIsAddMode(true);
  };

  // Handle map click to place new point
  const handleMapClickToRecord = useCallback((lat: number, lng: number) => {
    setPendingCoords({ lat, lng });
    setIsAddMode(false);
    setIsStopwatchOpen(true);
  }, []);

  // Quick preset jump
  const handleSelectPreset = (preset: LakePreset) => {
    // Look for a point near the preset coordinates or focus view
    const nearby = calculatedPoints.find(
      (p) => Math.abs(p.lat - preset.lat) < 0.003 && Math.abs(p.lng - preset.lng) < 0.003
    );
    if (nearby) {
      setSelectedPointId(nearby.id);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Bar with Brand & Actions */}
      <TopBar
        onOpenStopwatch={() => {
          setPendingCoords(null);
          setIsStopwatchOpen(true);
        }}
        onOpenTable={() => setIsTableModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenGpxImport={() => setIsGpxModalOpen(true)}
        pointsCount={points.length}
      />

      {/* Main Workspace: Sidebar + Map */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Control Sidebar */}
        <Sidebar
          stats={stats}
          sinkRate={sinkRate}
          onSinkRateChange={setSinkRate}
          onImportFile={handleImportFile}
          onRestoreSampleData={handleRestoreSampleData}
          onOpenExport={() => setIsExportModalOpen(true)}
          onOpenGpxImport={() => setIsGpxModalOpen(true)}
          onExportJSON={handleExportJSON}
          filterDepthRange={filterDepthRange}
          onFilterDepthRangeChange={setFilterDepthRange}
          onSelectPreset={handleSelectPreset}
          selectedPoint={selectedPoint}
          onDeselectPoint={() => setSelectedPointId(null)}
          onDeletePoint={handleDeletePoint}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Map Stage */}
        <main className="flex-1 relative h-full">
          <DepthMap
            points={calculatedPoints}
            maxDepth={stats.maxDepth}
            sinkRate={sinkRate}
            selectedPointId={selectedPointId}
            onSelectPoint={(p) => setSelectedPointId(p ? p.id : null)}
            onMapClickToRecord={handleMapClickToRecord}
            isAddMode={isAddMode}
            filterDepthRange={filterDepthRange}
            showDepthLabels={showDepthLabels}
            onToggleDepthLabels={() => setShowDepthLabels(!showDepthLabels)}
            showBathymetrySurface={showBathymetrySurface}
            onToggleBathymetrySurface={() => setShowBathymetrySurface(!showBathymetrySurface)}
            showHeatmap={showHeatmap}
            onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
            heatmapRadius={heatmapRadius}
            onHeatmapRadiusChange={setHeatmapRadius}
          />
        </main>
      </div>

      {/* Live Sounding Stopwatch Modal */}
      {isStopwatchOpen && (
        <SoundingStopwatch
          sinkRate={sinkRate}
          onSavePoint={handleSaveNewPoint}
          pendingCoords={pendingCoords}
          onTriggerMapPick={handleTriggerMapPick}
          onClose={() => setIsStopwatchOpen(false)}
        />
      )}

      {/* Points Data Table & Management Modal */}
      {isTableModalOpen && (
        <PointsTableModal
          points={calculatedPoints}
          sinkRate={sinkRate}
          selectedPointId={selectedPointId}
          onSelectPoint={(p) => setSelectedPointId(p.id)}
          onDeletePoint={handleDeletePoint}
          onClearAll={handleClearAll}
          onClose={() => setIsTableModalOpen(false)}
          onExportJSON={() => setIsExportModalOpen(true)}
        />
      )}

      {/* Selectable Data Export Modal (CSV, GeoJSON, JSON) */}
      {isExportModalOpen && (
        <ExportModal
          displayedPoints={displayedPoints}
          allPoints={calculatedPoints}
          sinkRate={sinkRate}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* Secondary GPX Import Flow Modal */}
      {isGpxModalOpen && (
        <GpxImportModal
          currentPointsCount={points.length}
          sinkRate={sinkRate}
          onImportGpxPoints={handleImportGpxPoints}
          onClose={() => setIsGpxModalOpen(false)}
        />
      )}
    </div>
  );
}
