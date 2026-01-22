<script lang="ts">
  import "../common/materialDesign.css";

  interface Props {
    name: string;
    tabindex?: number | null;
    class?: string
    onclick?: (event?: (KeyboardEvent | MouseEvent) & { currentTarget: EventTarget & HTMLSpanElement; }) => void
  }

  let {
    name,
    class: clazz = '',
    onclick,
    tabindex = !!onclick ? 0 : undefined,
  }: Props = $props();

  function handleIconClick(e: (KeyboardEvent | MouseEvent) & { currentTarget: EventTarget & HTMLSpanElement; }) {
    if(onclick) {
      onclick(e)
    }
  }
</script>

<span
  role="button"
  onclick={handleIconClick}
  onkeypress={handleIconClick}
  class="icon mdi {name} {clazz} {onclick ? 'click' : ''}"
  {tabindex}
></span>

<style>
  .icon {
    font-size: var(
      --icon-size,
      var(--icon-default-size)
    );
    color: var(
      --icon-color,
      var(--icon-default-color)
    );
    cursor: var(--icon-cursor, default);
  }
  .icon.click {
    cursor: var(--icon-cursor, pointer);
    pointer-events: var(--icon-pointer-events, auto);
    height: var(
      --icon-container-height,
      var(--icon-default-container-height)
    );
    width: var(
      --icon-container-width,
      var(--icon-default-container-width)
    );
  }
  .icon.click:not(.click) {
    pointer-events: var(--icon-pointer-events, none);
  }
  .click:hover, .click:focus {
    color: var(
      --icon-hover-color,
      rgb(var(--global-color-primary-500))
    );
    outline: none;
  }
  .click:active {
    color: var(
      --icon-active-color,
      rgb(var(--global-color-primary-600))
    );
    outline: none;
  }
</style>
