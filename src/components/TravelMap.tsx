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
}

declare global {
  interface Window {
    L: typeof import("leaflet");
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

export default function TravelMap({ markers, center }: TravelMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof window.L.map> | null>(null);
  const markersRef = useRef<Map<string, ReturnType<typeof window.L.marker>>>(new Map());

  useEffect(() => {
    loadLeaflet(() => {
      if (!containerRef.current || mapRef.current) return;
      const L = window.L;

      const map = L.map(containerRef.current, {
        center: center ?? [12.0, 122.5],
        zoom: 6,
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

      // Custom zoom control
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Update markers whenever they change
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
    });

    // Remove markers no longer in list
    existing.forEach((id) => {
      markersRef.current.get(id)?.remove();
      markersRef.current.delete(id);
    });

    // Fly to active user marker
    const active = markers.find((m) => m.active && m.type === "user");
    if (active) {
      map.flyTo([active.lat, active.lng], 9, { duration: 1.2, easeLinearity: 0.4 });
    }
  }, [markers]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-white/60 text-xs font-medium space-y-1.5">
        <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-sky-500 inline-block"/><span className="text-slate-700">Travelers</span></div>
        <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-400 inline-block"/><span className="text-slate-700">Featured</span></div>
        <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-emerald-500 inline-block"/><span className="text-slate-700">Hidden Gems</span></div>
      </div>
    </div>
  );
}
