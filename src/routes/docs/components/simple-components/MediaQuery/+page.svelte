<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import MediaQuery from "$lib/components/simple/common/MediaQuery.svelte";

  let open: boolean = false

  function handleButtonClick() {
    open = true
  }
</script>

<h1>MediaQuery</h1>
<ComponentSubtitle>Responsive is the key.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <MediaQuery
    let:xl
    let:l
    let:m
    let:s
    let:xs
  >
    <div>
      the screen size is 
      {#if xs}
        xs
      {:else if s}
        s
      {:else if m}
        m
      {:else if l}
        l
      {:else if xl}
        xl
      {/if}
    </div>
  </MediaQuery>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    // {
    //   name: 'type',
    //   type: '"button" | "submit"',
    //   description: "HTML type attribute",
    //   default: "button"
    // }
  ]}
  styleProps={[
    // {
    //   name: '--button-max-width',
    //   type: 'string',
    //   default: 'undefined',
    //   description: 'The max width of the outer element'
    // }
  ]}
></PropsViewer>
<h2>Slots</h2>
<h2>Events</h2>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }
</style>