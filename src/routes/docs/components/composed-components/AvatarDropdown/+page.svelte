<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";

  import AvatarDropdown, { type AvatarItem } from "$lib/components/composed/forms/AvatarDropdown.svelte";

  let items: AvatarItem[] = [
    { value: 'orange', label: 'Orange', text: 'OR' },
    { value: 'apple', label: 'Apple', text: 'AP' },
    { value: 'banana', label: 'Banana', text: 'BA' },
    { value: 'pear', label: 'Pear', text: 'PE' },
    { value: 'blackberry', label: 'Blackberry', text: 'BL' },
    { value: 'grape', label: 'Grape', text: 'GR' },
    { value: 'watermelon', label: 'Watermelon', text: 'WA' },
    { value: 'pineapple', label: 'Pineapple', text: 'PI' },
    { value: 'strawberry', label: 'Strawberry', text: 'ST' },
    { value: 'kiwi', label: 'Kiwi', text: 'KI' },
    { value: 'mango', label: 'Mango', text: 'MA' },
  ]
</script>

<h1>AvatarDropdown</h1>
<ComponentSubtitle>Easily choose your avatar.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <AvatarDropdown
    {items}
  ></AvatarDropdown>
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