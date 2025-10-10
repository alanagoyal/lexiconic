"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import Map, { Source, Layer, type MapRef } from "react-map-gl";
import type { WordWithEmbedding } from "@/lib/semantic-search";
import type {
  CircleLayer,
  SymbolLayer,
  GeoJSONSource
} from "mapbox-gl";
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

export function MapView({ words, onWordClick }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewport, setViewport] = useState({
    latitude: 20,
    longitude: 0,
    zoom: 1.5,
  });

  // Convert words to GeoJSON format with jittering
  const geojsonData = useMemo(() => {
    const features = words
      .map((word) => {
        const { lat, lng } = word;

        if (typeof lat !== 'number' || typeof lng !== 'number') {
          console.warn(`Missing coordinates for word: ${word.word} (location: ${word.location})`);
          return null;
        }

        // Add slight jitter to prevent exact overlaps using deterministic offset
        const jitter = 0.5;
        const hash = word.word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const jitteredLat = lat + ((hash % 1000) / 1000 - 0.5) * jitter;
        const jitteredLng = lng + ((hash % 1001) / 1001 - 0.5) * jitter;

        return {
          type: "Feature" as const,
          properties: {
            word: word.word,
            location: word.location,
            // Store the entire word object as JSON for click handling
            wordData: JSON.stringify(word),
          },
          geometry: {
            type: "Point" as const,
            coordinates: [jitteredLng, jitteredLat],
          },
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null);

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [words]);

  // Auto-fit map bounds when words change
  useEffect(() => {
    if (!mapRef.current || geojsonData.features.length === 0) return;

    const coords = geojsonData.features.map(f => f.geometry.coordinates);
    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Handle single point case - add some padding
    if (geojsonData.features.length === 1) {
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
  }, [geojsonData]);

  // Handle map clicks on points and clusters
  const handleMapClick = useCallback((event: any) => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    const features = map.queryRenderedFeatures(event.point, {
      layers: ['unclustered-point', 'clusters']
    });

    if (!features.length) return;

    const feature = features[0];

    if (feature.layer.id === 'clusters') {
      // Zoom into cluster
      const clusterId = feature.properties?.cluster_id;
      const source = map.getSource('words') as any;

      source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
        if (err) return;

        const coordinates = (feature.geometry as any).coordinates;
        map.easeTo({
          center: coordinates,
          zoom: zoom,
          duration: 500
        });
      });
    } else if (feature.layer.id === 'unclustered-point') {
      // Handle word click
      try {
        const wordData = JSON.parse(feature.properties?.wordData || '{}');
        onWordClick(wordData);
      } catch (e) {
        console.error('Error parsing word data:', e);
      }
    }
  }, [onWordClick]);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  // Define layer styles matching the original visual design
  const clusterLayer: CircleLayer = {
    id: 'clusters',
    type: 'circle',
    source: 'words',
    filter: ['has', 'point_count'],
    paint: {
      // Black circles matching original style: bg-black
      'circle-color': '#000000',
      // Size based on point count (15 + min(count * 1, 25))
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        15,  // base size
        10, 20,
        25, 25,
        50, 30,
        100, 35,
        200, 40
      ],
      'circle-opacity': 1
    }
  };

  const clusterCountLayer: SymbolLayer = {
    id: 'cluster-count',
    type: 'symbol',
    source: 'words',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12
    },
    paint: {
      // White text matching original: text-[#fafafa]
      'text-color': '#fafafa'
    }
  };

  const unclusteredPointLayer: CircleLayer = {
    id: 'unclustered-point',
    type: 'circle',
    source: 'words',
    filter: ['!', ['has', 'point_count']],
    paint: {
      // Black circles matching original: bg-black, w-6 h-6 = 24px = 12px radius
      'circle-color': '#000000',
      'circle-radius': 12,
      'circle-opacity': 1
    }
  };

  const unclusteredLabelLayer: SymbolLayer = {
    id: 'unclustered-label',
    type: 'symbol',
    source: 'words',
    filter: ['!', ['has', 'point_count']],
    layout: {
      'text-field': ['get', 'word'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12,
      'text-anchor': 'top',
      'text-offset': [0, 1.2]
    },
    paint: {
      'text-color': '#000000',
      'text-halo-color': 'rgba(255, 255, 255, 0.9)',
      'text-halo-width': 2
    }
  };

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
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
        renderWorldCopies={false}
        mapLib={import('mapbox-gl')}
        // Enable WebGPU rendering
        antialias={true}
        optimizeForTerrain={true}
      >
        <Source
          id="words"
          type="geojson"
          data={geojsonData}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...unclusteredPointLayer} />
          <Layer {...unclusteredLabelLayer} />
        </Source>
      </Map>
    </div>
  );
}
