export default `import { theme } from '@likable-hair/svelte'

theme.update((currentTheme) => {
  const activeTheme = currentTheme.active

  if(!currentTheme.colors[activeTheme]) currentTheme.colors[activeTheme] = {}
  if(!currentTheme.colors[activeTheme].light) currentTheme.colors[activeTheme].light = {}
  currentTheme.colors[activeTheme].light.background = {
    50: #eff6ff
  }

  return currentTheme
})
`