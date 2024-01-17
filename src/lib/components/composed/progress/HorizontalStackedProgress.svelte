<script lang="ts" context="module">
  export type ProgressItem = {
    label?: string,
    color?: string,
    value: number
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

  export let progresses: (
      number | 
      ProgressItem
    )[] = [],
    labelVisible: boolean = true

  let colors = [
    'rgb(var(--global-color-primary-500))',
    'rgb(var(--global-color-primary-300))',
    'rgb(var(--global-color-primary-700))',
    'rgb(var(--global-color-primary-500), .5)',
    'rgb(var(--global-color-primary-600), .5)',
    'rgb(var(--global-color-primary-700), .5)'
  ]

  $: total = progresses.reduce<number>((p, c, i, a) => {
    if(isProgressItem(c)) {
      return p + c.value
    } else {
      return p + c
    }
  }, 0)

  $: progressesItems = progresses.map((p, i) => {
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
  }).filter(p => p.value !== 0)
</script>

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
      ></ProgressBar>
      {#if progress.label && labelVisible}
        <div class="label">
          <div class="label-text">{progress.label}</div>
          <div class="label-value">
            <div 
              class="dot" 
              style:background-color={progress.color || 'rgb(var(--global-color-background-300))'}
            ></div>
            <div class="value-text">
              {progress.value}
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .stacked-container {
    overflow: hidden;
    display: flex;
    gap: var(
      --horizontal-stacked-progress-gap,
      var(--horizontal-stacked-progress-default-gap)
    );
    width: var(
      --horizontal-stacked-progress-width,
      var(--horizontal-stacked-progress-default-width)
    );
  }

  .single-progress-container {
    transition: width 300ms cubic-bezier(0.215, 0.610, 0.355, 1);
    display: flex;
    flex-direction: column;
  }

  .label-text {
    font-size: .8rem;
    font-weight: 300;
  }

  .label {
    margin-top: 12px;
  }

  .label-value {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .value-text {
    font-size: 1.1rem;
    font-weight: 700;
  }

  .dot {
    height: 10px;
    width: 10px;
    border-radius: 9999px;
  }
</style>