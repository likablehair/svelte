<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
</script>

<h1>Button</h1>
<ComponentSubtitle>Beautiful buttons are coming for your next project.</ComponentSubtitle>
<h2>Example</h2>
<form method="POST">
  <div class="example">
    <Button
      --button-width="200px"
      --button-max-width="90vw"
    >Default button</Button>
  </div>
  <div class="example">
    <Button
      buttonType="text"
      --button-width="200px"
      --button-max-width="90vw"
    >Text Button</Button>
  </div>
</form>
<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: 'type',
      type: '"button" | "submit"',
      description: "HTML type attribute",
      default: "button"
    }, {
      name: 'buttonType',
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
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description: 'Whether the component is disabled'
    },
  ]}
  styleProps={[
    {
      name: '--button-max-width',
      type: 'string',
      default: 'undefined',
      description: 'The max width of the outer element'
    }, {
      name: '--button-max-height',
      type: 'string',
      default: 'undefined',
      description: 'The max height of the outer element'
    }, {
      name: '--button-min-width',
      type: 'string',
      default: 'undefined',
      description: 'The min width of the outer element'
    }, {
      name: '--button-min-height',
      type: 'string',
      default: 'undefined',
      description: 'The min height of the outer element'
    }, {
      name: '--button-width',
      type: 'string',
      default: 'undefined',
      description: 'The width of the outer element'
    }, {
      name: '--button-height',
      type: 'string',
      default: 'undefined',
      description: 'The height of the outer element'
    }, {
      name: '--button-text-align',
      type: 'string',
      default: 'center',
      description: 'The text-align of the outer element'
    }, {
      name: '--button-cursor',
      type: 'string',
      default: 'pointer',
      description: 'The cursor of the outer element'
    }, {
      name: '--button-padding',
      type: 'string',
      default: '5px',
      description: 'The padding of the outer element'
    }, {
      name: '--button-font-size',
      type: 'string',
      default: 'undefined',
      description: 'The font-size of the outer element'
    }, {
      name: '--button-color',
      type: 'string',
      default: 'undefined',
      description: 'The color property of the outer element'
    }, {
      name: '--button-display',
      type: 'string',
      default: 'undefined',
      description: 'The display property of the outer element'
    }, {
      name: '--button-justify-content',
      type: 'string',
      default: 'undefined',
      description: 'The justify-content property of the outer element'
    }, {
      name: '--button-align-items',
      type: 'string',
      default: 'undefined',
      description: 'The align-items property of the outer element'
    }, {
      name: '--button-background-color',
      type: 'string',
      default: 'undefined',
      description: 'The background color of the button'
    }, {
      name: '--button-hover-background-color',
      type: 'string',
      default: 'var(--global-color-primary-600)',
      description: 'The hover color of the button'
    }, {
      name: '--button-border-radius',
      type: 'string',
      default: 'undefined',
      description: 'The border-radius property of the outer element'
    }, {
      name: '--button-border',
      type: 'string',
      default: 'undefined',
      description: 'The border property of the outer element'
    }, {
      name: '--button-box-shadow',
      type: 'string',
      default: 'undefined',
      description: 'The box-shadow property of the outer element'
    }, {
      name: '--button-icon-height',
      type: 'string',
      default: '15px',
      description: 'The height of the icon button'
    }, {
      name: '--button-icon-width',
      type: 'string',
      default: 'undefined',
      description: 'The width of the icon button'
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
    margin-bottom: 20px;
  }
</style>