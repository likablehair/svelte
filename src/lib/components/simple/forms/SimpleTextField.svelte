<script lang="ts">
  import Icon from "../media/Icon.svelte";


  export let _padding: string | null = null,
    _width: string | null = null,
    _height: string | null = null,
    _backgroundColor: string | null = null,
    _borderRadius: string | null = null,
    _boxShadow: string | null = null,
    _focusBackgroundColor: string | null = null,
    _focusBoxShadow: string | null = null,
    _transition: string | null = null,
    _fontSize: string | null = null,
    _fontWeight: string | null = null,
    _outerGap: string | null = null,
    _innerGap: string | null = null,
    _hintFontSize: string | null = null,
    _hintColor: string | null = null,
    _hintMarginLeft: string | null = null,
    _marginBottom: string | null = null

  export let value: string | number | undefined = undefined,
    type: "text" | "password" | "number" = "text",
    placeholder: string | undefined = undefined,
    disabled: boolean = false,
    readonly: boolean = false,
    appendIcon: string | undefined = undefined,
    appendInnerIcon: string | undefined = undefined,
    prependIcon: string | undefined = undefined,
    prependInnerIcon: string | undefined = undefined,
    iconSize: number = 12,
    hint: string | undefined = undefined

</script>

<div
  class="textfield-container"
  style:--simple-textfield-padding={_padding}
  style:--simple-textfield-height={_height}
  style:--simple-textfield-width={_width}
  style:--simple-textfield-background-color={_backgroundColor}
  style:--simple-textfield-border-radius={_borderRadius}
  style:--simple-textfield-box-shadow={_boxShadow}
  style:--simple-textfield-focus-background-color={_focusBackgroundColor}
  style:--simple-textfield-focus-box-shadow={_focusBoxShadow}
  style:--simple-textfield-transition={_transition}
  style:--simple-textfield-font-size={_fontSize}
  style:--simple-textfield-font-weight={_fontWeight}
  style:--simple-textfield-outer-gap={_outerGap}
  style:--simple-textfield-inner-gap={_innerGap}
  style:--simple-textfield-hint-font-size={_hintFontSize}
  style:--simple-textfield-hint-color={_hintColor}
  style:--simple-textfield-hint-margin-left={_hintMarginLeft}
  style:--simple-textfield-margin-bottom={_marginBottom}
>
  <div class="row">
    <slot name="prepend" {prependIcon} {iconSize}>
      {#if !!prependIcon}
          <Icon name={prependIcon} size={iconSize}></Icon>
      {/if}
    </slot>
    <div class="textfield">
      <slot name="prepend-inner" {prependInnerIcon} {iconSize}>
        {#if !!prependInnerIcon}
          <Icon name={prependInnerIcon} size={iconSize}></Icon>
        {/if}
      </slot>
      {#if type == "text"}
        <input
          bind:value={value}
          placeholder={placeholder}
          type="text"
          disabled={disabled}
          readonly={readonly}
          on:change
          on:input
          on:focus
          on:blur
          on:keydown
          on:keypress
          on:keyup
        />
      {:else if type == "password"}
        <input
          bind:value={value}
          placeholder={placeholder}
          type="password"
          disabled={disabled}
          readonly={readonly}
          on:change
          on:input
          on:focus
          on:blur
          on:keydown
          on:keypress
          on:keyup
        />
      {:else if type == "number"}
        <input
          bind:value={value}
          placeholder={placeholder}
          type="number"
          disabled={disabled}
          readonly={readonly}
          on:change
          on:input
          on:focus
          on:blur
          on:keydown
          on:keypress
          on:keyup
        />
      {/if}
      <slot name="append-inner" {appendInnerIcon} {iconSize}>
        {#if !!appendInnerIcon}
          <Icon name={appendInnerIcon} size={iconSize}></Icon>
        {/if}
      </slot>
    </div>
    <slot name="append" {appendIcon} {iconSize}>
      {#if !!appendIcon}
        <Icon name={appendIcon} size={iconSize}></Icon>
      {/if}
    </slot>
  </div>
  <div class="row">
    <slot name="hint">
      {#if !!hint}
        <span class="hint">{hint}</span>
      {/if}
    </slot>
  </div>
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: var(--simple-textfield-outer-gap, 8px);
    margin-bottom: var(--simple-textfield-margin-bottom, 5px);
  }

  .row:last-of-type {
    margin-bottom: 0px;
  }

  .hint {
    margin-left: var(--simple-textfield-hint-margin-left, 20px);
    font-size: var(--simple-textfield-hint-font-size, 0.75rem);
    color: var(--simple-textfield-hint-color, grey);
  }

  .textfield {
    padding: var(--simple-textfield-padding, 0.65rem 1rem 0.65rem 1rem);
    width: var(--simple-textfield-width, 280px);
    height: var(--simple-textfield-height);
    background-color: var(--simple-textfield-background-color, rgb(244 244 245/1));
    border: none;
    border-radius: var(--simple-textfield-border-radius, 9999px);
    box-shadow: var(--simple-textfield-box-shadow, none);
    transition: var(--simple-textfield-transition, 0.2s);
    gap: var(--simple-textfield-inner-gap, 8px);
    display: flex;
  }

  .textfield:focus-within {
    background-color: var(--simple-textfield-focus-background-color, var(--simple-textfield-background-color, rgb(244 244 245/1)));
    box-shadow: var(--simple-textfield-focus-box-shadow, rgba(100, 100, 111, 0.4) 0px 4px 25px 0px);
  }

  input {
    outline: none;
    width: 100%;
    background-color: transparent;
    font-size: var(--simple-textfield-font-size, .9rem);
    font-weight: var(--simple-textfield-font-weight, normal);
    border: none
  }
</style>