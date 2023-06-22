export default `type Shades = {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
  950: string
}

type Theme = string // should be a custom name, usually 'light' or 'dark'

type Colors = Record<Theme, {
  light?: {
    background?: Shades,
    contrast?: Shades,
    primary?: Shades,
    secondary?: Shades,
    error?: Shades,
    warning?: Shades,
  },
  dark?: {
    background?: Shades,
    contrast?: Shades,
    primary?: Shades,
    secondary?: Shades,
    error?: Shades,
    warning?: Shades,
  }
}>

type ThemeStore = {
  colors: Colors,
  active: Theme,
  disabled: boolean,
  inherit?: string
}
`