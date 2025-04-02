<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import MediaQuery from "$lib/components/simple/common/MediaQuery.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
    import EventsViewer from "../../EventsViewer.svelte";

</script>

<h1>MediaQuery</h1>
<ComponentSubtitle>Responsive is the key.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <MediaQuery>
    {#snippet defaultSnippet({ l, m, s, xl, xs})}
      <div>
        the screen size is 
        {#if xs}
          xs
        {:else if s}
          s
        {:else if m}
          m
        {:else if l}
          l
        {:else if xl}
          xl
        {/if}
      </div>
    {/snippet}
  </MediaQuery>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
  ]}
  styleProps={[
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    {
      description: 'Default content',
      name: 'DefaultSnippet',
      default: '',
      properties: [
  { description: 'xs breakpoint is active', name: 'xs', type: 'boolean' },
  { description: 's breakpoint is active', name: 's', type: 'boolean' },
  { description: 'm breakpoint is active', name: 'm', type: 'boolean' },
  { description: 'l breakpoint is active', name: 'l', type: 'boolean' },
  { description: 'xl breakpoint is active', name: 'xl', type: 'boolean' },
  { description: 'xs and down breakpoint is active', name: 'xsAndDown', type: 'boolean' },
  { description: 's and down breakpoint is active', name: 'sAndDown', type: 'boolean' },
  { description: 'l and down breakpoint is active', name: 'lAndDown', type: 'boolean' },
  { description: 'm and down breakpoint is active', name: 'mAndDown', type: 'boolean' },
  { description: 'xl and down breakpoint is active', name: 'xlAndDown', type: 'boolean' },
  { description: 'xl and up breakpoint is active', name: 'xlAndUp', type: 'boolean' },
  { description: 'l and up breakpoint is active', name: 'lAndUp', type: 'boolean' },
  { description: 'm and up breakpoint is active', name: 'mAndUp', type: 'boolean' },
  { description: 's and up breakpoint is active', name: 'sAndUp', type: 'boolean' },
  { description: 'xs and up breakpoint is active', name: 'xsAndUp', type: 'boolean' }
]
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer></EventsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }
</style>