<script lang="ts" generics="Data extends string">
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import type { ComponentProps } from "svelte";
  import MenuOrDrawer from "../common/MenuOrDrawer.svelte";
  import PeriodSelector, { getPeriodLabel } from "./PeriodSelector.svelte"; // Import helper
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import { fly } from "svelte/transition";
  import Icon from "$lib/components/simple/media/Icon.svelte";

  interface Props extends 
    Omit<ComponentProps<typeof PeriodSelector<Data>>, 'showTimeRangeLabel'> {
  }

  let {
    onchange,
    timespanSettings = $bindable(),
    valid = $bindable(),
    isSelectionMode = $bindable(),
    lang = 'en',
    quickSelectOptions,
    ...rest
  }: Props = $props()

  let open = $state(false),
    input: HTMLElement | undefined = $state(),
    text = $derived(getPeriodLabel(timespanSettings, lang, quickSelectOptions))

  function handleChange(event: Parameters<NonNullable<ComponentProps<typeof PeriodSelector<Data>>['onchange']>>[0]) {
    if (timespanSettings?.method == 'quick') {
      open = false
    }

    onchange?.(event)
  }

  function openMenu() {
    if (!open) open = true
    else if (valid) open = false
  }

</script>

<SimpleTextField
  onfocus={() => open = true}
  value={text}
  bind:input
  disabled
>
  {#snippet appendInnerSnippet()}
    <Icon
      name='mdi-chevron-down'
      onclick={openMenu}
      --icon-size="20px"
    ></Icon>
  {/snippet}
</SimpleTextField>
<MenuOrDrawer
  bind:open
  menuProps={{
    activator: input,
    _activatorGap: 16,
    closeOnClickOutside: valid,
    _offsetLeft: -16,
    anchor: 'bottom',
    flipOnOverflow: true,
    stayInViewport: true,
    openingId: 'period-picker',
    _overflow: 'hidden',
  }}
  drawerProps={{
    closeOnClickOutside: valid,
    _space: 'min(50%,420px)',
    _borderRadius: '4px',
    _overflow: 'hidden',
  }}
>
  {#snippet children({ isDrawer, isMenu })}
    <div
      class:menu={isMenu}
      class:drawer={isDrawer}
    >
      <PeriodSelector
        onchange={handleChange}
        bind:timespanSettings
        bind:valid
        bind:isSelectionMode
        {quickSelectOptions}
        {lang}
        {...rest}
      ></PeriodSelector>
      {#if !isSelectionMode}
        <div
          class:button-end={isMenu}
          class:button-full={isDrawer}
          in:fly={{ x: 200, duration: 250, delay: 200 }} 
          out:fly={{ x: 200, duration: 250 }}
        >
          <Button
            disabled={!valid}
            onclick={() => open = false}
          >
            {lang == 'en' ? 'Apply' : 'Applica'}
          </Button>
        </div>
      {/if}
    </div>
  {/snippet}
</MenuOrDrawer>

<style>
  .menu {
    padding: 8px;
    box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    background-color: rgb(var(--global-color-background-200));
    width: 400px;
    --period-selector-min-height: 290px;
  }

  .drawer {
    padding: 12px;
    --period-selector-max-width: none;
    --period-selector-list-element-padding: 8px;
  }

  .button-end {
    display: flex;
    justify-content: end;
  }

  .button-full {
    display: flex;
    --button-width: 100%
  }
</style>