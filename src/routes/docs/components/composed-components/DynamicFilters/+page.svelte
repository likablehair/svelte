<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Filters from "$lib/components/composed/search/Filters.svelte";
  import Converter, { type DateMode, type Filter, type NumberMode, type SelectMode, type StringMode } from "$lib/utils/filters/filters";
    import { DynamicFilters, FilterBuilder } from "$lib";
    import type { ComponentProps } from "svelte";
    import EventsViewer from "../../EventsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";

  let searchText = '',
    filters: ComponentProps<typeof Filters>["filters"] = [
    {
      type: 'string',
      column: 'cbam_declaration_goods.mrn',
      mode: 'ilike',
      advanced: false,
      name: 'mrn',
      label: 'MRN'
    },
		{
			type: 'string',
			column: 'identificationCode',
			mode: 'ilike',
			advanced: false,
			name: 'identificationCode',
			label: 'Identification Code'
		},
    {
      type: 'string',
      column: 'description',
      mode: 'ilike',
      advanced: false,
      name: 'description',
      label: 'Description'
    },
    {
      type: 'string',
      column: 'factoryAddress',
      mode: 'ilike',
      advanced: false,
      name: 'factoryAddress',
      label: 'Factory Address'
    },
    {
      type: 'string',
      column: 'factoryName',
      mode: 'ilike',
      advanced: false,
      name: 'factoryName',
      label: 'Factory Name'
    },
    {
      type: 'number',
      column: 'netWeight',
      advanced: true,
      mode: 'equal',
      name: 'netWeight',
      label: 'Net Weight(KG)'
    },
    {
      type: 'number',
      column: 'directEmission',
      advanced: true,
      mode: 'equal',
      name: 'directEmission',
      label: 'Direct Emission'
    },
    {
      type: 'number',
      column: 'indirectEmission',
      advanced: true,
      mode: 'equal',
      name: 'indirectEmission',
      label: 'Indirect Emission'
    },
    {
      type: 'number',
      column: 'totalEmission',
      advanced: true,
      mode: 'equal',
      name: 'totalEmission',
      label: 'Total Emission'
    },
    {
      type: 'number',
      column: 'directEmission',
      advanced: true,
      mode: 'equal',
      name: 'factoryDirectEmission',
      label: 'Factory Direct Emission'
    },
    {
      type: 'number',
      column: 'factoryIndirectEmission',
      advanced: true,
      mode: 'equal',
      name: 'factoryIndirectEmission',
      label: 'Factory Indirect Emission'
    },
    {
      type: 'number',
      column: 'factoryTotalEmission',
      advanced: true,
      mode: 'equal',
      name: 'factoryTotalEmission',
      label: 'Factory Total Emission'
    },
  ]

  function handleSearchChange(searchText?: string) {
    let builder: FilterBuilder;

    let converter = new Converter();
    builder = converter.createBuilder({
      filters: filters || [],
    })

    return builder;
  }

  function updateFilterValues(filter: Filter, updateMultiFilterValues: (filterName: string, newValue: any, newValid: boolean, newMode?: NumberMode | StringMode | SelectMode | DateMode) => void) {
    let newValue: any = {},
      newValid: boolean = false,
      newMode = filter.type == 'date' ||
        filter.type == 'number' ||
        filter.type == 'select' ||
        filter.type == 'string' ?
          filter.mode :
          undefined
    if(filter.type == 'select') {
      newValue = filter.values 
      if(newValue.length > 0) {
        newValid = true
      }
    } else if('mode' in filter && filter.mode == 'between') {
      newValue.to = filter.to
      newValue.from = filter.from
      if(!!newValue.from || !!newValue.to) {
        newValid = true
      }
    } else {
      newValue = filter.value
      if(!!newValue) {
        newValid = true
      }
    }
    updateMultiFilterValues(filter.name, newValue, newValid, newMode)
  }
</script>

<h1>DynamicFilters</h1>
<ComponentSubtitle>Make it easy, make it filter. Dynamically.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
<Filters
  bind:filters
  onapplyFilter={() => {
    handleSearchChange(searchText);
  }}
  onremoveFilter={() => {
    handleSearchChange(searchText);
  }}
  onremoveAllFilters={() => {
    handleSearchChange(searchText);
  }}
  --filters-default-wrapper-width="100%"
  lang={'en'}
  editFilterMode='multi-edit'
>
  {#snippet contentSnippet({ filters, handleRemoveAllFilters, mAndDown, updateMultiFilterValues, })}
    {#key filters}
      <DynamicFilters
        lang='en'
        {filters}                      
        {mAndDown}
        onchange={e => updateFilterValues(e.detail.filter, updateMultiFilterValues)}    
      >
      </DynamicFilters>
    {/key}
  {/snippet}
</Filters>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "filters", type: "Filter[]", description: "List of filters to show and edit.", default: "[]" },
    { name: "lang", type: "'it' | 'en'", description: "Language of the component text and labels.", default: '"en"' },
    { name: "mAndDown", type: "boolean", description: "Enables mobile layout mode if true.", default: "false" },
    { name: "updateMultiFilterValues", type: "function", description: "Function to update the filters", default: "" },
  ]}
  styleProps={[]}
/>
<h2>Slots</h2>
<SlotsViewer
  slots={[
        { 
      name: "customSnippet", description: "Custom filter content", properties: [
        { name: "filter", type: "Filter | undefined", description: "The filter definition" },
        { name: "updateCustomFilterValues", type: "function", description: "Updater for custom filters" },
        { name: "mAndDown", type: "boolean", description: "Screen size M and lower" }
      ] 
    },
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: "onchange",
      description: "Emitted when a filter is updated.",
      properties: [
        {
          name: "filter",
          type: "Filter",
          description: "The updated filter."
        }
      ]
    }
  ]}
></EventsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }
</style>
