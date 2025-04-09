<script lang="ts">
  import '../../../css/main.css'
  import './CollapsibleDivider.css'
  import Icon from "../media/Icon.svelte";

  interface Props {
    collapsed?: boolean;
    openedIconName?: string;
    collapsedIconName?: string;
    disabled?: boolean;
    onchange?: (event: {
      detail: {
        collapsed: boolean
      }
    }) => void
    onkeydown?: () => void
    onkeyup?: () => void
    onkeypress?: () => void
  }

  let {
    collapsed = $bindable(false),
    openedIconName = "mdi-chevron-left",
    collapsedIconName = "mdi-chevron-right",
    disabled = false,
    onchange,
    onkeydown,
    onkeypress,
    onkeyup,
  }: Props = $props();

  function handleCollapseClick() {
    if(!disabled) {
      collapsed = !collapsed
    }

    if(onchange){
      onchange({
        detail: {
          collapsed
        }
      })
    }
  }

  function handleKeydown() {
    if(onkeydown){
      onkeydown()
    }
  }

  function handleKeyup() {
    if(onkeyup){
      onkeyup()
    }
  }

  function handleKeypress() {
    if(onkeypress){
      onkeypress()
    }
  }

</script>

<div
  class="container"
>
  <div
    class="divider"
  ></div>
  <div
    role="button"
    tabindex="0"
    class="button"
    class:disabled={disabled}
    onclick={handleCollapseClick}
    onkeydown={handleKeydown}
    onkeyup={handleKeyup}
    onkeypress={handleKeypress}
    aria-expanded={!collapsed}
    aria-label="Toggle collapse"
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
