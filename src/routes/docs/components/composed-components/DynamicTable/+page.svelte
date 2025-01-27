<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import type { Filter } from "$lib/utils/filters/filters";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import DynamicTable from "$lib/components/composed/list/DynamicTable.svelte";
  import type { ComponentProps } from "svelte";

  let headers : ComponentProps<DynamicTable>['headers'] =[
      {
        value: 'businessName',
        label: 'Business name',
        type: {
        key: "string",
      },
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
      }
    ]

  let filters: Filter[] | undefined  = [{
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
]
  let value: string | number | undefined = undefined

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
    rows={[
      {
        item: {
          id: 1,
          businessName: "GQ Creators",
          productName: "Data Protection",
          progress: "339 sold",
          rating: 5,
        },
        subItems: [
          {
            businessName: "GQ Creators",
            productName: "Data Protection",
            progress: "339 sold",
            rating: 5,
          },
          { 
            businessName: "Dribblers Agency",
            productName: "Job Search",
            progress: "212 sold",
            rating: 4.5,
          },
          {
            businessName: "Popular My",
            productName: "Financial Transactions",
            progress: "94 sold",
            rating: 4.2,
          },
        ]
      },
      {
        item: {
          id: 2,
          businessName: "Dribblers Agency",
          productName: "Job Search",
          progress: "212 sold",
          rating: 4.5,
        },
        subItems: [
          {
            businessName: "GQ Creators",
            productName: "Data Protection",
            progress: "339 sold",
            rating: 5,
          },
          { 
            businessName: "Dribblers Agency",
            productName: "Job Search",
            progress: "212 sold",
            rating: 4.5,
          },
          {
            businessName: "Popular My",
            productName: "Financial Transactions",
            progress: "94 sold",
            rating: 4.2,
          },
        ]
      },
      {
        item: {
          id: 3,
          businessName: "Popular My",
          productName: "Financial Transactions",
          progress: "94 sold",
          rating: 4.2,
        },
        subItems: [
          {
            businessName: "GQ Creators",
            productName: "Data Protection",
            progress: "339 sold",
            rating: 5,
          },
          { 
            businessName: "Dribblers Agency",
            productName: "Job Search",
            progress: "212 sold",
            rating: 4.5,
          },
          {
            businessName: "Popular My",
            productName: "Financial Transactions",
            progress: "94 sold",
            rating: 4.2,
          },
        ]
      },
    ]}
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