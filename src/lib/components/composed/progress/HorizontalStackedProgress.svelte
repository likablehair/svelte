<script lang="ts" module>
  export type ProgressItem = {
    label?: string,
    color?: string,
    value: number,
    valueLabel?: string | number
  };

  export function isProgressItem(obj: any): obj is ProgressItem {
    return (
      (obj.label === undefined || typeof obj.label === 'string') &&
      (obj.color === undefined || typeof obj.color === 'string') &&
      typeof obj.value === 'number'
    );
  }
</script>

<script lang="ts">
  import './HorizontalStackedProgress.css'
  import ProgressBar from "$lib/components/simple/progress/ProgressBar.svelte";

  interface Props {
    progresses?: (number | ProgressItem)[];
    labelVisible?: boolean;
    labelValueVisible?: boolean;
    labelTextVisible?: boolean;
    legendVisible?: boolean;
    legendValueVisible?: boolean;
    legendTextVisible?: boolean;
    hideLabelUnderPercentage?: number;
    tooltipVisible?: boolean
  }

  let {
    progresses = [],
    labelVisible = true,
    labelValueVisible = true,
    labelTextVisible = true,
    legendVisible = false,
    legendValueVisible = true,
    legendTextVisible = true,
    hideLabelUnderPercentage,
    tooltipVisible= true,
  }: Props = $props();

  let colors = [
    'rgb(var(--global-color-primary-500))',
    'rgb(var(--global-color-primary-300))',
    'rgb(var(--global-color-primary-700))',
    'rgb(var(--global-color-primary-500), .5)',
    'rgb(var(--global-color-primary-600), .5)',
    'rgb(var(--global-color-primary-700), .5)'
  ]

  let total = $derived(progresses.reduce<number>((p, c, i, a) => {
    if(isProgressItem(c)) {
      return p + c.value
    } else {
      return p + c
    }
  }, 0))

  let progressesItems = $derived(progresses.map((p, i) => {
    let item: ProgressItem & { percentage: number }
    let value = isProgressItem(p) ? p.value : p
    // x : 100 = value : total
    let percentage = Number(((100 * value) / total).toFixed(2))
    let color = isProgressItem(p) ? p.color : colors[i % colors.length]

    item = {
      ...(isProgressItem(p) ? p : {}),
      color,
      value,
      percentage
    }

    return item
  }).filter(p => p.value !== 0))
</script>

<div class="horizontal-stacked-progress">
  <div
    class="stacked-container"
  >
    {#each progressesItems as progress}
      <div
        style:width={progress.percentage + '%'}
        class="single-progress-container"
      >
        <ProgressBar
          total={progress.value}
          value={progress.value}
          --progress-bar-highlight-color={progress.color}
          valueTooltip={tooltipVisible}
          valueTooltipLabel={progress.valueLabel || progress.value}
        ></ProgressBar>
        {#if progress.label && labelVisible && (hideLabelUnderPercentage === undefined || progress.percentage > hideLabelUnderPercentage)}
          <div class="label">
            {#if labelTextVisible}
              <div class="label-text">
                {progress.label}
              </div>
            {/if}
            {#if labelValueVisible}
              <div class="label-value">
                <div 
                  class="dot" 
                  style:background-color={progress.color || 'rgb(var(--global-color-background-300))'}
                ></div>
                <div class="value-text">
                  {progress.valueLabel || progress.value}
                </div>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
  {#if legendVisible}
    <div class="legend">
      {#each progressesItems as progress}
        <div class="legend-item">
          <div
            class="dot" 
            style:background-color={progress.color || 'rgb(var(--global-color-background-300))'}
          ></div>
          {#if legendValueVisible}
            <div class="value-text">
              {progress.valueLabel || progress.value}
            </div>
          {/if}
          {#if legendTextVisible}
            <div class="label-text">
              {progress.label}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .horizontal-stacked-progress {
    width: var(
      --horizontal-stacked-progress-width,
      var(--horizontal-stacked-progress-default-width)
    );
  }

  .stacked-container {
    overflow: hidden;
    display: flex;
    gap: var(
      --horizontal-stacked-progress-gap,
      var(--horizontal-stacked-progress-default-gap)
    );
    width: 100%;
  }

  .single-progress-container {
    transition: width 300ms cubic-bezier(0.215, 0.610, 0.355, 1);
    display: flex;
    flex-direction: column;
  }

  .label-text {
    font-size: var(
      --horizontal-stacked-progress-label-font-size,
      var(--horizontal-stacked-progress-default-label-font-size)
    );
    font-weight: var(
      --horizontal-stacked-progress-label-font-weight,
      var(--horizontal-stacked-progress-default-label-font-weight)
    );
  }

  .label {
    margin-top: var(
      --horizontal-stacked-progress-label-gap,
      var(--horizontal-stacked-progress-default-label-gap)
    );
  }

  .label-value {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .value-text {
    font-size: var(
      --horizontal-stacked-progress-value-font-size,
      var(--horizontal-stacked-progress-default-value-font-size)
    );
    font-weight: var(
      --horizontal-stacked-progress-value-font-weight,
      var(--horizontal-stacked-progress-default-value-font-weight)
    );
  }

  .dot {
    height: var(
      --horizontal-stacked-progress-dot-height,
      var(--horizontal-stacked-progress-default-dot-height)
    );
    width: var(
      --horizontal-stacked-progress-dot-width,
      var(--horizontal-stacked-progress-default-dot-width)
    );
    min-width: var(
      --horizontal-stacked-progress-dot-min-width,
      var(--horizontal-stacked-progress-default-dot-min-width)
    );
    border-radius: 9999px;
  }

  .legend {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: var(
      --horizontal-stacked-progress-legend-margin-top,
      var(--horizontal-stacked-progress-default-legend-margin-top)
    );
  }

  .legend-item {
    display: flex;
    gap: 8px;
    align-items: center;
  }
</style>