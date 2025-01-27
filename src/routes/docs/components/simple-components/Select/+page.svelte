<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import Avatar from "$lib/components/simple/media/Avatar.svelte";
    import Select from "$lib/components/simple/forms/Select.svelte";
</script>

<h1>Select</h1>
<ComponentSubtitle>Choose me.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Select
    options={[{
      text: 'Option 1',
      value: 'value',
      icon: 'mdi-wifi-strength-1'
    },
    {
      text: 'Option 2',
      value: 'value2',
      icon: 'mdi-wifi-strength-2'
    },
    {
      text: 'Option 3',
      value: 'value3',
      icon: 'mdi-wifi-strength-3'
    }]}
  >

  </Select>
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