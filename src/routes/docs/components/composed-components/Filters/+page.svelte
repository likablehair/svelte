<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Filters from "$lib/components/composed/search/Filters.svelte";
  import Converter, { type Filter } from "$lib/utils/filters/filters";
  import type Builder from "$lib/utils/filters/builder";
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";

  let x = 2

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
      column: "procutsNumber",
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
      console.log(builder.toJson())
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
  <Filters lang="it" bind:filters on:applyFilter={handleFilterEdit} on:removeAllFilters={handleFilterEdit} on:removeFilter={handleFilterEdit} showActiveFilters={true}>
    <svelte:fragment slot="custom-chip" let:filter>
      {#if filter.name === 'testCustom'}
        <span>Test custom filter equal to {filter.type === 'custom' ? filter.value : undefined}</span>
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="custom" let:updateFunction let:filter let:mAndDown>
      <SimpleTextField
        on:input={(e) => { handleSingleCustomFilter(e, filter.name, updateFunction) }}
        value={filter.type === 'custom' ? filter.value : undefined}
      ></SimpleTextField>
    </svelte:fragment>
  </Filters>
</div>
<div class="example" style:margin-top="500px" style:margin-bottom="500px">
  <Filters lang="it" bind:filters on:applyFilter={handleFilterEdit} on:removeAllFilters={handleFilterEdit} on:removeFilter={handleFilterEdit} showActiveFilters={false} editFilterMode="multi-edit">
    <!-- <svelte:fragment slot="content" let:updateMultiFilterValues let:filters>
      {#each filters as filter}
        <div>{filter.name}</div>
        {#if filter.type == 'string'}
          <SimpleTextField
            on:input={(e) => { handleCustomStringFilter(e, filter.name, updateMultiFilterValues) }}
          ></SimpleTextField>
        {/if}
      {/each}
    </svelte:fragment> -->
    <svelte:fragment slot="custom" let:updateFunction let:filter let:mAndDown>
      <SimpleTextField
        on:input={(e) => { handleSingleCustomFilter(e, filter.name, updateFunction) }}
        value={filter.type === 'custom' ? filter.value : undefined}
      ></SimpleTextField>
    </svelte:fragment>
  </Filters>
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
/>
<h2>Slots</h2>
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
