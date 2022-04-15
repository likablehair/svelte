<script lang="ts">
  import mediaQuery from "$lib/stores/mediaQuery";

  $: xsAndDown = $mediaQuery.xs
  $: sAndDown = $mediaQuery.s || $mediaQuery.xs
  $: mAndDown = $mediaQuery.s || $mediaQuery.xs || $mediaQuery.m
  $: lAndDown = $mediaQuery.s || $mediaQuery.xs || $mediaQuery.m || $mediaQuery.l
  $: xlAndDown = $mediaQuery.s || $mediaQuery.xs || $mediaQuery.m || $mediaQuery.l || $mediaQuery.xl

  $: xlAndUp = $mediaQuery.xl
  $: lAndUp = $mediaQuery.xl || $mediaQuery.l
  $: mAndUp = $mediaQuery.xl || $mediaQuery.l || $mediaQuery.m
  $: sAndUp = $mediaQuery.xl || $mediaQuery.l || $mediaQuery.m || $mediaQuery.s || $mediaQuery.xs
  $: xsAndUp = $mediaQuery.xl || $mediaQuery.l || $mediaQuery.m || $mediaQuery.s || $mediaQuery.xs
</script>

<slot
  xs={$mediaQuery.xs}
  s={$mediaQuery.s}
  m={$mediaQuery.m}
  l={$mediaQuery.l}
  xl={$mediaQuery.xl}
  xsAndDown={xsAndDown}
  sAndDown={sAndDown}
  mAndDown={mAndDown}
  lAndDown={lAndDown}
  xlAndDown={xlAndDown}
  xlAndUp={xlAndUp}
  lAndUp={lAndUp}
  mAndUp={mAndUp}
  sAndUp={sAndUp}
  xsAndUp={xsAndUp}
></slot>