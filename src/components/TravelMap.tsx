import { useEffect, useRef } from "react";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: "user" | "featured" | "gem";
  label: string;
  sublabel?: string;
  photo?: string;
  active?: boolean;
}

interface TravelMapProps {
  markers: MapMarker[];
  center?: [number, number];
  matchLine?: { fromLat: number; fromLng: number; toLat: number; toLng: number };
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    L: any;
    _leafletLoaded?: boolean;
    _leafletLoadCallbacks?: (() => void)[];
  }
}

function loadLeaflet(cb: () => void) {
  if (window._leafletLoaded) { cb(); return; }
  if (!window._leafletLoadCallbacks) window._leafletLoadCallbacks = [];
  window._leafletLoadCallbacks.push(cb);
  if (document.getElementById("leaflet-css")) return;

  const css = document.createElement("link");
  css.id = "leaflet-css";
  css.rel = "stylesheet";
  css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
  document.head.appendChild(css);

  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
  script.onload = () => {
    window._leafletLoaded = true;
    window._leafletLoadCallbacks?.forEach((fn) => fn());
    window._leafletLoadCallbacks = [];
  };
  document.head.appendChild(script);
}

function injectMatchLineCSS() {
  if (document.getElementById("match-line-css")) return;
  const s = document.createElement("style");
  s.id = "match-line-css";
  s.textContent = `
    .match-line {
      stroke-dasharray: 12 6;
      animation: matchLineDash 0.45s linear infinite;
      stroke: #f43f5e;
      stroke-width: 4;
      opacity: 0.9;
      filter: drop-shadow(0 0 4px rgba(244,63,94,0.6));
    }
    @keyframes matchLineDash {
      to { stroke-dashoffset: -18; }
    }
  `;
  document.head.appendChild(s);
}

function makeIcon(type: "user" | "featured" | "gem", active = false) {
  const cfg = {
    user:     { bg: active ? "#0284c7" : "#0ea5e9", emoji: "👤", size: active ? 44 : 36 },
    featured: { bg: active ? "#d97706" : "#f59e0b", emoji: "⭐", size: 40 },
    gem:      { bg: active ? "#059669" : "#10b981", emoji: "💎", size: 38 },
  }[type];

  const html = `
    <div style="
      width:${cfg.size}px;height:${cfg.size}px;
      background:${cfg.bg};
      border-radius:50% 50% 50% 4px;
      transform:rotate(45deg);
      border:3px solid white;
      box-shadow:0 4px 12px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      transition:all .2s;
    ">
      <span style="transform:rotate(-45deg);font-size:${cfg.size * 0.38}px;line-height:1">${cfg.emoji}</span>
    </div>`;

  return window.L.divIcon({
    html,
    className: "",
    iconSize: [cfg.size, cfg.size],
    iconAnchor: [cfg.size / 2, cfg.size],
    popupAnchor: [0, -cfg.size],
  });
}

export default function TravelMap({ markers, center, matchLine }: TravelMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof window.L.map> | null>(null);
  const markersRef = useRef<Map<string, ReturnType<typeof window.L.marker>>>(new Map());
  const matchLineRef = useRef<ReturnType<typeof window.L.polyline> | null>(null);

  // ── Init map ────────────────────────────────────────────────────
  useEffect(() => {
    loadLeaflet(() => {
      if (!containerRef.current || mapRef.current) return;
      injectMatchLineCSS();
      const L = window.L;

      const map = L.map(containerRef.current, {
        center: center ?? [12.0, 122.5],
        zoom: center ? 9 : 6,
        zoomControl: false,
      });

      // Satellite tiles (ESRI — free, no key)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Esri, Maxar, Earthstar Geographics", maxZoom: 18 }
      ).addTo(map);

      // Labels overlay
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 18, opacity: 0.7 }
      ).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;
    });

    return () => {
      matchLineRef.current?.remove();
      matchLineRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // ── Update markers whenever they change ──────────────────────────
  useEffect(() => {
    if (!mapRef.current || !window._leafletLoaded) return;
    const L = window.L;
    const map = mapRef.current;
    const existing = new Set(markersRef.current.keys());

    markers.forEach((m) => {
      existing.delete(m.id);
      const icon = makeIcon(m.type, m.active);

      const popup = `
        <div style="min-width:140px;font-family:system-ui;padding:2px">
          ${m.photo ? `<img src="${m.photo}" style="width:100%;height:72px;object-fit:cover;border-radius:8px;margin-bottom:6px"/>` : ""}
          <div style="font-weight:700;font-size:13px;color:#0f172a">${m.label}</div>
          ${m.sublabel ? `<div style="font-size:11px;color:#64748b;margin-top:2px">${m.sublabel}</div>` : ""}
          <div style="font-size:10px;margin-top:4px;padding:2px 6px;border-radius:99px;display:inline-block;background:${
            m.type === "user" ? "#e0f2fe" : m.type === "featured" ? "#fef3c7" : "#d1fae5"
          };color:${
            m.type === "user" ? "#0369a1" : m.type === "featured" ? "#92400e" : "#065f46"
          }">${
            m.type === "user" ? "👤 Traveler" : m.type === "featured" ? "⭐ Featured" : "💎 Hidden Gem"
          }</div>
        </div>`;

      if (markersRef.current.has(m.id)) {
        const mk = markersRef.current.get(m.id)!;
        mk.setIcon(icon);
        mk.bindPopup(popup);
      } else {
        const mk = L.marker([m.lat, m.lng], { icon })
          .addTo(map)
          .bindPopup(popup, { maxWidth: 200 });
        markersRef.current.set(m.id, mk);
      }

      // Auto-open popup for the active marker
      if (m.active) {
        const mk = markersRef.current.get(m.id)!;
        // Small delay lets the pan animation finish first
        setTimeout(() => mk.openPopup(), 700);
      }
    });

    // Remove stale markers
    existing.forEach((id) => {
      markersRef.current.get(id)?.remove();
      markersRef.current.delete(id);
    });

    // Navigation: when matchLine is active we use fitBounds (handled in matchLine effect)
    // Otherwise pan/zoom to the active user marker as before
    if (!matchLine) {
      const active = markers.find((m) => m.active && m.type === "user");
      if (active) {
        const currentZoom = map.getZoom();
        if (currentZoom < 8) {
          map.setView([active.lat, active.lng], 9, { animate: true, duration: 0.8 });
        } else {
          map.panTo([active.lat, active.lng], { animate: true, duration: 0.6 });
        }
      } else if (markers.length === 0) {
        map.setView([12.0, 122.5], 6, { animate: true, duration: 0.8 });
      }
    }
  }, [markers, matchLine]);

  // ── Match line animation ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !window._leafletLoaded) return;
    const L = window.L;
    const map = mapRef.current;

    if (matchLine) {
      const coords: [[number, number], [number, number]] = [
        [matchLine.fromLat, matchLine.fromLng],
        [matchLine.toLat, matchLine.toLng],
      ];

      if (matchLineRef.current) {
        matchLineRef.current.setLatLngs(coords);
      } else {
        matchLineRef.current = L.polyline(coords, {
          className: "match-line",
          color: "#f43f5e",
          weight: 4,
        }).addTo(map);
      }

      // Fit both ends in view with padding
      map.fitBounds(coords, { padding: [70, 70], animate: true, duration: 0.9 });
    } else {
      if (matchLineRef.current) {
        matchLineRef.current.remove();
        matchLineRef.current = null;
      }
    }
  }, [matchLine]);

  // Derived legend flags
  const hasUser     = markers.some((m) => m.type === "user");
  const hasFeatured = markers.some((m) => m.type === "featured");
  const hasGem      = markers.some((m) => m.type === "gem");

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* Dynamic legend */}
      {(hasUser || hasFeatured || hasGem) && (
        <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-white/60 text-xs font-medium space-y-1.5">
          {hasUser && (
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-sky-500 inline-block" />
              <span className="text-slate-700">Traveler</span>
            </div>
          )}
          {hasFeatured && (
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-400 inline-block" />
              <span className="text-slate-700">Featured</span>
            </div>
          )}
          {hasGem && (
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-slate-700">Hidden Gem</span>
            </div>
          )}
        </div>
      )}

      {/* Match line pulse indicator */}
      {matchLine && (
        <div className="absolute top-3 right-3 z-[400] bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
          ❤️ It's a Match!
        </div>
      )}
    </div>
  );
}
