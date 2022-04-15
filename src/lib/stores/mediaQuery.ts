/* 
  320px — 425px: Mobile devices
  426px — 768px: iPads, Tablets
  769px — 1024px: Small screens, laptops
  1025px — 1440px: Desktops, large screens
  1441px and more —  Extra large screens, TV
*/

import { readable } from "svelte/store";
import { browser } from "$app/env";

export type DeviceDimension = {
  xs: boolean,
  s: boolean,
  m: boolean,
  l: boolean,
  xl: boolean
}

// 0px — 425px: Mobile devices
function handleMatchOnXsQuery(event): DeviceDimension | undefined {
  if(event.matches) {
    return {
      xs: true,
      s: false,
      m: false,
      l: false,
      xl: false
    }
  }
}

// 426px — 768px: iPads, Tablets
function handleMatchOnSQuery(event): DeviceDimension | undefined {
  if (event.matches) {
    return {
      xs: false,
      s: true,
      m: false,
      l: false,
      xl: false
    }
  }
}

// 769px — 1024px: Small screens, laptops
function handleMatchOnMQuery(event): DeviceDimension | undefined {
  if (event.matches) {
    return {
      xs: false,
      s: false,
      m: true,
      l: false,
      xl: false
    }
  }
}

// 1025px — 1440px: Desktops, large screens
function handleMatchOnLQuery(event): DeviceDimension | undefined {
  if (event.matches) {
    return {
      xs: false,
      s: false,
      m: false,
      l: true,
      xl: false
    }
  }
}

// 1441px and more —  Extra large screens, TV
function handleMatchOnXlQuery(event): DeviceDimension | undefined {
  if (event.matches) {
    return {
      xs: false,
      s: false,
      m: false,
      l: false,
      xl: true
    }
  }
}

function getDeviceDimensionFromWidth(width: number) {
  let dimension: DeviceDimension = {
    xs: false,
    s: false,
    m: false,
    l: false,
    xl: false
  }

  if(width <= 425) {
    dimension.xs = true
  } else if(width <= 768) {
    dimension.s = true
  } else if (width <= 1024) {
    dimension.m = true
  } else if (width <= 1440) {
    dimension.l = true
  } else {
    dimension.xl = true
  }

  return dimension
}

let defaultDimension: DeviceDimension = {
  xs: false,
  s: false,
  m: true,
  l: false,
  xl: false
}
if(browser) {
  defaultDimension = getDeviceDimensionFromWidth(window.innerWidth)
} 

export default readable<DeviceDimension>(defaultDimension, set => {
  let mqlXs, mqlS, mqlM, mqlL, mqlXl
  let listenerXs = (e) => {
    const results = handleMatchOnXsQuery(e)
    if(!!results) set(results)
  }
  let listenerS = (e) => {
    const results = handleMatchOnSQuery(e)
    if (!!results) set(results)
  }
  let listenerM = (e) => {
    const results = handleMatchOnMQuery(e)
    if (!!results) set(results)
  }
  let listenerL = (e) => {
    const results = handleMatchOnLQuery(e)
    if (!!results) set(results)
  }
  let listenerXl = (e) => {
    const results = handleMatchOnXlQuery(e)
    if (!!results) set(results)
  }

  if (browser) {
    set(getDeviceDimensionFromWidth(window.innerWidth))

    mqlXs = window.matchMedia("(max-width: 425px)");
    mqlXs.addEventListener("change", listenerXs)

    mqlS = window.matchMedia("(min-width: 426px) and (max-width: 768px)");
    mqlS.addEventListener("change", listenerS)

    mqlM = window.matchMedia("(min-width: 769px) and (max-width: 1024px)");
    mqlM.addEventListener("change", listenerM)

    mqlL = window.matchMedia("(min-width: 1025px) and (max-width: 1440px)");
    mqlL.addEventListener("change", listenerL)

    mqlXl = window.matchMedia("(min-width: 1441px)");
    mqlXl.addEventListener("change", listenerXl)
  }

  return () => {
    if (browser) {
      mqlXs.removeEventListener("change", listenerXs)
      mqlS.removeEventListener("change", listenerS)
      mqlM.removeEventListener("change", listenerM)
      mqlL.removeEventListener("change", listenerL)
      mqlXl.removeEventListener("change", listenerXl)
    } 
  }
})