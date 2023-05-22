<script lang="ts" context="module">
  export type VariantOptions = "outlined" | "boxed";
</script>

<script lang="ts">
  export let label = "",
    placeholder = "",
    color: string | null = null,
    value: string | number = "",
    disabled = false,
    variant: VariantOptions = "outlined",
    width = "100%",
    height = "50px",
    maxWidth: string | undefined = undefined,
    minWidth: string | undefined = undefined,
    textColor = "black",
    borderWeight = "2px",
    borderRadius = "5px",
    borderColor: string | null = null,
    focusBorderColor: string | null = null,
    focusedBoxShadow: string | undefined = undefined,
    backgroundColor: string | null = null,
    padding: string | undefined = undefined,
    paddingLeft: string | undefined = undefined,
    paddingRight: string | undefined = undefined,
    paddingBottom: string | undefined = undefined,
    paddingTop: string | undefined = undefined,
    fontSize: string | undefined = undefined,
    type: "text" | "password" | "number" = "text",
    readonly = false,
    inputElement: HTMLElement | undefined = undefined,
    autocomplete = true;

  import { createId } from '@paralleldrive/cuid2';
  import { onMount } from "svelte";

  let inputId: string = createId(),
    focused = false,
    legendWidth = 0,
    labelElement: HTMLElement | undefined = undefined;

  onMount(() => {
    console.warn('TextField component is going to be depracated. Please use SimpleTextField instead.')

    if (labelElement) {
      legendWidth = labelElement.offsetWidth * 0.8 + 8;
    }
  });

  function handleFocus(): void {
    focused = true;
  }

  function handleBlur(): void {
    focused = false;
  }

  $: if (labelElement) {
    legendWidth = !value && !focused ? 0 : labelElement.offsetWidth * 0.8 + 8;
  }
</script>

<div
  style:width
  style:min-width={minWidth}
  style:max-width={maxWidth}
  style:height
  style:--textfield-theme-color={color}
  style:--textfield-border-color={borderColor}
  style:--textfield-border-weight={borderWeight}
  style:--textfield-focus-border-color={focusBorderColor}
  style:--textfield-legend-width={legendWidth + "px"}
  style:--textfield-focused-box-shadow={focusedBoxShadow}
  class="input-container"
  class:focused
  class:not-focused={!focused}
  class:texted={focused || !!value}
>
  <fieldset
    aria-hidden="true"
    style:border-radius={borderRadius}
    style:background-color={backgroundColor}
    style:padding
    style:padding-left={paddingLeft}
    style:padding-right={paddingRight}
    style:padding-bottom={paddingBottom}
    style:padding-top={paddingTop}
    class="fieldset"
    class:fieldset-outlined={variant == "outlined"}
    class:fieldset-boxed={variant == "boxed"}
  >
    {#if variant == "outlined"}
      <legend class="legend-outlined" />
      <label for={inputId} class="label-outlined" bind:this={labelElement}
        >{label}</label
      >
      <div
        style:display="flex"
        style:position="relative"
        style:bottom="8px"
        style:margin-left="8px"
        style:margin-right="8px"
      >
        <div>
          <slot name="prepend-inner" />
        </div>
        {#if type == "password"}
          <input
            autocomplete={autocomplete ? "on" : "new-password"}
            style:background-color={backgroundColor}
            style:color={textColor}
            style:font-size={fontSize}
            id={inputId}
            class="input-outlined"
            type="password"
            {placeholder}
            {disabled}
            {readonly}
            bind:value
            on:change
            on:input
            on:focus={handleFocus}
            on:focus
            on:blur={handleBlur}
            on:blur
            on:keydown
            on:keypress
            on:keyup
            bind:this={inputElement}
          />
        {:else if type == "text"}
          <input
            autocomplete={autocomplete ? "on" : "off"}
            style:background-color={backgroundColor}
            style:color={textColor}
            style:font-size={fontSize}
            id={inputId}
            class="input-outlined"
            type="text"
            {placeholder}
            {disabled}
            {readonly}
            bind:value
            on:change
            on:input
            on:focus={handleFocus}
            on:focus
            on:blur={handleBlur}
            on:blur
            on:keydown
            on:keypress
            on:keyup
            bind:this={inputElement}
          />
        {:else if type == "number"}
          <input
            style:background-color={backgroundColor}
            style:color={textColor}
            style:font-size={fontSize}
            id={inputId}
            class="input-outlined"
            type="number"
            {placeholder}
            {disabled}
            {readonly}
            bind:value
            on:change
            on:input
            on:focus={handleFocus}
            on:focus
            on:blur={handleBlur}
            on:blur
            on:keydown
            on:keypress
            on:keyup
            bind:this={inputElement}
          />
        {/if}
        <div>
          <slot name="append-inner" />
        </div>
      </div>
    {:else if variant == "boxed"}
      <div style:display="flex">
        <div>
          <slot name="prepend-inner" />
        </div>
        {#if type == "password"}
          <input
            autocomplete={autocomplete ? "on" : "new-password"}
            style:background-color={backgroundColor}
            style:color={textColor}
            style:font-size={fontSize}
            id={inputId}
            class="input-boxed"
            type="password"
            placeholder={placeholder || label}
            {disabled}
            {readonly}
            bind:value
            on:change
            on:input
            on:focus={handleFocus}
            on:focus
            on:blur={handleBlur}
            on:blur
            on:keydown
            on:keypress
            on:keyup
          />
        {:else if type == "text"}
          <input
            autocomplete={autocomplete ? "on" : "off"}
            style:background-color={backgroundColor}
            style:color={textColor}
            style:font-size={fontSize}
            id={inputId}
            class="input-boxed"
            type="text"
            placeholder={placeholder || label}
            {disabled}
            {readonly}
            bind:value
            on:change
            on:input
            on:focus={handleFocus}
            on:focus
            on:blur={handleBlur}
            on:blur
            on:keydown
            on:keypress
            on:keyup
            bind:this={inputElement}
          />
        {:else if type == "number"}
          <input
            style:background-color={backgroundColor}
            style:color={textColor}
            style:font-size={fontSize}
            id={inputId}
            class="input-boxed"
            type="number"
            placeholder={placeholder || label}
            {disabled}
            {readonly}
            bind:value
            on:change
            on:input
            on:focus={handleFocus}
            on:focus
            on:blur={handleBlur}
            on:blur
            on:keydown
            on:keypress
            on:keyup
            bind:this={inputElement}
          />
        {/if}
        <div>
          <slot name="append-inner" />
        </div>
      </div>
    {/if}
  </fieldset>
</div>

<style>
  .input-container {
    position: relative;
    --textfield-final-color: var(
      --textfield-theme-color,
      --textfield-border-color,
      rgb(88, 88, 88)
    );
    --textfield-final-border-color: var(
      --textfield-border-color,
      var(--textfield-final-color)
    );
  }

  /* outlined input */

  .input-outlined {
    border: 0px solid;
    box-sizing: border-box;
    font-size: 18px;
    height: 100%;
    outline: 0;
    padding: 4px 0px 0;
    width: 100%;
    transition: all 0.3s;
  }

  .fieldset-outlined {
    border: var(--textfield-border-weight) solid rgb(122, 122, 122);
    padding-left: 4px;
  }

  .focused .fieldset-outlined {
    border: var(--textfield-border-weight) solid
      var(--textfield-final-border-color);
    color: var(--textfield-final-color);
  }

  .legend-outlined {
    width: var(--textfield-legend-width);
    padding: 0px;
    transition: width 0.3s, color 0.1s;
  }

  .label-outlined {
    position: relative;
    top: 13px;
    left: 4px;
    display: inline-block;
    transition: all 0.3s;
    transform-origin: top left;
    transform: scale(1);
    z-index: 2;
  }

  .texted .label-outlined {
    top: -13px;
    left: 4px;
    transform: scale(0.8);
  }

  /* boxed input */

  .fieldset-boxed {
    padding: 5px;
    transition: border 0.3s ease, box-shadow 0.3s ease;
  }

  .not-focused .fieldset-boxed {
    border: var(--textfield-border-weight) solid
      var(--textfield-final-border-color);
  }

  .focused .fieldset-boxed {
    border: var(--textfield-border-weight) solid
      var(--textfield-focus-border-color, var(--textfield-final-color));
    box-shadow: var(--textfield-focused-box-shadow);
    padding: 5px;
  }

  .input-boxed {
    border: 0px solid;
    box-sizing: border-box;
    font-size: 18px;
    height: 100%;
    outline: 0;
    padding: 4px 0px 0;
    width: 100%;
    transition: all 0.3s;
    position: relative;
  }

  .input-boxed::placeholder {
    color: var(--textfield-final-color);
    opacity: 60%;
  }
</style>
