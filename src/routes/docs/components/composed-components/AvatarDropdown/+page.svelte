<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";

  import AvatarDropdown, { type AvatarItem } from "$lib/components/composed/forms/AvatarDropdown.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";

  let items: AvatarItem[] = [
    { value: 'orange', label: 'Orange', text: 'OR' },
    { value: 'apple', label: 'Apple', text: 'AP' },
    { value: 'banana', label: 'Banana', text: 'BA' },
    { value: 'pear', label: 'Pear', text: 'PE' },
    { value: 'blackberry', label: 'Blackberry', text: 'BL' },
    { value: 'grape', label: 'Grape', text: 'GR' },
    { value: 'watermelon', label: 'Watermelon', text: 'WA' },
    { value: 'pineapple', label: 'Pineapple', text: 'PI' },
    { value: 'strawberry', label: 'Strawberry', text: 'ST' },
    { value: 'kiwi', label: 'Kiwi', text: 'KI' },
    { value: 'mango', label: 'Mango', text: 'MA' },
  ]
</script>

<h1>AvatarDropdown</h1>
<ComponentSubtitle>Easily choose your avatar.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <AvatarDropdown
    {items}
  ></AvatarDropdown>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "items", type: "AvatarItemData[]", description: "Array of avatar items.", default: "[]" },
    { name: "values", type: "AvatarItemData[]", description: "Array of currently selected avatar items.", default: "[]" },
    { name: "multiple", type: "boolean", description: "Allow multiple selection.", default: "true" },
    { name: "menuOpened", type: "boolean", description: "Whether the dropdown menu is open.", default: "false" },
    { name: "openingId", type: "string", description: "ID for the opening element.", default: "\"autocomplete-menu\"" },
    { name: "width", type: "string", description: "Width of the autocomplete component." },
    { name: "minWidth", type: "string", description: "Minimum width of the autocomplete component.", default: "\"auto\"" },
    { name: "disabled", type: "boolean", description: "Disables the autocomplete if true.", default: "false" },
    { name: "menuWidth", type: "string | null", description: "Width of the dropdown menu.", default: "\"144px\"" },
  ]}
  styleProps={[
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "labelSnippet", description: "Slot for customizing the label content when items are selected.", default: `
{#if values.length > 0}
  <div class="overlapped-avatars">
    {#each values as avatar, i}
      {#if !!avatar.tooltip || !!avatar.label }
        <ToolTip activator={tooltipsActivator[i]} appearTimeout={500}>
          <div class="tooltip">{avatar.tooltip || avatar.label}</div>
        </ToolTip>
      {/if}
      <div class="single-avatar" bind:this={tooltipsActivator[i]}>
        <Avatar 
          text={avatar.text}
          alt={avatar.alt}
          src={avatar.src}
          --avatar-default-border="2px solid rgb(var(--global-color-background-100))"
        ></Avatar>
        <div 
          onclick={(e) => {
            e.stopPropagation()
            handleCloseClick({ index: i })
          }}
          onkeypress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleCloseClick({ index: i })
            }
          }}
          class="unstyled-button remove-button"
          role="button"
          tabindex="0"
        >
          <Icon --icon-default-size="10px" name="mdi-close"></Icon>
        </div>
      </div>
    {/each}
  </div>
{:else}
  {#if noValuesSnippet}
    {@render noValuesSnippet({ values, items, handleCloseClick})}
  {:else}
    <Icon name="mdi-account-plus"></Icon>
  {/if}
{/if}
    `, properties: [
      { name: "values", type: "AvatarItemData[]", description: "The selected avatar items." },
      { name: "items", type: "AvatarItemData[]", description: "The list of all avatar items." },
      { name: "handleCloseClick", type: "function", description: "Callback to remove a selected item." }
    ] },
    { name: "noValuesSnippet", description: "Slot for customizing the view when no values are selected.", default: '<Icon name="mdi-account-plus"></Icon>', properties: [
      { name: "values", type: "AvatarItemData[]", description: "The selected avatar items (empty array expected)." },
      { name: "items", type: "AvatarItemData[]", description: "The list of all avatar items." },
      { name: "handleCloseClick", type: "function", description: "Callback to remove a selected item." }
    ] },
    { name: "itemLabelSnippet", description: "Slot for customizing the rendering of each dropdown item.", default: `
<div class="item-label-container">
  <Avatar 
    text={item.data!.text}
    alt={item.data!.alt}
    src={item.data!.src}
    --avatar-default-border="2px solid rgb(var(--global-color-background-100))"
  ></Avatar>
  {item.label}
</div>
    `, properties: [
      { name: "item", type: "AvatarItemData", description: "The current avatar item to render." }
    ] },
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { name: "onchange", description: "Fires when the selection changes.", properties: [
      { name: "unselect", type: "AvatarItemData | undefined", description: "The item that was unselected, if any." },
      { name: "select", type: "AvatarItemData | undefined", description: "The item that was selected, if any." },
      { name: "selection", type: "AvatarItemData[]", description: "The current selection." }
    ] },
  ]}
></EventsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }
</style>