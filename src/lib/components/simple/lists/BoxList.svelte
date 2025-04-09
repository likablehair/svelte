<script lang="ts" module>
	export type Box = {
		name: string
		label: string
    href?: string
		style?: {
			width?: string
			maxWidth?: string
			minWidth?: string
		}
	};
</script>

<script lang="ts">
  import { Icon } from "$lib";
    import type { Snippet } from "svelte";

	interface Props {
		boxes: Box[];
		gap?: string;
    onboxClick?: (event: {
      detail: {
        box: Box
      }
    }) => void
    boxSnippet?: Snippet<[{
      box: Box
    }]>
	}

	let { boxes,
    gap = '15px',
    onboxClick,
    boxSnippet,
  }: Props = $props();

	function handleBoxClick(event: MouseEvent, box: Box) {
		if(onboxClick) {
      onboxClick({
        detail: {
          box
        }
      })
    }
	}
</script>

<ul style:gap class="box-list" role="listbox">
	{#each boxes as box}
    {#if boxSnippet}{@render boxSnippet({ box })}{:else}
      {#if box.href}
        <a
          class="box"
          style:width={box.style?.width}
          style:max-width={box.style?.maxWidth}
          style:min-width={box.style?.minWidth}
          href={box.href}
          onclick={(event) => handleBoxClick(event, box)}
        >
          <div style:flex-grow="1">
            {box.label}
          </div>
          <div style:margin-left="10px">
            <Icon name="mdi-arrow-right" />
          </div>
        </a>
      {:else}
        <button
          class="box"
          style:width={box.style?.width}
          style:max-width={box.style?.maxWidth}
          style:min-width={box.style?.minWidth}
          onclick={(event) => handleBoxClick(event, box)}
        >
          <div style:flex-grow="1">
            {box.label}
          </div>
          <div style:margin-left="10px">
            <Icon name="mdi-arrow-right" />
          </div>
        </button>
      {/if}
    {/if}
	{/each}
</ul>

<style>
	.box-list {
		display: flex;
		flex-wrap: wrap;
	}

	.box {
		background-color: rgb(var(--global-color-background-300));
		padding: 10px;
		font-weight: 600;
		font-size: 1.2rem;
		border-radius: 5px;
    border: none;
		display: flex;
		cursor: pointer;
    text-align: start;
	}

  .box:hover {
		background-color: rgb(var(--global-color-background-500));
  }

	.box:focus {
		background-color: rgb(var(--global-color-primary-500));
		color: rgb(var(--global-color-contrast-50));
	}
</style>
