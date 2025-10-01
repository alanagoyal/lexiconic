"use client"

import { useMemo, useState } from "react"
import type { WordWithEmbedding } from "@/lib/semantic-search"
import { LANGUAGE_COORDINATES } from "@/lib/language-coordinates"

interface MapViewProps {
  words: WordWithEmbedding[]
  onWordClick: (word: WordWithEmbedding) => void
}

interface WordPoint {
  word: WordWithEmbedding
  x: number
  y: number
}

interface Cluster {
  words: WordWithEmbedding[]
  x: number
  y: number
  count: number
}

// Convert lat/lng to screen coordinates (simplified projection)
function latLngToXY(lat: number, lng: number, width: number, height: number) {
  // Simple equirectangular projection
  const x = ((lng + 180) / 360) * width
  const y = ((90 - lat) / 180) * height
  return { x, y }
}

// Calculate distance between two points
function distance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

export function MapView({ words, onWordClick }: MapViewProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const viewWidth = 1400
  const viewHeight = 700

  // Convert words to points with coordinates
  const wordPoints: WordPoint[] = useMemo(() => {
    return words
      .map((word) => {
        const coords = LANGUAGE_COORDINATES[word.language]
        if (!coords) return null

        // Add slight jitter to prevent exact overlaps
        const jitter = 2
        const lat = coords.lat + (Math.random() - 0.5) * jitter
        const lng = coords.lng + (Math.random() - 0.5) * jitter

        const { x, y } = latLngToXY(lat, lng, viewWidth, viewHeight)

        return { word, x, y }
      })
      .filter((p): p is WordPoint => p !== null)
  }, [words])

  // Create clusters based on zoom level
  const { clusters, points } = useMemo(() => {
    if (zoomLevel > 3) {
      // At high zoom, show individual points
      return { clusters: [], points: wordPoints }
    }

    // Cluster radius based on zoom
    const clusterRadius = 60 / zoomLevel

    const clustered: Cluster[] = []
    const unclustered: WordPoint[] = []
    const processed = new Set<number>()

    wordPoints.forEach((point, i) => {
      if (processed.has(i)) return

      const nearby: WordWithEmbedding[] = [point.word]
      processed.add(i)

      wordPoints.forEach((other, j) => {
        if (i === j || processed.has(j)) return
        if (distance(point.x, point.y, other.x, other.y) < clusterRadius) {
          nearby.push(other.word)
          processed.add(j)
        }
      })

      if (nearby.length > 1) {
        clustered.push({
          words: nearby,
          x: point.x,
          y: point.y,
          count: nearby.length,
        })
      } else {
        unclustered.push(point)
      }
    })

    return { clusters: clustered, points: unclustered }
  }, [wordPoints, zoomLevel])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x)
      setPanY(e.clientY - dragStart.y)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoomLevel((prev) => Math.max(0.5, Math.min(10, prev * delta)))
  }

  const handleClusterClick = (cluster: Cluster) => {
    // Zoom in on the cluster
    setZoomLevel((prev) => Math.min(10, prev * 2))
  }

  return (
    <div className="w-full h-[calc(100vh-120px)] bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 relative overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-lg border border-border shadow-lg">
        <button
          onClick={() => setZoomLevel((prev) => Math.min(10, prev * 1.5))}
          className="px-3 py-1 bg-background hover:bg-accent rounded text-sm font-medium"
        >
          +
        </button>
        <button
          onClick={() => setZoomLevel((prev) => Math.max(0.5, prev / 1.5))}
          className="px-3 py-1 bg-background hover:bg-accent rounded text-sm font-medium"
        >
          −
        </button>
        <button
          onClick={() => {
            setZoomLevel(1)
            setPanX(0)
            setPanY(0)
          }}
          className="px-3 py-1 bg-background hover:bg-accent rounded text-sm font-medium"
        >
          Reset
        </button>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-border shadow-lg text-xs text-muted-foreground">
        Zoom: {zoomLevel.toFixed(1)}x • {clusters.length} clusters • {points.length} words
      </div>

      {/* Map visualization */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={isDragging ? "cursor-grabbing" : "cursor-grab"}
        style={{ userSelect: "none" }}
      >
        <g transform={`translate(${panX / 2}, ${panY / 2}) scale(${zoomLevel})`}>
          {/* Decorative grid lines */}
          <g opacity="0.1">
            {Array.from({ length: 20 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={(i * viewWidth) / 19}
                y1={0}
                x2={(i * viewWidth) / 19}
                y2={viewHeight}
                stroke="currentColor"
                strokeWidth="0.5"
              />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={(i * viewHeight) / 9}
                x2={viewWidth}
                y2={(i * viewHeight) / 9}
                stroke="currentColor"
                strokeWidth="0.5"
              />
            ))}
          </g>

          {/* Clusters */}
          {clusters.map((cluster, i) => {
            const size = 20 + Math.min(cluster.count * 3, 60)
            return (
              <g key={`cluster-${i}`}>
                <circle
                  cx={cluster.x}
                  cy={cluster.y}
                  r={size}
                  fill="rgb(59, 130, 246)"
                  opacity="0.7"
                  onClick={() => handleClusterClick(cluster)}
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                />
                <text
                  x={cluster.x}
                  y={cluster.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={Math.max(12, size / 3)}
                  fontWeight="600"
                  pointerEvents="none"
                >
                  {cluster.count}
                </text>
              </g>
            )
          })}

          {/* Individual word points */}
          {points.map((point, i) => (
            <g key={`word-${i}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={16}
                fill="rgb(34, 197, 94)"
                opacity="0.85"
                onClick={() => onWordClick(point.word)}
                className="cursor-pointer hover:opacity-100 hover:scale-110 transition-all"
              />
              <text
                x={point.x}
                y={point.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="12"
                fontWeight="600"
                pointerEvents="none"
              >
                {point.word.native_script.charAt(0)}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
