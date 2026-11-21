/** Pares papel/tinta de las portadas. El color de un curso sale de su id. */
const PALETTES: ReadonlyArray<{ paper: string; ink: string }> = [
  { paper: '#C9C2A8', ink: '#1F1E1A' },
  { paper: '#3F5B4A', ink: '#EFEBDD' },
  { paper: '#8C4A32', ink: '#F3E9DE' },
  { paper: '#2F4A6B', ink: '#E9EEF4' },
  { paper: '#B08A2E', ink: '#1F1A0E' },
  { paper: '#5C4D6E', ink: '#EFE9F5' },
  { paper: '#D7D3C8', ink: '#1F1E1A' },
  { paper: '#6B7344', ink: '#F1F0E2' },
]

export function coverPalette(seed: number) {
  return PALETTES[Math.abs(seed) % PALETTES.length]
}

/** Variables CSS con el color de la portada, para lomos y fondos. */
export function coverVars(seed: number) {
  const { paper, ink } = coverPalette(seed)
  return { '--cover-paper': paper, '--cover-ink': ink } as Record<string, string>
}
