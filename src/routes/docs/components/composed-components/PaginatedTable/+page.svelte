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
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SimpleTable from "$lib/components/simple/lists/SimpleTable.svelte";

  type Row = {
    businessName: string;
    productName: string;
    progress: string;
    rating: number;
  };

  let headers: ComponentProps<
    typeof SimpleTable<Row, { ciao: string }>
  >["headers"] = [
    {
      value: "businessName",
      label: "Business name",
      type: {
        key: "string",
      },
      data: {
        ciao: "sddfd",
      },
    },
    {
      value: "productName",
      label: "Product Name",
      type: {
        key: "string",
      },
      sortable: true,
      data: {
        ciao: "sddfd",
      },
    },
    {
      value: "progress",
      label: "Progress",
      type: {
        key: "string",
      },
      data: {
        ciao: "sddfd",
      },
    },
    {
      value: "rating",
      label: "Rating",
      type: {
        key: "custom",
      },
      sortable: true,
      data: {
        ciao: "sddfd",
      },
    },
  ];

  let items: Row[] = [
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
  ];

  let filters: Filter[] | undefined = [
    {
      label: "Business name",
      active: false,
      type: "string",
      name: "businessName",
      column: "businessName",
      mode: "contains",
      modify: function ({ builder, value }) {
        return builder.whereJsonSuperset("products.categories", {
          data: [
            {
              name: "Tipologie Gomme",
              tags: { data: [{ value: value, selected: true }] },
            },
          ],
        });
      },
    },
    {
      label: "Product name",
      active: false,
      type: "string",
      name: "productName",
      column: "productName",
      advanced: true,
      mode: "like",
    },
    {
      label: "Rating",
      view: "toggle",
      active: false,
      type: "select",
      column: "rating",
      mode: "equal",
      advanced: true,
      name: "rating",
      items: [
        {
          label: "5",
          value: 5,
        },
        {
          label: "4.5",
          value: 4.5,
        },
      ],
    },
    {
      label: "Test date",
      active: false,
      type: "date",
      name: "testDate",
      column: "testDate",
      advanced: false,
      mode: "equal",
    },
    {
      type: "custom",
      label: "Product category",
      name: "productCategory",
      modify: ({ builder, value }) => {
        return builder
          .join("categories", (q) => {
            q.on("product.categoryId", "category.id");
          })
          .where("categories.name", value);
      },
    },
  ];
  let value: string | number | undefined = undefined;

  function handleFiltersChange(
    e: Parameters<
      NonNullable<ComponentProps<typeof PaginatedTable>["onfiltersChange"]>
    >[0],
  ) {
    let filterBuilder: Builder = e.detail.builder;
  }

  function handleCustomInput(
    e: Parameters<
      NonNullable<ComponentProps<typeof SimpleTextField>["oninput"]>
    >[0],
    filterName: string,
    updateFunction: (
      filterName: string,
      newValue: any,
      newValid: boolean,
    ) => void,
  ) {
    let newValue: string = e.currentTarget.value;
    let isValid = !!newValue && newValue.length > 2;
    updateFunction(filterName, newValue, isValid);
  }

  function calculateRowStyles(
    item: Parameters<
      NonNullable<ComponentProps<typeof PaginatedTable>["calculateRowStyles"]>
    >[0],
  ): {
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
    return {};
  }

  function calculateRowClasses(
    item: Parameters<
      NonNullable<ComponentProps<typeof PaginatedTable>["calculateRowClasses"]>
    >[0],
  ): string | undefined {
    if (!!item.businessName && item.businessName == "Popular My") {
      return "calculated-class";
    }
    return "";
  }
</script>

<h1>PaginatedTable</h1>
<ComponentSubtitle
  >Table and pagination agreement with filter.</ComponentSubtitle
>
<h2>Example</h2>
<div class="example">
  <PaginatedTable
    resizableColumns={true}
    {filters}
    {headers}
    {items}
    searchBarColumns={["businessName", "productName"]}
    totalElements={40}
    onfiltersChange={handleFiltersChange}
    onremoveFilter={(e) => {
      if (e.detail.filter.name == "productCategory") {
        value = undefined;
      }
    }}
    editFilterMode="multi-edit"
    showActiveFilters={true}
    {calculateRowStyles}
    {calculateRowClasses}
    --filters-one-edit-menu-max-height="50vh"
  >
    {#snippet customFilterSnippet({ filter, mAndDown, updateFunction })}
      {#if !!filter}
        {#if filter.name == "productCategory"}
          <label for="productCategory">Product Category</label>
          <SimpleTextField
            name="productCategory"
            bind:value
            oninput={(e) => handleCustomInput(e, filter.name, updateFunction)}
          ></SimpleTextField>
        {/if}
      {/if}
    {/snippet}
    {#snippet customFilterChipSnippet({ filter })}
      {#if filter.name === "productCategory"}
        <span
          >Product category equal to {filter.type === "custom"
            ? filter.value
            : undefined}</span
        >
      {/if}
    {/snippet}
    {#snippet customSnippet({ columnIndex, header, index, item })}
      {#if header.value == "rating"}
        {item.rating}
        <Icon name="mdi-star" --icon-color="green"></Icon>
      {/if}
    {/snippet}
    {#snippet rowActionsSnippet({ index, item })}
      RowActions
    {/snippet}
    {#snippet appendSnippet({ index, item })}
      RowActions
    {/snippet}
  </PaginatedTable>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: "headers",
      type: "Header<Data>[]",
      description: "Defines the table columns.",
      default: "[]",
    },
    {
      name: "items",
      type: "Item[]",
      description: "Defines the table rows.",
      default: "[]",
    },
    {
      name: "sortedBy",
      type: "string | undefined",
      description: "Column currently sorted by.",
      default: "undefined",
    },
    {
      name: "sortDirection",
      type: "'asc' | 'desc'",
      description: "Current sorting direction.",
      default: "asc",
    },
    {
      name: "page",
      type: "number",
      description: "Current page number",
      default: "1",
    },
    {
      name: "maxPage",
      type: "number",
      description: "Maximum number of pages",
      default: "undefined",
    },
    {
      name: "rowsPerPageOptions",
      type: "Item[]",
      description: "Options for rows per page.",
      default:
        "[{ label: '20', value: 20 }, { label: '50', value: 50 }, { label: '100', value: 100 }]",
    },
    {
      name: "hideRowsPerPage",
      type: "boolean",
      description: "Whether to hide the rows-per-page selector.",
      default: "false",
    },
    {
      name: "totalElements",
      type: "number | undefined",
      description: "Total number of elements available.",
      default: "undefined",
    },
    {
      name: "rowsPerPage",
      type: "number",
      description: "Number of rows shown per page.",
      default: "20",
    },
    {
      name: "filters",
      type: "Filter[]",
      description: "Array of filters applied or available.",
      default: "[]",
    },
    {
      name: "searchBarColumns",
      type: "string[] | undefined",
      description: "Fields on which to perform search filtering.",
      default: "undefined",
    },
    {
      name: "searchBarVisible",
      type: "boolean",
      description: "Show or hide the search bar.",
      default: "true",
    },
    {
      name: "searchBarPlaceholder",
      type: "string",
      description: "Placeholder text for the search bar.",
      default: "'Type something to search...'",
    },
    {
      name: "lang",
      type: "'it' | 'en'",
      description: "Language of the UI.",
      default: "'en'",
    },
    {
      name: "editFilterMode",
      type: "'one-edit' | 'multi-edit'",
      description: "Mode for editing filters.",
      default: "'one-edit'",
    },
    {
      name: "showActiveFilters",
      type: "boolean",
      description: "Show chips representing active filters.",
      default: "true",
    },
    {
      name: "resizableColumns",
      type: "boolean",
      description: "Enable or disable column resizing.",
      default: "false",
    },
    {
      name: "resizedColumnSizeWithPadding",
      type: "Record<string, number>",
      description: "Mapping of column names to custom widths.",
      default: "{}",
    },
    {
      name: "pointerOnRowHover",
      type: "boolean | undefined",
      description: "If true, shows pointer on row hover.",
      default: "undefined",
    },
    {
      name: "doubleClickActive",
      type: "boolean",
      description: "Enables the double click of the row.",
      default: "false",
    },
    {
      name: "doubleClickDelay",
      type: "number",
      description: "Time window (in ms) to double click",
      default: "250",
    },
    {
      name: "calculateRowStyles",
      type: "CalculateRowStyles<Item> | undefined",
      description: "Function to calculate row styles.",
      default: "undefined",
    },
    {
      name: "calculateRowClasses",
      type: "CalculateRowClasses<Item> | undefined",
      description: "Function to calculate row classes.",
      default: "undefined",
    },
    {
      name: "class",
      type: "{ simpleTable?: { container?: string, header?: string, row?: string, cell?: string } }",
      description: "Custom class mappings for inner components.",
      default: "{}",
    },
  ]}
  styleProps={[
    {
      name: "--filters-one-edit-menu-max-height",
      type: "string",
      default: "100%",
      description:
        'The max height of the filters dropdown element when "one-edit" mode is active',
    },
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    {
      name: "searchBarSnippet",
      description: "Custom content for the search bar.",
      properties: [
        {
          name: "handleSearchChange",
          type: "function",
          description: "Handler for search input changes.",
        },
      ],
    },
    {
      name: "footerSnippet",
      description: "Custom footer content.",
      properties: [
        {
          name: "hideRowsPerPage",
          type: "boolean",
          description: "If true, hides the rows-per-page dropdown.",
        },
        {
          name: "rowsPerPageOptions",
          type: "array",
          description: "Available options for rows per page.",
        },
        {
          name: "rowsPerPageSelection",
          type: "function",
          description: "Handler for changing rows per page.",
        },
        {
          name: "totalElements",
          type: "number",
          description: "Total number of elements.",
        },
        { name: "page", type: "number", description: "Current page." },
        {
          name: "maxPage",
          type: "number",
          description: "Maximum number of pages.",
        },
        {
          name: "rowsPerPage",
          type: "number",
          description: "Current rows per page.",
        },
        {
          name: "handlePaginationChange",
          type: "function",
          description: "Handles pagination changes.",
        },
      ],
    },
    {
      name: "rangeDescriptorSnippet",
      description: "Custom snippet for describing current pagination range.",
      properties: [
        {
          name: "totalElements",
          type: "number",
          description: "Total elements count.",
        },
        { name: "page", type: "number", description: "Current page." },
        {
          name: "maxPage",
          type: "number",
          description: "Maximum page number.",
        },
        {
          name: "rowsPerPage",
          type: "number",
          description: "Current rows per page.",
        },
      ],
    },
    {
      name: "customSnippet",
      description: "Custom UI for editing a single filter.",
      properties: [
        {
          name: "filter",
          type: "Filter | undefined",
          description: "Current filter being edited.",
        },
        {
          name: "updateFunction",
          type: "function",
          description: "Updates the current filter.",
        },
        {
          name: "mAndDown",
          type: "boolean",
          description: "True if screen size is medium or smaller.",
        },
      ],
    },
    {
      name: "customChipSnippet",
      description: "Custom rendering of individual filter chip.",
      properties: [
        {
          name: "filter",
          type: "Filter",
          description: "The filter to render.",
        },
      ],
    },
    {
      name: "appendSnippet",
      description:
        "Slot for appending additional elements to the filter component.",
    },
    {
      name: "headerSnippet",
      description: "Custom rendering for table headers.",
      properties: [
        { name: "head", type: "TableHeader", description: "Header object." },
      ],
      default: `
<span class="header-label">
  {#if headerLabelSnippet}
    {@render headerLabelSnippet({ head })}
  {:else}
    {head.label}
  {/if}
</span>
{#if head.sortable}
  <span
    class="header-sort-icon"
    class:active={sortedBy == head.value}
    class:asc={sortDirection == "asc"}
    class:desc={sortDirection == "desc"}
  >
    {#if sortDirection == "asc"}
      <Icon name="mdi-arrow-up" />
    {:else}
      <Icon name="mdi-arrow-down" />
    {/if}
  </span>
{/if}
      `,
    },
    {
      name: "headerLabelSnippet",
      description: "Custom rendering for header labels.",
      properties: [
        { name: "head", type: "TableHeader", description: "Header object." },
      ],
      default: "{head.label}",
    },
    {
      name: "appendSnippet",
      description: "Custom rendering at the end of rows.",
      properties: [
        { name: "index", type: "number", description: "Row index." },
        { name: "item", type: "Item", description: "Row item." },
      ],
    },
    {
      name: "rowActionsSnippet",
      description: "Custom actions for rows.",
      properties: [
        { name: "index", type: "number", description: "Row index." },
        { name: "item", type: "Item", description: "Row item." },
      ],
    },
    {
      name: "customSnippet",
      description: "Custom cell rendering.",
      properties: [
        { name: "index", type: "number", description: "Row index." },
        { name: "columnIndex", type: "number", description: "Column index." },
        { name: "header", type: "TableHeader", description: "Header object." },
        { name: "item", type: "Item", description: "Row item." },
      ],
    },
    {
      name: "noDataSnippet",
      description: "Custom slot when there are no items.",
      default: `
<NoData {lang} />
      `,
    },
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: "onpaginationChange",
      description: "Fired when pagination values change.",
      properties: [
        {
          name: "rowsPerPage",
          type: "number",
          description: "Number of rows per page.",
        },
        { name: "page", type: "number", description: "Current page number." },
        {
          name: "builder",
          type: "Builder",
          description: "Builder with current query state.",
        },
      ],
    },
    {
      name: "onfiltersChange",
      description: "Fired when the filters change.",
      properties: [
        {
          name: "builder",
          type: "Builder",
          description: "Builder with updated filter state.",
        },
      ],
    },
    {
      name: "onremoveAllFilters",
      description: "Triggered when all filters are removed.",
    },
    {
      name: "onremoveFilter",
      description: "Triggered when an individual filter is removed.",
      properties: [
        {
          name: "filter",
          type: "Filter",
          description: "The filter that was removed.",
        },
      ],
    },
    {
      name: "onsort",
      description: "Triggered when sorting changes.",
      properties: [
        {
          name: "sortedBy",
          type: "string | undefined",
          description: "Column sorted by.",
        },
        {
          name: "sortDirection",
          type: "string",
          description: "Sorting direction.",
        },
        {
          name: "sortModify",
          type: "(params: { builder: FilterBuilder, sortDirection: 'asc' | 'desc' }) => FilterBuilder",
          description: "Column modify.",
        },
      ],
    },
    {
      name: "onrowClick",
      description: "Triggered when a row is clicked.",
      properties: [
        { name: "item", type: "Item", description: "The clicked row item." },
      ],
    },
    {
      name: "onrowDoubleClick",
      description: "Triggered when a row is double clicked.",
      properties: [
        { name: "item", type: "Item", description: "The clicked row item." },
      ],
    },
    {
      name: "oncolumnResize",
      description: "Triggered when a column is resized.",
      properties: [
        { name: "id", type: "string", description: "Column ID." },
        {
          name: "newWidthPx",
          type: "number",
          description: "New column width in pixels.",
        },
      ],
    },
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

  :global(.calculated-class) {
    background-color: rgba(var(--global-color-contrast-200), 0.2);
  }
</style>
