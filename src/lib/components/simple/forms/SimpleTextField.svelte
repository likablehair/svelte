<script lang="ts">
  import '../../../css/main.css'
  import './SimpleTextField.css'
  import Icon from "../media/Icon.svelte";

  let clazz: {
    container?: string,
    row?: string,
    field?: string,
    hint?: string,
    input?: string
  } = {};
	export { clazz as class };

  /* 
    Styles:
    
    --simple-textfield-padding
    --simple-textfield-height
    --simple-textfield-width
    --simple-textfield-max-width
    --simple-textfield-color
    --simple-textfield-background-color
    --simple-textfield-border-radius
    --simple-textfield-box-shadow
    --simple-textfield-focus-background-color
    --simple-textfield-focus-box-shadow
    --simple-textfield-transition
    --simple-textfield-font-size
    --simple-textfield-font-weight
    --simple-textfield-outer-gap
    --simple-textfield-inner-gap
    --simple-textfield-hint-font-size
    --simple-textfield-hint-color
    --simple-textfield-hint-margin-left
    --simple-textfield-margin-bottom
    --simple-textfield-margin-left
  */

  export let value: string | number | undefined = undefined,
    type: "text" | "password" | "number" | "time" | "date" = "text",
    placeholder: string | undefined = undefined,
    disabled: boolean = false,
    readonly: boolean = false,
    appendIcon: string | undefined = undefined,
    appendInnerIcon: string | undefined = undefined,
    prependIcon: string | undefined = undefined,
    prependInnerIcon: string | undefined = undefined,
    iconSize: string = "12pt",
    name: string | undefined = undefined,
    hint: string | undefined = undefined,
    input: HTMLElement | undefined = undefined
</script>

<div
  class="textfield-container {clazz.container || ''}"
>
  <div class="row {clazz.row || ''}">
    <slot name="prepend" {prependIcon} {iconSize}>
      {#if !!prependIcon}
        <Icon name={prependIcon} --icon-size={iconSize}></Icon>
      {/if}
    </slot>
    <div class="textfield {clazz.field || ''}">
      <slot name="prepend-inner" {prependInnerIcon} {iconSize}>
        {#if !!prependInnerIcon}
          <Icon name={prependInnerIcon} --icon-size={iconSize}></Icon>
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
          on:change
          name={name}
          class={clazz.input || ''}
          bind:this={input}
          {...$$restProps}
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
          on:change
          name={name}
          class={clazz.input || ''}
          bind:this={input}
          {...$$restProps}
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
          on:change
          name={name}
          class={clazz.input || ''}
          bind:this={input}
          {...$$restProps}
        />
      {:else if type == "time"}
        <input
          bind:value={value}
          placeholder={placeholder}
          type="time"
          disabled={disabled}
          readonly={readonly}
          on:change
          on:input
          on:focus
          on:blur
          on:keydown
          on:keypress
          on:keyup
          on:change
          name={name}
          class={clazz.input || ''}
          bind:this={input}
          {...$$restProps}
        />
      {:else if type == "date"}
        <input
          bind:value={value}
          placeholder={placeholder}
          type="date"
          disabled={disabled}
          readonly={readonly}
          on:change
          on:input
          on:focus
          on:blur
          on:keydown
          on:keypress
          on:keyup
          on:change
          name={name}
          class={clazz.input || ''}
          bind:this={input}
          {...$$restProps}
        />
      {/if}
      <slot name="append-inner" {appendInnerIcon} {iconSize}>
        {#if !!appendInnerIcon}
          <Icon name={appendInnerIcon} --icon-size={iconSize}></Icon>
        {/if}
      </slot>
    </div>
    <slot name="append" {appendIcon} {iconSize}>
      {#if !!appendIcon}
        <Icon name={appendIcon} --icon-size={iconSize}></Icon>
      {/if}
    </slot>
  </div>
  <div class="row {clazz.hint || ''}">
    <slot name="hint">
      {#if !!hint}
        <span class="hint">{hint}</span>
      {/if}
    </slot>
  </div>
</div>

<style>
  .textfield-container {
    max-width: var(
      --simple-textfield-max-width,
      var(--simple-textfield-default-max-width)
    );
    width: var(
      --simple-textfield-width,
      var(--simple-textfield-default-width)
    );
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(
      --simple-textfield-outer-gap, 
      var(--simple-textfield-default-outer-gap)
    );
    margin-bottom: var(
      --simple-textfield-margin-bottom,
      var(--simple-textfield-default-margin-bottom)
    );
    margin-left: var(
      --simple-textfield-margin-left,
      var(--simple-textfield-default-margin-left)
    );
  }

  .row:last-of-type {
    margin-bottom: 0px;
  }

  .hint {
    margin-left: var(
      --simple-textfield-hint-margin-left, 
      var(--simple-textfield-default-hint-margin-left)
    );
    font-size: var(
      --simple-textfield-hint-font-size, 
      var(--simple-textfield-default-hint-font-size)
    );
    color: var(
      --simple-textfield-hint-color,
      var(--simple-textfield-default-hint-color)
    );
  }

  .textfield {
    padding: var(
      --simple-textfield-padding,
      var(--simple-textfield-default-padding)
    );
    height: var(
      --simple-textfield-height,
      var(--simple-textfield-default-height)
    );
    background-color: var(
      --simple-textfield-background-color,
      var(--simple-textfield-default-background-color)
    );
    border: var(
      --simple-textfield-border,
      var(--simple-textfield-default-border)
    );
    border-radius: var(
      --simple-textfield-border-radius,
      var(--simple-textfield-default-border-radius)
    );
    box-shadow: var(
      --simple-textfield-box-shadow,
      var(--simple-textfield-default-box-shadow)
    );
    transition: var(
      --simple-textfield-transition,
      var(--simple-textfield-default-transition)
    );
    gap: var(
      --simple-textfield-inner-gap,
      var(--simple-textfield-default-inner-gap)
    );
    display: flex;
    flex-grow: 1;
  }

  .textfield:focus-within {
    background-color: var(
      --simple-textfield-focus-background-color, 
      var(
        --simple-textfield-default-focus-background-color,
        var(
          --simple-textfield-background-color,
          var(--simple-textfield-default-background-color)
        )
      )
    );
    box-shadow: var(
      --simple-textfield-focus-box-shadow, 
      var(--simple-textfield-default-focus-box-shadow)
    );
  }

  input {
    outline: none;
    width: 100%;
    background-color: transparent;
    font-size: var(
      --simple-textfield-font-size, 
      var(--simple-textfield-default-font-size)
    );
    font-weight: var(
      --simple-textfield-font-weight,
      var(--simple-textfield-default-font-weight)
    );
    color: var(
      --simple-textfield-color,
      var(--simple-textfield-default-color)
    );
    border: none
  }

  ::-webkit-calendar-picker-indicator {
    opacity: 0;
  }

</style>