<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
</script>

<h1>Button</h1>
<ComponentSubtitle>Beautiful buttons are coming for your next project.</ComponentSubtitle>

<h2>Example</h2>
<form method="POST">
  <div class="example">
    <Button --button-width="200px" --button-max-width="90vw">Default button</Button>
  </div>
  <div class="example">
    <Button buttonType="text" --button-width="200px" --button-max-width="90vw">Text Button</Button>
  </div>
  <div class="example">
    <Button disabled={true} --button-width="200px" --button-max-width="90vw">Disabled Button</Button>
  </div>
  <div class="example">
    <Button buttonType="icon" icon={'mdi-filter'} disabled={true} --button-width="200px" --button-max-width="90vw"></Button>
  </div>
</form>

<h2>Props</h2>
<PropsViewer
  props={[
    { name: 'buttonType', type: 'default | text | icon', default: 'default', description: 'Determines the button style.' },
    { name: 'type', type: 'button | submit', default: 'button', description: 'Specifies the button type.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Indicates if the button is in a loading state.' },
    { name: 'icon', type: 'string', default: 'undefined', description: 'Icon to be displayed inside the button.' },
    { name: 'tabindex', type: 'number | null', default: 'null', description: 'Defines the tab index of the button.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables the button when true.' },
    { name: 'buttonElement', type: 'HTMLElement | undefined', default: 'undefined', description: 'A reference to the button DOM element.' },
    { name: 'class', type: 'string', default: 'undefined', description: 'Additional CSS classes for customization.' }
  ]}
  styleProps={[
    { name: '--button-width', type: 'size', description: 'Defines the button width.', default: 'auto' },
    { name: '--button-max-width', type: 'size', description: 'Sets the maximum button width.', default: 'none' },
    { name: '--button-min-width', type: 'size', description: 'Sets the minimum button width.', default: 'none' },
    { name: '--button-height', type: 'size', description: 'Defines the button height.', default: 'auto' },
    { name: '--button-max-height', type: 'size', description: 'Sets the maximum button height.', default: 'none' },
    { name: '--button-min-height', type: 'size', description: 'Sets the minimum button height.', default: 'none' },
    { name: '--button-text-align', type: 'alignment', description: 'Controls the text alignment inside the button.', default: 'center' },
    { name: '--button-cursor', type: 'cursor', description: 'Defines the cursor style when hovering over the button.', default: 'pointer' },
    { name: '--button-padding', type: 'spacing', description: 'Controls the button padding.', default: '8px' },
    { name: '--button-font-size', type: 'size', description: 'Sets the font size of the button text.', default: 'inherit' },
    { name: '--button-display', type: 'display', description: 'Defines how the button is displayed (e.g., flex, block).', default: 'inline-flex' },
    { name: '--button-justify-content', type: 'alignment', description: 'Controls content alignment along the main axis.', default: 'center' },
    { name: '--button-align-items', type: 'alignment', description: 'Controls content alignment along the cross axis.', default: 'center' },
    { name: '--button-border', type: 'border', description: 'Defines the button border style.', default: 'none' },
    { name: '--button-border-radius', type: 'border', description: 'Sets the button border radius.', default: '.5rem' },
    { name: '--button-box-shadow', type: 'shadow', description: 'Defines the button shadow effect.', default: '0 0 0.5rem rgba(0, 0, 0, 0.3)' },
    { name: '--button-background-color', type: 'color', description: 'Sets the button background color.', default: 'rgb(var(--global-color-primary-500))' },
    { name: '--button-color', type: 'color', description: 'Sets the button text color.', default: 'rgb(var(--global-color-grey-50))' },
    { name: '--button-font-weight', type: 'font', description: 'Controls the text weight.', default: 'inherit' },
    { name: '--button-hover-background-color', type: 'color', description: 'Defines the background color when hovered.', default: 'rgb(var(--global-color-primary-600))' },
    { name: '--button-hover-color', type: 'color', description: 'Defines the text color when hovered.', default: 'rgb(var(--global-color-grey-50))' },
    { name: '--button-hover-box-shadow', type: 'shadow', description: 'Sets the shadow effect on hover.', default: 'none' },
    { name: '--button-active-background-color', type: 'color', description: 'Defines the background color when active.', default: 'rgb(var(--global-color-primary-500))' },
    { name: '--button-active-box-shadow', type: 'box shadow', description: 'Box shadow for an active button', },
    { name: '--button-focus-background-color', type: 'color', description: 'Defines the background color when focused.', default: 'rgb(var(--global-color-primary-500))' },
    { name: '--button-focus-color', type: 'color', description: 'Sets the text color when focused.', default: 'rgb(var(--global-color-grey-50))' },
    { name: '--button-focus-box-shadow', type: 'box shadow', description: 'Box shadow for a focused button', },
    { name: '--button-disabled-background-color', type: 'color', description: 'Background color for disabled state.', default: 'rgb(var(--global-color-primary-500), .6)' },
    { name: '--button-disabled-color', type: 'color', description: 'Text color for disabled state.', default: 'rgb(var(--global-color-grey-50), .6)' },
    { name: '--button-text-background-color', type: 'color', description: 'Background color for text buttons.', default: 'transparent' },
    { name: '--button-text-hover-background-color', type: 'color', description: 'Background color for text button on hover.', default: 'rgb(var(--global-color-primary-500), 0.2)' },
    { name: '--button-text-active-background-color', type: 'color', description: 'Background color for text button when active.', default: 'rgb(var(--global-color-primary-500), 0.4)' },
    { name: '--button-icon-border-radius', type: 'border', description: 'Border radius for icon buttons.', default: '9999px' },
  ]}
/>

<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "children", description: "Slot for the button content (text or icon)" },
    { name: "appendSnippet", description: "Slot for appending additional content inside the button" }
  ]}
/>

<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onclick", description: "Triggered when the button is clicked", properties: [{ name: "nativeEvent", type: "MouseEvent", description: "The original click event" }] },
    { name: "onkeypress", description: "Triggered when a key is pressed", properties: [{ name: "nativeEvent", type: "KeyboardEvent", description: "The original key press event" }] },
    { name: "onkeydown", description: "Triggered when a key is held down", properties: [{ name: "nativeEvent", type: "KeyboardEvent", description: "The original key down event" }] }
  ]}
/>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }
</style>
