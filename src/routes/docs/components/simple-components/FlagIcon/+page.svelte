<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import FlagIcon from "$lib/components/simple/media/FlagIcon.svelte";
</script>

<h1>FlagIcon</h1>
<ComponentSubtitle>No to racism.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <FlagIcon alpha2="ua"></FlagIcon>
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