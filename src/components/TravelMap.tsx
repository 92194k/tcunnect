import { useEffect, useRef, useState } from "react";

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
  onMarkerClick?: (marker: MapMarker) => void;
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

// ── Colour palette — distinct per type ───────────────────────────────────────
const TYPE_COLORS = {
  user:     { normal: "#2563eb", active: "#1d4ed8", glow: "rgba(37,99,235,0.35)",  bg: "#dbeafe" }, // blue
  featured: { normal: "#d97706", active: "#b45309", glow: "rgba(217,119,6,0.35)",  bg: "#fef3c7" }, // amber
  gem:      { normal: "#059669", active: "#047857", glow: "rgba(5,150,105,0.35)",  bg: "#d1fae5" }, // emerald
} as const;

function makeIcon(type: "user" | "featured" | "gem", active = false, photo?: string) {
  const c = TYPE_COLORS[type];

  // ── User marker: avatar circle ────────────────────────────────────────────
  if (type === "user") {
    const size = active ? 50 : 42;
    const ring = active ? c.active : c.normal;
    const glow = active ? `,0 0 0 3px ${c.glow}` : "";
    const inner = photo
      ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block"/>`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${size * 0.42}px;line-height:1">👤</div>`;
    const html = `
      <div style="
        width:${size}px;height:${size}px;
        border-radius:50%;
        border:3px solid ${ring};
        box-shadow:0 4px 14px rgba(0,0,0,0.38)${glow};
        overflow:hidden;
        background:${c.bg};
        transition:all .2s;
      ">${inner}</div>`;
    return window.L.divIcon({
      html,
      className: "",
      iconSize:    [size, size],
      iconAnchor:  [size / 2, size / 2],
      popupAnchor: [0, -(size / 2 + 8)],
    });
  }

  // ── Gem / Featured: teardrop pin pointing straight down ──────────────────
  const cfg = {
    featured: { bg: active ? TYPE_COLORS.featured.active : TYPE_COLORS.featured.normal, emoji: "⭐", size: 40 },
    gem:      { bg: active ? TYPE_COLORS.gem.active      : TYPE_COLORS.gem.normal,      emoji: "💎", size: 38 },
    user:     { bg: TYPE_COLORS.user.normal, emoji: "👤", size: 38 }, // TS exhaustiveness only
  }[type];

  // Teardrop: a circle on top + a triangle pointing down, no CSS rotation tricks
  const r   = cfg.size / 2;            // circle radius
  const tip = 12;                       // extra height for the triangle tip
  const total = cfg.size + tip;
  const html = `
    <div style="position:relative;width:${cfg.size}px;height:${total}px">
      <div style="
        position:absolute;top:0;left:0;
        width:${cfg.size}px;height:${cfg.size}px;
        background:${cfg.bg};
        border-radius:50%;
        border:3px solid white;
        box-shadow:0 4px 12px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="font-size:${cfg.size * 0.4}px;line-height:1">${cfg.emoji}</span>
      </div>
      <div style="
        position:absolute;bottom:0;left:50%;
        transform:translateX(-50%);
        width:0;height:0;
        border-left:${r * 0.45}px solid transparent;
        border-right:${r * 0.45}px solid transparent;
        border-top:${tip + 2}px solid ${cfg.bg};
      "></div>
    </div>`;

  return window.L.divIcon({
    html,
    className: "",
    iconSize:    [cfg.size, total],
    iconAnchor:  [cfg.size / 2, total],      // tip of the triangle = lat/lng point
    popupAnchor: [0, -(total + 4)],
  });
}

export default function TravelMap({ markers, center, matchLine, onMarkerClick }: TravelMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof window.L.map> | null>(null);
  const markersRef = useRef<Map<string, ReturnType<typeof window.L.marker>>>(new Map());
  const matchLineRef = useRef<ReturnType<typeof window.L.polyline> | null>(null);
  const gemTooltipRef = useRef<HTMLDivElement | null>(null);
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);

  // ── Filter state: null = show all; otherwise show only that type ─────────
  const [activeFilter, setActiveFilter] = useState<"user" | "gem" | null>(null);
  const toggleFilter = (type: "user" | "gem") =>
    setActiveFilter((prev) => (prev === type ? null : type));

  // Apply filter — always keep featured pins; filter only user vs gem
  const visibleMarkers = activeFilter
    ? markers.filter((m) => m.type === "featured" || m.type === activeFilter)
    : markers;

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

      // ── Gem hover tooltip div (added to map container, positioned absolutely)
      if (containerRef.current && !gemTooltipRef.current) {
        const tip = document.createElement("div");
        tip.style.cssText = [
          "position:absolute",
          "z-index:1500",
          "pointer-events:none",
          "display:none",
          "background:#fff",
          "border-radius:12px",
          "box-shadow:0 8px 28px rgba(0,0,0,0.22)",
          "overflow:hidden",
          "width:170px",
          "border:2px solid #d1fae5",
          "transition:opacity .15s",
        ].join(";");
        containerRef.current.appendChild(tip);
        gemTooltipRef.current = tip;
      }
    });

    return () => {
      gemTooltipRef.current?.remove();
      gemTooltipRef.current = null;
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

    visibleMarkers.forEach((m) => {
      existing.delete(m.id);
      const icon = makeIcon(m.type, m.active, m.photo);

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
        mk.on('click', () => { if (onMarkerClickRef.current) onMarkerClickRef.current(m); });
        markersRef.current.set(m.id, mk);

        // ── Gem hover image preview (only for gem markers that have a photo)
        if (m.type === "gem" && m.photo) {
          const photo = m.photo;
          const label = m.label;
          const sublabel = m.sublabel ?? "";
          mk.on("mouseover", (e: { containerPoint: { x: number; y: number } }) => {
            const tip = gemTooltipRef.current;
            if (!tip) return;
            tip.innerHTML = [
              `<img src="${photo}" style="width:170px;height:110px;object-fit:cover;display:block"/>`,
              `<div style="padding:7px 10px 3px;font-size:12px;font-weight:700;color:#064e3b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${label}</div>`,
              sublabel ? `<div style="padding:0 10px 7px;font-size:11px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">📍 ${sublabel}</div>` : `<div style="padding-bottom:7px"/>`,
            ].join("");
            const x = e.containerPoint.x;
            const y = e.containerPoint.y;
            tip.style.left = `${x - 85}px`;
            tip.style.top  = `${y - 175}px`;
            tip.style.display = "block";
          });
          mk.on("mouseout", () => {
            if (gemTooltipRef.current) gemTooltipRef.current.style.display = "none";
          });
        }
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
      const active = visibleMarkers.find((m) => m.active && m.type === "user");
      if (active) {
        const currentZoom = map.getZoom();
        if (currentZoom < 8) {
          map.setView([active.lat, active.lng], 9, { animate: true, duration: 0.8 });
        } else {
          map.panTo([active.lat, active.lng], { animate: true, duration: 0.6 });
        }
      } else if (visibleMarkers.length === 0) {
        map.setView([12.0, 122.5], 6, { animate: true, duration: 0.8 });
      }
    }
  }, [visibleMarkers, matchLine]);

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

  // Derived flags from original markers (not filtered — so buttons always appear)
  const hasUser     = markers.some((m) => m.type === "user");
  const hasFeatured = markers.some((m) => m.type === "featured");
  const hasGem      = markers.some((m) => m.type === "gem");

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* ── Filter buttons + legend ─────────────────────────── */}
      {(hasUser || hasFeatured || hasGem) && (
        <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5">
          {/* Clickable filter pills */}
          <div className="flex flex-col gap-1">
            {hasUser && (
              <button
                onClick={() => toggleFilter("user")}
                title={activeFilter === "user" ? "Show all" : "Show travelers only"}
                className={[
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-md border transition-all",
                  activeFilter === "user"
                    ? "bg-blue-600 border-blue-700 text-white scale-105"
                    : "bg-white/90 border-white/60 text-slate-700 hover:bg-blue-50 hover:border-blue-200 backdrop-blur-sm",
                ].join(" ")}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block flex-shrink-0" />
                👤 Travelers
                {activeFilter === "user" && <span className="ml-0.5 opacity-75">✕</span>}
              </button>
            )}
            {hasFeatured && (
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-md border border-white/60 text-xs font-semibold text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block flex-shrink-0" />
                ⭐ Featured
              </div>
            )}
            {hasGem && (
              <button
                onClick={() => toggleFilter("gem")}
                title={activeFilter === "gem" ? "Show all" : "Show hidden gems only"}
                className={[
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shadow-md border transition-all",
                  activeFilter === "gem"
                    ? "bg-emerald-600 border-emerald-700 text-white scale-105"
                    : "bg-white/90 border-white/60 text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 backdrop-blur-sm",
                ].join(" ")}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 inline-block flex-shrink-0" />
                💎 Hidden Gems
                {activeFilter === "gem" && <span className="ml-0.5 opacity-75">✕</span>}
              </button>
            )}
          </div>

          {/* Active filter label */}
          {activeFilter && (
            <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full text-center">
              Filtered · tap to clear
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
