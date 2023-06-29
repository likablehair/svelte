<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import Chip from "$lib/components/simple/navigation/Chip.svelte";
</script>

<h1>Chip</h1>
<ComponentSubtitle>Cheap Chip.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Chip close>Some chip</Chip>
  <Chip>Some chip</Chip>
  <Chip label>Label chip</Chip>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: 'type',
      type: '"button" | "submit"',
      description: "HTML type attribute",
      default: "button"
    }
  ]}
  styleProps={[
    {
      name: '--button-max-width',
      type: 'string',
      default: 'undefined',
      description: 'The max width of the outer element'
    }
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