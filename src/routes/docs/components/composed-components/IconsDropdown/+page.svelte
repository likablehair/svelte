<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import IconsDropdown, { type IconItem } from "$lib/components/composed/forms/IconsDropdown.svelte";
    import EventsViewer from "../../EventsViewer.svelte";

  let values: IconItem[] = []
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
    {
      name: "items",
      type: "IconItemData[]",
      description: "An array of items to display in the dropdown.",
      default: "[]"
    },
    {
      name: "values",
      type: "IconItemData[]",
      description: "An array of selected values in the dropdown.",
      default: "[]"
    },
    {
      name: "clearable",
      type: "boolean",
      description: "Determines if the selected values can be cleared.",
      default: "false"
    },
    {
      name: "disabled",
      type: "boolean",
      description: "Disables the dropdown and its functionality.",
      default: "false"
    },
    {
      name: "placeholder",
      type: "string",
      description: "The placeholder text when no value is selected.",
      default: "''"
    },
    {
      name: "width",
      type: "string",
      description: "The width of the dropdown.",
      default: "'auto'"
    },
    {
      name: "minWidth",
      type: "string",
      description: "The minimum width of the dropdown.",
      default: "'auto'"
    },
    {
      name: "menuWidth",
      type: "string",
      description: "The width of the dropdown menu.",
      default: "'60px'"
    }
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
<EventsViewer
  events={[
    {
      name: "onchange",
      description: "Triggered when a selection changes.",
      properties: [
        {
          name: "unselect",
          type: "IconItemData | undefined",
          description: "The item that was unselected."
        },
        {
          name: "select",
          type: "IconItemData | undefined",
          description: "The item that was selected."
        },
        {
          name: "selection",
          type: "IconItemData[]",
          description: "The array of selected items."
        }
      ]
    }
  ]}
></EventsViewer>

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