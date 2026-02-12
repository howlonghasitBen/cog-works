/**
 * usePaletteExtractor — Extract color palettes from card images using node-vibrant
 * 
 * Ported from pepeArtGen/mini-app/server/api.mjs extractColorsFromImage()
 * Runs entirely client-side in the browser.
 */
import { useState, useCallback } from 'react'
import { Vibrant } from 'node-vibrant/browser'

export interface ExtractedColors {
  vibrant: string
  darkVibrant: string
  lightVibrant: string
  muted: string
  darkMuted: string
  lightMuted: string
}

export interface CardTheme {
  background: string
  header: { background: string; color: string; textShadow: string; boxShadow: string }
  imageArea: { background: string; border: string; boxShadow: string }
  typeSection: { background: string; color: string; textShadow: string; boxShadow: string }
  stat: { background: string; color: string; border: string; boxShadow: string }
  flavorText: { background: string; color: string; border: string }
  bottomSection: { background: string }
  rarity: { background: string; color: string; border: string; boxShadow: string }
}

function hexToRgba(hex: string, alpha = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return `rgba(128, 128, 128, ${alpha})`
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
}

function getBestTextColor(bgHex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(bgHex)
  if (!result) return '#ffffff'
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff'
}

function generateCardTheme(colors: ExtractedColors): CardTheme {
  const vibrantRgba = hexToRgba(colors.vibrant, 0.4)
  const darkVibrantRgba = hexToRgba(colors.darkVibrant, 0.5)
  const lightVibrantRgba = hexToRgba(colors.lightVibrant, 0.3)
  const mutedRgba = hexToRgba(colors.muted, 0.3)

  return {
    background: `radial-gradient(circle at 20% 30%, ${vibrantRgba} 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${darkVibrantRgba} 0%, transparent 40%), radial-gradient(circle at 60% 10%, ${lightVibrantRgba} 0%, transparent 45%), linear-gradient(145deg, ${colors.darkMuted}, ${colors.darkVibrant}, ${colors.muted})`,
    header: {
      background: `radial-gradient(circle at 25% 50%, ${vibrantRgba} 0%, transparent 60%), radial-gradient(circle at 75% 50%, ${mutedRgba} 0%, transparent 60%), linear-gradient(135deg, ${colors.vibrant}, ${colors.muted}, ${colors.lightVibrant}, ${colors.vibrant}, ${colors.darkVibrant})`,
      color: getBestTextColor(colors.vibrant),
      textShadow: `0 0 min(1vw, 8px) ${hexToRgba(colors.vibrant, 0.8)}, 0 0 min(2vw, 16px) ${hexToRgba(colors.vibrant, 0.4)}`,
      boxShadow: `0 min(0.5vw, 4px) min(1.5vw, 12px) ${hexToRgba(colors.vibrant, 0.3)}, inset 0 min(0.25vw, 2px) 0 ${hexToRgba(colors.lightVibrant, 0.3)}`,
    },
    imageArea: {
      background: `radial-gradient(circle at 30% 20%, ${vibrantRgba} 0%, transparent 45%), radial-gradient(circle at 70% 80%, ${darkVibrantRgba} 0%, transparent 50%), linear-gradient(145deg, ${colors.darkMuted}, ${colors.darkVibrant}, ${colors.muted})`,
      border: `min(0.25vw, 2px) solid ${colors.vibrant}`,
      boxShadow: `inset 0 0 min(2vw, 16px) ${hexToRgba(colors.vibrant, 0.3)}`,
    },
    typeSection: {
      background: `radial-gradient(circle at 30% 60%, ${vibrantRgba} 0%, transparent 55%), radial-gradient(circle at 70% 60%, ${mutedRgba} 0%, transparent 55%), linear-gradient(135deg, ${colors.vibrant}, ${colors.muted}, ${colors.lightVibrant}, ${colors.vibrant}, ${colors.darkVibrant})`,
      color: getBestTextColor(colors.vibrant),
      textShadow: `0 0 min(1vw, 8px) ${hexToRgba(colors.vibrant, 0.8)}`,
      boxShadow: `0 min(0.25vw, 2px) min(1vw, 8px) ${hexToRgba(colors.vibrant, 0.3)}`,
    },
    stat: {
      background: `radial-gradient(circle at 40% 30%, ${vibrantRgba} 0%, transparent 50%), radial-gradient(circle at 60% 70%, ${mutedRgba} 0%, transparent 50%), linear-gradient(145deg, ${colors.darkMuted}, ${colors.darkVibrant})`,
      color: colors.lightVibrant,
      accentColor: colors.vibrant,
      border: `min(0.25vw, 2px) solid ${colors.vibrant}`,
    } as unknown as CardTheme['stat'],
    flavorText: {
      background: `linear-gradient(135deg, ${colors.darkVibrant}, ${colors.darkMuted})`,
      color: colors.lightVibrant,
      border: `1px solid ${hexToRgba(colors.vibrant, 0.3)}`,
    },
    bottomSection: {
      background: hexToRgba(colors.darkVibrant, 0.8),
      border: `min(0.25vw, 2px) solid ${colors.vibrant}`,
      color: colors.lightVibrant,
      boxShadow: `0 0 min(1vw, 8px) ${hexToRgba(colors.vibrant, 0.5)}`,
    } as CardTheme['bottomSection'],
    rarity: {
      background: `linear-gradient(135deg, ${colors.vibrant}, ${colors.muted})`,
      color: getBestTextColor(colors.vibrant),
      border: `min(0.25vw, 2px) solid ${colors.darkVibrant}`,
      boxShadow: `0 0 min(1.2vw, 10px) ${hexToRgba(colors.vibrant, 0.6)}`,
    },
  }
}

export function usePaletteExtractor() {
  const [extracting, setExtracting] = useState(false)

  const extractFromImage = useCallback(async (imageSource: string): Promise<{ colors: ExtractedColors; theme: CardTheme }> => {
    setExtracting(true)
    try {
      // node-vibrant works with img elements, URLs, or ImageData in browser
      const palette = await Vibrant.from(imageSource).getPalette()

      const colors: ExtractedColors = {
        vibrant: palette.Vibrant?.hex || '#808080',
        darkVibrant: palette.DarkVibrant?.hex || '#404040',
        lightVibrant: palette.LightVibrant?.hex || '#c0c0c0',
        muted: palette.Muted?.hex || '#808080',
        darkMuted: palette.DarkMuted?.hex || '#404040',
        lightMuted: palette.LightMuted?.hex || '#c0c0c0',
      }

      const theme = generateCardTheme(colors)

      return { colors, theme }
    } finally {
      setExtracting(false)
    }
  }, [])

  return { extractFromImage, extracting }
}
