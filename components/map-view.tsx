"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Map, { Marker, type MapRef } from "react-map-gl";
import type { WordWithEmbedding } from "@/lib/semantic-search";
import { LANGUAGE_COORDINATES } from "@/lib/language-coordinates";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapViewProps {
  words: WordWithEmbedding[];
  onWordClick: (word: WordWithEmbedding) => void;
}

interface WordPoint {
  word: WordWithEmbedding;
  lat: number;
  lng: number;
}

interface Cluster {
  words: WordPoint[];
  lat: number;
  lng: number;
  count: number;
}

// Calculate distance between two points (simple euclidean for clustering)
function distance(lat1: number, lng1: number, lat2: number, lng2: number) {
  return Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);
}

export function MapView({ words, onWordClick }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewport, setViewport] = useState({
    latitude: 20,
    longitude: 0,
    zoom: 1.5,
  });

  // Convert words to points with coordinates
  const wordPoints: WordPoint[] = useMemo(() => {
    return words
      .map((word) => {
        const coords = LANGUAGE_COORDINATES[word.language];
        if (!coords) return null;

        // Add slight jitter to prevent exact overlaps
        const jitter = 0.5;
        const lat = coords.lat + (Math.random() - 0.5) * jitter;
        const lng = coords.lng + (Math.random() - 0.5) * jitter;

        return { word, lat, lng };
      })
      .filter((p): p is WordPoint => p !== null);
  }, [words]);

  // Create clusters based on zoom level
  const { clusters, points } = useMemo(() => {
    if (viewport.zoom > 4) {
      // At high zoom, show individual points
      return { clusters: [], points: wordPoints };
    }

    // Cluster radius based on zoom (larger radius at lower zoom)
    const clusterRadius = 15 / Math.pow(viewport.zoom, 1.5);

    const clustered: Cluster[] = [];
    const unclustered: WordPoint[] = [];
    const processed = new Set<number>();

    wordPoints.forEach((point, i) => {
      if (processed.has(i)) return;

      const nearby: WordPoint[] = [point];
      processed.add(i);

      wordPoints.forEach((other, j) => {
        if (i === j || processed.has(j)) return;
        if (
          distance(point.lat, point.lng, other.lat, other.lng) < clusterRadius
        ) {
          nearby.push(other);
          processed.add(j);
        }
      });

      if (nearby.length > 1) {
        // Average position for cluster
        const avgLat =
          nearby.reduce((sum, p) => sum + p.lat, 0) / nearby.length;
        const avgLng =
          nearby.reduce((sum, p) => sum + p.lng, 0) / nearby.length;

        clustered.push({
          words: nearby,
          lat: avgLat,
          lng: avgLng,
          count: nearby.length,
        });
      } else {
        unclustered.push(point);
      }
    });

    return { clusters: clustered, points: unclustered };
  }, [wordPoints, viewport.zoom]);

  // Auto-fit map bounds when words change
  useEffect(() => {
    if (!mapRef.current || wordPoints.length === 0) return;

    // Calculate bounds from all word points
    const lats = wordPoints.map(p => p.lat);
    const lngs = wordPoints.map(p => p.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Handle single point case - add some padding
    if (wordPoints.length === 1) {
      const padding = 5; // degrees
      mapRef.current.fitBounds([
        [minLng - padding, minLat - padding],
        [maxLng + padding, maxLat + padding]
      ], {
        padding: 50,
        duration: 1000
      });
    } else {
      // Multiple points - fit to bounds with padding
      mapRef.current.fitBounds([
        [minLng, minLat],
        [maxLng, maxLat]
      ], {
        padding: 100,
        duration: 1000
      });
    }
  }, [wordPoints]);

  const handleClusterClick = (cluster: Cluster) => {
    // Zoom in on the cluster
    setViewport({
      latitude: cluster.lat,
      longitude: cluster.lng,
      zoom: Math.min(viewport.zoom + 2, 10),
    });
  };

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  return (
    <div className="w-full h-[calc(100vh-120px)] relative">
      {!MAPBOX_TOKEN && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="max-w-md p-6 bg-background border border-border rounded-lg shadow-lg text-center">
            <h3 className="text-lg font-semibold mb-2">
              Mapbox Token Required
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              To use the map view, add your Mapbox access token to{" "}
              <code className="bg-muted px-1 py-0.5 rounded">.env.local</code>:
            </p>
            <code className="block bg-muted p-2 rounded text-xs mb-4">
              NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
            </code>
            <p className="text-xs text-muted-foreground">
              Get a free token at{" "}
              <a
                href="https://account.mapbox.com/auth/signup/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        {...viewport}
        onMove={(evt) => setViewport(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Clusters */}
        {clusters.map((cluster, i) => {
          const size = 30 + Math.min(cluster.count * 2, 50);

          return (
            <Marker
              key={`cluster-${i}`}
              latitude={cluster.lat}
              longitude={cluster.lng}
              anchor="center"
            >
              <button
                className="flex items-center justify-center rounded-full bg-[#7F8081] opacity-80 text-black font-semibold hover:bg-[#282828] transition-colors shadow-lg"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                }}
                onClick={() => handleClusterClick(cluster)}
              >
                {cluster.count}
              </button>
            </Marker>
          );
        })}

        {/* Individual word points */}
        {points.map((point, i) => (
          <Marker
            key={`word-${i}`}
            latitude={point.lat}
            longitude={point.lng}
            anchor="center"
          >
            <button
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#7F8081] opacity-80 text-black text-xs font-semibold hover:bg-[#282828] transition-colors shadow-md hover:scale-110"
              onClick={() => onWordClick(point.word)}
              title={point.word.word}
            ></button>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
