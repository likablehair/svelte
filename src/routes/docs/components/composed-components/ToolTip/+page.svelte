<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import ToolTip from "$lib/components/composed/common/ToolTip.svelte";
  import ActivableButton from "$lib/components/composed/buttons/ActivableButton.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import { fly } from "svelte/transition";
  import { cubicIn } from "svelte/easing";
    import SlotsViewer from "../../SlotsViewer.svelte";
    import EventsViewer from "../../EventsViewer.svelte";

  let activator: HTMLElement,
    secondActivator: HTMLElement,
    thirdActivator: HTMLElement;
</script>

<h1>ToolTip</h1>
<ComponentSubtitle>A tip for the tool.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div style:display="flex" style:gap="2px" bind:this={activator}>
    <ActivableButton>
      <Icon name="mdi-format-italic" />
    </ActivableButton>
  </div>
  <ToolTip {activator}>I am button to activate italic font</ToolTip>
  <div style:display="flex" style:gap="2px" bind:this={secondActivator}>
    <ActivableButton>
      <Icon name="mdi-format-bold" />
    </ActivableButton>
  </div>
  <ToolTip
    activator={secondActivator}
    menuProps={{ anchor: "right-center" }}
    appearTimeout={1000}
  >
    <div
      style:background-color="rgb(var(--global-color-background-300))"
      style:padding="8px"
      style:border-radius="4px"
    >
      I am button to activate bold font
    </div>
  </ToolTip>

  <div
    class="select-container"
    transition:fly={{ delay: 150, duration: 150, y: -10, easing: cubicIn }}
  >
  <div style="display: flex;">

    <div class="select-actions-container">
      <div class="select-actions">
        <div style="display: flex; gap: 8px" ></div>
          <div bind:this={thirdActivator}>hover</div>
          <ToolTip
            activator={thirdActivator}
            menuProps={{ anchor: "bottom-center" }}
            appearTimeout={100}
          >
            <div
              style:background-color="rgb(var(--global-color-background-300))"
              style:padding="8px"
              style:border-radius="4px"
            >
              I am button to activate bold font
            </div>
          </ToolTip>
      </div>
    </div>
  </div>


  </div>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "activator", type: "HTMLElement", description: "Element that triggers the menu.", default: "undefined" },
    { name: "menuOpen", type: "boolean", description: "Controls whether the menu is open.", default: "false" },
    { name: "menuProps", type: "ComponentProps<typeof Menu>", description: "Props forwarded to the Menu component.", default: "{}" },
    { name: "appearTimeout", type: "number", description: "Delay before the menu appears when hovered.", default: "undefined" }
  ]}
  styleProps={[]}
/>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "children", description: "Content to be rendered inside the menu.", }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer></EventsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    margin-bottom: 20px;
  }

  .select-container {
    position: fixed;
    top: 56px;
    right: 150px;
    bottom: 0;
    z-index: 802;
    width: 40%;
    height: fit-content;
    background-color: rgb(var(--global-color-background-400));
    border-radius: 8px;
    padding: 5px;
    margin-bottom: 10px;
  }

  .select-actions-container {
    align-items: center;
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .select-actions {
    display: flex;
    margin: 0 8px;
    justify-content: flex-end;
    width: 100%;
  }
</style>
