<script lang="ts">
  type VariantOptions = 'outlined' | 'boxed'

  export let label: string = "",
    placeholder: string = "",
    color: string = "",
    value: string = "",
    variant: VariantOptions = 'outlined';

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
  $: cssVariables = Object.entries({
      '--theme-color': color,
      '--legend-width': legendWidth + 'px'
    }).filter(([key]) => key.startsWith('--'))
    .reduce( (css, [key,value]) => {
      return `${ css }${ key }: ${ value };`
    }, '');

  import '$lib/common/tailwind.css';
</script>

<style>
  .input-container {
    margin-top: 15px;
    height: 50px;
    position: relative;
    width: var(--width, 100%);
    --final-color: var(--theme-color, --border-color, rgb(88, 88, 88));
  }

  /* outlined input */

  .input-outlined {
    border: 0px solid;
    box-sizing: border-box;
    color: var(--color, black);
    font-size: 18px;
    height: 100%;
    outline: 0;
    padding: 4px 0px 0;
    width: 100%;
    transition: all 0.3s;
  }

  .fieldset-outlined {
    border-radius: var(--border-radius, 5px);
    border: 1px solid rgb(122, 122, 122);
    padding-left: 4px;
  }

  .focused .fieldset-outlined {
    border: 1px solid var(--final-color);
    color: var(--final-color);
  }

  .legend-outlined {
    width: var(--legend-width);
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
    border: 2px solid var(--final-color);
    padding: 5px;
    border-radius: var(--border-radius, 0);
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
    color: var(--final-color);
    opacity: 60%;
  }

</style>


<div 
  class="input-container" 
  style={cssVariables}
  class:focused={focused}
  class:texted={focused || !!value}
>
  <fieldset 
    aria-hidden="true" 
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
        <div class="flex content-center relative bottom-3 ml-2 mr-2">
          <div>
            <slot name="prepend-inner"></slot>
          </div>
          <input 
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
          />
          <div>
            <slot name="append-inner"></slot>
          </div>
        </div>
    {:else if variant == 'boxed'}
      <div class="flex">
        <div>
          <slot name="prepend-inner"></slot>
        </div>
        <input
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
        />
        <div>
          <slot name="append-inner"></slot>
        </div>
      </div>
    {/if}
  </fieldset>
</div>