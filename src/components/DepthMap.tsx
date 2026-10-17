import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import * as d3 from 'd3';
import { CalculatedPoint, MapTileProvider, FishCatch, FishSpecies, BoatPosition } from '../types';
import { getDepthColor, getMarkerRadius } from '../utils/depthCalc';
import { Layers, Crosshair, ZoomIn, ZoomOut, Locate, Eye, EyeOff, Radio, Flame, Fish, Navigation } from 'lucide-react';

interface DepthMapProps {
  points: CalculatedPoint[];
  maxDepth: number;
  sinkRate: number;
  selectedPointId: string | null;
  onSelectPoint: (point: CalculatedPoint | null) => void;
  onMapClickToRecord?: (lat: number, lng: number) => void;
  isAddMode: boolean;
  filterDepthRange: [number, number];
  showDepthLabels: boolean;
  onToggleDepthLabels: () => void;
  showBathymetrySurface: boolean;
  onToggleBathymetrySurface: () => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  heatmapRadius: number;
  onHeatmapRadiusChange: (radius: number) => void;
  catches: FishCatch[];
  showCatches: boolean;
  onToggleCatches: () => void;
  boatPosition: BoatPosition | null;
  isFishingMode: boolean;
  onToggleFishingMode: () => void;
  isAutoFollow: boolean;
}

const TILE_LAYERS: Record<MapTileProvider, { name: string; url: string; attribution: string; maxZoom: number }> = {
  dark: {
    name: 'Mörk hydrografisk',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19
  },
  satellite: {
    name: 'Satellit (ESRI)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19
  },
  street: {
    name: 'Sjökort / Terräng',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  },
  topo: {
    name: 'CartoDB Ljus',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19
  }
};

export default function DepthMap({
  points,
  maxDepth,
  sinkRate,
  selectedPointId,
  onSelectPoint,
  onMapClickToRecord,
  isAddMode,
  filterDepthRange,
  showDepthLabels,
  onToggleDepthLabels,
  showBathymetrySurface,
  onToggleBathymetrySurface,
  showHeatmap,
  onToggleHeatmap,
  heatmapRadius,
  onHeatmapRadiusChange,
  catches,
  showCatches,
  onToggleCatches,
  boatPosition,
  isFishingMode,
  onToggleFishingMode,
  isAutoFollow,
}: DepthMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const catchesLayerRef = useRef<L.LayerGroup | null>(null);
  const boatLayerRef = useRef<L.LayerGroup | null>(null);
  const driftHistoryRef = useRef<[number, number][]>([]);
  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const markersMapRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const selectedRingRef = useRef<L.CircleMarker | null>(null);

  const [currentZoom, setCurrentZoom] = useState<number>(14);
  const [activeTile, setActiveTile] = useState<MapTileProvider>('dark');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [56.2805, 14.5020],
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
      minZoom: 9,
      maxZoom: 19,
    });

    // Default tile
    const initialTile = TILE_LAYERS.dark;
    tileLayerRef.current = L.tileLayer(initialTile.url, {
      attribution: initialTile.attribution,
      maxZoom: initialTile.maxZoom,
      subdomains: 'abcd',
    }).addTo(map);

    // Markers layer
    markersLayerRef.current = L.layerGroup().addTo(map);
    catchesLayerRef.current = L.layerGroup().addTo(map);
    boatLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    setCurrentZoom(map.getZoom());

    // Listen to zoom events for dynamic marker sizing
    const handleZoom = () => {
      const newZoom = map.getZoom();
      setCurrentZoom(newZoom);
    };

    map.on('zoom', handleZoom);
    map.on('zoomend', handleZoom);

    // Listen to mouse movement for coordinate HUD
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    map.on('mouseout', () => {
      setMouseCoords(null);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update base tile layer when activeTile changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = TILE_LAYERS[activeTile];
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom,
      subdomains: 'abcd',
    }).addTo(map);

    // Ensure markers stay above tile layer
    if (markersLayerRef.current) {
      markersLayerRef.current.eachLayer((layer) => {
        if ('bringToFront' in layer && typeof (layer as L.Path).bringToFront === 'function') {
          (layer as L.Path).bringToFront();
        }
      });
    }
  }, [activeTile]);

  // Handle map click for adding points
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isAddMode && onMapClickToRecord) {
        onMapClickToRecord(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isAddMode, onMapClickToRecord]);

  // Build / update popup HTML
  const createPopupContent = useCallback((p: CalculatedPoint, currentMaxDepth: number) => {
    const color = getDepthColor(p.calculatedDepth, currentMaxDepth);
    return `
      <div class="p-1 min-w-[190px]">
        <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/80">
          <span class="text-xs font-semibold tracking-wide text-slate-300">Lodningspunkt</span>
          <span class="font-mono text-[10px] text-slate-400">ID: ${p.id.slice(-6)}</span>
        </div>
        
        <div class="flex items-baseline gap-2 mb-2.5">
          <div class="text-2xl font-bold font-mono text-cyan-300" style="color: ${color === '#1e3a8a' ? '#60a5fa' : color}">
            ${p.calculatedDepth.toFixed(1)} <span class="text-xs font-sans font-normal text-slate-400">m djup</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-1.5 text-xs text-slate-300 mb-2 font-mono">
          <div class="bg-slate-800/80 px-2 py-1 rounded border border-slate-700/50">
            <span class="text-[10px] uppercase text-slate-400 block">Sjunktid</span>
            <span class="text-emerald-400 font-semibold">${p.seconds.toFixed(1)}s</span>
          </div>
          <div class="bg-slate-800/80 px-2 py-1 rounded border border-slate-700/50">
            <span class="text-[10px] uppercase text-slate-400 block">Sänkbly</span>
            <span class="text-amber-400 font-semibold">${p.weight_g}g</span>
          </div>
        </div>

        ${p.note ? `<div class="text-[11px] text-slate-300 bg-slate-800/50 p-1.5 rounded border border-slate-700/30 mb-2 italic">"${p.note}"</div>` : ''}

        <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800 font-mono">
          <span>${p.date} ${p.time}</span>
          <span>${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}</span>
        </div>
      </div>
    `;
  }, []);

  // Update dynamic marker radius when currentZoom changes
  // SPEC REQUIREMENT: Smaller markers at high zoom levels, larger at lower zoom levels
  useEffect(() => {
    const targetRadius = getMarkerRadius(currentZoom);
    markersMapRef.current.forEach((marker) => {
      marker.setRadius(targetRadius);
    });

    if (selectedRingRef.current) {
      selectedRingRef.current.setRadius(targetRadius + 5);
    }
  }, [currentZoom]);

  // Synchronize points, depths, colors, and markers in real-time
  // SPEC REQUIREMENT: When sink rate is adjusted, dynamically update depth values for all points and max depth without re-upload!
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    const [minFilter, maxFilter] = filterDepthRange;
    const currentRadius = getMarkerRadius(currentZoom);
    const existingMap = markersMapRef.current;

    // Filter points based on user's active depth filter
    const visiblePoints = points.filter(
      p => p.calculatedDepth >= minFilter && p.calculatedDepth <= maxFilter
    );
    const visibleIds = new Set(visiblePoints.map(p => p.id));

    // Remove markers that are no longer present or filtered out
    existingMap.forEach((marker, id) => {
      if (!visibleIds.has(id)) {
        layer.removeLayer(marker);
        existingMap.delete(id);
      }
    });

    // Update existing markers or add new ones
    visiblePoints.forEach(p => {
      const color = getDepthColor(p.calculatedDepth, maxDepth);
      const popupHtml = createPopupContent(p, maxDepth);
      const isSelected = p.id === selectedPointId;

      if (existingMap.has(p.id)) {
        // Dynamically update existing marker style and popup
        const marker = existingMap.get(p.id)!;
        marker.setLatLng([p.lat, p.lng]);
        marker.setStyle({
          fillColor: color,
          color: isSelected ? '#38bdf8' : '#0f172a',
          weight: isSelected ? 2.5 : 1.2,
          radius: currentRadius,
          fillOpacity: 0.88,
        });

        // Update popup content in place
        const popup = marker.getPopup();
        if (popup) {
          popup.setContent(popupHtml);
          if (marker.isPopupOpen()) {
            popup.update();
          }
        } else {
          marker.bindPopup(popupHtml, { className: 'custom-popup' });
        }

        // Update tooltip smoothly if depth labels are active
        const tooltip = marker.getTooltip();
        if (showDepthLabels) {
          if (tooltip) {
            marker.setTooltipContent(`${p.calculatedDepth.toFixed(1)}m`);
          } else {
            marker.bindTooltip(`${p.calculatedDepth.toFixed(1)}m`, {
              permanent: true,
              direction: 'top',
              className: 'depth-tooltip',
              offset: [0, -currentRadius],
            });
          }
        } else if (tooltip) {
          marker.unbindTooltip();
        }
      } else {
        // Create new marker
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: currentRadius,
          fillColor: color,
          color: isSelected ? '#38bdf8' : '#0f172a',
          weight: isSelected ? 2.5 : 1.2,
          opacity: 1,
          fillOpacity: 0.88,
        });

        marker.bindPopup(popupHtml, { className: 'custom-popup' });

        if (showDepthLabels) {
          marker.bindTooltip(`${p.calculatedDepth.toFixed(1)}m`, {
            permanent: true,
            direction: 'top',
            className: 'depth-tooltip',
            offset: [0, -currentRadius],
          });
        }

        marker.on('click', () => {
          onSelectPoint(p);
        });

        marker.addTo(layer);
        existingMap.set(p.id, marker);
      }
    });

    // Handle selected ring marker
    if (selectedRingRef.current) {
      layer.removeLayer(selectedRingRef.current);
      selectedRingRef.current = null;
    }

    if (selectedPointId) {
      const selected = points.find(p => p.id === selectedPointId);
      if (selected) {
        const ring = L.circleMarker([selected.lat, selected.lng], {
          radius: currentRadius + 6,
          fillColor: 'transparent',
          color: '#38bdf8',
          weight: 2,
          dashArray: '4, 4',
          opacity: 0.9,
          interactive: false,
        }).addTo(layer);
        selectedRingRef.current = ring;
      }
    }
  }, [
    points,
    maxDepth,
    sinkRate,
    selectedPointId,
    filterDepthRange,
    showDepthLabels,
    currentZoom,
    createPopupContent,
    onSelectPoint
  ]);

  // Center on selected point if requested
  useEffect(() => {
    if (!selectedPointId || !mapInstanceRef.current) return;
    const pt = points.find(p => p.id === selectedPointId);
    if (pt) {
      mapInstanceRef.current.panTo([pt.lat, pt.lng], { animate: true, duration: 0.5 });
      const marker = markersMapRef.current.get(selectedPointId);
      if (marker && !marker.isPopupOpen()) {
        marker.openPopup();
      }
    }
  }, [selectedPointId, points]);

  // Bathymetric interpolated surface overlay (Canvas IDW)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const canvas = canvasOverlayRef.current;
    if (!map || !canvas) return;

    if (!showBathymetrySurface || points.length < 3) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const renderSurface = () => {
      const bounds = map.getBounds();
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Only interpolate for points inside / near current viewport
      const validPoints = points.map(p => {
        const point = map.latLngToContainerPoint([p.lat, p.lng]);
        return {
          x: point.x,
          y: point.y,
          depth: p.calculatedDepth,
        };
      }).filter(p => p.x >= -100 && p.x <= size.x + 100 && p.y >= -100 && p.y <= size.y + 100);

      if (validPoints.length < 3) return;

      // Inverse Distance Weighting (IDW) interpolation on a lightweight grid
      const step = 20; // 20px sampling grid
      const cols = Math.ceil(size.x / step);
      const rows = Math.ceil(size.y / step);
      const maxInfluenceDist = 220; // max pixel distance of effect

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const gx = c * step;
          const gy = r * step;

          let num = 0;
          let den = 0;
          let closestDist = Infinity;

          for (let i = 0; i < validPoints.length; i++) {
            const vp = validPoints[i];
            const dx = gx - vp.x;
            const dy = gy - vp.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < closestDist) closestDist = dist;

            if (dist < maxInfluenceDist) {
              const weight = 1 / Math.pow(Math.max(dist, 10), 2);
              num += vp.depth * weight;
              den += weight;
            }
          }

          // If too far from any sounding, do not render water
          if (den > 0 && closestDist < maxInfluenceDist) {
            const estDepth = num / den;
            const ratio = maxDepth > 0 ? Math.min(1, Math.max(0, estDepth / maxDepth)) : 0;
            // Opacity fades out towards edge of soundings
            const edgeFade = Math.max(0, 1 - (closestDist / maxInfluenceDist));
            const alpha = 0.32 * edgeFade;

            // Map color
            let rgb = '103, 232, 249'; // Cyan
            if (ratio > 0.75) rgb = '30, 58, 138'; // Deep blue
            else if (ratio > 0.5) rgb = '29, 78, 216';
            else if (ratio > 0.25) rgb = '6, 182, 212';

            ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
            ctx.fillRect(gx - step / 2, gy - step / 2, step + 1, step + 1);
          }
        }
      }
    };

    renderSurface();
    map.on('moveend', renderSurface);
    map.on('zoomend', renderSurface);

    return () => {
      map.off('moveend', renderSurface);
      map.off('zoomend', renderSurface);
    };
  }, [showBathymetrySurface, points, maxDepth, currentZoom]);

  // D3 Density Heatmap Overlay for Point Concentration
  useEffect(() => {
    const map = mapInstanceRef.current;
    const canvas = heatmapCanvasRef.current;
    if (!map || !canvas) return;

    if (!showHeatmap || points.length === 0) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Precalculate D3 Turbo Color Lookup Table (256 color steps)
    const colorLUT = new Uint8ClampedArray(256 * 4);
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      const c = d3.rgb(d3.interpolateTurbo(t));
      colorLUT[i * 4] = c.r;
      colorLUT[i * 4 + 1] = c.g;
      colorLUT[i * 4 + 2] = c.b;
      // Smooth alpha ramp
      colorLUT[i * 4 + 3] = i < 8 ? 0 : Math.min(210, Math.round(35 + t * 165));
    }

    const renderHeatmap = () => {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const radius = Math.max(15, heatmapRadius);
      const [minFilter, maxFilter] = filterDepthRange;
      const activePoints = points.filter(
        p => p.calculatedDepth >= minFilter && p.calculatedDepth <= maxFilter
      );

      if (activePoints.length === 0) return;

      // Pass 1: Accumulate alpha density
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = size.x;
      shadowCanvas.height = size.y;
      const shadowCtx = shadowCanvas.getContext('2d');
      if (!shadowCtx) return;

      // Radial brush
      const brushCanvas = document.createElement('canvas');
      brushCanvas.width = radius * 2;
      brushCanvas.height = radius * 2;
      const brushCtx = brushCanvas.getContext('2d');
      if (brushCtx) {
        const grad = brushCtx.createRadialGradient(radius, radius, 0, radius, radius, radius);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
        grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.22)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        brushCtx.fillStyle = grad;
        brushCtx.fillRect(0, 0, radius * 2, radius * 2);
      }

      activePoints.forEach(p => {
        const pt = map.latLngToContainerPoint([p.lat, p.lng]);
        if (pt.x >= -radius && pt.x <= size.x + radius && pt.y >= -radius && pt.y <= size.y + radius) {
          shadowCtx.drawImage(brushCanvas, pt.x - radius, pt.y - radius);
        }
      });

      // Pass 2: Color mapping through D3 LUT
      const imgData = shadowCtx.getImageData(0, 0, size.x, size.y);
      const data = imgData.data;
      for (let i = 3; i < data.length; i += 4) {
        const alpha = data[i];
        if (alpha > 0) {
          const offset = alpha * 4;
          data[i - 3] = colorLUT[offset];
          data[i - 2] = colorLUT[offset + 1];
          data[i - 1] = colorLUT[offset + 2];
          data[i] = colorLUT[offset + 3];
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };

    renderHeatmap();
    map.on('moveend', renderHeatmap);
    map.on('zoomend', renderHeatmap);

    return () => {
      map.off('moveend', renderHeatmap);
      map.off('zoomend', renderHeatmap);
    };
  }, [showHeatmap, points, heatmapRadius, filterDepthRange, currentZoom]);

  // Fit bounds to points
  const handleFitBounds = () => {
    if (!mapInstanceRef.current || points.length === 0) return;
    const latLngs = points.map(p => [p.lat, p.lng] as [number, number]);
    mapInstanceRef.current.fitBounds(latLngs, { padding: [50, 50], maxZoom: 16 });
  };

  // Geolocation trigger
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolokalisering stöds inte av din webbläsare.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16);
          L.circleMarker([latitude, longitude], {
            radius: 8,
            fillColor: '#38bdf8',
            color: '#ffffff',
            weight: 2,
            fillOpacity: 0.9,
          })
            .bindPopup('Din position')
            .addTo(mapInstanceRef.current)
            .openPopup();
        }
      },
      (err) => {
        alert(`Kunde inte hämta position: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  // Render Fish Catch Markers
  useEffect(() => {
    const layer = catchesLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showCatches || catches.length === 0) return;

    const speciesColors: Record<FishSpecies, string> = {
      Abborre: '#10b981', // Emerald
      Gädda: '#f59e0b',   // Amber
      Gös: '#06b6d4',     // Cyan
      Öring: '#a855f7',   // Purple
      Annan: '#94a3b8',
    };

    catches.forEach(c => {
      const color = speciesColors[c.species] || '#10b981';
      const iconHtml = `
        <div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #0f172a; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
          <span style="font-size: 11px;">🐟</span>
        </div>
      `;

      const marker = L.marker([c.lat, c.lng], {
        icon: L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      });

      const popupHtml = `
        <div class="p-1 min-w-[190px]">
          <div class="font-bold text-emerald-400 text-sm flex items-center justify-between border-b border-slate-700/80 pb-1 mb-1.5">
            <span class="flex items-center gap-1">🐟 ${c.species}</span>
            <span class="text-xs font-mono text-cyan-300 font-bold">${c.depth_m.toFixed(1)}m djup</span>
          </div>
          ${c.length_cm ? `<div class="text-xs text-slate-300 font-mono">Längd: <strong class="text-white">${c.length_cm} cm</strong></div>` : ''}
          ${c.weight_kg ? `<div class="text-xs text-slate-300 font-mono">Vikt: <strong class="text-white">${c.weight_kg} kg</strong></div>` : ''}
          ${c.lure ? `<div class="text-[11px] text-slate-300 mt-1 italic">Bete: <span class="text-emerald-300 font-medium">${c.lure}</span></div>` : ''}
          ${c.note ? `<div class="text-[11px] text-slate-300 bg-slate-800/80 p-1.5 rounded mt-1.5 border border-slate-700/50">"${c.note}"</div>` : ''}
          <div class="text-[10px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-800 flex justify-between">
            <span>${c.date} ${c.time}</span>
            <span>${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'custom-popup' });
      marker.addTo(layer);
    });
  }, [catches, showCatches]);

  // Render Boat Position and Drift History Trail
  useEffect(() => {
    const layer = boatLayerRef.current;
    const map = mapInstanceRef.current;
    if (!layer || !map) return;
    layer.clearLayers();

    if (!boatPosition) return;

    // Track drift trail
    const history = driftHistoryRef.current;
    history.push([boatPosition.lat, boatPosition.lng]);
    if (history.length > 60) history.shift();

    if (history.length > 1) {
      L.polyline(history, {
        color: '#38bdf8',
        weight: 2,
        dashArray: '3, 6',
        opacity: 0.75,
      }).addTo(layer);
    }

    const boatIconHtml = `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(56, 189, 248, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 18px; height: 18px; border-radius: 50%; background: #0284c7; border: 2px solid #ffffff; box-shadow: 0 0 10px #38bdf8; display: flex; align-items: center; justify-content: center;">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
        </div>
      </div>
    `;

    const boatMarker = L.marker([boatPosition.lat, boatPosition.lng], {
      icon: L.divIcon({
        html: boatIconHtml,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
      zIndexOffset: 1000,
    });

    boatMarker.bindPopup(`
      <div class="text-xs">
        <strong class="text-cyan-400 block mb-1">Båtposition</strong>
        <div>${boatPosition.lat.toFixed(5)}°N, ${boatPosition.lng.toFixed(5)}°E</div>
        ${boatPosition.speedKnots !== null && boatPosition.speedKnots !== undefined ? `<div class="text-slate-300 font-mono mt-0.5">Fart: ${boatPosition.speedKnots.toFixed(1)} knop</div>` : ''}
      </div>
    `, { className: 'custom-popup' });

    boatMarker.addTo(layer);

    if (isAutoFollow) {
      map.panTo([boatPosition.lat, boatPosition.lng], { animate: true, duration: 0.6 });
    }
  }, [boatPosition, isAutoFollow]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full ${isAddMode ? 'cursor-crosshair' : ''}`}
      />

      {/* Bathymetry Canvas Overlay */}
      <canvas
        ref={canvasOverlayRef}
        className="absolute inset-0 pointer-events-none z-[400]"
      />

      {/* D3 Density Heatmap Overlay */}
      <canvas
        ref={heatmapCanvasRef}
        className="absolute inset-0 pointer-events-none z-[405]"
      />

      {/* Crosshair instruction badge when Add Point Mode is active */}
      {isAddMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-cyan-950/90 text-cyan-200 border border-cyan-500/50 px-4 py-2 rounded-lg shadow-xl text-xs flex items-center gap-2 backdrop-blur-sm animate-pulse">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span>Klicka var som helst på sjön för att placera en ny lodning</span>
        </div>
      )}

      {/* Top Left Navigation / Zoom HUD */}
      <div className="absolute top-4 left-4 z-[900] flex flex-col gap-2">
        <div className="flex flex-col bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-lg overflow-hidden shadow-xl">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            title="Zooma in"
            className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 transition-colors border-b border-slate-700/80"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            title="Zooma ut"
            className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleFitBounds}
          title="Centrera över alla lodningspunkter"
          className="p-2 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-slate-800 shadow-xl transition-colors"
        >
          <Radio className="w-4 h-4" />
        </button>

        <button
          onClick={handleLocateMe}
          title="Min GPS-position"
          className="p-2 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-slate-800 shadow-xl transition-colors"
        >
          <Locate className="w-4 h-4" />
        </button>
      </div>

      {/* Top Right Map Layers & Visual Toggles */}
      <div className="absolute top-4 right-4 z-[900] flex items-center gap-2">
        {/* Toggle Fishing Mode HUD */}
        <button
          onClick={onToggleFishingMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border backdrop-blur transition-all shadow-lg ${
            isFishingMode
              ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-cyan-950/60'
              : 'bg-slate-900/90 border-cyan-500/50 text-cyan-300 hover:text-white hover:border-cyan-400'
          }`}
          title="Växla till taktilt fiskeläge med stora knappar och djuplodning för båt"
        >
          <Navigation className={`w-3.5 h-3.5 ${isFishingMode ? 'fill-slate-950' : 'text-cyan-400'}`} />
          <span>Fiskeläge</span>
        </button>

        {/* Toggle Catches */}
        <button
          onClick={onToggleCatches}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border backdrop-blur transition-all shadow-lg ${
            showCatches
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
              : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
          }`}
          title="Visa fångstplatser och hugg på sjön"
        >
          <Fish className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Fångster</span>
          <span className="font-mono text-[10px] text-emerald-400">({catches.length})</span>
        </button>

        {/* Toggle Depth Numbers on markers */}
        <button
          onClick={onToggleDepthLabels}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border backdrop-blur transition-all shadow-lg ${
            showDepthLabels
              ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
              : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
          }`}
          title="Växla mellan rena punkter eller synliga djuptal"
        >
          {showDepthLabels ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Djuptal</span>
        </button>

        {/* Toggle Bathymetry Interpolation Surface */}
        <button
          onClick={onToggleBathymetrySurface}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border backdrop-blur transition-all shadow-lg ${
            showBathymetrySurface
              ? 'bg-blue-950/80 border-blue-500/60 text-blue-300'
              : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
          }`}
          title="Beräkna och visa interpolerat bottenytlager (IDW Bathymetry)"
        >
          <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-blue-700 to-cyan-300 opacity-80" />
          <span>Djupvy</span>
        </button>

        {/* Toggle D3 Density Heatmap */}
        <button
          onClick={onToggleHeatmap}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border backdrop-blur transition-all shadow-lg ${
            showHeatmap
              ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
              : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
          }`}
          title="Visa D3 värmekarta över punkttäthet och koncentrationsområden"
        >
          <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-amber-400 fill-amber-400/40' : 'text-slate-400'}`} />
          <span>Värmekarta</span>
        </button>

        {/* Map Style Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-lg text-xs font-medium text-slate-300 hover:text-white shadow-xl transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Karta: {TILE_LAYERS[activeTile].name}</span>
          </button>

          {isLayerMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-[1100] backdrop-blur-md">
              {(Object.keys(TILE_LAYERS) as MapTileProvider[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveTile(key);
                    setIsLayerMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    activeTile === key ? 'text-cyan-400 font-semibold bg-slate-800/60' : 'text-slate-300'
                  }`}
                >
                  <span>{TILE_LAYERS[key].name}</span>
                  {activeTile === key && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Telemetry & Legend HUD */}
      <div className="absolute bottom-4 left-4 right-4 z-[900] pointer-events-none flex flex-col sm:flex-row items-end sm:items-center justify-between gap-2">
        {/* Dynamic Zoom & Marker Size Indicator */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 flex items-center gap-3 shadow-xl">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Zoom:</span>
            <span className="font-mono font-bold text-cyan-300">{currentZoom}x</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5" title="Punkternas radie anpassas dynamiskt efter zoomnivån">
            <span className="text-slate-400">Punktstorlek:</span>
            <div className="flex items-center gap-1">
              <span
                className="inline-block rounded-full bg-cyan-400 border border-slate-900"
                style={{
                  width: `${Math.max(6, getMarkerRadius(currentZoom) * 1.5)}px`,
                  height: `${Math.max(6, getMarkerRadius(currentZoom) * 1.5)}px`,
                }}
              />
              <span className="font-mono text-cyan-300">{getMarkerRadius(currentZoom)}px</span>
            </div>
          </div>
          {mouseCoords && (
            <>
              <span className="text-slate-600 hidden md:inline">|</span>
              <div className="hidden md:flex items-center gap-1 font-mono text-[10px] text-slate-400">
                <span>{mouseCoords.lat.toFixed(5)}°N</span>
                <span>{mouseCoords.lng.toFixed(5)}°E</span>
              </div>
            </>
          )}
        </div>

        {/* D3 Heatmap Concentration Legend */}
        {showHeatmap && (
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur border border-amber-500/40 rounded-lg p-2.5 text-xs shadow-xl min-w-[240px] animate-in fade-in">
            <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-slate-400 mb-1.5">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Flame className="w-3 h-3 fill-amber-400/40" />
                <span>Koncentration (D3)</span>
              </span>
              <span className="font-mono text-amber-300">{heatmapRadius}px radie</span>
            </div>
            <div className="h-2 w-full rounded overflow-hidden flex border border-slate-700/50 mb-1 bg-gradient-to-r from-blue-700 via-emerald-400 via-yellow-400 to-rose-600" />
            <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mb-2">
              <span>Låg densitet</span>
              <span>Medel</span>
              <span>Hög täthet</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
              <span className="text-[10px] text-slate-400 shrink-0">Radie:</span>
              <input
                type="range"
                min="18"
                max="60"
                step="2"
                value={heatmapRadius}
                onChange={(e) => onHeatmapRadiusChange(parseInt(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded appearance-none"
              />
            </div>
          </div>
        )}

        {/* Bathymetric Depth Scale Legend */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-lg p-2 text-xs shadow-xl min-w-[240px]">
          <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-slate-400 mb-1.5">
            <span>0m Grunt</span>
            <span className="text-cyan-400 font-mono">Djupintervall</span>
            <span>{maxDepth > 0 ? `${maxDepth}m Djupt` : '0m'}</span>
          </div>
          <div className="h-2 w-full rounded overflow-hidden flex border border-slate-700/50">
            <div className="flex-1 bg-[#67e8f9]" title="< 20% av maxdjup" />
            <div className="flex-1 bg-[#06b6d4]" title="20 - 40%" />
            <div className="flex-1 bg-[#3b82f6]" title="40 - 60%" />
            <div className="flex-1 bg-[#1d4ed8]" title="60 - 80%" />
            <div className="flex-1 bg-[#1e3a8a]" title="> 80% av maxdjup" />
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-1">
            <span>Cyan (0-2m)</span>
            <span>Blå (4-7m)</span>
            <span>Mörk marin (8m+)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
