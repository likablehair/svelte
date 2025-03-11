<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import type { Filter } from "$lib/utils/filters/filters";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import DynamicTable from "$lib/components/composed/list/DynamicTable.svelte";
  import type { ComponentProps } from "svelte";
    import FlagIcon from "$lib/components/simple/media/FlagIcon.svelte";

  let headers : ComponentProps<DynamicTable>['headers'] = [
    {
      value: 'businessName',
      label: 'Business name',
      type: {
        key: "string",
      },
      info: 'informazioni',
      sortable: true
    },
    {
      value: "productName",
      label: "Product Name",
      type: {
        key: "string",
      },
      sortable: true,
      cellEditorInfo: {
        description: 'Descrizione',
        title: 'Titolo',
        type: {
          key: 'string',
        },
        column: 'Colonna',
        info: 'Informazioni'
      }
    },
    {
      value: "progress",
      label: "Progress",
      type: {
        key: "string",
      },
    },
    {
      value: "rating",
      label: "Rating",
      type: {
        key: "custom",
      },
      sortable: true,
    },
    {
      value: "id",
      label: "ID",
      type: {
        key: "string",
      },
      sortable: true,
    }
  ],
  filters: Filter[] | undefined  = [
    {
      label: "Business name",
      active: false,
      type: 'string',
      name: "businessName",
      column: "businessName",
      mode: 'contains',
      modify: function({ builder, value }) {
        return builder.whereJsonSuperset('products.categories', {data: [{name: "Tipologie Gomme", tags: {data: [{value: value, selected: true}]}}]})
      }
    },
    {
      label: "Product name",
      active: false,
      type: 'string',
      name: "productName",
      column: "productName",
      advanced: true,
      mode: 'like'
    },
    {
      label: 'Rating',
      view: 'toggle',
      active: false,
      type: 'select',
      column: 'rating',
      mode: 'equal',
      advanced: true,
      name: 'rating',
      items: [
        {
          label: "5",
          value: 5
        },
        {
          label: "4.5",
          value: 4.5
        }
      ]
    },
    {
      label: "Test date",
      active: false,
      type: 'date',
      name: "testDate",
      column: "testDate",
      advanced: false,
      mode: 'equal'
    },
    {
      type: "custom",
      label: "Product category",
      name: "productCategory",
      modify: ({builder, value}) => {
        return builder.join('categories', q => {
          q.on('product.categoryId', 'category.id')
        }).where('categories.name', value)
      }
    }
  ],
  value: string | number | undefined = undefined,
  rows = Array.from({ length: 500 }, (_, index) => ({
    item: {
      id: index + 1,
      businessName: "Popular My",
      productName: "Financial Transactions",
      progress: `${94 + (index % 10)} sold`, 
      rating: (4 + (index % 5) * 0.1).toFixed(1), 
    },
    subItems: [
      {
        id: index + 1,
        businessName: "Popular My",
        productName: "Financial Transactions",
        progress: `${94 + (index % 10)} sold`, 
        rating: (4 + (index % 5) * 0.1).toFixed(1), 
      },
      {
        id: index + 1,
        businessName: "Popular My",
        productName: "Financial Transactions",
        progress: `${94 + (index % 10)} sold`, 
        rating: (4 + (index % 5) * 0.1).toFixed(1), 
      },
      {
        id: index + 1,
        businessName: "Popular My",
        productName: "Financial Transactions",
        progress: `${94 + (index % 10)} sold`, 
        rating: (4 + (index % 5) * 0.1).toFixed(1), 
      },
      {
        id: index + 1,
        businessName: "Popular My",
        productName: "Financial Transactions",
        progress: `${94 + (index % 10)} sold`, 
        rating: (4 + (index % 5) * 0.1).toFixed(1), 
      },
    ]
  }));

  function handleCustomInput(e: Event, filterName: string, updateFunction: (filterName: string, newValue: any, newValid: boolean) => void) {
    //@ts-ignore
    let newValue: string = e.target.value
    let isValid = !!newValue && newValue.length > 2
    updateFunction(filterName, newValue, isValid)
  }

</script>

<h1>DynamicTable With Filter Panel</h1>
<ComponentSubtitle>Dynamic Table and pagination agreement with filter.</ComponentSubtitle>
<h2>Example</h2>
<div>
  <DynamicTable
    filters={filters}
    headers={headers}
    subHeaders={headers}
    editFilterMode={'multi-edit'}
    headersToShowInTable={headers}
    showExpand
    filtersVisible
    cellEdit
    {rows}
    totalRows={100000000}
    on:fetchData={() => {
      let lastId = rows[rows.length - 1].item.id
      rows = [
        ...rows,
        ...(Array.from({ length: 100 }, (_, index) => ({
          item: {
            id: ++lastId,
            businessName: "Popular My",
            productName: "Financial Transactions",
            progress: `${94 + (index % 10)} sold`, 
            rating: (4 + (index % 5) * 0.1).toFixed(1), 
          },
          subItems: []
        })))
      ]
    }}
    customizeHeaders
    searchBarPlaceholder={'Type to search'}
    searchBarVisible
  >
    <svelte:fragment slot="custom-filter" let:filter let:updateMultiFilterValues>
      {#if !!filter}
        {#if filter.name == 'productCategory'}
          <label for="productCategory">Product Category</label>
          <SimpleTextField name="productCategory" bind:value on:input={(e) => handleCustomInput(e, filter.name, updateMultiFilterValues)}></SimpleTextField>
        {/if}
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="custom-filter-chip" let:filter>
      {#if filter.name === 'productCategory'}
        <span>Product category equal to {filter.type === 'custom' ? filter.value : undefined}</span>
      {/if}
    </svelte:fragment>
    <svelte:fragment slot="custom" let:header let:row>
      {#if header.value == 'rating'}
        {row.item.rating}
        <Icon name="mdi-star" --icon-color="green"></Icon>
      {/if}
    </svelte:fragment>
    <div slot='custom-subheader' let:subHeader let:subItem>
      {#if subHeader.value == 'rating'}
        <FlagIcon alpha2='it'></FlagIcon>
      {/if}
    </div>
  </DynamicTable>
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
  :global(.calculated-class) {
    background-color: rgba(var(--global-color-contrast-200), 0.2);
  }
</style>