<script lang="ts">
  import '../../../css/main.css'
  import './Textarea.css'
  import { createId } from '@paralleldrive/cuid2';
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  interface Props extends HTMLTextareaAttributes {
    label?: string;
    class?: {
      container?: string;
      label?: string;
      textarea?: string;
    }
  };

  let {
    label,
    id = createId(),
    value = $bindable(),
    class: clazz,
    ...rest
  }: Props = $props();
</script>

<div class={clazz?.container}>
  {#if label}
    <label for={id} class={clazz?.label}>
      {label}
    </label>
  {/if}
  <textarea
    {...rest}
    bind:value
    {id}
    class={clazz?.textarea}
  ></textarea>
</div>

<style>
  textarea {
    box-sizing: border-box;
    padding: var(
      --textarea-padding,
      var(--textarea-default-padding)
    );
    margin: var(
      --textarea-margin,
      var(--textarea-default-margin)
    );
    height: var(
      --textarea-height,
      var(--textarea-default-height)
    );
    width: var(
      --textarea-width,
      var(--textarea-default-width)
    );
    background-color: var(
      --textarea-background-color,
      var(--textarea-default-background-color)
    );
    border: var(
      --textarea-border,
      var(--textarea-default-border)
    );
    border-radius: var(
      --textarea-border-radius,
      var(--textarea-default-border-radius)
    );
    box-shadow: var(
      --textarea-box-shadow,
      var(--textarea-default-box-shadow)
    );
    transition: var(
      --textarea-transition,
      var(--textarea-default-transition)
    );
    font-family: var(
      --textarea-font-family,
      var(--textarea-default-font-family)
    );
    font-size: var(
      --textarea-font-size,
      var(--textarea-default-font-size)
    );
    font-weight: var(
      --textarea-font-weight,
      var(--textarea-default-font-weight)
    );
    color: var(
      --textarea-color,
      var(--textarea-default-color)
    );
    resize: var(
      --textarea-resize,
      var(--textarea-default-resize)
    );
  }

  label {
    margin: var(
      --textarea-label-margin,
      var(--textarea-default-label-margin)
    );
    font-size: var(
      --textarea-label-font-size,
      var(--textarea-default-label-font-size)
    );
    font-weight: var(
      --textarea-label-font-weight,
      var(--textarea-default-label-font-weight)
    );
    color: var(
      --textarea-label-color,
      var(--textarea-default-label-color)
    );
  }

  textarea:focus {
    outline: none;
    -webkit-box-shadow: var(
      --textarea-focus-box-shadow,
      var(--textarea-default-focus-box-shadow)
    );
    -moz-box-shadow: var(
      --textarea-focus-box-shadow,
      var(--textarea-default-focus-box-shadow)
    );
    -o-box-shadow: var(
      --textarea-focus-box-shadow,
      var(--textarea-default-focus-box-shadow)
    );
    box-shadow: var(
      --textarea-focus-box-shadow,
      var(--textarea-default-focus-box-shadow)
    );
  }
</style>
