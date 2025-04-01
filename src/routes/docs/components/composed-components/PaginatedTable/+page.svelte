<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import PaginatedTable from "$lib/components/composed/list/PaginatedTable.svelte";
  import type { Filter } from "$lib/utils/filters/filters";
  import type { Header } from "$lib/components/simple/lists/SimpleTable.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import type Builder from "$lib/utils/filters/builder";
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import type { ComponentProps } from "svelte";

  let headers : Header[] =[
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

  function handleFiltersChange(e: Parameters<NonNullable<ComponentProps<typeof PaginatedTable>['onfiltersChange']>>[0]) {
    let filterBuilder: Builder = e.detail.builder
  }

  function handleCustomInput(e: Parameters<NonNullable<ComponentProps<typeof SimpleTextField>['oninput']>>[0], filterName: string, updateFunction: (filterName: string, newValue: any, newValid: boolean) => void) {
    let newValue: string = e.currentTarget.value
    let isValid = !!newValue && newValue.length > 2
    updateFunction(filterName, newValue, isValid)
  }

  function calculateRowStyles(item: Parameters<NonNullable<ComponentProps<typeof PaginatedTable>['calculateRowStyles']>>[0]): {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string;
  } {
    if (!!item.businessName && item.businessName == "GQ Creators") {
      return {
        backgroundColor: "rgba(var(--global-color-primary-300), 0.8)",
        color: "#fff",
        fontWeight: "900",
      };
    }
    return {}
  }

  function calculateRowClasses(item: Parameters<NonNullable<ComponentProps<typeof PaginatedTable>['calculateRowClasses']>>[0]): string | undefined {
    if (!!item.businessName && item.businessName == "Popular My") {
      return 'calculated-class'
    }
    return ''
  }
</script>

<h1>PaginatedTable With Filter Panel</h1>
<ComponentSubtitle>Table and pagination agreement with filter.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <PaginatedTable
    resizableColumns={true}
    filters={filters}
    headers={headers}
    items={[
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
    ]}
    searchBarColumns={['businessName', 'productName']}
    totalElements={40}
    onfiltersChange={handleFiltersChange}
    onremoveFilter={(e) => {if(e.detail.filter.name == "productCategory") {value = undefined}}}
    editFilterMode="multi-edit"
    showActiveFilters={true}
    {calculateRowStyles}
    {calculateRowClasses}
  >
  {#snippet customFilterSnippet({ filter, mAndDown, updateFunction, })}
    {#if !!filter}
      {#if filter.name == 'productCategory'}
        <label for="productCategory">Product Category</label>
        <SimpleTextField name="productCategory" bind:value oninput={(e) => handleCustomInput(e, filter.name, updateFunction)}></SimpleTextField>
      {/if}
    {/if}
  {/snippet}
  {#snippet customFilterChipSnippet({ filter })}
    {#if filter.name === 'productCategory'}
      <span>Product category equal to {filter.type === 'custom' ? filter.value : undefined}</span>
    {/if}
  {/snippet}
  {#snippet customSnippet({ columnIndex, header, index, item, })}
    {#if header.value == 'rating'}
      {item.rating}
      <Icon name="mdi-star" --icon-color="green"></Icon>
    {/if}
  {/snippet}
  {#snippet rowActionsSnippet({ index, item, })}
    RowActions
  {/snippet}
  {#snippet appendSnippet({ index, item, })}
    RowActions
  {/snippet}
  {#snippet filterAppendSnippet()}
    <div
      style:margin-left="auto"
    >
      <button>Ciao</button>
    </div>
  {/snippet}
</PaginatedTable>
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
    gap: 10px;
    margin-bottom: 20px;
  }

  :global(.calculated-class) {
    background-color: rgba(var(--global-color-contrast-200), 0.2);
  }
</style>