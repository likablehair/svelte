import { browser } from '$app/environment';
import { derived } from "svelte/store";
import theme from './theme'

export type Colors = {
  primary: string,
  secondary: string,
  tertiary: string,
  background: string,
  contrast: string,
  lightContrast: string
  thinContrast: string,
  warning: string,
  warningBackground: string,
  alert: string
}

let lighColors: Colors = {
  primary: '#6186B7',
  secondary: '#6DCFCF',
  tertiary: '#A7CECB',
  background: '#FFFFFF',
  contrast: '#0F1722',
  lightContrast: '#6A7585',
  thinContrast: '#AFBACA',
  warning: '#AD0000',
  warningBackground: '#ffa7a7',
  alert: '#D2A157'
}

let darkColors: Colors = {
  primary: '#197BAA',
  secondary: '#40A3D1',
  tertiary: '#365c6e',
  background: '#061117',
  contrast: '#EFF2F3',
  lightContrast: '#A3A3A3',
  thinContrast: '#314954',
  warning: '#e04747',
  warningBackground: '#AD0000',
  alert: '#D2A157'
}

const store = derived<typeof theme, Colors>(theme, $theme => $theme == 'light' ? lighColors : darkColors)
export default store

store.subscribe((newColors) => {
  if (browser) {
    document.documentElement.style.setProperty("--global-primary-color", newColors.primary);
    document.documentElement.style.setProperty("--global-secondary-color", newColors.secondary);
    document.documentElement.style.setProperty("--global-tertiary-color", newColors.tertiary);
    document.documentElement.style.setProperty("--global-background-color", newColors.background);
    document.documentElement.style.setProperty("--global-contrast-color", newColors.contrast);
    document.documentElement.style.setProperty("--global-light-contrast-color", newColors.lightContrast);
    document.documentElement.style.setProperty("--global-thin-contrast-color", newColors.thinContrast);
    document.documentElement.style.setProperty("--global-warning-color", newColors.warning);
    document.documentElement.style.setProperty("--global-alert-color", newColors.alert);
  }
})