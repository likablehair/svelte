<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Filters from "$lib/components/composed/search/Filters.svelte";
  import Converter, { type Filter } from "$lib/utils/filters/filters";
  import type Builder from "$lib/utils/filters/builder";
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
    import { FilterEditor } from "$lib";
    import EventsViewer from "../../EventsViewer.svelte";
    import SlotsViewer from "../../SlotsViewer.svelte";

  let filters: Filter[] = [
    {
      name: "handlingType",
      label: "Tipo movimento",
      type: "select",
      view: 'toggle',
      column: 'handlingType',
      mode: 'equal',
      items: [
        {
          label: 'Carico',
          value: 'load'
        },
        {
          label: 'Scarico',
          value: 'unload'
        },
        {
          label: 'Acquisto',
          value: 'purhcase'
        },
        {
          label: 'Vendita',
          value: 'sale'
        }
      ],
      advanced: false,
    },
    {
      name: "customerSupplier",
      label: "Cliente/Fornitore",
      type: "string",
      column: 'customer',
      mode: 'ilike',
      advanced: false
    },
    {
      name: "handlingDate",
      label: "Data movimento",
      type: "date",
      column: "handlingDate",
      mode: "between",
      advanced: false,
    },
    {
      name: "documentDate",
      label: "Data documento",
      type: "date",
      column: "docDate",
      mode: "equal",
      advanced: true,
    },
    {
      name: 'testCustom',
      label: 'Test custom',
      type: 'custom',
      modify: function({builder, value }) {
        return builder.where('test', value)
      }
    },
    {
      name: "productsNumber",
      label: "Numero articoli",
      type: "number",
      column: "productsNumber",
      mode: "between",
      advanced: false,
    },
    {
      name: "tags",
      label: "Categorie/Tag",
      type: "select",
      column: "tags",
      advanced: false,
      mode: "equal",
      items: [
        {
          label: 'Prima categoria',
          value: 'tag1'
        },
        {
          label: 'Seconda categoria',
          value: 'tag2'
        }
      ],
    },
    {
      name: "ddt",
      label: "DDT creato",
      type: "bool",
      column: "ddt",
      mode: "equal",
      description: "DDT creato",
    },
    {
      name: "underStock",
      label: "Merce sottoscorta",
      type: "bool",
      column: "underStock",
      mode: "equal",
      description: "Merce sottoscorta",
      modify: function({ builder, value }) {
        if(value) {
          return builder
            .join('stocks', q => q.on('products.id', 'stocks.productId'))
            .whereColumn('stocks.qty', '<', 'products.minQty')
        } else {
          return builder
        }
      }
    },
    {
      name: "overflowTest",
      label: "Test datepicker overflow",
      type: "date",
      column: "test",
      mode: "equal"
    }
  ];

  function handleFilterEdit() {
    if (!!filters) {
      let converter = new Converter();
      let builder: Builder;
      builder = converter.createBuilder({
        filters
      });
    }
  }

  function handleCustomStringFilter(e: Event, filterName: string, updateFunction: (filterName: string, newValue: any) => void): void {
    //@ts-ignore
    updateFunction(filterName, e.target.value)
  }

  function handleSingleCustomFilter(e: Event, filterName: string, updateFunction: (filterName: string, newValue: any, newValid: boolean) => void): void {
    //@ts-ignore
    let newValue: string = e.target.value
    let isValid = !!newValue && newValue.length > 2
    updateFunction(filterName, newValue, isValid)
  }
</script>

<h1>Filters</h1>
<ComponentSubtitle>Make it easy, make it filter.</ComponentSubtitle>
<h2>Example</h2>
<div class="example" style:margin-top="1000px" style:margin-bottom="500px">
  <Filters lang="it" bind:filters onapplyFilter={handleFilterEdit} onremoveAllFilters={handleFilterEdit} onremoveFilter={handleFilterEdit} showActiveFilters={true}>
    {#snippet customChipSnippet({ filter })}
      {#if filter.name === 'testCustom'}
        <span>Test custom filter equal to {filter.type === 'custom' ? filter.value : undefined}</span>
      {/if}
    {/snippet}
    {#snippet customSnippet({ filter, mAndDown, updateFunction })}
      {#if filter}
        <SimpleTextField
          oninput={(e) => { handleSingleCustomFilter(e, filter.name, updateFunction) }}
          value={filter.type === 'custom' ? filter.value : undefined}
        ></SimpleTextField>
      {/if}
    {/snippet}
  </Filters>
</div>
<div class="example" style:margin-top="500px" style:margin-bottom="500px">
  <Filters lang="it" bind:filters onapplyFilter={handleFilterEdit} onremoveAllFilters={handleFilterEdit} onremoveFilter={handleFilterEdit} showActiveFilters={false} editFilterMode="multi-edit">
    {#snippet customSnippet({ filter, mAndDown, updateFunction, })}
      {#if filter}
        <SimpleTextField
          oninput={(e) => { handleSingleCustomFilter(e, filter.name, updateFunction) }}
          value={filter.type === 'custom' ? filter.value : undefined}
        ></SimpleTextField>
      {/if}
    {/snippet}
  </Filters>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: "filters",
      type: "Filter[]",
      description: "Array of filters applied or available.",
      default: "[]"
    },
    {
      name: "lang",
      type: "'it' | 'en'",
      description: "Language of the component.",
      default: "'en'"
    },
    {
      name: "addFilterLabel",
      type: "string",
      description: "Label shown on the button to add filters.",
      default: "'Filters'"
    },
    {
      name: "cancelFilterLabel",
      type: "string",
      description: "Label for cancel filter action.",
      default: "'Cancel'"
    },
    {
      name: "applyFilterLabel",
      type: "string",
      description: "Label for apply filter action.",
      default: "'Apply filter'"
    },
    {
      name: "showActiveFilters",
      type: "boolean",
      description: "Whether to show currently active filters.",
      default: "true"
    },
    {
      name: "filterTitleLabel",
      type: "string",
      description: "Title shown in the filter dialog.",
      default: "'Filter by'"
    },
    {
      name: "dateLocale",
      type: "Locale",
      description: "Locale object for date formatting.",
      default: "'en'"
    },
    {
      name: "betweenSeparator",
      type: "string",
      description: "Text used between values in a between filter.",
      default: "'and'"
    },
    {
      name: "trueString",
      type: "string",
      description: "String used to represent a `true` boolean.",
      default: "'true'"
    },
    {
      name: "falseString",
      type: "string",
      description: "String used to represent a `false` boolean.",
      default: "'false'"
    },
    {
      name: "editFilterMode",
      type: "'one-edit' | 'multi-edit'",
      description: "How filter editing behaves.",
      default: "'one-edit'"
    },
    {
      name: "labelsMapper",
      type: "LabelMapper",
      description: "Maps operators to display labels.",
      default: "Based on language"
    }
  ]}
  styleProps={[
    {
      name: "--filters-button-cancel-background-color",
      type: "color",
      description: "Background color of the cancel button.",
      default: "transparent"
    },
    {
      name: "--filters-button-cancel-color",
      type: "color",
      description: "Text color of the cancel button.",
      default: "rgb(var(--global-color-primary-400))"
    },
    {
      name: "--filters-wrapper-width",
      type: "size",
      description: "Width of the filter wrapper container.",
      default: "auto"
    }
  ]}
/>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    {
      name: "customSnippet",
      description: "Custom UI for editing a single filter.",
      properties: [
        { name: "filter", type: "Filter | undefined", description: "Current filter being edited." },
        { name: "updateFunction", type: "function", description: "Updates the current filter." },
        { name: "mAndDown", type: "boolean", description: "True if screen size is medium or smaller." }
      ]
    },
    {
      name: "customChipSnippet",
      description: "Custom rendering of individual filter chip.",
      properties: [
        { name: "filter", type: "Filter", description: "The filter to render." }
      ]
    },
    {
      name: "appendSnippet",
      description: "Slot for appending additional elements to the filter component."
    },
    {
      name: "contentSnippet",
      description: "Custom content for the entire filter area.",
      properties: [
        { name: "mAndDown", type: "boolean", description: "True if screen size is medium or smaller." },
        { name: "updateMultiFilterValues", type: "function", description: "Updates the values of multiple filters." },
        { name: "handleRemoveAllFilters", type: "function", description: "Removes all filters." },
        { name: "filters", type: "Filter[]", description: "Array of current filters." }
      ],
      default: `
<div class="multi-filters-container" style:grid-template-columns={mAndDown ? '1fr' : '1fr 1fr'}>
  {#each filters as filter, i}
    <div class="filter" class:wide={filter.type === 'select' || filter.type === 'custom'}>
      <div class="input">
        {#if !filter.advanced && filter.type !== 'custom'}
          <div class="label">
            {filter.label}
          </div>
        {/if}
        <div class="field">
          <FilterEditor
            bind:filter={filters[i]}
            {lang}
            {labelsMapper}
            editFilterMode="multi-edit"
            bind:tmpFilter={tmpFilters[filter.name]}
            mobile={mAndDown}
          >
            {#snippet customSnippet({ filter })}
              {@render customInternalSnippet?.({ filter, updateFunction, mAndDown })}
            {/snippet}
          </FilterEditor>
        </div>
      </div>
    </div>
  {/each}
</div>
      `
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: "onaddFilterClick",
      description: "Triggered when the add filter button is clicked."
    },
    {
      name: "onapplyFilter",
      description: "Triggered when filters are applied."
    },
    {
      name: "onremoveAllFilters",
      description: "Triggered when all filters are removed."
    },
    {
      name: "onremoveFilter",
      description: "Triggered when an individual filter is removed.",
      properties: [
        {
          name: "filter",
          type: "Filter",
          description: "The filter that was removed."
        }
      ]
    },
    {
      name: "onclick",
      description: "DOM click event on component root."
    },
    {
      name: "onkeydown",
      description: "DOM keydown event on component root."
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
