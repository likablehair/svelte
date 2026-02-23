<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import PeriodSelector from "$lib/components/composed/forms/PeriodSelector.svelte";
  import type { ComponentProps } from "svelte";

  
  const quickSelectOptions: ComponentProps<typeof PeriodSelector>['quickSelectOptions'] = [
    {
      label: '1',
      value: '1'
    },
    {
      label: '2',
      value: '2'
    },
  ]
  type QuickSelecValues = '1' | '2'
  let timespanSettings: ComponentProps<typeof PeriodSelector<QuickSelecValues>>['timespanSettings'] = $state()

  if(timespanSettings?.method == 'quick') {
    if (timespanSettings.values == '1') {

    }
  }

</script>

<h1>PeriodSelector</h1>
<ComponentSubtitle>What period are you going through?</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <PeriodSelector
    timespanSettings={timespanSettings}
    mode='datepicker'
    showTimeRangeLabel
  ></PeriodSelector>
  <PeriodSelector
    timespanSettings={timespanSettings}
    lang='it'
  ></PeriodSelector>
</div>

<h2>Props</h2>
<PropsViewer
  props={[
    {
      description: 'Contains the selected timespan',
      name: 'timespanSettings',
      type: 'TimespanSettings<T>',
    },
    {
      description: 'Quick range options.',
      name: 'quickSelectOptions',
      type: 'Option[]',
      default: 'defaultQuickOptions',
    },
    {
      description: 'True if the range is fully completed',
      name: 'valid',
      type: 'boolean',
      default: 'false',
    },
    {
      description: 'If datepicker, converts quick and rolling ranges into dates',
      name: 'mode',
      type: "'default' | 'datepicker'",
      default: "'default'",
    },
    {
      description: 'Language for labels',
      name: 'lang',
      type: '"it" | "en"',
      default: '"en"',
    },
    {
      description: 'Locale for dates',
      name: 'locale',
      type: '"it" | "en"',
      default: 'lang',
    },
    {
      description: 'True when the selectable vertical list is displayed',
      name: 'isSelectionMode',
      type: 'boolean',
      default: 'true',
    },
    {
      description: 'Show the time range label',
      name: 'showTimeRangeLabel',
      type: 'boolean',
      default: 'false',
    },
    {
      description: 'Converts the quick range value into dates',
      name: 'quickRangeConvertor',
      type: 'function',
    },
    {
      description: 'Custom label setter',
      name: 'setTimespanLabel',
      type: 'function',
    },
  ]}
  styleProps={[
    {
      name: '--period-selector-list-element-padding',
      description: 'Element padding',
      type: 'padding',
      default: '4px',
    },
    {
      name: '--period-selector-list-element-border-radius',
      description: 'Element border radius',
      type: 'border-radius',
      default: '4px',
    },
    {
      name: '--period-selector-list-element-font-size',
      description: 'Element font size',
      type: 'font-size',
      default: '0.95rem',
    },
    {
      name: '--period-selector-width',
      description: 'Selector width',
      type: 'width',
      default: '100%',
    },
    {
      name: '--period-selector-max-width',
      description: 'Selector max width',
      type: 'max-width',
      default: '400px',
    },
    {
      name: '--period-selector-min-height',
      description: 'Selecton min height',
      type: 'min-heinght',
      default: '360px',
    },
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      description: 'Event triggered when the settings have changed',
      name: 'onchange',
      properties: [
        {
          description: 'Timespan settings',
          name: 'timespanSettings',
          type: "TimespanSettings<T>"
        }
      ]
    }
  ]}
></EventsViewer>

<style>
  .example {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    margin-bottom: 20px;
  }
</style>