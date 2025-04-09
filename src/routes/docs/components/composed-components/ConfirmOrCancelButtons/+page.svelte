<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import ConfirmOrCancelButtons from "$lib/components/composed/forms/ConfirmOrCancelButtons.svelte";
</script>

<h1>ConfirmOrCancelButtons</h1>
<ComponentSubtitle>Last chance to make the right decision.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <ConfirmOrCancelButtons></ConfirmOrCancelButtons>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "loading", type: "boolean", description: "Indicates if the confirm button is in a loading state.", default: "false" },
    { name: "marginTop", type: "size", description: "Top margin of the button container.", default: "20px" },
    { name: "cancelText", type: "string", description: "Text of the cancel button.", default: "Annulla" },
    { name: "confirmText", type: "string", description: "Text of the confirm button.", default: "Salva" },
    { name: "confirmDisable", type: "boolean", description: "Disables the confirm button.", default: "false" },
    { name: "cancelDisable", type: "boolean", description: "Disables the cancel button.", default: "false" }
  ]}
  styleProps={[]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "cancelButtonSnippet", description: "Slot for custom cancel button.", properties: [{ name: "loading", type: "boolean", description: "Loading state." }, { name: "handleCancel", type: "function", description: "Cancel handler." }, { name: "cancelText", type: "string", description: "Cancel button text." }], default: `
<button
  class="text-button"
  onclick={handleCancel}
>{cancelText}</button>
    ` },
    { name: "confirmButtonSnippet", description: "Slot for custom confirm button.", properties: [{ name: "loading", type: "boolean", description: "Loading state." }, { name: "handleConfirm", type: "function", description: "Confirm handler." }, { name: "confirmText", type: "string", description: "Confirm button text." }, { name: "confirmDisable", type: "boolean", description: "Confirm button disabled state." }], default: `
<Button
  loading={loading}
  onclick={handleConfirm}
  disabled={confirmDisable}
>{confirmText}</Button>
    ` }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onconfirmClick", description: "Triggered when the confirm button is clicked.", properties: [{ name: "nativeEvent", type: "MouseEvent", description: "The native click event." }] },
    { name: "oncancelClick", description: "Triggered when the cancel button is clicked.", properties: [{ name: "nativeEvent", type: "MouseEvent | KeyboardEvent", description: "The native click or keyboard event." }] }
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