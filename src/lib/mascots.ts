const base = import.meta.env.BASE_URL

export const MASCOT_PATHS = {
  welcome: `${base}mascots/welcome.png`,
  thumbsUp: `${base}mascots/thumbs-up.png`,
  explaining: `${base}mascots/explaining.png`,
  allDone: `${base}mascots/all-done.png`,
} as const

export type MascotKey = keyof typeof MASCOT_PATHS
