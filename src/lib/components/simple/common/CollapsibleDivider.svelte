<script lang="ts">
  import '../../../css/main.css'
  import './CollapsibleDivider.css'
  import { createEventDispatcher } from "svelte";
  import Icon from "../media/Icon.svelte";

  let dispatch = createEventDispatcher<{
    'change': {
      collapsed: boolean
    }
  }>()

  export let collapsed: boolean = false,
    openedIconName: string = "mdi-chevron-left",
    collapsedIconName: string = "mdi-chevron-right",
    disabled: boolean = false

  function handleCollapseClick() {
    if(!disabled) {
      collapsed = !collapsed
      dispatch('change', { collapsed })
    }
  }

</script>

<div
  class="container"
>
  <div
    class="divider"
  />
  <div
    class="button"
    class:disabled={disabled}
    on:click="{handleCollapseClick}"
    on:click
    on:keydown
    on:keyup
    on:keypress
  >
    <Icon 
      name={collapsed ? collapsedIconName : openedIconName}
      --icon-default-color="var(--collapsible-divider-button-border-color, var(--collapsible-divider-default-button-border-color))"
    ></Icon>
  </div>
</div>

<style>
  .container {
    display: flex;
    margin-right: var(
      --collapsible-divider-margin-right,
      var(--collapsible-divider-default-margin-right)
    );
    margin-left: var(
      --collapsible-divider-margin-left,
      var(--collapsible-divider-default-margin-left)
    );
    margin-top: var(
      --collapsible-divider-margin-top,
      var(--collapsible-divider-default-margin-top)
    );
    margin-bottom: var(
      --collapsible-divider-margin-bottom,
      var(--collapsible-divider-default-margin-bottom)
    );
    align-items: center;
  }

  .divider {
    flex-grow: 1;
    background-color: var(
      --collapsible-divider-background-color,
      var(--collapsible-divider-default-background-color)
    );
    border-radius: var(
      --collapsible-divider-line-border-radius,
      var(--collapsible-divider-default-line-border-radius)
    );
    height: var(
      --collapsible-divider-line-height,
      var(--collapsible-divider-default-line-height)
    );
  }

  .button {
    display: flex;
    justify-content: center;
    cursor: pointer;
    border-radius: var(
      --collapsible-divider-button-border-radius,
      var(--collapsible-divider-default-button-border-radius)
    );
    border: var(
      --collapsible-divider-button-border,
      var(--collapsible-divider-default-button-border)
    );
    border-color: var(
      --collapsible-divider-button-border-color,
      var(--collapsible-divider-default-button-border-color)
    );
    width: var(
      --collapsible-divider-button-width,
      var(--collapsible-divider-default-button-width)
    );
    height: var(
      --collapsible-divider-button-height,
      var(--collapsible-divider-default-button-height)
    );
  }

  .button.disabled {
    opacity: .5;
    cursor: not-allowed;
  }
</style>
