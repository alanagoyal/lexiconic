"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Map, { Marker, type MapRef } from "react-map-gl";
import type { WordWithEmbedding } from "@/lib/semantic-search";
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
  const [hoveredCluster, setHoveredCluster] = useState<number | null>(null);

  // Stabilize viewport position to prevent constant filtering changes during zoom/pan
  const stableViewport = useMemo(() => {
    return {
      latitude: Math.round(viewport.latitude * 2) / 2, // Round to nearest 0.5 degree
      longitude: Math.round(viewport.longitude * 2) / 2,
    };
  }, [viewport.latitude, viewport.longitude]);

  // Convert words to points with coordinates
  const wordPoints: WordPoint[] = useMemo(() => {
    return words
      .map((word) => {
        // Read coordinates directly from word data
        const { lat, lng } = word;
        
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          console.warn(`Missing coordinates for word: ${word.word} (location: ${word.location})`);
          return null;
        }

        // Add slight jitter to prevent exact overlaps using deterministic offset
        const jitter = 0.5;
        // Use word string to generate stable pseudo-random offset
        const hash = word.word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const jitteredLat = lat + ((hash % 1000) / 1000 - 0.5) * jitter;
        const jitteredLng = lng + ((hash % 1001) / 1001 - 0.5) * jitter;

        return { word, lat: jitteredLat, lng: jitteredLng };
      })
      .filter((p): p is WordPoint => p !== null);
  }, [words]);

  // Get current map bounds to filter visible markers
  const bounds = useMemo(() => {
    if (!mapRef.current) return null;
    const map = mapRef.current.getMap();
    const mapBounds = map.getBounds();
    if (!mapBounds) return null;
    return {
      north: mapBounds.getNorth(),
      south: mapBounds.getSouth(),
      east: mapBounds.getEast(),
      west: mapBounds.getWest(),
    };
  }, [viewport]);

  // Create clusters based on zoom level
  const { clusters, points } = useMemo(() => {
    // Filter points to only those in viewport (accounting for longitude wrapping)
    const visiblePoints = bounds
      ? wordPoints.filter((point) => {
          const inLatRange = point.lat >= bounds.south && point.lat <= bounds.north;

          // Handle longitude wrapping around 180/-180
          let inLngRange;
          if (bounds.west <= bounds.east) {
            // Normal case: bounds don't cross antimeridian
            inLngRange = point.lng >= bounds.west && point.lng <= bounds.east;
          } else {
            // Bounds cross antimeridian
            inLngRange = point.lng >= bounds.west || point.lng <= bounds.east;
          }

          return inLatRange && inLngRange;
        })
      : wordPoints;

    if (viewport.zoom > 4) {
      // At high zoom, show individual points
      return { clusters: [], points: visiblePoints };
    }

    // Cluster radius based on zoom (larger radius at lower zoom)
    const clusterRadius = 35 / Math.pow(viewport.zoom, 1.2);

    const clustered: Cluster[] = [];
    const unclustered: WordPoint[] = [];
    const processed = new Set<number>();

    visiblePoints.forEach((point, i) => {
      if (processed.has(i)) return;

      const nearby: WordPoint[] = [point];
      processed.add(i);

      visiblePoints.forEach((other, j) => {
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
  }, [wordPoints, viewport.zoom, bounds]);

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
        renderWorldCopies={false}
      >
        {/* Clusters */}
        {clusters.map((cluster, i) => {
          const size = 15 + Math.min(cluster.count * 1, 25);
          const fontSize = 6 + Math.min(cluster.count * 0.2, 8);
          const sampleWords = cluster.words.slice(0, 3).map(w => w.word.word).join(", ");
          const label = cluster.count <= 3 ? sampleWords : `${sampleWords}...`;

          return (
            <Marker
              key={`cluster-${i}`}
              latitude={cluster.lat}
              longitude={cluster.lng}
              anchor="center"
            >
              <div 
                className="relative flex items-center justify-center"
                onMouseEnter={() => setHoveredCluster(i)}
                onMouseLeave={() => setHoveredCluster(null)}
              >
                <button
                  className="flex items-center justify-center bg-black text-[#fafafa] font-semibold transition-all duration-200 hover:scale-110"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    fontSize: `${fontSize}px`,
                  }}
                  onClick={() => handleClusterClick(cluster)}
                >
                  {cluster.count}
                </button>
                {hoveredCluster === i && (
                  <div 
                    className="absolute bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground whitespace-nowrap shadow-sm transition-opacity duration-200"
                    style={{ 
                      top: 'calc(50% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      pointerEvents: 'none'
                    }}
                  >
                    {label}
                  </div>
                )}
              </div>
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
            <div className="flex flex-col items-center gap-1">
              <button
                className="flex items-center justify-center w-6 h-6 bg-black text-foreground text-xs font-semibold transition-all duration-200 hover:scale-110"
                onClick={() => onWordClick(point.word)}
              ></button>
              <div className="bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground whitespace-nowrap shadow-sm">
                {point.word.word}
              </div>
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
