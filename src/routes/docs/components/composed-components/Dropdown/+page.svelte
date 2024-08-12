<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";

  import Dropdown, { type Item } from "$lib/components/composed/forms/Dropdown.svelte";
    import Dialog from "$lib/components/simple/dialogs/Dialog.svelte";
    import Button from "$lib/components/simple/buttons/Button.svelte";


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
  ],
  dialogOpened: boolean = false
</script>

<h1>Dropdown</h1>
<ComponentSubtitle>Easily drop your things down.</ComponentSubtitle>
<h2>Example</h2>
<div 
  style:position="sticky" 
  style:top="70px"
>
  <Dropdown 
    {items}
    multiple={true}
  ></Dropdown>
</div>
<div style:height="150px">lorem</div>
<div class="example">
  <Dropdown
    icon="mdi-apple"
    {items}
  ></Dropdown>
  <Dropdown 
    {items}
    multiple={true}
  ></Dropdown>

  <div style:position="relative" style:height="400px" style:overflow="auto" style:width="80vw">
    <div style:height="500px">lorem</div>
    <div 
      style:position="sticky" 
      style:top="0px"
    >
      <Dropdown 
        {items}
        multiple={true}
      ></Dropdown>
    </div>
    <div style:height="500px">lorem</div>
  </div>
</div>
<Button on:click={() => dialogOpened = true}>Apri dialog</Button>
<Dialog
  bind:open={dialogOpened}
>
  <div
    style:background-color="rgb(var(--global-color-background-200))"
    style:border-radius="8px"
    style:height="200px"
    style:width="300px"
  >
    <Dropdown 
      {items}
      multiple={true}
    ></Dropdown>
  </div>
</Dialog>
<div 
  style:position="relative"
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:height="500px"
>
  <Dropdown 
    {items}
    multiple={true}
  ></Dropdown>
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