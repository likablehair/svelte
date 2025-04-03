<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import SimpleTimeLine from "$lib/components/simple/timeline/SimpleTimeLine.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";
</script>

<h1>SimpleTimeLine</h1>
<ComponentSubtitle>Always simple timeline</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <SimpleTimeLine
    items={[
      { name: 'firstEvent', title: 'firstEvent', description: 'firstEvent', from: new Date(), to: new Date() },
      { name: 'secondEvent', title: 'secondEvent', description: 'secondEvent' },
      { name: 'thirdEvent', title: 'thirdEvent', description: 'thirdEvent' },
      { name: 'forthEvent', title: 'forthEvent', description: 'forthEvent' },
      { name: 'fifthEvent', title: 'fifthEvent', description: 'fifthEvent' }
    ]}
  ></SimpleTimeLine>
</div>
<div class="example">
  <SimpleTimeLine
    items={[
      { name: 'firstEvent', title: 'firstEvent', description: 'firstEvent' },
      { name: 'secondEvent', title: 'secondEvent', description: 'secondEvent' },
      { name: 'thirdEvent', title: 'thirdEvent', description: 'thirdEvent' },
      { name: 'forthEvent', title: 'forthEvent', description: 'forthEvent' },
      { name: 'fifthEvent', title: 'fifthEvent', description: 'fifthEvent' }
    ]}
    singleSided
  ></SimpleTimeLine>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: 'items', type: 'TimeLineItem[]', description: 'Array of items to be displayed in the timeline', default: '[]' },
    { name: 'singleSided', type: 'boolean', description: 'Toggle for single-sided timeline', default: 'false' },
    { name: 'circleAlignment', type: '"top" | "center" | "bottom"', description: 'Alignment of the circle (top, center, bottom)', default: '"top"' }
  ]}
  styleProps={[
    { name: '--simple-time-line-gap', type: 'size', description: 'Gap between timeline items', default: '16px' },
    { name: '--simple-time-line-line-background', type: 'color', description: 'Background color of the central line', default: 'rgb(var(--global-color-background-200))' },
    { name: '--simple-time-line-circle-width', type: 'size', description: 'Width of the circle', default: '12px' },
    { name: '--simple-time-line-circle-height', type: 'size', description: 'Height of the circle', default: '12px' },
    { name: '--simple-time-line-line-width', type: 'size', description: 'Width of the central line', default: '2px' },
    { name: '--simple-time-line-circle-background-color', type: 'color', description: 'Background color of the circle', default: 'rgb(var(--global-color-primary-500))' },
    { name: '--simple-time-line-height', type: 'size', description: 'Height of the timeline container', default: 'auto' },
    { name: '--simple-time-line-width', type: 'size', description: 'Width of the timeline container', default: '100%' },
    { name: '--simple-time-line-body-width', type: 'size', description: 'Width of the timeline body', default: 'auto' },
    { name: '--simple-time-line-divider-width', type: 'size', description: 'Width of the divider line', default: '48px' },
    { name: '--simple-time-line-central-line-left', type: 'size', description: 'Left position of the central line', default: 'calc(50% - 0.5px)' },
    { name: '--simple-time-line-line-width', type: 'size', description: 'Width of the central timeline line', default: '2px' }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: 'itemSnippet', description: 'Snippet for custom rendering of each timeline item', default: `
<div
  style:padding={singleSided || index % 2 == 0
    ? "0px 20px 0px 0px"
    : "0px 0px 0px 20px"}
  class="time-line-times"
>
  {#if timesSnippet}
    {@render timesSnippet({ item, dateToString })}
  {:else}
    <div
      class:vertical-centered-container={circleAlignment ==
        "center"}
      class:vertical-bottom-container={circleAlignment == "bottom"}
    >
      {#if !!item.from}
        <div
          style:text-align={singleSided || index % 2 == 0
            ? "left"
            : "right"}
          style="font-weight: 200; font-size: 9pt"
        >
          {dateToString(item.from)}
        </div>
      {/if}
      {#if !!item.to}
        <div
          style:text-align={singleSided || index % 2 == 0
            ? "left"
            : "right"}
          style="font-weight: 200; font-size: 9pt"
        >
          {dateToString(item.to)}
        </div>
      {/if}
    </div>
  {/if}
</div>
{/if}
<div
class="time-line-infos"
style:text-align={singleSided || index % 2 == 0 ? "left" : "right"}
>
{#if infosSnippet}
  {@render infosSnippet({ item, alignment: !singleSided && index % 2 == 0 ? "right" : "left"})}
{:else}
  {#if !!item.title}
    <div class="time-line-title">
      {item.title}
    </div>
  {/if}
  {#if !!item.description}
    <div class="time-line-description">
      {item.description}
    </div>
  {/if}
  {@render infosAppendSnippet?.({ item, alignment: !singleSided && index % 2 == 0 ? "right" : "left"})}
{/if}
</div>
    ` },
    { name: 'timesSnippet', description: 'Snippet for custom rendering of time-related info', default: `
<div
  class:vertical-centered-container={circleAlignment ==
    "center"}
  class:vertical-bottom-container={circleAlignment == "bottom"}
>
  {#if !!item.from}
    <div
      style:text-align={singleSided || index % 2 == 0
        ? "left"
        : "right"}
      style="font-weight: 200; font-size: 9pt"
    >
      {dateToString(item.from)}
    </div>
  {/if}
  {#if !!item.to}
    <div
      style:text-align={singleSided || index % 2 == 0
        ? "left"
        : "right"}
      style="font-weight: 200; font-size: 9pt"
    >
      {dateToString(item.to)}
    </div>
  {/if}
</div>
    ` },
    { name: 'infosSnippet', description: 'Snippet for custom rendering of timeline item information', default: `
{#if !!item.title}
  <div class="time-line-title">
    {item.title}
  </div>
{/if}
{#if !!item.description}
  <div class="time-line-description">
    {item.description}
  </div>
{/if}
{@render infosAppendSnippet?.({ item, alignment: !singleSided && index % 2 == 0 ? "right" : "left"})}
    ` },
    { name: 'infosAppendSnippet', description: 'Snippet for additional content appended to timeline item information', },
    { name: 'circleSnippet', description: 'Snippet for custom rendering of the circle in the timeline', default: '<div class="circle"></div>' }
  ]}
></SlotsViewer>
<h2>Events</h2>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }
</style>