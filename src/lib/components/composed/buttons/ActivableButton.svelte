<script lang="ts">
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import type { ComponentProps, Snippet } from "svelte";
  interface Props {
    active?: boolean;
    buttonProps?: ComponentProps<typeof Button>;
    onclick?: ComponentProps<typeof Button>['onclick']
    children?: Snippet<[]>
    appendSnippet?: Snippet<[]>
  }

  let { 
    active = $bindable(false), 
    buttonProps = {},
    onclick,
    children,
    appendSnippet: appendInternalSnippet,
  }: Props = $props();

  function handleOnClick(e: Parameters<NonNullable<typeof onclick>>[0]) {
    active = !active

    if(onclick) {
      onclick(e)
    }
  }
</script>

<Button
  onclick={handleOnClick}
  {...buttonProps}
  buttonType="text"
  --button-default-text-background-color={active ? 
    "var(--activable-button-active-background-color, rgb(var(--global-color-primary-500)))" :
    "var(--activable-button-deactive-background-color, none)"
  }
  --button-default-text-color={active ? 
    "var(--activable-button-active-color, rgb(var(--global-color-grey-50)))" : 
    "var(--activable-button-deactive-color, rgb(var(--global-color-contrast-900)))"
  }
  --button-default-text-hover-background-color={active ? 
    "var(--activable-button-hover-active-background-color, rgb(var(--global-color-primary-500)))" : 
    "var(--activable-button-hover-deactive-background-color, rgb(var(--global-color-background-200)))"
  }
  --button-default-text-hover-color={active ? 
    "var(--activable-button-hover-active-color, rgb(var(--global-color-grey-50)))" : 
    undefined
  }
  --button-default-text-active-background-color={active ? 
    "var(--activable-button-active-active-background-color, rgb(var(--global-color-primary-500)))" : 
    "var(--activable-button-active-deactive-background-color, rgb(var(--global-color-background-200)))"
  }
  --button-default-text-active-color={active ? 
    "var(--activable-button-active-active-color, rgb(var(--global-color-grey-50)))" : 
    undefined
  }
  --button-default-text-focus-background-color={active ? 
    "var(--activable-button-focus-active-background-color, rgb(var(--global-color-primary-500)))" : 
    "var(--activable-button-focus-deactive-background-color, rgb(var(--global-color-background-200)))"
  }
  --button-default-text-focus-color={active ? 
    "var(--activable-button-focus-active-color, rgb(var(--global-color-grey-50)))" : 
    undefined
  }
  --button-default-disabled-background-color="none"
  --button-default-disabled-color="rgb(var(--global-color-contrast-900), .5)"
>
  {@render children?.()}
  {#snippet appendSnippet()}
    {@render appendInternalSnippet?.()}
  {/snippet}
</Button>