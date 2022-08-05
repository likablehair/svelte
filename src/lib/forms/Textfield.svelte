<script lang="ts" context="module">
  export type VariantOptions = 'outlined' | 'boxed'
</script>

<script lang="ts">

  export let label: string = "",
    placeholder: string = "",
    color: string = null,
    value: string = "",
    variant: VariantOptions = 'outlined',
    width: string = "100%",
    height: string = "50px",
    maxWidth: string = undefined,
    minWidth: string = undefined,
    textColor: string = "black",
    borderWeight: string = "2px",
    borderRadius: string = "5px",
    borderColor: string = null,
    focusBorderColor: string = null,
    focusedBoxShadow: string = undefined,
    backgroundColor: string = null,
    padding: string = undefined,
    paddingLeft: string = undefined,
    paddingRight: string = undefined,
    paddingBottom: string = undefined,
    paddingTop: string = undefined,
    fontSize: string = undefined,
    type: 'text' | 'password' = 'text',
    inputElement: HTMLElement = undefined

  import { v4 as uuidv4 } from 'uuid';
  import { onMount } from 'svelte'

  let inputId: string = uuidv4(),
    focused: boolean = false,
    legendWidth: number = 0,
    labelElement: HTMLElement = undefined
  
  onMount(() => {
    if(!!labelElement) {
      legendWidth = (labelElement.offsetWidth * 0.8) + 8
    }
  })

  function handleFocus(): void {
    focused = true
  }

  function handleBlur(): void {
    focused = false
  }


  $: if(!!labelElement) {
    legendWidth = !value && !focused ? 0 : (labelElement.offsetWidth * 0.8) + 8
  }
</script>

<style>
  .input-container {
    position: relative;
    --textfield-final-color: var(--textfield-theme-color, --textfield-border-color, rgb(88, 88, 88));
    --textfield-final-border-color: var(--textfield-border-color, var(--textfield-final-color))
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
    border: var(--textfield-border-weight) solid var(--textfield-final-border-color);
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
    transform: scale(.8);
  }

  /* boxed input */

  .fieldset-boxed {
    padding: 5px;
    transition: border 0.3s ease, box-shadow 0.3s ease;
  }

  .not-focused .fieldset-boxed {
    border: var(--textfield-border-weight) solid var(--textfield-final-border-color);
  }

  .focused .fieldset-boxed {
    border: var(--textfield-border-weight) solid var(--textfield-focus-border-color, var(--textfield-final-color));
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


<div 
  style:width={width}
  style:min-width={minWidth}
  style:max-width={maxWidth}
  style:height={height}
  style:--textfield-theme-color={color}
  style:--textfield-border-color={borderColor}
  style:--textfield-border-weight={borderWeight}
  style:--textfield-focus-border-color={focusBorderColor}
  style:--textfield-legend-width={legendWidth + 'px'}
  style:--textfield-focused-box-shadow={focusedBoxShadow}
  class="input-container" 
  class:focused={focused}
  class:not-focused={!focused}
  class:texted={focused || !!value}
>
  <fieldset 
    aria-hidden="true"
    style:border-radius={borderRadius}
    style:background-color={backgroundColor}
    style:padding={padding}
    style:padding-left={paddingLeft}
    style:padding-right={paddingRight}
    style:padding-bottom={paddingBottom}
    style:padding-top={paddingTop}
    class="fieldset"
    class:fieldset-outlined={variant == 'outlined'}
    class:fieldset-boxed={variant == 'boxed'}
  >
    {#if variant == 'outlined'}
        <legend class="legend-outlined"></legend>
        <label 
          for={inputId}
          class="label-outlined"
          bind:this={labelElement}
        >{label}</label>
        <div 
          style:display="flex"
          style:position="relative"
          style:bottom="8px"
          style:margin-left="8px"
          style:margin-right="8px"
        >
          <div>
            <slot name="prepend-inner"></slot>
          </div>
          {#if type == 'password'}
            <input 
              style:background-color={backgroundColor}
              style:color={textColor}
              style:font-size={fontSize}
              id={inputId} 
              class="input-outlined"
              type="password"
              placeholder={placeholder}
              bind:value={value}
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
          {:else if type == 'text'}
            <input 
              style:background-color={backgroundColor}
              style:color={textColor}
              style:font-size={fontSize}
              id={inputId} 
              class="input-outlined"
              type="text"
              placeholder={placeholder}
              bind:value={value}
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
            <slot name="append-inner"></slot>
          </div>
        </div>
    {:else if variant == 'boxed'}
      <div 
        style:display="flex"
      >
        <div>
          <slot name="prepend-inner"></slot>
        </div>
        {#if type == 'password'}
          <input
            style:background-color={backgroundColor}
            style:color={textColor}
            style:font-size={fontSize}
            id={inputId}
            class="input-boxed"
            type="password"
            placeholder={placeholder || label}
            bind:value={value}
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
        {:else if type == 'text'}
          <input
            style:background-color={backgroundColor}
            style:color={textColor}
            style:font-size={fontSize}
            id={inputId}
            class="input-boxed"
            type="text"
            placeholder={placeholder || label}
            bind:value={value}
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
          <slot name="append-inner"></slot>
        </div>
      </div>
    {/if}
  </fieldset>
</div>