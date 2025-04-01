<script lang="ts">
  import mediaQuery from "$lib/stores/mediaQuery";
  import type { Snippet } from "svelte";

  interface Props {
    defaultSnippet?: Snippet<[{
      xs: boolean,
      s: boolean,
      m: boolean,
      l: boolean,
      xl: boolean,
      xsAndDown: boolean,
      sAndDown: boolean,
      lAndDown: boolean,
      mAndDown: boolean,
      xlAndDown: boolean,
      xlAndUp: boolean,
      lAndUp: boolean,
      mAndUp: boolean,
      sAndUp: boolean,
      xsAndUp: boolean
    }]>,
  }

  let { defaultSnippet }: Props = $props() 

  let xsAndDown = $derived($mediaQuery.xs);
let sAndDown = $derived($mediaQuery.s || $mediaQuery.xs);
let mAndDown = $derived($mediaQuery.s || $mediaQuery.xs || $mediaQuery.m);
let lAndDown = $derived($mediaQuery.s || $mediaQuery.xs || $mediaQuery.m || $mediaQuery.l);
let xlAndDown = $derived($mediaQuery.s || $mediaQuery.xs || $mediaQuery.m || $mediaQuery.l || $mediaQuery.xl);

let xlAndUp = $derived($mediaQuery.xl);
let lAndUp = $derived($mediaQuery.xl || $mediaQuery.l);
let mAndUp = $derived($mediaQuery.xl || $mediaQuery.l || $mediaQuery.m);
let sAndUp = $derived($mediaQuery.xl || $mediaQuery.l || $mediaQuery.m || $mediaQuery.s || $mediaQuery.xs);
let xsAndUp = $derived($mediaQuery.xl || $mediaQuery.l || $mediaQuery.m || $mediaQuery.s || $mediaQuery.xs);
</script>

{@render defaultSnippet?.({
  xs: $mediaQuery.xs,
  s: $mediaQuery.s,
  m: $mediaQuery.m,
  l: $mediaQuery.l,
  xl: $mediaQuery.xl,
  xsAndDown,
  sAndDown,
  mAndDown,
  lAndDown,
  xlAndDown,
  xlAndUp,
  lAndUp,
  mAndUp,
  sAndUp,
  xsAndUp,
})}
