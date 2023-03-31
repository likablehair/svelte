<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let disabled: boolean = false
  
  const dispatch = createEventDispatcher<{
    click: {
      nativeEvent: MouseEvent;
    };
    keypress: {
      nativeEvent: KeyboardEvent;
    };
  }>();

  function handleClick(event: MouseEvent) {
    if (disabled) return;
    dispatch("click", {
      nativeEvent: event,
    });
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (disabled) return;
    dispatch("keypress", {
      nativeEvent: event,
    });
  }
</script>

<button
  on:click={handleClick}
  on:keypress={handleKeyPress}
>
  <slot></slot>
</button>