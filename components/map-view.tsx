"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Map, { Source, Layer, type MapRef, type LayerProps } from "react-map-gl";
import type { WordWithEmbedding } from "@/lib/semantic-search";
import type { FeatureCollection, Point } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapViewProps {
  words: WordWithEmbedding[];
  onWordClick: (word: WordWithEmbedding) => void;
}

interface WordFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    word: string;
    location: string;
    wordData: WordWithEmbedding;
  };
}

export function MapView({ words, onWordClick }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewport, setViewport] = useState({
    latitude: 20,
    longitude: 0,
    zoom: 1.5,
  });

  // Convert words to GeoJSON FeatureCollection - this is stable and only updates when words change
  const geojsonData: FeatureCollection<Point> = useMemo(() => {
    const features = words
      .filter((word) => {
        const { lat, lng } = word;
        if (typeof lat !== 'number' || typeof lng !== 'number') {
          console.warn(`Missing coordinates for word: ${word.word} (location: ${word.location})`);
          return false;
        }
        return true;
      })
      .map((word) => {
        // Add slight jitter to prevent exact overlaps using deterministic offset
        const jitter = 0.5;
        const hash = word.word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const jitteredLat = word.lat + ((hash % 1000) / 1000 - 0.5) * jitter;
        const jitteredLng = word.lng + ((hash % 1001) / 1001 - 0.5) * jitter;

        return {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [jitteredLng, jitteredLat], // GeoJSON uses [lng, lat] order
          },
          properties: {
            word: word.word,
            location: word.location,
            wordData: word,
          },
        };
      });

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [words]);

  // Auto-fit map bounds when words change
  useEffect(() => {
    if (!mapRef.current || geojsonData.features.length === 0) return;

    // Calculate bounds from all features
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

  // Handle clicks on clusters - zoom in
  const onClusterClick = (event: any) => {
    const feature = event.features?.[0];
    if (!feature || !mapRef.current) return;

    const clusterId = feature.properties.cluster_id;
    const mapboxSource = mapRef.current.getMap().getSource('words');

    if (!mapboxSource || mapboxSource.type !== 'geojson') return;

    // @ts-ignore - getClusterExpansionZoom exists on GeoJSON source
    mapboxSource.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
      if (err) return;

      setViewport({
        ...viewport,
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
        zoom: zoom,
      });
    });
  };

  // Handle clicks on individual points
  const onPointClick = (event: any) => {
    const feature = event.features?.[0];
    if (!feature) return;

    const wordData = feature.properties.wordData;
    if (wordData) {
      onWordClick(JSON.parse(wordData));
    }
  };

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  // We'll need to add a square icon image to the map after it loads
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();

    // Wait for map to load
    if (!map.loaded()) {
      map.on('load', addSquareIcon);
    } else {
      addSquareIcon();
    }

    function addSquareIcon() {
      if (map.hasImage('square')) return;

      // Create a square icon using canvas
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, size, size);

        map.addImage('square', canvas);
      }
    }

    return () => {
      map.off('load', addSquareIcon);
    };
  }, []);

  // Layer styles for clusters (using symbols with square icon)
  const clusterLayer: LayerProps = {
    id: 'clusters',
    type: 'symbol',
    source: 'words',
    filter: ['has', 'point_count'],
    layout: {
      'icon-image': 'square',
      'icon-size': [
        'step',
        ['get', 'point_count'],
        0.3,  // size for clusters with < 10 points
        10, 0.4,  // size for 10-99 points
        100, 0.5  // size for 100+ points
      ],
      'icon-allow-overlap': true,
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
      'text-size': 12,
    },
    paint: {
      'text-color': '#fafafa',
    },
  };

  // Layer for unclustered points (using same square icon)
  const unclusteredPointLayer: LayerProps = {
    id: 'unclustered-point',
    type: 'symbol',
    source: 'words',
    filter: ['!', ['has', 'point_count']],
    layout: {
      'icon-image': 'square',
      'icon-size': 0.15,
      'icon-allow-overlap': true,
    },
  };

  // Layer for word labels
  const wordLabelLayer: LayerProps = {
    id: 'word-labels',
    type: 'symbol',
    source: 'words',
    filter: ['!', ['has', 'point_count']],
    layout: {
      'text-field': ['get', 'word'],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12,
      'text-offset': [0, 1.5],
      'text-anchor': 'top',
    },
    paint: {
      'text-color': '#000000',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1,
    },
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
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
        renderWorldCopies={false}
        interactiveLayerIds={['clusters', 'unclustered-point']}
        onClick={(event) => {
          const features = event.features;
          if (!features || features.length === 0) return;

          const feature = features[0];
          if (feature.layer.id === 'clusters') {
            onClusterClick(event);
          } else if (feature.layer.id === 'unclustered-point') {
            onPointClick(event);
          }
        }}
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
          <Layer {...unclusteredPointLayer} />
          <Layer {...wordLabelLayer} />
        </Source>
      </Map>
    </div>
  );
}
