<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import HorizontalStackedProgress from "$lib/components/composed/progress/HorizontalStackedProgress.svelte";
</script>

<h1>HorizontalStackedProgress</h1>
<ComponentSubtitle>Stacked progress.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <HorizontalStackedProgress
    progresses={[
      {
        label: 'Etichetta uno',
        value: 1000,
        color: 'grey',
      },
      {
        label: 'Etichetta due',
        value: 2000,
        color: 'rgb(var(--global-color-error-500))'
      },
      {
        label: 'Etichetta tre',
        value: 1200,
        color: 'rgb(var(--global-color-primary-500))'
      }
    ]}
    --horizontal-stacked-progress-width="300px"
    labelTextVisible={false}
  ></HorizontalStackedProgress>
  <HorizontalStackedProgress
    progresses={[
      {
        label: 'Etichetta uno',
        value: 100000,
        color: 'grey'
      },
      {
        label: 'Etichetta due',
        value: 2000,
        color: 'rgb(var(--global-color-error-500))',
      },
      {
        label: 'Etichetta tre',
        value: 12000,
        color: 'rgb(var(--global-color-primary-500))',
        valueLabel: 'pluto'
      }
    ]}
    --horizontal-stacked-progress-width="100%"
    hideLabelUnderPercentage={10}
  ></HorizontalStackedProgress>
  <HorizontalStackedProgress
    progresses={[
      {
        label: 'Etichetta uno',
        value: 1000,
        color: 'grey',
        valueLabel: 'pippo'
      },
      {
        label: 'Etichetta due',
        value: 2000,
        color: 'rgb(var(--global-color-error-500))'
      },
      {
        label: 'Etichetta tre',
        value: 1200,
        color: 'rgb(var(--global-color-primary-500))'
      }
    ]}
    --horizontal-stacked-progress-width="100%"
    labelVisible={false}
    legendVisible
  ></HorizontalStackedProgress>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    // {
    //   name: 'type',
    //   type: '"button" | "submit"',
    //   description: "HTML type attribute",
    //   default: "button"
    // }
  ]}
  styleProps={[
    // {
    //   name: '--button-max-width',
    //   type: 'string',
    //   default: 'undefined',
    //   description: 'The max width of the outer element'
    // }
  ]}
></PropsViewer>
<h2>Slots</h2>
<h2>Events</h2>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 24px;
    margin-bottom: 20px;
  }
</style>