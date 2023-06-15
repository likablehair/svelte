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
<form method="POST">
  <div class="example">
    <Button
      _backgroundColor={$colors.primary}
      _color={$colors.background}
      _hoverBackgroundColor={$colors.secondary}
      _width="200px"
      _maxWidth="90vw"
    >Type: button</Button>
  </div>
  <div class="example">
    <Button
      type="submit"
      _backgroundColor={$colors.primary}
      _color={$colors.background}
      _hoverBackgroundColor={$colors.secondary}
      _width="200px"
      _maxWidth="90vw"
    >Type: submit</Button>
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
      name: '_maxWidth',
      type: 'string',
      default: 'undefined',
      description: 'The max width of the outer element'
    }, {
      name: '_maxHeight',
      type: 'string',
      default: 'undefined',
      description: 'The max height of the outer element'
    }, {
      name: '_minWidth',
      type: 'string',
      default: 'undefined',
      description: 'The min width of the outer element'
    }, {
      name: '_minHeight',
      type: 'string',
      default: 'undefined',
      description: 'The min height of the outer element'
    }, {
      name: '_width',
      type: 'string',
      default: 'undefined',
      description: 'The width of the outer element'
    }, {
      name: '_height',
      type: 'string',
      default: 'undefined',
      description: 'The height of the outer element'
    }, {
      name: '_textAlign',
      type: 'string',
      default: 'center',
      description: 'The text-align of the outer element'
    }, {
      name: '_cursor',
      type: 'string',
      default: 'pointer',
      description: 'The cursor of the outer element'
    }, {
      name: '_padding',
      type: 'string',
      default: '5px',
      description: 'The padding of the outer element'
    }, {
      name: '_fontSize',
      type: 'string',
      default: 'undefined',
      description: 'The font-size of the outer element'
    }, {
      name: '_color',
      type: 'string',
      default: 'undefined',
      description: 'The color property of the outer element'
    }, {
      name: '_display',
      type: 'string',
      default: 'undefined',
      description: 'The display property of the outer element'
    }, {
      name: '_justifyContent',
      type: 'string',
      default: 'undefined',
      description: 'The justify-content property of the outer element'
    }, {
      name: '_alignItems',
      type: 'string',
      default: 'undefined',
      description: 'The align-items property of the outer element'
    }, {
      name: '_backgroundColor',
      type: 'string',
      default: 'undefined',
      description: 'The background color of the button'
    }, {
      name: '_hoverBackgroundColor',
      type: 'string',
      default: '#88888847',
      description: 'The hover color of the button'
    }, {
      name: '_activeBackgroundColor',
      type: 'string',
      default: 'hoverBackgroundColor',
      description: 'The active color of the button'
    }, {
      name: '_borderRadius',
      type: 'string',
      default: 'undefined',
      description: 'The border-radius property of the outer element'
    }, {
      name: '_border',
      type: 'string',
      default: 'undefined',
      description: 'The border property of the outer element'
    }, {
      name: '_boxShadow',
      type: 'string',
      default: 'undefined',
      description: 'The box-shadow property of the outer element'
    }, {
      name: '_loaderHeight',
      type: 'string',
      default: '15px',
      description: 'The height of the loader shown with the loading prop'
    }, {
      name: '_loaderWidth',
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
    margin-bottom: 20px;
  }
</style>