<script lang="ts">
  import './Checkbox.css'
  import '../../../css/main.css'
  import { onMount } from 'svelte';

  interface Props {
    value?: boolean;
    id?: string;
    disabled?: boolean;
    onchange?: (event: {
      detail: {
        shiftKeyPressed: boolean,
        nativeEvent: Event
      }
    }) => void
  }

  let { 
    value = $bindable(), 
    id = undefined, 
    disabled = false,
    onchange,
  }: Props = $props();

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  })

  function handleKeyDown(event: KeyboardEvent) {
    if(event.key == 'Shift') {
      shiftKeyPressed = true
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    if(event.key == 'Shift') {
      shiftKeyPressed = false
    }
  }

  let shiftKeyPressed: boolean = false

  function handleChange(e: Event) {
    if(onchange) {
      onchange({
        detail: {
          shiftKeyPressed, 
          nativeEvent: e
        }
      })
    }
  }
</script>

<input
  {id}
  type="checkbox"
  bind:checked={value}
  onchange={handleChange}
  {disabled}
/>

<style>
  @supports (-webkit-appearance: none) or (-moz-appearance: none) {
    input[type="checkbox"] {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      height: 21px;
      outline: none;
      display: inline-block;
      vertical-align: top;
      position: relative;
      margin: 0;
      cursor: pointer;
      border: 1px solid var(--bc, var(
        --checkbox-border-color,
        var(--checkbox-default-border-color)
      ));
      background: var(--b, var(
        --checkbox-background-color,
        var(--checkbox-default-background-color)
      ));
      transition: background 0.3s, border-color 0.3s, box-shadow 0.2s;
      width: 21px;
      border-radius: 7px;
    }

    input[type="checkbox"]:after {
      content: "";
      display: block;
      position: absolute;
      opacity: var(--o, 0);
      transition: transform var(--d-t, 0.3s) var(--d-t-e, ease),
        opacity var(--d-o, 0.2s);
      width: 5px;
      height: 9px;
      border: 2px solid var(
        --checkbox-active-inner-color,
        var(--checkbox-default-active-inner-color)
      );
      border-top: 0;
      border-left: 0;
      left: 7px;
      top: 4px;
      transform: rotate(var(--r, 20deg));
      box-sizing: border-box;
    }

    input[type="checkbox"]:checked:not(:disabled) {
      --b: var(
        --checkbox-active-color,
        var(--checkbox-default-active-color)
      );
      --bc: var(
        --checkbox-active-color,
        var(--checkbox-default-active-color)
      );
      --d-o: 0.3s;
      --d-t: 0.6s;
      --d-t-e: cubic-bezier(0.2, 0.85, 0.32, 1.2);
      --o: 1;
      --r: 43deg;
    }

    input[type="checkbox"]:disabled {
      --b: var(
        --checkbox-disabled-color,
        var(--checkbox-default-disabled-color)
      );
      --bc: var(
        --checkbox-disabled-active-color,
        var(--checkbox-default-disabled-active-color)
      );
      cursor: not-allowed;
      opacity: 0.5;
    }

    input[type="checkbox"]:disabled:checked {
      --b: var(
        --checkbox-disabled-active-color,
        var(--checkbox-default-disabled-active-color)
      );
      --bc: var(
        --checkbox-border-color,
        var(--checkbox-default-border-color)
      );
      --d-o: 0.3s;
      --d-t: 0.6s;
      --d-t-e: cubic-bezier(0.2, 0.85, 0.32, 1.2);
      --o: .7;
      --r: 43deg;
    }

    input[type="checkbox"]:hover:not(:checked):not(:disabled) {
      --bc: var(
        --checkbox-border-hover-color,
        var(--checkbox-default-border-hover-color)
      );
    }
    input[type="checkbox"]:focus {
      box-shadow: 0 0 0 var(
        --checkbox-focus-shadow,
        var(--checkbox-default-focus-shadow)
      );
    }

    input[type="checkbox"]:after {
      width: 5px;
      height: 9px;
      border: 2px solid var(
        --checkbox-active-inner-color,
        var(--checkbox-default-active-inner-color)
      );
      border-top: 0;
      border-left: 0;
      left: 7px;
      top: 4px;
      transform: rotate(var(--r, 20deg));
    }
  }
</style>
