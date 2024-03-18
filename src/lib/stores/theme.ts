import { writable } from "svelte/store";
import { BROWSER } from "esm-env";

export const COLOR_TYPES = [
  "background",
  "contrast",
  "primary",
  "secondary",
  "error",
  "warning",
];
export const COLOR_SHADES = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
];

export type Shades = Record<(typeof COLOR_SHADES)[number], string>;

export type Colors = Record<
  string,
  {
    dark: Record<(typeof COLOR_TYPES)[number], Shades>;
    light: Record<(typeof COLOR_TYPES)[number], Shades>;
  }
>;

type ThemeStore = {
  colors?: Colors;
  active: string;
  disabled: boolean;
  dark: boolean;
};

const theme = writable<ThemeStore>({
  active: "default",
  disabled: false,
  dark: false,
});

let colorNames: string[] = [];
theme.subscribe((v) => {
  if (!!v.colors) colorNames = Object.keys(v.colors);
});

if (BROWSER) {
  const savedColor = localStorage.getItem("color");

  if (savedColor == "custom") {
    document.documentElement.classList.add("custom");

    theme.update((v) => {
      v.active = "custom";
      return v;
    });
  } else if (savedColor == "green") {
    document.documentElement.classList.add("green");

    theme.update((v) => {
      v.active = "green";
      return v;
    });
  } else {
    document.documentElement.classList.add("default");

    theme.update((v) => {
      v.active = "default";
      return v;
    });
  }
}

if (BROWSER) {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme == "dark") {
    document.documentElement.classList.add("dark");
    theme.update((v) => {
      v.dark = true;
      return v;
    });
  } else if (savedTheme == "light") {
    document.documentElement.classList.add("light");
    theme.update((v) => {
      v.dark = false;
      return v;
    });
  } else if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    theme.update((v) => {
      v.dark = true;
      return v;
    });
  } else {
    theme.update((v) => {
      v.dark = false;
      return v;
    });
  }
}

export function setTheme(th: "light" | "dark") {
  localStorage.setItem("theme", th);
  if (th == "dark") {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
    theme.update((v) => {
      v.dark = true;
      return v;
    });
  } else if (th == "light") {
    document.documentElement.classList.add("light");
    document.documentElement.classList.remove("dark");
    theme.update((v) => {
      v.dark = false;
      return v;
    });
  }
}

export function toggleTheme() {
  if (BROWSER) {
    const th = localStorage.getItem("theme");
    const matchMediaDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (th == "dark") setTheme("light");
    else if (th == "light") setTheme("dark");
    else if (matchMediaDark) setTheme("light");
    else setTheme("light");
  }
}

export function setColor(ct: (typeof colorNames)[number]) {
  if (!ct) ct = "default";

  if (BROWSER) {
    localStorage.setItem("color", ct);

    document.documentElement.classList.add(ct);
    let colorsToRemove = colorNames.filter((cn) => cn != ct);

    for (let color of colorsToRemove) document.documentElement.classList.remove(color);

    theme.update((v) => {
      v.active = ct;
      return v;
    });
  }
}

let styleTag: HTMLStyleElement;
theme.subscribe((value) => {
  if (BROWSER) {
    if (
      !value.colors?.[value.active] ||
      !value.colors[value.active]["dark"] ||
      !value.colors[value.active]["light"]
    ) {
      if (!value.colors) value.colors = {};
      value.colors[value.active] = {
        dark: {},
        light: {},
      };

      for (let i = 0; i < COLOR_TYPES.length; i++) {
        if (!value.colors[value.active]["light"][COLOR_TYPES[i]])
          value.colors[value.active]["light"][COLOR_TYPES[i]] = {};
        if (!value.colors[value.active]["dark"][COLOR_TYPES[i]])
          value.colors[value.active]["dark"][COLOR_TYPES[i]] = {};
        for (let k = 0; k < COLOR_SHADES.length; k++) {
          let rgbCodeLight = getComputedStyle(
            document.documentElement
          ).getPropertyValue(
            `--global-color-light-${COLOR_TYPES[i]}-${COLOR_SHADES[k]}`
          );
          if (!rgbCodeLight && !value.dark)
            rgbCodeLight = getComputedStyle(
              document.documentElement
            ).getPropertyValue(
              `--global-color-${COLOR_TYPES[i]}-${COLOR_SHADES[k]}`
            );

          value.colors[value.active]["light"][COLOR_TYPES[i]][COLOR_SHADES[k]] =
            rgbCodeLight;

          let rgbCodeDark = getComputedStyle(
            document.documentElement
          ).getPropertyValue(
            `--global-color-dark-${COLOR_TYPES[i]}-${COLOR_SHADES[k]}`
          );
          if (!rgbCodeDark && value.dark)
            rgbCodeDark = getComputedStyle(
              document.documentElement
            ).getPropertyValue(
              `--global-color-${COLOR_TYPES[i]}-${COLOR_SHADES[k]}`
            );

          value.colors[value.active]["dark"][COLOR_TYPES[i]][COLOR_SHADES[k]] =
            rgbCodeDark;
        }
      }
    }

    if (!value.disabled) {
      const headTag = document.getElementsByTagName("head")[0];
      if (!styleTag) styleTag = document.createElement("style");

      let styleBuilder: string = "";
      if (!!value.colors) {
        for (let q = 0; q < colorNames.length; q++) {
          const activeTheme = colorNames[q] || "default";
          styleBuilder += `:root.${activeTheme} {`;
          if (!!value.colors[activeTheme]) {
            const modes = ["light", "dark"];
            for (let j = 0; j < modes.length; j++) {
              if (!value.colors[activeTheme][modes[j] as "dark" | "light"])
                value.colors[activeTheme][modes[j] as "dark" | "light"] = {};
              for (const [colorType, shades] of Object.entries(
                value.colors[activeTheme][modes[j] as "dark" | "light"]
              )) {
                for (const [shade, color] of Object.entries(shades)) {
                  styleBuilder += `--global-color-${modes[j]}-${colorType}-${shade}:${color};`;
                }
              }
            }
          }
          styleBuilder += `}`;
        }
      }

      styleTag.innerHTML = styleBuilder;
      headTag.appendChild(styleTag);
    } else if (!!styleTag) {
      const headTag = document.getElementsByTagName("head")[0];
      headTag.removeChild(styleTag);
    }
  }
});

export default theme;
