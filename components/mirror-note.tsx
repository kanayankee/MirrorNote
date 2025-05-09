"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eraser, MousePointer, Pen, RotateCcw } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { ColorPalette } from "./color-palette"

type Tool = "pen" | "eraser" | "pointer"
type Color = "black" | "red" | "blue" | "green" | "yellow" | "purple"

export function MirrorNote() {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")
  const [tool, setTool] = useState<Tool>("pen")
  const [color, setColor] = useState<Color>("black")
  const [topColor, setTopColor] = useState<Color>("black")
  const [bottomColor, setBottomColor] = useState<Color>("black")
  const [penOnly, setPenOnly] = useState(true)
  const [isDrawing, setIsDrawing] = useState(false)
  const [pointerPosition, setPointerPosition] = useState<{ x: number; y: number } | null>(null)

  const topCanvasRef = useRef<HTMLCanvasElement>(null)
  const bottomCanvasRef = useRef<HTMLCanvasElement>(null)
  const leftCanvasRef = useRef<HTMLCanvasElement>(null)
  const rightCanvasRef = useRef<HTMLCanvasElement>(null)

  const topCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const bottomCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const leftCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const rightCtxRef = useRef<CanvasRenderingContext2D | null>(null)

  const isMobile = useMobile()

  // Handle orientation changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > window.innerHeight) {
        setOrientation("landscape")
      } else {
        setOrientation("portrait")
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Initialize canvases
  useEffect(() => {
    const setupCanvas = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return null

      const ctx = canvas.getContext("2d")
      if (!ctx) return null

      // Set canvas size to match its display size
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio

      // Scale context to match device pixel ratio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

      // Set default styles
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.lineWidth = 2

      return ctx
    }

    if (orientation === "portrait") {
      topCtxRef.current = setupCanvas(topCanvasRef.current)
      bottomCtxRef.current = setupCanvas(bottomCanvasRef.current)
    } else {
      leftCtxRef.current = setupCanvas(leftCanvasRef.current)
      rightCtxRef.current = setupCanvas(rightCanvasRef.current)
    }
  }, [orientation])

  // Clear all canvases
  const clearCanvases = () => {
    const clearCanvas = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    clearCanvas(topCanvasRef.current)
    clearCanvas(bottomCanvasRef.current)
    clearCanvas(leftCanvasRef.current)
    clearCanvas(rightCanvasRef.current)
  }

  // Transform coordinates for rotated canvas
  const transformCoordinates = (x: number, y: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: rect.width - x,
      y: rect.height - y,
    }
  }

  // Handle drawing in portrait mode
  const handlePortraitDrawStart = (e: React.PointerEvent<HTMLCanvasElement>, isTop: boolean) => {
    if (penOnly && e.pointerType !== "pen") return

    const canvas = isTop ? topCanvasRef.current : bottomCanvasRef.current
    const ctx = isTop ? topCtxRef.current : bottomCtxRef.current
    const mirrorCtx = isTop ? bottomCtxRef.current : topCtxRef.current
    const mirrorCanvas = isTop ? bottomCanvasRef.current : topCanvasRef.current
    const currentColor = isTop ? topColor : bottomColor

    if (!canvas || !ctx || !mirrorCtx || !mirrorCanvas) return

    const rect = canvas.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top

    // Transform coordinates for top canvas (rotated 180 degrees)
    if (isTop) {
      const transformed = transformCoordinates(x, y, canvas)
      x = transformed.x
      y = transformed.y
    }

    if (tool === "pointer") {
      setPointerPosition({ x, y })
      return
    }

    setIsDrawing(true)

    // Draw on both canvases
    ctx.beginPath()
    ctx.moveTo(x, y)

    // For the mirrored canvas, use the same coordinates
    mirrorCtx.beginPath()
    mirrorCtx.moveTo(x, y)

    // Set styles based on selected tool
    if (tool === "pen") {
      ctx.strokeStyle = currentColor
      mirrorCtx.strokeStyle = currentColor
    } else if (tool === "eraser") {
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 20
      mirrorCtx.strokeStyle = "#ffffff"
      mirrorCtx.lineWidth = 20
    }
  }

  const handlePortraitDrawMove = (e: React.PointerEvent<HTMLCanvasElement>, isTop: boolean) => {
    if (penOnly && e.pointerType !== "pen") return

    const canvas = isTop ? topCanvasRef.current : bottomCanvasRef.current
    const ctx = isTop ? topCtxRef.current : bottomCtxRef.current
    const mirrorCtx = isTop ? bottomCtxRef.current : topCtxRef.current

    if (!canvas || !ctx || !mirrorCtx) return

    const rect = canvas.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top

    // Transform coordinates for top canvas (rotated 180 degrees)
    if (isTop) {
      const transformed = transformCoordinates(x, y, canvas)
      x = transformed.x
      y = transformed.y
    }

    if (tool === "pointer") {
      setPointerPosition({ x, y })
      return
    }

    if (!isDrawing) return

    ctx.lineTo(x, y)
    ctx.stroke()

    // Draw on mirrored canvas with the same coordinates
    mirrorCtx.lineTo(x, y)
    mirrorCtx.stroke()
  }

  // Handle drawing in landscape mode
  const handleLandscapeDrawStart = (e: React.PointerEvent<HTMLCanvasElement>, isLeft: boolean) => {
    if (penOnly && e.pointerType !== "pen") return

    const canvas = isLeft ? leftCanvasRef.current : rightCanvasRef.current
    const ctx = isLeft ? leftCtxRef.current : rightCtxRef.current
    const mirrorCtx = isLeft ? rightCtxRef.current : leftCtxRef.current

    if (!canvas || !ctx || !mirrorCtx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === "pointer") {
      setPointerPosition({ x, y })
      return
    }

    setIsDrawing(true)

    ctx.beginPath()
    ctx.moveTo(x, y)

    // For the mirrored canvas in landscape mode
    mirrorCtx.beginPath()
    mirrorCtx.moveTo(x, y)

    // Set styles based on selected tool
    if (tool === "pen") {
      ctx.strokeStyle = color
      mirrorCtx.strokeStyle = color
    } else if (tool === "eraser") {
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 20
      mirrorCtx.strokeStyle = "#ffffff"
      mirrorCtx.lineWidth = 20
    }
  }

  const handleLandscapeDrawMove = (e: React.PointerEvent<HTMLCanvasElement>, isLeft: boolean) => {
    if (penOnly && e.pointerType !== "pen") return

    const canvas = isLeft ? leftCanvasRef.current : rightCanvasRef.current
    const ctx = isLeft ? leftCtxRef.current : rightCtxRef.current
    const mirrorCtx = isLeft ? rightCtxRef.current : leftCtxRef.current

    if (!canvas || !ctx || !mirrorCtx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === "pointer") {
      setPointerPosition({ x, y })
      return
    }

    if (!isDrawing) return

    ctx.lineTo(x, y)
    ctx.stroke()

    // Draw on mirrored canvas with the same coordinates
    mirrorCtx.lineTo(x, y)
    mirrorCtx.stroke()
  }

  const handleDrawEnd = () => {
    setIsDrawing(false)

    // Reset line width for eraser
    if (tool === "eraser") {
      if (topCtxRef.current) topCtxRef.current.lineWidth = 2
      if (bottomCtxRef.current) bottomCtxRef.current.lineWidth = 2
      if (leftCtxRef.current) leftCtxRef.current.lineWidth = 2
      if (rightCtxRef.current) rightCtxRef.current.lineWidth = 2
    }
  }

  // Render pointer on canvases
  useEffect(() => {
    if (!pointerPosition || tool !== "pointer") return

    const drawPointer = (ctx: CanvasRenderingContext2D | null, x: number, y: number, isRotated = false) => {
      if (!ctx) return

      // Clear previous pointer
      const canvas = ctx.canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw new pointer
      ctx.beginPath()
      ctx.arc(x, y, 10, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(255, 0, 0, 0.5)"
      ctx.fill()
    }

    if (orientation === "portrait") {
      if (topCtxRef.current && bottomCtxRef.current && topCanvasRef.current && bottomCanvasRef.current) {
        // For bottom canvas, use coordinates directly
        drawPointer(bottomCtxRef.current, pointerPosition.x, pointerPosition.y)

        // For top canvas, transform coordinates to match rotation
        const topCanvas = topCanvasRef.current
        const transformed = transformCoordinates(pointerPosition.x, pointerPosition.y, topCanvas)
        drawPointer(topCtxRef.current, transformed.x, transformed.y, true)
      }
    } else {
      if (leftCtxRef.current && rightCtxRef.current) {
        drawPointer(leftCtxRef.current, pointerPosition.x, pointerPosition.y)
        drawPointer(rightCtxRef.current, pointerPosition.x, pointerPosition.y)
      }
    }
  }, [pointerPosition, tool, orientation])

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="flex justify-between items-center p-2 border-b">
        <h1 className="text-xl font-bold">MirrorNote</h1>
        <div className="flex items-center gap-2">
          <Tabs value={tool} onValueChange={(value) => setTool(value as Tool)}>
            <TabsList>
              <TabsTrigger value="pen" className="flex items-center gap-1">
                <Pen className="h-4 w-4" />
                <span className="hidden md:inline">ペン</span>
              </TabsTrigger>
              <TabsTrigger value="eraser" className="flex items-center gap-1">
                <Eraser className="h-4 w-4" />
                <span className="hidden md:inline">消しゴム</span>
              </TabsTrigger>
              <TabsTrigger value="pointer" className="flex items-center gap-1">
                <MousePointer className="h-4 w-4" />
                <span className="hidden md:inline">ポインター</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Toggle pressed={penOnly} onPressedChange={setPenOnly} aria-label="ペンのみモード" className="ml-2">
            ペンのみ
          </Toggle>

          <Button variant="outline" size="icon" onClick={clearCanvases} className="ml-2">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {orientation === "portrait" ? (
        <div className="flex flex-col h-full">
          <div className="flex-1 border-b relative">
            <canvas
              ref={topCanvasRef}
              className="absolute inset-0 w-full h-full touch-none transform rotate-180"
              onPointerDown={(e) => handlePortraitDrawStart(e, true)}
              onPointerMove={(e) => handlePortraitDrawMove(e, true)}
              onPointerUp={handleDrawEnd}
              onPointerLeave={handleDrawEnd}
            />
            {/* Top palette - positioned at the "bottom" from the top user's perspective (which is actually the top due to rotation) */}
            <div className="absolute top-2 left-0 right-0 flex justify-center transform rotate-180">
              <ColorPalette
                selectedColor={topColor}
                onSelectColor={(color) => setTopColor(color as Color)}
                tool={tool}
              />
            </div>
          </div>
          <div className="flex-1 relative">
            <canvas
              ref={bottomCanvasRef}
              className="absolute inset-0 w-full h-full touch-none"
              onPointerDown={(e) => handlePortraitDrawStart(e, false)}
              onPointerMove={(e) => handlePortraitDrawMove(e, false)}
              onPointerUp={handleDrawEnd}
              onPointerLeave={handleDrawEnd}
            />
            {/* Bottom palette - positioned at the top of the bottom half */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
              <ColorPalette
                selectedColor={bottomColor}
                onSelectColor={(color) => setBottomColor(color as Color)}
                tool={tool}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex flex-1">
            <div className="flex-1 border-r relative">
              <canvas
                ref={leftCanvasRef}
                className="absolute inset-0 w-full h-full touch-none"
                onPointerDown={(e) => handleLandscapeDrawStart(e, true)}
                onPointerMove={(e) => handleLandscapeDrawMove(e, true)}
                onPointerUp={handleDrawEnd}
                onPointerLeave={handleDrawEnd}
              />
            </div>
            <div className="flex-1 relative">
              <canvas
                ref={rightCanvasRef}
                className="absolute inset-0 w-full h-full touch-none"
                onPointerDown={(e) => handleLandscapeDrawStart(e, false)}
                onPointerMove={(e) => handleLandscapeDrawMove(e, false)}
                onPointerUp={handleDrawEnd}
                onPointerLeave={handleDrawEnd}
              />
            </div>
          </div>
          {/* Shared palette at the bottom in landscape mode */}
          <div className="p-2 flex justify-center border-t">
            <ColorPalette selectedColor={color} onSelectColor={(color) => setColor(color as Color)} tool={tool} large />
          </div>
        </div>
      )}
    </div>
  )
}
