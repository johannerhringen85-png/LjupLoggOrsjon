import { DepthPoint } from '../types';

export interface GpxParsedSummary {
  points: DepthPoint[];
  trackName?: string;
  totalWaypoints: number;
  totalTrackPoints: number;
  timeRange?: { start: string; end: string };
  bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

export interface GpxImportOptions {
  leadWeight: number; // default 20g
  defaultSeconds: number; // default 5s if no depth/ele found
  sinkRate: number; // to convert ele/depth to seconds
  thinningFactor: number; // 1 = all, 2 = every 2nd, etc.
}

/**
 * Parses GPX XML text into structured depth points.
 * Handles <wpt>, <trkpt>, and <rtept> with elevation, depth extensions, timestamps, and notes.
 */
export function parseGPX(xmlText: string, options: GpxImportOptions): GpxParsedSummary {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Kunde inte tolka GPX-filen. Kontrollera att filen är en giltig XML/GPX.');
  }

  // Extract metadata / track name
  const nameNode = xmlDoc.querySelector('trk > name') || xmlDoc.querySelector('metadata > name') || xmlDoc.querySelector('gpx > name');
  const trackName = nameNode?.textContent?.trim() || 'GPS-spårlogg';

  // Gather all point elements: wpt, trkpt, rtept
  const pointElements: Element[] = [];
  const wpts = xmlDoc.querySelectorAll('wpt');
  const trkpts = xmlDoc.querySelectorAll('trkpt');
  const rtepts = xmlDoc.querySelectorAll('rtept');

  wpts.forEach(p => pointElements.push(p));
  trkpts.forEach(p => pointElements.push(p));
  if (pointElements.length === 0) {
    rtepts.forEach(p => pointElements.push(p));
  }

  if (pointElements.length === 0) {
    throw new Error('Inga GPS-koordinater (<wpt> eller <trkpt>) hittades i GPX-filen.');
  }

  const rawPoints: DepthPoint[] = [];
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  let earliestTime = '';
  let latestTime = '';

  const step = Math.max(1, options.thinningFactor || 1);

  for (let i = 0; i < pointElements.length; i += step) {
    const el = pointElements[i];
    const latAttr = el.getAttribute('lat');
    const lonAttr = el.getAttribute('lon') || el.getAttribute('lng');

    if (!latAttr || !lonAttr) continue;

    const lat = parseFloat(latAttr);
    const lng = parseFloat(lonAttr);

    if (isNaN(lat) || isNaN(lng)) continue;

    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;

    // Time
    const timeEl = el.querySelector('time');
    let dateStr = new Date().toISOString().slice(0, 10);
    let timeStr = '12:00';

    if (timeEl && timeEl.textContent) {
      const iso = timeEl.textContent.trim();
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        dateStr = d.toISOString().slice(0, 10);
        timeStr = d.toTimeString().slice(0, 5);
        if (!earliestTime || iso < earliestTime) earliestTime = iso;
        if (!latestTime || iso > latestTime) latestTime = iso;
      }
    }

    // Name or comment
    const nameEl = el.querySelector('name') || el.querySelector('desc') || el.querySelector('cmt');
    const note = nameEl?.textContent?.trim() || undefined;

    // Depth extraction
    // Many sonar logs store depth in <depth>, <water_depth>, or negative <ele>
    let depthMetres: number | null = null;
    const depthEl = el.querySelector('depth') || el.querySelector('water_depth') || el.querySelector('depth_m');
    if (depthEl && depthEl.textContent) {
      const d = parseFloat(depthEl.textContent);
      if (!isNaN(d) && d > 0) depthMetres = d;
    }

    if (depthMetres === null) {
      const eleEl = el.querySelector('ele');
      if (eleEl && eleEl.textContent) {
        const ele = parseFloat(eleEl.textContent);
        if (!isNaN(ele)) {
          // If elevation is negative, it's often sonar depth below surface (e.g. -6.5)
          if (ele < 0) {
            depthMetres = Math.abs(ele);
          } else if (ele > 0 && ele < 40) {
            // Some lake loggers store relative water depth in ele
            depthMetres = ele;
          }
        }
      }
    }

    // If depth is in note, e.g. "Djup: 4.8m" or "6.2m"
    if (depthMetres === null && note) {
      const match = note.match(/(?:djup|depth|d)?[:\s]*(\d+(?:[.,]\d+)?)\s*(?:m|meter)/i);
      if (match) {
        const parsed = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(parsed) && parsed > 0) depthMetres = parsed;
      }
    }

    // Calculate seconds from depth or default
    let calculatedSeconds = options.defaultSeconds || 5.0;
    if (depthMetres !== null && depthMetres > 0) {
      // depth = seconds * baseRate * sqrt(weight / 20)
      // seconds = depth / (baseRate * sqrt(weight / 20))
      const weightFactor = options.leadWeight / 20;
      const speed = Math.max(0.1, options.sinkRate * Math.sqrt(weightFactor));
      calculatedSeconds = parseFloat((depthMetres / speed).toFixed(1));
    }

    rawPoints.push({
      id: `gpx-${i}-${Date.now().toString(36)}`,
      lat,
      lng,
      seconds: calculatedSeconds,
      weight_g: options.leadWeight,
      date: dateStr,
      time: timeStr,
      note: note || (depthMetres ? `Lodat djup: ${depthMetres.toFixed(1)}m` : `GPX-punkt #${i + 1}`),
    });
  }

  return {
    points: rawPoints,
    trackName,
    totalWaypoints: wpts.length,
    totalTrackPoints: trkpts.length,
    timeRange: earliestTime && latestTime ? { start: earliestTime, end: latestTime } : undefined,
    bounds: isFinite(minLat) ? { minLat, maxLat, minLng, maxLng } : undefined,
  };
}

/**
 * Pre-recorded realistic sample GPX track for lake Orsjön.
 * Simulates a boat sounding survey along the eastern shoreline, central trench, and northern bay.
 */
export const SAMPLE_ORSJON_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Lowrance SonarLog Orsjön" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Orsjön Båtlogg Vår 2026</name>
    <desc>Djupmätning och ekolodsspår Orsjön, Blekinge</desc>
    <time>2026-05-24T09:00:00Z</time>
  </metadata>
  <trk>
    <name>Lodningsrunda Öst &amp; Djupgrav</name>
    <desc>Båtlogg med ekolodsdjup</desc>
    <trkseg>
      <trkpt lat="56.2865" lon="14.5032"><ele>-1.6</ele><time>2026-05-24T09:02:10Z</time><name>Norra viken strandkant</name></trkpt>
      <trkpt lat="56.2855" lon="14.5039"><ele>-2.2</ele><time>2026-05-24T09:04:15Z</time><name>Vassbälte</name></trkpt>
      <trkpt lat="56.2847" lon="14.5048"><ele>-3.1</ele><time>2026-05-24T09:06:30Z</time><name>3m kurva</name></trkpt>
      <trkpt lat="56.2838" lon="14.5060"><ele>-4.8</ele><time>2026-05-24T09:08:45Z</time><name>Nordöstra slänten</name></trkpt>
      <trkpt lat="56.2830" lon="14.5072"><ele>-6.2</ele><time>2026-05-24T09:11:00Z</time><name>Brant övergång</name></trkpt>
      <trkpt lat="56.2821" lon="14.5085"><ele>-7.5</ele><time>2026-05-24T09:13:20Z</time><name>Östra stupet</name></trkpt>
      <trkpt lat="56.2812" lon="14.5094"><ele>-5.4</ele><time>2026-05-24T09:15:40Z</time><name>Östra grundplatån</name></trkpt>
      <trkpt lat="56.2803" lon="14.5105"><ele>-3.0</ele><time>2026-05-24T09:18:00Z</time><name>Östra landnära stenbotten</name></trkpt>
      <trkpt lat="56.2794" lon="14.5090"><ele>-6.8</ele><time>2026-05-24T09:20:30Z</time><name>Östra brantfoten</name></trkpt>
      <trkpt lat="56.2808" lon="14.5050"><ele>-9.4</ele><time>2026-05-24T09:23:00Z</time><name>Centrala djupfåran</name></trkpt>
      <trkpt lat="56.2814" lon="14.5015"><ele>-12.4</ele><time>2026-05-24T09:25:30Z</time><name>Djupgraven maxbotten</name></trkpt>
      <trkpt lat="56.2820" lon="14.5008"><ele>-11.8</ele><time>2026-05-24T09:28:00Z</time><name>Djupgrav nordväst</name></trkpt>
      <trkpt lat="56.2829" lon="14.4988"><ele>-6.5</ele><time>2026-05-24T09:30:20Z</time><name>Västra slänten</name></trkpt>
      <trkpt lat="56.2822" lon="14.4965"><ele>-3.4</ele><time>2026-05-24T09:32:45Z</time><name>Västra grundet</name></trkpt>
      <trkpt lat="56.2805" lon="14.4975"><ele>-5.2</ele><time>2026-05-24T09:35:10Z</time><name>Sundet väster</name></trkpt>
      <trkpt lat="56.2788" lon="14.4995"><ele>-7.8</ele><time>2026-05-24T09:37:35Z</time><name>Sydvästra djupzonen</name></trkpt>
      <trkpt lat="56.2775" lon="14.5015"><ele>-6.7</ele><time>2026-05-24T09:40:00Z</time><name>Södra bassängens mitt</name></trkpt>
      <trkpt lat="56.2762" lon="14.5002"><ele>-4.5</ele><time>2026-05-24T09:42:25Z</time><name>Södra sundingången</name></trkpt>
      <trkpt lat="56.2748" lon="14.4980"><ele>-2.8</ele><time>2026-05-24T09:44:50Z</time><name>Utloppssträckan</name></trkpt>
      <trkpt lat="56.2739" lon="14.4960"><ele>-1.4</ele><time>2026-05-24T09:47:15Z</time><name>Södra viken bryggan</name></trkpt>
    </trkseg>
  </trk>
</gpx>`;
