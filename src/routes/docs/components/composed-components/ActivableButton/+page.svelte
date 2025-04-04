<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import ActivableButton from "$lib/components/composed/buttons/ActivableButton.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";

  let boldActive: boolean = false,
    italicActive: boolean = false,
    underlineActive: boolean = false
</script>

<h1>ActivableButton</h1>
<ComponentSubtitle>Activate the power now.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div
    style:display="flex"
    style:gap="2px"
  >
    <ActivableButton
      bind:active={italicActive}
    >
      <Icon name="mdi-format-italic"></Icon>
    </ActivableButton>
    <ActivableButton
      bind:active={underlineActive}
    >
      <Icon name="mdi-format-underline"></Icon>
    </ActivableButton>
    <ActivableButton
      buttonProps={{
        disabled: true
      }}
      bind:active={boldActive}
    >
      <Icon name="mdi-format-bold"></Icon>
    </ActivableButton>
  </div>
  <div>
    Italic: {italicActive}<br/>
    Underline: {underlineActive}<br/>
    Bold: {boldActive}
  </div>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: 'active', type: 'boolean', description: 'Determines whether the button is active', default: 'false' },
    { name: 'buttonProps', type: 'ComponentProps<typeof Button>', description: 'Props passed to the Button component', default: '{}' },
  ]}
  styleProps={[
    { name: '--activable-button-active-background-color', type: 'color', description: 'Background color when the button is active', default: 'rgb(var(--global-color-primary-500))' },
    { name: '--activable-button-deactive-background-color', type: 'color', description: 'Background color when the button is inactive', default: 'none' },
    { name: '--activable-button-active-color', type: 'color', description: 'Text color when the button is active', default: 'rgb(var(--global-color-grey-50))' },
    { name: '--activable-button-deactive-color', type: 'color', description: 'Text color when the button is inactive', default: 'rgb(var(--global-color-contrast-900))' },
    { name: '--activable-button-hover-active-background-color', type: 'color', description: 'Background color when hovering over an active button', default: 'rgb(var(--global-color-primary-500))' },
    { name: '--activable-button-hover-deactive-background-color', type: 'color', description: 'Background color when hovering over an inactive button', default: 'rgb(var(--global-color-background-200))' },
    { name: '--activable-button-hover-active-color', type: 'color', description: 'Text color when hovering over an active button', default: 'rgb(var(--global-color-grey-50))' },
    { name: '--activable-button-active-active-background-color', type: 'color', description: 'Background color when clicking an active button', default: 'rgb(var(--global-color-primary-500))' },
    { name: '--activable-button-active-deactive-background-color', type: 'color', description: 'Background color when clicking an inactive button', default: 'rgb(var(--global-color-background-200))' },
    { name: '--activable-button-active-active-color', type: 'color', description: 'Text color when clicking an active button', default: 'rgb(var(--global-color-grey-50))' },
    { name: '--activable-button-focus-active-background-color', type: 'color', description: 'Background color when focusing on an active button', default: 'rgb(var(--global-color-primary-500))' },
    { name: '--activable-button-focus-deactive-background-color', type: 'color', description: 'Background color when focusing on an inactive button', default: 'rgb(var(--global-color-background-200))' },
    { name: '--activable-button-focus-active-color', type: 'color', description: 'Text color when focusing on an active button', default: 'rgb(var(--global-color-grey-50))' },
    { name: '--button-default-disabled-background-color', type: 'color', description: 'Background color when the button is disabled', default: 'none' },
    { name: '--button-default-disabled-color', type: 'color', description: 'Text color when the button is disabled', default: 'rgb(var(--global-color-contrast-900), .5)' }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: 'children', description: 'Slot for button content', },
    { name: 'appendSnippet', description: 'Additional content appended inside the button', }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: 'onclick', description: 'Triggered when the button is clicked', properties: [{ name: 'nativeEvent', type: 'MouseEvent', description: 'The click event' }] }
  ]}
></EventsViewer>

<style>
  .example {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    margin-bottom: 20px;
  }
</style>