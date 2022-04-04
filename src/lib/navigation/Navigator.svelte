<script context="module" lang="ts">
  export type Item = {
    title: string,
    name: string,
    url?: string,
  }
</script>

<script lang="ts">
  export let items: Item[] = []
</script>

<div 
  style:display="flex"
>
  {#each items as item}
    <div 
      style:margin-right="20px"
      class="link bar-link"
    >
      {item.title}
    </div>
  {/each}
</div>

<style>
  .link {
    cursor: pointer;
    font-size: 18px;
    position: relative;
    white-space: nowrap;
    color: var(--color-text);
  }

  .link::before,
  .link::after {
    position: absolute;
    width: 100%;
    height: 1px;
    background: currentColor;
    top: 100%;
    left: 0;
    pointer-events: none;
  }

  .link::before {
    content: '';
  }

  .bar-link::before {
    transform-origin: 100% 50%;
    transform: scale3d(0, 1, 1);
    transition: transform 0.3s;
  }

  .bar-link:hover::before {
    transform-origin: 0% 50%;
    transform: scale3d(1, 1, 1);
  }
</style>
