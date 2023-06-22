export default `import { theme } from '@likable-hair/svelte'

theme.update((currentTheme) => {
  currentTheme.disabled = true
  return currentTheme
})
`