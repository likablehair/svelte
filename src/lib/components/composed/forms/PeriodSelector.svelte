<script module lang="ts">
  type RollingMeasurementUnit = 'days' | 'weeks' | 'months' | 'years';
  type RollingDirection = 'last' | 'next';

  type PickerSelectValues = {
    from?: Date,
    to?: Date
  }

  type RollingSelectValues = {
    numberOfUnits?: number,
    measurementUnit?: RollingMeasurementUnit
    direction?: RollingDirection
  }

  type TimespanMap<T extends string> = {
    quick: T | undefined
    rolling: RollingSelectValues
    picker: PickerSelectValues
  }

  export type TimespanSettings<T extends string = string> = {
    [K in keyof TimespanMap<T>]: {
      method?: K
      values?: TimespanMap<T>[K]
    }
  }[keyof TimespanMap<T>]

  export const defaultQuickOptions = {
    'it': [
      { value: 'today', label: 'Oggi' },
      { value: 'this-week', label: 'Questa settimana' },
      { value: 'this-month', label: 'Questo mese' },
      { value: 'last-3month', label: 'Ultimi 3 mesi' },
      { value: 'last-6month', label: 'Ultimi 6 mesi' },
      { value: 'this-year', label: "Quest'anno" },
      { value: 'total', label: 'Sempre' },
    ],
    'en': [
      { value: 'today', label: 'Today' },
      { value: 'this-week', label: 'This week' },
      { value: 'this-month', label: 'This month' },
      { value: 'last-3month', label: 'Last 3 months' },
      { value: 'last-6month', label: 'Last 6 months' },
      { value: 'this-year', label: 'This year' },
      { value: 'total', label: 'All time' },
    ],
  }

  export function getPeriodLabel<T extends string>(
    settings: TimespanSettings<T> | undefined,
    lang: 'en' | 'it' = 'en',
    quickOptions: { value: string | T; label: string }[] = defaultQuickOptions[lang]
  ): string {
    if (!settings?.method) return lang == 'en' ? 'Select range mode' : 'Seleziona una modalità';

    if (settings.method === 'picker') {
      let fromStr = settings.values?.from ? new Date(settings.values.from).toLocaleDateString(lang) : '';
      let toStr = settings.values?.to ? new Date(settings.values.to).toLocaleDateString(lang) : '';

      if (fromStr && toStr) return `${lang == 'en' ? 'From' : 'Dal'} ${fromStr} ${lang == 'en' ? 'to' : 'al'} ${toStr}`;
      if (fromStr) return `${lang == 'en' ? 'From' : 'Dal'} ${fromStr}`;
      if (toStr) return `${lang == 'en' ? 'Until' : 'Fino al'} ${toStr}`;
      return lang == 'en' ? 'Select dates' : 'Seleziona date';
    }

    if (settings.method === 'quick') {
      return quickOptions.find(o => o.value === settings.values)?.label || (lang == 'en' ? 'Select a period' : 'Seleziona un periodo');
    }

    if (settings.method === 'rolling') {
      const num = settings.values?.numberOfUnits;
      const unit = settings.values?.measurementUnit;
      const dir = settings.values?.direction ?? 'last';

      if (!unit || !num) return lang == 'en' ? 'Configure rolling window' : 'Configura periodo';

      let unitLabel = '';
      if (unit === 'days') unitLabel = lang == 'en' ? 'Days' : 'Giorni';
      if (unit === 'weeks') unitLabel = lang == 'en' ? 'Weeks' : 'Settimane';
      if (unit === 'months') unitLabel = lang == 'en' ? 'Months' : 'Mesi';
      if (unit === 'years') unitLabel = lang == 'en' ? 'Years' : 'Anni';

      const dirLabel = dir === 'next' 
        ? (lang == 'en' ? 'Next' : unit == 'weeks' ? 'Prossime' : 'Prossimi')
        : (lang == 'en' ? 'Last' : unit == 'weeks' ? 'Ultime' : 'Ultimi');

      return `${dirLabel} ${num} ${unitLabel}`;
    }

    return lang == 'en' ? 'Select range mode' : 'Seleziona una modalità';
  }
</script>

<script lang="ts" generics="T extends string = string">
  import Dropdown from "./Dropdown.svelte"
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte"
  import type { DateStat } from "$lib/components/simple/dates/utils";
  import SelectableVerticalList from "$lib/components/simple/lists/SelectableVerticalList.svelte";
  import DatePicker from "$lib/components/simple/dates/DatePicker.svelte";
  import { fly } from "svelte/transition";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import Chip from "$lib/components/simple/navigation/Chip.svelte";
  import { tick } from "svelte";

  interface Props {
    timespanSettings?: TimespanSettings<T>
    quickSelectOptions?: {
      value: T
      label: string
    }[]
    valid?: boolean
    mode?: 'default' | 'datepicker'
    lang?: 'it' | 'en'
    locale?: 'it' | 'en'
    showTimeRangeLabel?: boolean
    isSelectionMode?: boolean
    onchange?: (event: {
      timespanSettings?: TimespanSettings<T>
    }) => void
    quickRangeConvertor?: typeof getDatesFromQuick
    setTimespanLabel?: (params: {
      timespanSettings: typeof timespanSettings
    }) => string
  }

  let { 
    timespanSettings = $bindable(),
    lang = 'en',
    quickSelectOptions = defaultQuickOptions[lang] as { value: T; label: string }[],
    valid = $bindable(),
    mode = 'default',
    locale = lang,
    showTimeRangeLabel = false,
    isSelectionMode = $bindable(),
    onchange,
    quickRangeConvertor,
    setTimespanLabel,
  }: Props = $props()

  if (!timespanSettings) {
    timespanSettings = {}
  }

  if (isSelectionMode == undefined) {
    isSelectionMode = true
  }

  $effect(() => {
    if(localValid != valid) valid = localValid
  })

  let timeRangeLabel = $derived(setTimespanLabel ? setTimespanLabel({ timespanSettings }) : getPeriodLabel(timespanSettings, lang, quickSelectOptions));

  let rollingAutocompleteValues: {
      value: RollingMeasurementUnit,
      label: string
    }[] = [
        { value: 'days', label: lang == 'en' ? 'Days' : 'Giorni' },
        { value: 'weeks', label: lang == 'en' ? 'Weeks' : 'Settimane' },
        { value: 'months', label: lang == 'en' ? 'Months' : 'Mesi' },
        { value: 'years', label: lang == 'en' ? 'Years' : 'Anni' },
    ],
    rollingNumberOfUnits = $state(timespanSettings?.method === 'rolling'
      ? timespanSettings.values?.numberOfUnits
      : 0
    ),
    rollingMeasurementOfUnit = $state(timespanSettings?.method === 'rolling' && timespanSettings.values?.measurementUnit
      //@ts-ignore
      ? rollingAutocompleteValues.find(v => v.value == timespanSettings!.values.measurementUnit) 
      : undefined
    ),
    rollingDirectionOptions: {
      value: RollingDirection,
      label: string
    }[] = $derived([
      { value: 'last', label: lang == 'en' ? 'Last' : rollingMeasurementOfUnit?.value == 'weeks' ? 'Ultime' : 'Ultimi' },
      { value: 'next', label: lang == 'en' ? 'Next' : rollingMeasurementOfUnit?.value == 'weeks' ? 'Prossime' : 'Prossimi' },
    ]),
    rollingDirection = $state<RollingDirection>(
      timespanSettings?.method === 'rolling' 
        ? timespanSettings.values?.direction ?? 'last' 
        : 'last'
    ),
    pickerFromValue = $derived(timespanSettings?.method === 'picker' && timespanSettings.values?.from
      ? new Date(timespanSettings.values.from)
      : undefined
    ),
    pickerToValue = $derived(timespanSettings?.method === 'picker' && timespanSettings.values?.to
      ? new Date(timespanSettings.values.to)
      : undefined
    ),
    quickSelectCustomOption = {
      title: lang == 'en' ? 'Custom Range' : 'Intervallo personalizzato',
      name: 'picker',
    },
    quickSelectRollingOption = {
      title: lang == 'en' ? 'Rolling Window' : 'Periodo dinamico',
      name: 'rolling',
    },
    selectedOption: string | undefined = $state(timespanSettings?.method),
    quickSelectValue = $derived(
      mode == 'datepicker'
        ? selectedOption == 'picker'
          ? [quickSelectCustomOption]
          : selectedOption == 'rolling'
            ? [quickSelectRollingOption]
            : [{
              name: quickSelectOptions.find(o => o.value == selectedOption)?.value,
              title: quickSelectOptions.find(o => o.value == selectedOption)?.label,
            }]
        : timespanSettings?.method === 'quick' && timespanSettings.values
          ? [{
              name: timespanSettings.values,
              title: quickSelectOptions.find((item) => item.value === timespanSettings!.values)?.label,      
            }]
          : timespanSettings?.method == 'picker'
            ? [quickSelectCustomOption]
            : timespanSettings?.method == 'rolling'
              ? [quickSelectRollingOption]
              : []
    ),
    localValid = $derived.by(() => {
      if (timespanSettings?.method == 'picker') {
        return !!timespanSettings.values?.from || !!timespanSettings.values?.to
      } else if (timespanSettings?.method == 'quick') {
        return !!timespanSettings.values
      } else if (timespanSettings?.method == 'rolling') {
        return !!rollingNumberOfUnits && !!rollingMeasurementOfUnit
      }
      return false
    }),
    activeSlot: 'from' | 'to' = $state('from')

  function getDatesFromRolling(
    num: number, 
    unit: RollingMeasurementUnit, 
    direction: RollingDirection = 'last'
  ): { from: Date, to: Date } {
    const from = new Date();
    const to = new Date();
    
    if (direction === 'last') {
      to.setHours(23, 59, 59, 999);
      if (unit === 'days') from.setDate(from.getDate() - num);
      if (unit === 'weeks') from.setDate(from.getDate() - (num * 7));
      if (unit === 'months') from.setMonth(from.getMonth() - num);
      if (unit === 'years') from.setFullYear(from.getFullYear() - num);
      from.setHours(0, 0, 0, 0);
    } else {
      from.setHours(0, 0, 0, 0);
      if (unit === 'days') to.setDate(to.getDate() + num);
      if (unit === 'weeks') to.setDate(to.getDate() + (num * 7));
      if (unit === 'months') to.setMonth(to.getMonth() + num);
      if (unit === 'years') to.setFullYear(to.getFullYear() + num);
      to.setHours(23, 59, 59, 999);
    }

    return { from, to };
  }

  function getDatesFromQuick(value: string): { from?: Date, to: Date } | undefined {
    if (!!quickRangeConvertor) {
      return quickRangeConvertor(value)
    }

    let now = new Date();
    let from: Date | undefined = new Date(now);
    let to = new Date(now);
    
    to.setHours(23, 59, 59, 999);
    from.setHours(0, 0, 0, 0);

    if (value === 'today') {
    } else if (value === 'this-week') {
      const day = now.getDay() || 7;
      if (day !== 1) from.setHours(-24 * (day - 1));
    } else if (value === 'this-month') {
      from.setDate(1);
    } else if (value === 'last-3month') {
      from.setMonth(from.getMonth() - 3);
    } else if (value === 'last-6month') {
      from.setMonth(from.getMonth() - 6);
    } else if (value === 'this-year') {
      from.setMonth(0, 1);
    } else if (value === 'total') {
      from = undefined
    } else {
      return
    }
    return { from, to };
  }

  function formatDateLabel(from?: Date, to?: Date): string {
    let fromStr = from ? from.toLocaleDateString(locale) : ''
    let toStr = to ? to.toLocaleDateString(locale) : ''

    if (fromStr && toStr) return `${lang == 'en' ? 'From' : 'Dal'} ${fromStr} ${lang == 'en' ? 'to' : 'al'} ${toStr}`
    if (fromStr) return `${lang == 'en' ? 'From' : 'Dal'} ${fromStr}`
    if (toStr) return `${lang == 'en' ? 'Until' : 'Fino al'} ${toStr}`
    return lang == 'en' ? 'Select dates' : 'Seleziona date'
  }
      
  async function handleRollingInput(value?: string, direction?: string) {
    rollingNumberOfUnits = Math.max(Number(rollingNumberOfUnits), 0)
    if (value) {
      rollingMeasurementOfUnit = rollingAutocompleteValues.find(v => v.value == value)
    }
    if (direction == 'next' || direction == 'last') {
      rollingDirection = direction;
    }

    if(mode == 'datepicker' && rollingMeasurementOfUnit && rollingNumberOfUnits) {
      const { from, to } = getDatesFromRolling(rollingNumberOfUnits, rollingMeasurementOfUnit.value, rollingDirection);

      timespanSettings = {
        method: 'picker',
        values: {
          from,
          to,
        }
      }
    }
    else if (timespanSettings?.method == 'rolling') {
      timespanSettings = {
        method: 'rolling',
        values: {
          numberOfUnits: rollingNumberOfUnits,
          measurementUnit: rollingMeasurementOfUnit?.value,
          direction: rollingDirection
        }
      }
    }

    await tick()
    
    onchange?.({
      timespanSettings
    })
  }

  async function handleQuickChange(value?: string | number) {
    if(timespanSettings) {
      if(value == 'picker') {
        if(selectedOption != 'picker'){
          activeSlot = 'from'

          timespanSettings = {
            method: 'picker',
          }
        }

        isSelectionMode = false
      } 
      else if (value == 'rolling') {
        if(selectedOption != 'rolling'){
          rollingNumberOfUnits = 0
          rollingMeasurementOfUnit = undefined

          timespanSettings = {
            method: 'rolling'
          }
        }

        isSelectionMode = false
      } 
      else {
        let foundValue = quickSelectOptions.find(o => o.value == value)?.value
        
        if (mode === 'datepicker' && foundValue) {
          const dates = getDatesFromQuick(foundValue);
          if (dates) {
             timespanSettings = {
              method: 'picker',
              values: dates
            }
          }
        }
        else {
          timespanSettings = {
            method: 'quick',        
            values: foundValue
          }
        }

      }

      await tick()

      selectedOption = value?.toString()
      onchange?.({
        timespanSettings
      })
    }
  }

  async function handleSlotToggle(slot: 'from' | 'to') {
    activeSlot = slot;

    if (timespanSettings?.method === 'picker' && timespanSettings.values) {
      const { from, to } = timespanSettings.values;
      const hasFrom = !!from;
      const hasTo = !!to;

      if (hasFrom && !hasTo && slot === 'to') {
        timespanSettings.values = { from: undefined, to: from };
      }
      else if (!hasFrom && hasTo && slot === 'from') {
        timespanSettings.values = { from: to, to: undefined };
      }
    }

    await tick()

    onchange?.({
      timespanSettings
    });
  }

  async function handleDatePickerDayClick(dateStat: DateStat) {
    const clickedDate = new Date(dateStat.year, dateStat.month, dateStat.dayOfMonth);
          
    if (timespanSettings) {
      if(timespanSettings.method != 'picker') {
        timespanSettings = {
          method: 'picker'
        }
      }

      let nextFrom = timespanSettings.values?.from ? new Date(timespanSettings.values.from) : undefined;
      let nextTo = timespanSettings.values?.to ? new Date(timespanSettings.values.to) : undefined;

      if (activeSlot == 'from') {
        if (!nextFrom) {
          nextFrom = clickedDate;
        } else if (!nextTo) {
          nextTo = clickedDate;
  
          if (nextFrom > nextTo) {
            const temp = nextFrom;
            nextFrom = nextTo;
            nextTo = temp;
          }
        } else {
          nextFrom = clickedDate
          nextTo = undefined
        }
      }
      else {
        if (!nextTo) {
          nextTo = clickedDate;
        } else if (!nextFrom) {
          nextFrom = clickedDate;
  
          if (nextFrom > nextTo) {
            const temp = nextFrom;
            nextFrom = nextTo;
            nextTo = temp;
          }
        } else {
          nextTo = clickedDate
          nextFrom = undefined
        }
      }

      timespanSettings = {
        method: 'picker',
        values: {
          from: nextFrom,
          to: nextTo
        }
      };

      await tick()

      onchange?.({
        timespanSettings
      });
    }
  }

  function handleBack() {
    isSelectionMode = true
  }
</script>

<div class="period-selector-container">
  {#if isSelectionMode}
    <div 
      class="view-panel"
      in:fly={{ x: -200, duration: 250, delay: 200 }} 
      out:fly={{ x: -200, duration: 250, }}
    >
      {#if showTimeRangeLabel}
        <div class="time-range-label">
          {timeRangeLabel}
        </div>
      {/if}
      <SelectableVerticalList
        elements={
          [
            ...quickSelectOptions.map(o => ({
              title: o.label,
              name: o.value
            })),
            quickSelectCustomOption,
            quickSelectRollingOption
          ]
        }
        selected={
          quickSelectValue.length
            ? quickSelectValue[0].name
            : undefined
        }
        onselect={e => handleQuickChange(e.detail.element.name)}
        --selectable-vertical-list-element-padding="var(--period-selector-list-element-padding, 4px)"
        --selectable-vertical-list-element-border-radius="var(--period-selector-list-element-border-radius, 4px)"
        --selectable-vertical-list-title-font-size="var(--period-selector-list-element-font-size, 0.95rem)"
      ></SelectableVerticalList>
    </div>
  {:else}
    <div 
      class="view-panel detail-layout"
      in:fly={{ x: 200, duration: 250, delay: 200 }} 
      out:fly={{ x: 200, duration: 250 }}
    >
      <div class="detail-header">
        <div class="detail-subheader">
          <button class="back-button" onclick={handleBack} type="button">
            <Icon name='mdi-chevron-left'></Icon> {lang == 'en' ? 'Back' : 'Indietro'}
          </button>
          <span class="detail-title">
            {
              timespanSettings?.method === 'rolling'
                ? lang == 'en' ? 'Rolling Window' : 'Periodo dinamico'
                : lang == 'en' ? 'Custom Range' : 'Intervallo personalizzato'
            }
          </span>
        </div>
        
        {#if timespanSettings?.method === 'picker' && (!timespanSettings.values?.from || !timespanSettings.values?.to) && timespanSettings.values}
          <Chip
            inactive
            onclick={() => handleSlotToggle(activeSlot == 'from' ? 'to' : 'from')}
            --chip-min-height=none
          >
            {
              activeSlot == 'from' 
                ? lang == 'en' ? 'From' : 'Dal'
                : lang == 'en' ? 'Until' : 'Fino al'
            }
            <Icon name="mdi-swap-horizontal"/>
          </Chip>
        {/if}
      </div>

      <div class="detail-content">
        {#if selectedOption == 'rolling' || timespanSettings?.method == 'rolling'}
          <div class="rolling-container">
            <div class="rolling-controls">
              
              <div class="dropdown-wrapper">
                <Dropdown
                  items={rollingDirectionOptions}
                  values={[rollingDirectionOptions.find(o => o.value == rollingDirection)!]}
                  mandatory
                  {lang}
                  multiple={false}
                  onchange={(e) => handleRollingInput(undefined, e.detail.select?.value.toString())}
                  mobileDrawer
                  clearable={false}
                  menuWidth='fit-content'
                  openingId='rolling-direction'
                ></Dropdown>
              </div>

              <div>
                <SimpleTextField
                  type='number'
                  bind:value={rollingNumberOfUnits}
                  oninput={() => handleRollingInput()}
                  --simple-textfield-width="100%"
                  --simple-textfield-margin-bottom="0px"
                ></SimpleTextField>
              </div>

              <div class="dropdown-wrapper">
                <Dropdown
                  items={rollingAutocompleteValues}
                  values={rollingMeasurementOfUnit ? [rollingMeasurementOfUnit] : undefined}
                  mandatory
                  {lang}
                  multiple={false}
                  onchange={(e) => handleRollingInput(e.detail.select?.value.toString())}
                  mobileDrawer
                  clearable={false}
                  menuWidth='fit-content'
                  openingId='rolling-unit'
                ></Dropdown>
              </div>
            </div>
            
            {#if showTimeRangeLabel}
              <div class="rolling-summary">
                {timeRangeLabel}
              </div>
            {/if}
          </div>
        {:else if timespanSettings?.method == 'picker'}
          <DatePicker
            type='dateRange'
            selectedDate={pickerFromValue}
            selectedDateTo={pickerToValue}
            ondayClick={e => handleDatePickerDayClick(e.detail.dateStat)}
            {locale}
            --date-picker-height="300px"
            fillOpenRange
          >
            {#snippet headerLabelSnippet({ dateString, dateToString, })}
              {#if !!dateString && !dateToString}
                {lang == 'en' ? 'From' : 'Dal'} {dateString}
              {:else if !dateString && !!dateToString}
                {lang == 'en' ? 'Until' : 'Fino al'} {dateToString}
              {:else if !!dateToString && !!dateToString}
                {lang == 'en' ? 'From' : 'Dal'} {dateString} {lang == 'en' ? 'to' : 'al'} {dateToString}
              {/if}
            {/snippet}
          </DatePicker>
        {/if}
      </div>
    </div>
  {/if}

</div>

<style>
  .period-selector-container {
    display: grid;
    grid-template-areas: "stack"; 
    width: var(
      --period-selector-width,
      100%
    );
    max-width: var(
      --period-selector-max-width,
      400px
    );
    min-height: var(
      --period-selector-min-height,
      360px
    );
    overflow: hidden;
    position: relative;
  }

  .view-panel {
    grid-area: stack;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .detail-layout {
    display: flex;
    flex-direction: column;
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  
  .detail-subheader {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .back-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.9rem;
    display: flex;
    color: rgb(var(--global-color-conrast-800));
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
  }


  .detail-title {
    font-weight: 600;
    font-size: 1rem;
    color: rgb(var(--global-color-conrast-900));
  }

  .detail-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .rolling-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .rolling-controls {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }

  .dropdown-wrapper {
    width: 31%;
    --button-width: 100%;
  }

  .rolling-summary {
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    color: rgb(var(--global-color-conrast-700));
  }

  .time-range-label {
    display: flex;
    align-items: center;
    font-size: 1rem;
    font-weight: 700;
    color: rgb(var(--global-color-conrast-800));
    margin-bottom: 12px;
    padding-left: 4px;
  }

  @media (max-width: 450px) {
    .period-selector-container {
      max-width: 100%;
    }
  }
</style>