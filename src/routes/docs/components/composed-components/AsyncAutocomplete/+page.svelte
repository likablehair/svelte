<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import AsyncAutocomplete, { type Item } from "$lib/components/composed/forms/AsyncAutocomplete.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  let items: Item[] = [
    { value: 'orange', label: 'Orange' },
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'pear', label: 'Pear' },
    { value: 'blackberry', label: 'Blackberry' },
    { value: 'grape', label: 'Grape' },
    { value: 'watermelon', label: 'Watermelon' },
    { value: 'pineapple', label: 'Pineapple' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'kiwi', label: 'Kiwi' },
    { value: 'mango', label: 'Mango' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'blueberry', label: 'Blueberry' },
    { value: 'raspberry', label: 'Raspberry' },
    { value: 'peach', label: 'Peach' },
    { value: 'apricot', label: 'Apricot' },
    { value: 'plum', label: 'Plum' },
    { value: 'lemon', label: 'Lemon' },
    { value: 'lime', label: 'Lime' },
    { value: 'coconut', label: 'Coconut' }
  ]

  let index = 0
  async function searcher(params: { searchText: string }): Promise<Item[]> {
    index += 1
    return [
      items[index],
      items[(index + 1) % (items.length - 1)],
      items[(index + 2) % (items.length - 1)]
    ]
  }
</script>

<h1>AsyncAutocomplete</h1>
<ComponentSubtitle>Autocomplete in different time and space.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <AsyncAutocomplete
    searcher={searcher}
    {items}
  ></AsyncAutocomplete>
  <AsyncAutocomplete
    searcher={searcher}
    {items}
    multiple={true}
  ></AsyncAutocomplete>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "items", type: "Item[]", description: "List of selectable items.", default: "[]" },
    { name: "values", type: "Item[]", description: "Selected items.", default: "[]" },
    { name: "multiple", type: "boolean", description: "Allow multiple selections.", default: "false" },
    { name: "searcher", type: "(params: { searchText: string }) => Promise<Item[]>", description: "Function to fetch items based on search text." },
    { name: "placeholder", type: "string", description: "Placeholder text.", default: "undefined" },
    { name: "searchThreshold", type: "number", description: "Minimum search text length before triggering search.", default: "2" },
    { name: "debounceTimeout", type: "number", description: "Debounce time for search input.", default: "500" },
    { name: "searching", type: "boolean", description: "Indicates if search is in progress.", default: "false" },
    { name: "search", type: "boolean", description: "Trigger search manually.", default: "false" },
    { name: "searchText", type: "string", description: "Current search text.", default: "undefined" },
    { name: "maxVisibleChips", type: "number", description: "Maximum number of visible selected items.", default: "undefined" },
    { name: "menuOpened", type: "boolean", description: "Controls menu visibility.", default: "false" },
    { name: "mobileDrawer", type: "boolean", description: "Enable mobile-friendly drawer mode.", default: "false" },
    { name: "closeOnSelect", type: "boolean", description: "Close menu when item is selected.", default: "false" },
    { name: "disabled", type: "boolean", description: "Disable input.", default: "false" },
  ]}
  styleProps={[]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { 
      name: 'chipLabelSnippet', 
      description: 'Renders the label inside each chip.', 
      default: '{selection.label}', 
      properties: [
        { name: 'selection', type: 'ItemData', description: 'The selected item.' }
      ]
    },
    { 
      name: 'itemLabelSnippet', 
      description: 'Renders the label of an item.', 
      default: '{item.label}', 
      properties: [
        { name: 'item', type: 'ItemData', description: 'The item to render the label for.' }
      ]
    },
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: 'onchange',
      description: 'Fired when the selection changes.',
      properties: [
        { name: 'unselect', type: 'ItemData | undefined', description: 'The item that was unselected.' },
        { name: 'select', type: 'ItemData | undefined', description: 'The item that was selected.' },
        { name: 'selection', type: 'ItemData[]', description: 'The current selection of items.' }
      ]
    },
  ]}
></EventsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }
</style>