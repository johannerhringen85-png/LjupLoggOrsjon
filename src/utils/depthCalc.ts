import { DepthPoint, CalculatedPoint, DepthStats } from '../types';

/**
 * Calculates depth based on sink time (seconds), sinker weight (grams), and base sink rate (m/s for 20g lead).
 * The square root of weight factor accounts for hydrodynamic drag.
 */
export function calculateDepth(seconds: number, weightGrams: number, baseRate: number): number {
  if (seconds <= 0 || baseRate <= 0) return 0;
  const weight = Math.max(1, weightGrams || 20);
  const weightFactor = weight / 20;
  const speed = baseRate * Math.sqrt(weightFactor);
  return parseFloat((seconds * speed).toFixed(1));
}

/**
 * Calculates dynamic marker radius based on map zoom level.
 * Requirement: Smaller markers at high zoom levels (zoomed in, close details),
 * and larger markers at lower zoom levels (zoomed out, broad visibility).
 */
export function getMarkerRadius(zoom: number): number {
  if (zoom <= 10) return 15;
  if (zoom === 11) return 13;
  if (zoom === 12) return 11;
  if (zoom === 13) return 9.5;
  if (zoom === 14) return 8;
  if (zoom === 15) return 6.5;
  if (zoom === 16) return 5;
  if (zoom === 17) return 4;
  return 3.5; // zoom 18+
}

/**
 * Return color according to bathymetric depth ratio.
 * Follows the user's specification with smooth gradient steps.
 */
export function getDepthColor(depth: number, maxDepth: number): string {
  if (maxDepth <= 0 || depth <= 0) return '#67e8f9';
  const ratio = Math.min(1, Math.max(0, depth / maxDepth));

  if (ratio < 0.2) return '#67e8f9'; // Grunt (0 - 20% av maxdjup) Cyan-300
  if (ratio < 0.4) return '#06b6d4'; // Cyan-500
  if (ratio < 0.6) return '#3b82f6'; // Blue-500
  if (ratio < 0.8) return '#1d4ed8'; // Blue-700
  return '#1e3a8a';                  // Djupt (> 80% av maxdjup) Blue-900
}

/**
 * Depth text category
 */
export function getDepthCategory(depth: number): { label: string; color: string } {
  if (depth < 2.0) return { label: 'Strand / Grunt', color: 'text-cyan-300' };
  if (depth < 4.5) return { label: 'Platå / Vegetationskant', color: 'text-cyan-400' };
  if (depth < 7.5) return { label: 'Slänt / Pelagial', color: 'text-blue-400' };
  return { label: 'Djupgrav / Bottenhåla', color: 'text-indigo-400' };
}

/**
 * Calculate statistical aggregate values for a point collection
 */
export function calculateStats(points: CalculatedPoint[]): DepthStats {
  if (points.length === 0) {
    return {
      totalPoints: 0,
      maxDepth: 0,
      minDepth: 0,
      avgDepth: 0,
      deepSpotsCount: 0,
      shallowSpotsCount: 0,
    };
  }

  let max = 0;
  let min = Infinity;
  let sum = 0;
  let deepCount = 0;
  let shallowCount = 0;

  for (const p of points) {
    const d = p.calculatedDepth;
    if (d > max) max = d;
    if (d < min) min = d;
    sum += d;
    if (d >= 6.0) deepCount++;
    if (d <= 2.5) shallowCount++;
  }

  return {
    totalPoints: points.length,
    maxDepth: parseFloat(max.toFixed(1)),
    minDepth: parseFloat(min.toFixed(1)),
    avgDepth: parseFloat((sum / points.length).toFixed(1)),
    deepSpotsCount: deepCount,
    shallowSpotsCount: shallowCount,
  };
}

/**
 * Export points as CSV string
 */
export function exportToCSV(points: CalculatedPoint[], sinkRate: number): string {
  const headers = ['id', 'lat', 'lng', 'depth_m', 'seconds', 'weight_g', 'sink_rate_ms', 'date', 'time', 'note'];
  const rows = points.map(p => [
    p.id,
    p.lat,
    p.lng,
    p.calculatedDepth,
    p.seconds,
    p.weight_g,
    sinkRate,
    `"${p.date}"`,
    `"${p.time}"`,
    `"${(p.note || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Export points as standard GeoJSON FeatureCollection
 */
export function exportToGeoJSON(points: CalculatedPoint[], sinkRate: number): string {
  const geojson = {
    type: 'FeatureCollection',
    name: 'Orsjon_Djupkarta',
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
      }
    },
    features: points.map(p => ({
      type: 'Feature',
      id: p.id,
      properties: {
        id: p.id,
        depth_m: p.calculatedDepth,
        seconds: p.seconds,
        weight_g: p.weight_g,
        sink_rate_ms: sinkRate,
        date: p.date,
        time: p.time,
        note: p.note || null
      },
      geometry: {
        type: 'Point',
        coordinates: [p.lng, p.lat]
      }
    }))
  };

  return JSON.stringify(geojson, null, 2);
}

/**
 * Export points as native application JSON
 */
export function exportToNativeJSON(points: CalculatedPoint[], sinkRate: number): string {
  const data = points.map(p => ({
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    seconds: p.seconds,
    weight_g: p.weight_g,
    depth_m: p.calculatedDepth,
    sink_rate_ms: sinkRate,
    date: p.date,
    time: p.time,
    note: p.note
  }));
  return JSON.stringify(data, null, 2);
}

/**
 * Parse CSV data into DepthPoint[]
 */
export function parseCSV(text: string): DepthPoint[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  const latIdx = headers.findIndex(h => h.includes('lat'));
  const lngIdx = headers.findIndex(h => h.includes('lng') || h.includes('lon'));
  const secIdx = headers.findIndex(h => h.includes('sec') || h.includes('tid') || h.includes('time_s'));
  const weightIdx = headers.findIndex(h => h.includes('weight') || h.includes('vikt') || h.includes('bly'));
  const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('datum'));
  const timeIdx = headers.findIndex(h => h === 'time' || h.includes('klockslag'));
  const noteIdx = headers.findIndex(h => h.includes('note') || h.includes('anteckning'));

  if (latIdx === -1 || lngIdx === -1) {
    throw new Error('CSV saknar kolumner för latitud och longitud (lat, lng).');
  }

  const result: DepthPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV splitter handling quoted cells
    const cols: string[] = [];
    let inQuotes = false;
    let current = '';
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current.trim());

    const lat = parseFloat(cols[latIdx]);
    const lng = parseFloat(cols[lngIdx]);
    const seconds = secIdx !== -1 && cols[secIdx] ? parseFloat(cols[secIdx]) : 5.0;
    const weight_g = weightIdx !== -1 && cols[weightIdx] ? parseFloat(cols[weightIdx]) : 20;

    if (!isNaN(lat) && !isNaN(lng)) {
      result.push({
        id: `csv-${i}-${Date.now()}`,
        lat,
        lng,
        seconds: isNaN(seconds) ? 5.0 : seconds,
        weight_g: isNaN(weight_g) ? 20 : weight_g,
        date: dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx].replace(/^"|"$/g, '') : new Date().toISOString().slice(0, 10),
        time: timeIdx !== -1 && cols[timeIdx] ? cols[timeIdx].replace(/^"|"$/g, '') : '12:00',
        note: noteIdx !== -1 && cols[noteIdx] ? cols[noteIdx].replace(/^"|"$/g, '') : undefined,
      });
    }
  }

  return result;
}

/**
 * Estimates depth at any arbitrary lake coordinate (e.g. current boat GPS location)
 * using Inverse Distance Weighting from existing soundings within influence range.
 */
export function estimateDepthAtLocation(lat: number, lng: number, points: CalculatedPoint[]): number | null {
  if (points.length === 0) return null;

  const latRad = lat * (Math.PI / 180);
  let num = 0;
  let den = 0;
  let closestDist = Infinity;
  let closestDepth = 0;

  for (const p of points) {
    const dLat = (p.lat - lat) * 111320;
    const dLng = (p.lng - lng) * 111320 * Math.cos(latRad);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);

    if (dist < closestDist) {
      closestDist = dist;
      closestDepth = p.calculatedDepth;
    }

    if (dist < 280) { // within 280 meters
      const weight = 1 / Math.pow(Math.max(dist, 8), 2);
      num += p.calculatedDepth * weight;
      den += weight;
    }
  }

  if (den > 0 && closestDist <= 200) {
    return parseFloat((num / den).toFixed(1));
  }
  if (closestDist <= 300) {
    return parseFloat(closestDepth.toFixed(1));
  }
  return null;
}
