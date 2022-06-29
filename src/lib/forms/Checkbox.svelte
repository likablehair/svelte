<script lang="ts">
  export let value: boolean = false,
    id: string = undefined,
    disabled: boolean = false,
    activeColor: string = "#275efe",
    activeInnerColor: string = "#fff",
    focusShadow: string = "2px rgba(39, 94, 254, 0.3)",
    borderColor: string = "#bbc1e1",
    borderHoverColor: string = "#275efe",
    backgroundColor: string = "#fff",
    disabledColor: string = "#f6f8ff",
    disabledInnerColor: string = "#e1e6f9"
</script>

<input
  style:--checkbox-active-color={activeColor}
  style:--checkbox-active-inner-color={activeInnerColor}
  style:--checkbox-focus-shadow={focusShadow}
  style:--checkbox-border-color={borderColor}
  style:--checkbox-border-hover-color={borderHoverColor}
  style:--checkbox-background-color={backgroundColor}
  style:--checkbox-disabled-color={disabledColor}
  style:--checkbox-disabled-inner-color={disabledInnerColor}
  id={id}
  type="checkbox"
  bind:checked={value}
  disabled={disabled}
>

<style>
  @supports (-webkit-appearance: none) or (-moz-appearance: none) {
    input[type="checkbox"] {
      -webkit-appearance: none;
      -moz-appearance: none;
      height: 21px;
      outline: none;
      display: inline-block;
      vertical-align: top;
      position: relative;
      margin: 0;
      cursor: pointer;
      border: 1px solid var(--bc, var(--checkbox-border-color));
      background: var(--b, var(--checkbox-background-color));
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
      border: 2px solid var(--checkbox-active-inner-color);
      border-top: 0;
      border-left: 0;
      left: 7px;
      top: 4px;
      transform: rotate(var(--r, 20deg));
      box-sizing: border-box;
    }

    input[type="checkbox"]:checked {
      --b: var(--checkbox-active-color);
      --bc: var(--checkbox-active-color);
      --d-o: 0.3s;
      --d-t: 0.6s;
      --d-t-e: cubic-bezier(0.2, 0.85, 0.32, 1.2);
      --o: 1;
      --r: 43deg;
    }

    input[type="checkbox"]:disabled {
      --b: var(--checkbox-disabled-color);
      cursor: not-allowed;
      opacity: 0.9;
    }

    input[type="checkbox"]:disabled:checked {
      --b: var(--checkbox-disabled-inner-color);
      --bc: var(--checkbox-border-color);
      --r: 43deg;
    }

    input[type="checkbox"]:disabled + label {
      cursor: not-allowed;
    }

    input[type="checkbox"]:hover:not(:checked):not(:disabled) {
      --bc: var(--checkbox-border-hover-color);
    }
    input[type="checkbox"]:focus {
      box-shadow: 0 0 0 var(--checkbox-focus-shadow);
    }

    input[type="checkbox"]:not(.switch):after {
      width: 5px;
      height: 9px;
      border: 2px solid var(--checkbox-active-inner-color);
      border-top: 0;
      border-left: 0;
      left: 7px;
      top: 4px;
      transform: rotate(var(--r, 20deg));
    }

  }
</style>
