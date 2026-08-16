"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap, type Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const OPENFREEMAP_LIBERTY = "https://tiles.openfreemap.org/styles/liberty";

const RASTER_FALLBACK = {
  version: 8 as const,
  sources: {
    raster: {
      type: "raster" as const,
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap",
    },
  },
  layers: [{ id: "raster", type: "raster" as const, source: "raster" }],
};

export type DialMapPin = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
};

function isStyleLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /style|fetch|network|failed/i.test(msg);
}

function styleUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MAP_TILES_STYLE_URL?.trim() ||
    process.env.MAP_TILES_STYLE_URL?.trim() ||
    OPENFREEMAP_LIBERTY
  );
}

export function DialMap(props: {
  pins?: DialMapPin[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onPick?: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [status, setStatus] = useState<"vector" | "raster">("vector");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const waitForSize = (attempt = 0) => {
      if (el.clientWidth <= 0 || el.clientHeight <= 0) {
        if (attempt < 24) {
          window.requestAnimationFrame(() => waitForSize(attempt + 1));
        }
        return;
      }
      mount(el);
    };
    waitForSize();

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  function mount(el: HTMLDivElement) {
    const map = new maplibregl.Map({
      container: el,
      style: styleUrl(),
      center: props.center ?? [31.05, -17.83],
      zoom: props.zoom ?? 11,
      attributionControl: {},
    });
    mapRef.current = map;

    const watchdog = window.setTimeout(() => {
      if (!map.isStyleLoaded()) {
        map.setStyle(RASTER_FALLBACK as never);
        setStatus("raster");
      }
    }, 10_000);

    map.on("error", (e) => {
      if (isStyleLoadError(e.error) && status === "vector") {
        map.setStyle(RASTER_FALLBACK as never);
        setStatus("raster");
      }
    });
    map.on("load", () => window.clearTimeout(watchdog));
    map.on("style.load", () => {
      applyPins(map, props.pins ?? []);
    });

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el);

    if (props.onPick) {
      map.on("click", (ev) => props.onPick?.(ev.lngLat.lat, ev.lngLat.lng));
    }

    map.once("remove", () => {
      window.clearTimeout(watchdog);
      ro.disconnect();
    });
  }

  useEffect(() => {
    const map = mapRef.current;
    if (map?.isStyleLoaded()) applyPins(map, props.pins ?? []);
  }, [props.pins]);

  function applyPins(map: MapLibreMap, pins: DialMapPin[]) {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = pins.map((pin) => {
      const marker = new maplibregl.Marker({ color: "#1f4d3a" })
        .setLngLat([pin.lng, pin.lat])
        .setPopup(
          pin.label ? new maplibregl.Popup({ offset: 12 }).setText(pin.label) : undefined,
        )
        .addTo(map);
      return marker;
    });
  }

  return (
    <div style={{ position: "relative", height: props.height ?? "min(50vh, 400px)" }}>
      <div
        ref={containerRef}
        data-testid="dial-map"
        role="img"
        aria-label="Map"
        style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden" }}
      />
      {status === "raster" ? (
        <div
          data-testid="dial-map-raster"
          style={{
            position: "absolute",
            top: 10,
            left: 12,
            fontSize: 12,
            background: "rgba(255,255,255,0.85)",
            padding: "4px 8px",
            borderRadius: 6,
          }}
        >
          Raster basemap
        </div>
      ) : null}
    </div>
  );
}
