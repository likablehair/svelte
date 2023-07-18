import { writable } from 'svelte/store';
import { BROWSER } from 'esm-env';

export type Shades = {
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
}

type Colors = Record<string, {
  background?: Shades,
  contrast?: Shades,
  primary?: Shades,
  secondary?: Shades,
  error?: Shades,
  warning?: Shades,
}>

type ThemeStore = {
  colors?: Colors,
  active: string,
  disabled: boolean,
  dark: boolean
}

const theme = writable<ThemeStore>({
  active: 'light',
  disabled: true,
  dark: false
});

if(BROWSER) {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme == 'dark') {
    document.documentElement.classList.add("dark")
    theme.update((v) => {
      v.dark = true
      return v
    })
  } else if (savedTheme == 'light') {
    document.documentElement.classList.add("light")
    theme.update((v) => {
      v.dark = false
      return v
    })
  }
}

export function setTheme(th: 'light' | 'dark') {
  localStorage.setItem('theme', th)
  if (th == 'dark') {
    document.documentElement.classList.add("dark")
    document.documentElement.classList.remove("light")
    theme.update((v) => {
      v.dark = true
      return v
    })
  } else if (th == 'light') {
    document.documentElement.classList.add("light")
    document.documentElement.classList.remove("dark")
    theme.update((v) => {
      v.dark = false
      return v
    })
  }
}

export function toggleTheme() {
  if(BROWSER) {
    const th = localStorage.getItem('theme')
    const matchMediaDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

    if (th == 'dark') setTheme('light')
    else if (th == 'light') setTheme('dark')
    else if (matchMediaDark) setTheme('light')
    else setTheme('light')
  }
}

let styleTag: HTMLStyleElement
theme.subscribe(value => {
  if(BROWSER) {
    if (!value.disabled) {
      const headTag = document.getElementsByTagName('head')[0];
      styleTag = document.createElement("style");
  
      let styleBuilder = `:root {`
      if(!!value.colors) {
        const activeTheme = value.active || 'light'
        if(!!value.colors[activeTheme]) {
          for (const [colorType, shades] of Object.entries(value.colors[activeTheme])) {
            for(const [shade, color] of Object.entries(shades)) {
              styleBuilder += `--global-color-${colorType}-${shade}:${color}`
            }
          }
        }
      }
      styleBuilder += '}'
  
      styleTag.innerHTML = styleBuilder;
      headTag.appendChild(styleTag);
    } else if (!!styleTag) {
      const headTag = document.getElementsByTagName('head')[0];
      headTag.removeChild(styleTag)
    }
  }
});

export default theme