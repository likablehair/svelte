<script lang="ts">
  export let label: string = "",
    color: string = "",
    value: string = "";

  $: cssVariables = Object.entries({
      '--theme-color': color,
    }).filter(([key]) => key.startsWith('--'))
    .reduce( (css, [key,value]) => {
      return `${ css }${ key }: ${ value };`
    }, '');
</script>

<style>
  .input-container {
    margin-top: 15px;
    height: 50px;
    position: relative;
    width: var(--width, 100%);
  }

  .input {
    border-radius: var(--border-radius, 5px);
    border: 1px solid var(--border-color, rgb(122, 122, 122));
    box-sizing: border-box;
    color: var(--color, black);
    font-size: 18px;
    height: 100%;
    outline: 0;
    padding: 4px 20px 0;
    width: 100%;
  }

  .cut {
    background-color: transparent;
    border-radius: 10px;
    height: 17px;
    left: 28px;
    position: absolute;
    padding-left: 10px;
    padding-top: 3px;
    padding-bottom: 3px;
    padding-right: 10px;
    top: -20px;
    color: transparent;
    transform: translateY(0);
    transform-origin: 0 0;
    transition: transform 200ms, background-color 200ms;
  }

  .input:focus ~ .cut,
  .input:not(:placeholder-shown) ~ .cut {
    transform: translateY(5px) scale(0.80);
    background-color: rgb(255, 255, 255);
  }

  .placeholder {
    color: #65657b;
    left: 20px;
    line-height: 14px;
    pointer-events: none;
    position: absolute;
    transform-origin: 0 50%;
    transition: transform 200ms, color 200ms;
    top: 20px;
  }

  .input:focus ~ .placeholder,
  .input:not(:placeholder-shown) ~ .placeholder {
    transform: translateY(-30px) translateX(15px) scale(0.80);
  }

  .input:not(:placeholder-shown) ~ .placeholder {
    color: #808097;
  }

  .input:focus ~ .placeholder {
    color: var(--theme-color);
  }

  .input:focus {
    border: 1px solid var(--theme-color, rgb(122, 122, 122));
  }
</style>


<div class="input-container" style={cssVariables}>
  <input 
    id="firstname" 
    class="input" 
    type="text" 
    placeholder=" " 
    bind:value={value}
    on:change
    on:input
    on:focus
    on:blur
  />
  {#if !!label}
    <div class="cut">{label}</div>
  {/if}
  <label for="firstname" class="placeholder">{label}</label>
</div>