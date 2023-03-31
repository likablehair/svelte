<script lang="ts">
  import FinalButton from "../../../FinalButton.svelte";
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import colors from "../../../stores/colors";
</script>

<h1>Button</h1>
<ComponentSubtitle>Beautiful buttons are coming for your next project.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Button
    backgroundColor={$colors.primary}
    color={$colors.background}
    hoverBackgroundColor={$colors.secondary}
    width="200px"
    maxWidth="90vw"
  >Click me</Button>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: 'type',
      type: '"default" | "text" | "icon"',
      default: "default",
      description: "Define the type of the button."
    }, {
      name: 'active',
      type: 'boolean',
      default: 'false',
      description: "Define whether a button is active or not (so it show the active color)"
    }, {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'If true shows a circular loader inside the button'
    }, {
      name: 'icon',
      type: 'string',
      default: 'undefined',
      description: 'If not null the button shows the icon specified'
    }, {
      name: 'iconSize',
      type: 'number',
      default: '15',
      description: 'The size of the icon shwon with the \'icon\' property'
    }, {
      name: 'maxWidth',
      type: 'string',
      default: 'undefined',
      description: 'The max width of the outer element'
    }, {
      name: 'maxHeight',
      type: 'string',
      default: 'undefined',
      description: 'The max height of the outer element'
    }, {
      name: 'minWidth',
      type: 'string',
      default: 'undefined',
      description: 'The min width of the outer element'
    }, {
      name: 'minHeight',
      type: 'string',
      default: 'undefined',
      description: 'The min height of the outer element'
    }, {
      name: 'width',
      type: 'string',
      default: 'undefined',
      description: 'The width of the outer element'
    }, {
      name: 'height',
      type: 'string',
      default: 'undefined',
      description: 'The height of the outer element'
    }, {
      name: 'textAlign',
      type: 'string',
      default: 'center',
      description: 'The text-align of the outer element'
    }, {
      name: 'cursor',
      type: 'string',
      default: 'pointer',
      description: 'The cursor of the outer element'
    }, {
      name: 'padding',
      type: 'string',
      default: '5px',
      description: 'The padding of the outer element'
    }, {
      name: 'fontSize',
      type: 'string',
      default: 'undefined',
      description: 'The font-size of the outer element'
    }, {
      name: 'color',
      type: 'string',
      default: 'undefined',
      description: 'The color property of the outer element'
    }, {
      name: 'display',
      type: 'string',
      default: 'undefined',
      description: 'The display property of the outer element'
    }, {
      name: 'justifyContent',
      type: 'string',
      default: 'undefined',
      description: 'The justify-content property of the outer element'
    }, {
      name: 'alignItems',
      type: 'string',
      default: 'undefined',
      description: 'The align-items property of the outer element'
    }, {
      name: 'backgroundColor',
      type: 'string',
      default: 'undefined',
      description: 'The background color of the button'
    }, {
      name: 'hoverBackgroundColor',
      type: 'string',
      default: '#88888847',
      description: 'The hover color of the button'
    }, {
      name: 'activeBackgroundColor',
      type: 'string',
      default: 'hoverBackgroundColor',
      description: 'The active color of the button'
    }, {
      name: 'borderRadius',
      type: 'string',
      default: 'undefined',
      description: 'The border-radius property of the outer element'
    }, {
      name: 'border',
      type: 'string',
      default: 'undefined',
      description: 'The border property of the outer element'
    }, {
      name: 'boxShadow',
      type: 'string',
      default: 'undefined',
      description: 'The box-shadow property of the outer element'
    }, {
      name: 'loaderHeight',
      type: 'string',
      default: '15px',
      description: 'The height of the loader shown with the loading prop'
    }, {
      name: 'loaderWidth',
      type: 'string',
      default: 'undefined',
      description: 'The width of the loader shown with the loading prop'
    }, {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Whether the component is disabled'
    },
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
  }
</style>