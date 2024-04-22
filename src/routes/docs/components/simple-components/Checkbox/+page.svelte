<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import Checkbox from "$lib/components/simple/forms/Checkbox.svelte";
</script>

<h1>Checkbox</h1>
<ComponentSubtitle>A simple checkbox.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Checkbox />
  <Checkbox disabled />
  <Checkbox disabled value={true} />
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