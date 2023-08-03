<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";

  import AsyncAutocomplete, { type Item } from "$lib/components/composed/forms/AsyncAutocomplete.svelte";
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