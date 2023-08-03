<script lang="ts" context="module">
  import type { Item } from "../../../components/simple/forms/Autocomplete.svelte";
  export type { Item }
</script>

<script lang="ts">
  import Autocomplete from "../../../components/simple/forms/Autocomplete.svelte";
  import Button from '../../simple/buttons/Button.svelte'
  import Icon from '../../simple/media/Icon.svelte'

  export let items: Item[] = [],
    values: Item[] = [],
    multiple: boolean = false,
    searchText: string | undefined = undefined,
    maxVisibleChips: number | undefined = undefined,
    placeholder: string = "Seleziona"

  $: generatedLabel = values.length == 1 ? values[0].label : `${values.length} Selezionati`

  function handleCloseClick(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    values = []
  }
</script>

<Autocomplete
  bind:items
  bind:values
  bind:searchText
  bind:multiple
  bind:maxVisibleChips
  searchFunction={() => true}
>
  <svelte:fragment slot="selection-container" let:openMenu>
    <Button 
      --button-default-background-color="transparent"
      --button-default-border="2px solid rgb(var(--global-color-primary-400))"
      --button-default-color="rgb(var(--global-color-contrast-800))"
      on:click={openMenu}
    >
      <slot name="label" {values} {items} {searchText}>
        <div class="label">
          {#if values.length == 0}
            {placeholder}
            <Icon name="mdi-chevron-down"></Icon>
          {:else}
            {generatedLabel}
            <Icon 
              name="mdi-close"
              click
              on:click={handleCloseClick}
            ></Icon>
          {/if}
        </div>
      </slot>
    </Button>
  </svelte:fragment>
</Autocomplete>

<style>
  .label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    width: 130px;
  }
</style>