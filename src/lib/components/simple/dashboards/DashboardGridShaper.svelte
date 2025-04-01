<script lang="ts">
  import Grid from "svelte-grid";
  import gridHelp from "svelte-grid/build/helper/index.mjs";

  const id = () => "_" + Math.random().toString(36).slice(2, 11);

  let items = [
    {
      6: gridHelp.item({
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      }),
      id: id(),
    },

    {
      6: gridHelp.item({
        x: 2,
        y: 0,
        w: 2,
        h: 2,
      }),
      id: id(),
    },
  ]

  const breakpoint = 1
  const column = 6

  const cols = [[breakpoint, column]]
</script>

<div class=demo-container style:width="100%">
  <Grid bind:items={items} rowHeight={100} let:item let:dataItem {cols}>
    <div class="widget">
      <div class="content">
        {dataItem.id}
      </div>
    </div>
  </Grid>
</div>

<style>
  .widget {
    background-color: rgb(var(--global-color-background-200));
    width: 100%;
    height: 100%;
    border-radius: 8px;
    padding: 2px;
  }

  .content {
    padding: 8px;
  }

  :global(.svlt-grid-active) {
    opacity: 1!important;
  }

  :global(.svlt-grid-shadow) {
    /* Back shadow */
    background-color: rgb(var(--global-color-primary-900), .5) !important;
    border-radius: 10px;
  }

  :global(.svlt-grid-resizer::after) {
    /* Resizer color */
    border-color: white !important;
  }
</style>