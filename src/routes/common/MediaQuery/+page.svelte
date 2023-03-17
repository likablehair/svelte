<script lang="ts">
  import MediaQuery from "$lib/components/simple/common/MediaQuery.svelte";
</script>

<MediaQuery let:s let:xs let:m let:l let:xl let:mAndDown>
  {#if s}
    sono un dispositivo s
  {/if}
  {#if xs}
    sono un dispositivo xs
  {/if}
  {#if m}
    sono un dispositivo m
  {/if}
  {#if l}
    sono un dispositivo l
  {/if}
  {#if xl}
    sono un dispositivo xl
  {/if}
  {#if mAndDown}
    <div>sono più piccolo di un l</div>
  {/if}
</MediaQuery>
