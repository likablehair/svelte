<script lang="ts">
  import IMask, { type InputMask } from 'imask';
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import Menu from "$lib/components/simple/common/Menu.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import { onMount, tick, type ComponentProps, type Snippet } from 'svelte';
  import { DateTime } from 'luxon'
  import MediaQuery from '../../simple/common/MediaQuery.svelte';
  import Dialog from '../../simple/dialogs/Dialog.svelte';
  import YearSelector from '$lib/components/simple/dates/YearSelector.svelte';

  interface Props {
    menuOpened?: boolean;
    openingId?: string;
    selectedYear?: number;
    placeholder?: string;
    mobileDialog?: boolean;
    maxYearInRange?: number;
    minYearInRange?: number;
    disabled?: boolean;
    class?: {
      activator?: string,
      textfield?: ComponentProps<typeof SimpleTextField>['class']
    }
    onyearClick?: (event: {
      detail: {
        year: number
      }
    }) => void
    oninput?: (event: {
      detail: {
        year: number | undefined
      }
    }) => void
    appendSnippet?: ComponentProps<typeof SimpleTextField>['appendSnippet']
    appendInnerSnippet?: ComponentProps<typeof SimpleTextField>['appendInnerSnippet']
    prependSnippet?: ComponentProps<typeof SimpleTextField>['prependSnippet']
    prependInnerSnippet?: ComponentProps<typeof SimpleTextField>['prependInnerSnippet']
    activatorSnippet?: Snippet<[{
      mask: typeof mask,
      handleTextFieldFocus: typeof handleTextFieldFocus,
      handleInputChange: typeof handleInputChange,
      inputElement: typeof inputElement,
      placeholder: typeof placeholder,
      disabled: typeof disabled,
    }]>
  }

  let {
    menuOpened = $bindable(false),
    openingId = $bindable('year-picker-text-field'),
    selectedYear = $bindable(),
    placeholder,
    mobileDialog = true,
    maxYearInRange = 2100,
    minYearInRange = 1900,
    disabled = false,
    class: clazz = {},
    oninput,
    onyearClick,
    appendInnerSnippet,
    appendSnippet,
    prependInnerSnippet: prependInnerInternalSnippet,
    prependSnippet,
    activatorSnippet,
  }: Props = $props();

  let activator: HTMLElement | undefined = $state(),
    refreshPosition = $state(false),
    menuElement: HTMLElement | undefined = $state(),
    inputElement: HTMLElement | undefined = $state(),
    pattern: string = "yyyy",
    mask: InputMask<typeof maskFactoryArgs> | { value: string | undefined } = $state({
      value: undefined
    }),
    maskFactoryArgs = {
      mask: Date,
      pattern: pattern,
      format: function (date: any): string {
        return DateTime.fromJSDate(date).toFormat(pattern)
      },
      parse: function (str: string): Date {
        return DateTime.fromFormat(str, pattern).toJSDate()
      },
      blocks: {
        yyyy: {
          mask: IMask.MaskedRange,
          from: minYearInRange,
          to: maxYearInRange
        }
      }
    }

  function handleTextFieldFocus(mobile: boolean) {
    if(!mobile || !mobileDialog) {
      menuOpened = true
    }
  }

  onMount(() => {
    if(inputElement){
      mask = IMask(
        inputElement, maskFactoryArgs
      )
    }

    if(selectedYear !== undefined && selectedYear !== null) {
      mask.value = selectedYear.toString()
    }
  })

  function handleInputChange(event: any) {
    setTimeout(() => {
      const typedValue = mask.value

      if(typedValue !== undefined && typedValue !== null) {
        // find year
        const yearIndex = pattern.indexOf('yyyy')
        const year = typedValue.substring(yearIndex, yearIndex + 4)
        if(year.length == 4) {
          selectedYear = Number(year)
        } else if(year.length == 0) {
          selectedYear = undefined
        }

        if(oninput) {
          oninput({
            detail: {
              year: selectedYear
            }
          })
        }
      }
    }, 30);
  }

  function handleYearClick(event: Parameters<NonNullable<ComponentProps<typeof YearSelector>['onclick']>>[0]) {
    if(onyearClick) {
      onyearClick({
        detail: {
          year: event.detail.year
        }
      })
    }
  }

  function handleYearChange(event: Parameters<NonNullable<ComponentProps<typeof YearSelector>['onchange']>>[0]) {
    if(!!selectedYear) {
      mask.value = selectedYear.toString()
    } else {
      mask.value = ''
    }
  }

  $effect(() => {
    if(!!selectedYear) {
      setTimeout(async () => {
        if(!!selectedYear) {
          mask.value = selectedYear.toString()
        }
        await tick()
      }, 30);
    }
  })
</script>

<MediaQuery>
  {#snippet defaultSnippet({ mAndDown})}
    <div
      bind:this={activator}
      class="year-picker-activator {clazz.activator || ''}"
    >
      {#if activatorSnippet}
        {@render activatorSnippet({
          mask,
          handleTextFieldFocus,
          handleInputChange,
          inputElement,
          placeholder,
          disabled,
        })}
      {:else}
        <SimpleTextField
          bind:value={mask.value}
          onfocus={() => handleTextFieldFocus(mAndDown)}
          onkeydown={handleInputChange}
          bind:input={inputElement}
          {placeholder}
          class={clazz.textfield}
          {disabled}
          {appendSnippet}
          {appendInnerSnippet}
          {prependSnippet}
        >
          {#snippet prependInnerSnippet({ iconSize, prependInnerIcon })}
            {#if prependInnerInternalSnippet}
              {@render prependInnerInternalSnippet({ prependInnerIcon, iconSize })}
            {:else}
              <Icon
                name="mdi-calendar"
                onclick={() => menuOpened = !menuOpened}
              ></Icon>
            {/if}
          {/snippet}
        </SimpleTextField>
      {/if}
    </div>

    {#if mAndDown && mobileDialog}
      <Dialog
        bind:open={menuOpened}
      >
        <div
          style:background-color="rgb(var(--global-color-background-100))"
          style:width="300px"
          style:border-radius="10px"
        >
          <YearSelector
            bind:selectedYear={selectedYear}
            onclick={handleYearClick}
            onchange={handleYearChange}
            {disabled}
          ></YearSelector>
        </div>
      </Dialog>
    {:else}
      <Menu
        {activator}
        _width={"300px"}
        _boxShadow={"rgb(var(--global-color-background-300), .5) 0px 2px 4px"}
        _borderRadius={"5px"}
        bind:open={menuOpened}
        anchor="bottom-center"
        closeOnClickOutside
        bind:refreshPosition
        bind:menuElement
        bind:openingId={openingId}
      >
        <div
          style:background-color="rgb(var(--global-color-background-100))"
        >
          <YearSelector
            bind:selectedYear={selectedYear}
            onclick={handleYearClick}
            onchange={handleYearChange}
            {disabled}
            selectableYears={[...Array((maxYearInRange - minYearInRange) + 1).keys()].map((v) => {
              return minYearInRange + v
            })}
          ></YearSelector>
        </div>
      </Menu>
    {/if}
  {/snippet}
</MediaQuery>

<style>
  .year-picker-activator {
    width: fit-content;
  }
</style>

