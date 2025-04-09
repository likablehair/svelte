<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import Navigator from "$lib/components/simple/navigation/Navigator.svelte";
</script>

<h1>Navigator</h1>
<ComponentSubtitle>Better than a TomTom.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Navigator
    items={[
      { name: 'Home', title: 'Home', icon: 'mdi-home' },
      { name: 'About', title: 'About Us', icon: 'mdi-information' },
      { name: 'Services', title: 'Our Services', icon: 'mdi-briefcase' },
      { name: 'Contact', title: 'Contact Us', icon: 'mdi-phone' }
    ]}
  ></Navigator>
  <Navigator
    items={[
      { name: 'Home', title: 'Home', icon: 'mdi-home' },
      { name: 'About', title: 'About Us', icon: 'mdi-information' },
      { name: 'Services', title: 'Our Services', icon: 'mdi-briefcase' },
      { name: 'Contact', title: 'Contact Us', icon: 'mdi-phone' }
    ]}
    vertical
  ></Navigator>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "items", type: "Item[]", description: "List of items to display", default: "[]" },
    { name: "color", type: "string", description: "Text color of the links", default: "undefined" },
    { name: "vertical", type: "boolean", description: "Whether the items are displayed vertically or horizontally", default: "false" },
    { name: "variant", type: "'standard' | 'underlined'", description: "Style of the links", default: "'underlined'" },
    { name: "textColor", type: "string", description: "Text color of the links", default: "''" },
    { name: "hoverTextColor", type: "string", description: "Text color of the links when hovered", default: "undefined" },
    { name: "space", type: "string", description: "Spacing between the items", default: "'20px'" },
  ]}
  styleProps={[
    { name: "--navigator-text-color", type: "color", description: "Text color for the navigator", },
    { name: "--navigator-hover-text-color", type: "color", description: "Text color when hovered", },
    { name: "--navigator-space", type: "size", description: "Spacing between items", default: "'20px'" },
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onitemClick", description: "Triggered when an item is clicked", properties: [{ name: "item", type: "Item", description: "The clicked item" }] },
  ]}
></EventsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 100px;
    margin-bottom: 20px;
  }
</style>