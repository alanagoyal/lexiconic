"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Map, { Marker, type MapRef } from "react-map-gl"
import Supercluster from "supercluster"
import type { WordWithEmbedding } from "@/lib/semantic-search"
import { LANGUAGE_COORDINATES } from "@/lib/language-coordinates"
import "mapbox-gl/dist/mapbox-gl.css"

interface MapViewProps {
  words: WordWithEmbedding[]
  onWordClick: (word: WordWithEmbedding) => void
}

interface ClusterPoint {
  type: "Feature"
  properties: {
    cluster: boolean
    word?: WordWithEmbedding
    point_count?: number
    cluster_id?: number
  }
  geometry: {
    type: "Point"
    coordinates: [number, number]
  }
}

export function MapView({ words, onWordClick }: MapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const [viewport, setViewport] = useState({
    latitude: 20,
    longitude: 0,
    zoom: 1.5,
  })

  // Convert words to GeoJSON points
  const points: ClusterPoint[] = useMemo(() => {
    return words
      .map((word) => {
        const coords = LANGUAGE_COORDINATES[word.language]
        if (!coords) return null

        // Add some random jitter to prevent exact overlaps
        const jitter = 0.5
        const lat = coords.lat + (Math.random() - 0.5) * jitter
        const lng = coords.lng + (Math.random() - 0.5) * jitter

        return {
          type: "Feature" as const,
          properties: {
            cluster: false,
            word,
          },
          geometry: {
            type: "Point" as const,
            coordinates: [lng, lat] as [number, number],
          },
        }
      })
      .filter((p): p is ClusterPoint => p !== null)
  }, [words])

  // Create supercluster instance
  const supercluster = useMemo(() => {
    const cluster = new Supercluster({
      radius: 75,
      maxZoom: 20,
    })
    cluster.load(points)
    return cluster
  }, [points])

  // Get clusters for current viewport
  const clusters = useMemo(() => {
    if (!supercluster) return []

    const bounds = mapRef.current?.getMap().getBounds()
    if (!bounds) {
      return supercluster.getClusters([-180, -85, 180, 85], Math.floor(viewport.zoom))
    }

    return supercluster.getClusters(
      [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ],
      Math.floor(viewport.zoom)
    )
  }, [supercluster, viewport])

  const handleClusterClick = (clusterId: number, longitude: number, latitude: number) => {
    const expansionZoom = Math.min(
      supercluster.getClusterExpansionZoom(clusterId),
      20
    )

    setViewport({
      latitude,
      longitude,
      zoom: expansionZoom,
    })
  }

  return (
    <div className="w-full h-[calc(100vh-120px)]">
      <Map
        ref={mapRef}
        {...viewport}
        onMove={(evt) => setViewport(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoibGV4aWNvbmljIiwiYSI6ImNtNWxrd3RvbTA1MmQybHB6Y3ZvZnZhMHgifQ.0"}
        style={{ width: "100%", height: "100%" }}
      >
        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates
          const { cluster: isCluster, point_count: pointCount, word } = cluster.properties

          if (isCluster) {
            const size = 30 + (pointCount! / points.length) * 50

            return (
              <Marker
                key={`cluster-${cluster.properties.cluster_id}`}
                latitude={latitude}
                longitude={longitude}
              >
                <button
                  className="flex items-center justify-center rounded-full bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors shadow-lg"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                  }}
                  onClick={() =>
                    handleClusterClick(
                      cluster.properties.cluster_id!,
                      longitude,
                      latitude
                    )
                  }
                >
                  {pointCount}
                </button>
              </Marker>
            )
          }

          return (
            <Marker
              key={`word-${word!.word}-${word!.language}`}
              latitude={latitude}
              longitude={longitude}
            >
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors shadow-md hover:scale-110"
                onClick={() => onWordClick(word!)}
                title={word!.word}
              >
                {word!.native_script.charAt(0)}
              </button>
            </Marker>
          )
        })}
      </Map>
    </div>
  )
}
