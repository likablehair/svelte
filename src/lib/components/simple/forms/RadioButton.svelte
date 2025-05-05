<script lang="ts">
  import './RadioButton.css'
  import "../../../css/main.css";

  interface Props {
    name: string;
    value: string;
    id?: string;
    checked?: boolean;
    label?: string;
    disabled?: boolean;
    onchange?: () => void
    oninput?: () => void
    onfocus?: () => void
    onblur?: () => void
    onkeydown?: () => void
    onkeypress?: () => void
    onkeyup?: () => void
  }

  let {
    name,
    value,
    id = undefined,
    checked = $bindable(),
    label = undefined,
    disabled = false,
    onblur,
    onchange,
    onfocus,
    oninput,
    onkeydown,
    onkeypress,
    onkeyup,
  }: Props = $props();

</script>

<input
  type="radio"
  {name}
  {value}
  {id}
  {disabled}
  {checked}
  {onchange}
  {oninput}
  {onfocus}
  {onblur}
  {onkeydown}
  {onkeypress}
  {onkeyup}
/>
{#if label}
  <label for={id}>
    {label}
  </label>
{/if}

<style>
@supports (-webkit-appearance: none) or (-moz-appearance: none) {
  input[type="radio"] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    height: 21px;
    width: 21px;
    outline: none;
    display: inline-block;
    vertical-align: top;
    position: relative;
    margin: 0;
    cursor: pointer;
    border-radius: 50%;
    border: 1px solid var(--bc, var(--radio-button-border-color, var(--radio-button-default-border-color)));
    background: var(--b, var(--radio-button-background-color, var(--radio-button-default-background-color)));
    transition: background 0.3s, border-color 0.3s, box-shadow 0.2s;
  }

  input[type="radio"]:after {
    content: "";
    display: block;
    position: absolute;
    width: 19px;
    height: 19px;
    border-radius: 50%;
    background: var(--radio-button-active-inner-color, var(--radio-button-default-active-inner-color));
    opacity: var(--o, 0);
    transform: scale(var(--s, 0.7));
    transition: transform 0.3s ease, opacity 0.2s;
  }

  input[type="radio"]:checked:not(:disabled) {
    --b: var(--radio-button-active-color, var(--radio-button-default-active-color));
    --bc: var(--radio-button-active-color, var(--radio-button-default-active-color));
    --o: 1;
    --s: 0.5;
  }

  input[type="radio"]:disabled {
    --b: var(--radio-button-disabled-color, var(--radio-button-default-disabled-color));
    --bc: var(--radio-button-disabled-active-color, var(--radio-button-default-disabled-active-color));
    cursor: not-allowed;
    opacity: 0.9; 
  }

  input[type="radio"]:disabled:checked {
    --b: var(--radio-button-disabled-active-color, var(--radio-button-default-disabled-active-color));
    --bc: var(--radio-button-border-color, var(--radio-button-default-border-color));
    --o: 1;
    --s: 0.5;
  }

  input[type="radio"]:hover:not(:checked):not(:disabled) {
    --bc: var(--radio-button-border-hover-color, var(--radio-button-default-border-hover-color));
  }

  input[type="radio"]:focus {
    box-shadow: 0 0 0 var(--radio-button-focus-shadow, var(--radio-button-default-focus-shadow));
  }

  input[type="radio"] + label {
    font-size: 14px;
    line-height: 21px;
    display: inline-block;
    vertical-align: top;
    cursor: pointer;
    margin-left: 4px;
  }

  input[type="radio"]:disabled + label {
    cursor: not-allowed;
  }
}
</style>