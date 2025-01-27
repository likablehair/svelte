<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Switch from "$lib/components/simple/forms/Switch.svelte";

  let value: boolean
</script>

<h1>Switch</h1>
<ComponentSubtitle>Switching sides.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Switch label='Switch' bind:value={value}/>
</div>
<h2>Props</h2>
<PropsViewer
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