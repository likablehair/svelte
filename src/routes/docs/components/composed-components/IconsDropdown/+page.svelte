<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import IconsDropdown, { type IconItem } from "$lib/components/composed/forms/IconsDropdown.svelte";

  let values: IconItem[] = []

  $: console.log(values)
</script>

<h1>IconsDropdown</h1>
<ComponentSubtitle>Choose an icon from the list.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div
    style:display="flex"
    style:gap="2px"
  >
    <IconsDropdown
      items={[
        { value: 'align-left', icon: 'mdi-format-align-left'},
        { value: 'align-right', icon: 'mdi-format-align-right'},
        { value: 'align-center', icon: 'mdi-format-align-center'},
      ]}
      values={values}
    ></IconsDropdown>
  </div>
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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    margin-bottom: 20px;
  }
</style>