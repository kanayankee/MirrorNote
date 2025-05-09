"use client"
import { cn } from "@/lib/utils"

type Color = "black" | "red" | "blue" | "green" | "yellow" | "purple"
type Tool = "pen" | "eraser" | "pointer"

interface ColorPaletteProps {
  selectedColor: Color
  onSelectColor: (color: Color) => void
  tool: Tool
  large?: boolean
}

const colorMap = {
  black: "bg-black",
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  purple: "bg-purple-500",
}

export function ColorPalette({ selectedColor, onSelectColor, tool, large = false }: ColorPaletteProps) {
  const isDisabled = tool !== "pen"

  const colors: Color[] = ["black", "red", "blue", "green", "yellow", "purple"]

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md border",
        large ? "px-4 py-3" : "px-3 py-2",
      )}
    >
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => !isDisabled && onSelectColor(color)}
          className={cn(
            "rounded-full transition-all",
            colorMap[color],
            selectedColor === color
              ? large
                ? "w-10 h-10 ring-4 ring-offset-2 ring-gray-400"
                : "w-8 h-8 ring-2 ring-offset-2 ring-gray-400"
              : large
                ? "w-8 h-8 opacity-70"
                : "w-6 h-6 opacity-70",
            isDisabled && "opacity-30 cursor-not-allowed",
          )}
          disabled={isDisabled}
          aria-label={`${color} color`}
        />
      ))}
    </div>
  )
}
