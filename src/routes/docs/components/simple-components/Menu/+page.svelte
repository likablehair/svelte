<script lang="ts">
  import Button from "$lib/components/simple/buttons/Button.svelte";
    import Menu from "$lib/components/simple/common/Menu.svelte";
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import colors from "../../../stores/colors"
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";

  let menuOpened = false
  let activator

  function handleButtonClick(e: CustomEvent) {
    e.detail.nativeEvent.stopPropagation()
    menuOpened = !menuOpened
  }
</script>

<h1>Menu</h1>
<ComponentSubtitle>Custom elements that appear on the screen wherever you want them to be positioned.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div style:width="fit-content" bind:this={activator}>
    <Button
      backgroundColor={$colors.primary}
      color={$colors.background}
      hoverBackgroundColor={$colors.secondary}
      width="200px"
      maxWidth="90vw"
      on:click={(e) => handleButtonClick(e)}
    >
      Click me
    </Button>
  </div>
</div>
<Menu
  _width="160px"
  activator={activator}
  bind:open={menuOpened}
  anchor="bottom-center"
  _borderRadius="10px"
  _boxShadow="rgba(149, 157, 165, 0.2) 0px 8px 24px"
  closeOnClickOutside
>
  <div class="menu-content">
    <div class="list-container">
      <ul>
        <li>This</li>
        <li>is</li>
        <li>a</li>
        <li>Menu</li>
        <li>!</li>
      </ul>
    </div>
  </div>
</Menu>

<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: "open",
      type: "boolean",
      description: "Define whether the menu is opened or not",
      default: "false"
    }, {
      name: "refreshPosition",
      type: "boolean",
      description: "To be set to true when the position of the menu should be recalculated",
      default: "false"
    }, {
      name: "activator",
      type: "HTMLElement",
      default: "undefined",
      description: "HTML element to bind the menu to"
    }, {
      name: "anchor",
      type: '"bottom" | "bottom-center"',
      default: '"bottom"',
      description: 'The position of the menu realtive to the activator'
    }, {
      name: "closeOnClickOutside",
      type: "boolean",
      description: "Define whether the menu should be closed when clicking outside",
      default: "false"
    }, {
      name: "inAnimation",
      description: "The animation used to show the menu",
      type: "(node: Element, params?: SlideParams | FlyParams | FadeParams) => TransitionConfig",
      default: "fly"
    }, {
      name: "inAnimationConfig",
      type: "SlideParams | FlyParams | FadeParams",
      description: "The configuration used by the inAnimation function",
      default: "{ duration: 100, y: 10 }"
    }, {
      name: "outAnimation",
      description: "The animation used to hide the menu",
      type: "(node: Element, params?: SlideParams | FlyParams | FadeParams) => TransitionConfig",
      default: "fly"
    }, {
      name: "outAnimationConfig",
      type: "SlideParams | FlyParams | FadeParams",
      description: "The configuration used by the outAnimation function",
      default: "{ duration: 100, y: 10 }"
    }
  ]}
  styleProps={[
    {
      name: "_top",
      type: "number",
      default: "undefined",
      description: "Absolute top position (px) used if activator is not defined"
    }, {
      name: "_left",
      type: "number",
      default: "undefined",
      description: "Absolute left position (px) used if activator is not defined"
    }, {
      name: "_width",
      type: "string",
      default: "auto",
      description: "Width of the menu"
    }, {
      name: "_height",
      type: "string",
      default: "auto",
      description: "Height of the menu"
    }, {
      name: "_maxHeight",
      type: "string",
      default: "undefined",
      description: "max-height of the menu"
    }, {
      name: "_overflow",
      type: "string",
      default: "auto",
      description: "overflow css property"
    }, {
      name: "_boxShadow",
      type: "string",
      default: "undefined",
      description: "box-shadow css property"
    }, {
      name: "_borderRadius",
      type: "string",
      default: "undefined",
      description: "border-radius css property"
    }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
    slots={[
      {
        name: 'default',
        description: 'Content of the menu'
      }
    ]}
></SlotsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    padding: 5px 0px 5px 0px;
    display: flex;
    justify-content: center;
  }

  li:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .menu-content {
    background-color: white;
  }
</style>