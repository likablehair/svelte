<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import ToolTip from "$lib/components/composed/common/ToolTip.svelte";
  import ActivableButton from "$lib/components/composed/buttons/ActivableButton.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";

  let activator: HTMLElement,
    secondActivator: HTMLElement
</script>

<h1>ToolTip</h1>
<ComponentSubtitle>A tip for the tool.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div
    style:display="flex"
    style:gap="2px"
    bind:this={activator}
  >
    <ActivableButton>
      <Icon name="mdi-format-italic"></Icon>
    </ActivableButton>
  </div>
  <ToolTip {activator}>
    I am button to activate italic font
  </ToolTip>
  <div
    style:display="flex"
    style:gap="2px"
    bind:this={secondActivator}
  >
    <ActivableButton>
      <Icon name="mdi-format-bold"></Icon>
    </ActivableButton>
  </div>
  <ToolTip 
    activator={secondActivator} 
    menuProps={{anchor: 'right-center'}} 
    appearTimeout={1000}
  >
    <div
      style:background-color="rgb(var(--global-color-background-300))"
      style:padding="8px"
      style:border-radius="4px"
    >I am button to activate bold font</div>
  </ToolTip>
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
    gap: 2px;
    margin-bottom: 20px;
  }
</style>