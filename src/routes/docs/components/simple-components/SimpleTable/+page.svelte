<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SimpleTable, {
    type Header,
  } from "$lib/components/simple/lists/SimpleTable.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import { DateTime } from "luxon";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";

  let resizedColumnSizeWithPadding: { [value: string]: number } | undefined =
    undefined;

  let headers: Header[] = [
      // {
      //   value: 'true',
      //   label: 'New customer',
      //   type: 'checkbox',
      //   additionalParams :{
      //     checkboxColor:'white',
      //     checkboxSize:'2.1rem'
      //   }
      // },
      {
        value: "active",
        label: "Active",
        type: {
          key: "icon",
          params: {
            name: "mdi-check",
            color: "green",
            size: "2.1rem",
          },
        },
      },
      {
        value: "businessName",
        label: "Business name",
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
        minWidth: "160px",
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
        icon: 'mdi-check',
      },
      {
        value: "startDate",
        label: "Start date ",
        type: {
          key: "date",
          params: {
            locale: "it",
            format: "dd/MM/yyyy",
          },
        },
      },
      {
        value: "activeDate",
        label: "Active date [toLocaleString]",
        type: {
          key: "date",
          params: {
            locale: "en",
            format: "MM-dd-yy",
          },
        },
      },
      {
        value: "endDate",
        label: "End date ",
        type: {
          key: "date",
          params: {
            locale: "it",
            format: "HH 'ore e' mm 'minuti",
          },
        },
      },
    ],
    items = [
      {
        businessName: "GQ Creators",
        productName: "Data Protection",
        progress: "339 sold",
        rating: 5,
        startDate: DateTime.now(),
        activeDate: DateTime.now(),
        endDate: DateTime.now(),
      },
      {
        businessName: "Dribblers Agency",
        productName: "Job Search",
        progress: "212 sold",
        rating: 4.5,
        startDate: DateTime.now(),
        activeDate: DateTime.now(),
        endDate: DateTime.now(),
      },
      {
        businessName: "Popular My",
        productName: "Financial Transactions",
        progress: "94 sold",
        rating: 4.2,
        startDate: DateTime.now(),
        activeDate: DateTime.now(),
        endDate: DateTime.now(),
      },
    ];
</script>

<h1>SimpleTable</h1>
<ComponentSubtitle>Grid beutiful view.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <SimpleTable
    resizableColumns={true}
    bind:resizedColumnSizeWithPadding
    {headers}
    {items}
  >
    {#snippet customSnippet({ columnIndex, header, index, item })}
      {#if header.value == "rating"}
        {item.rating}
        <Icon name="mdi-star" --icon-color="green"></Icon>
      {/if}
    {/snippet}
    {#snippet appendSnippet({ index, item })}
      {#if index == -1}
        Append
      {/if}
    {/snippet}
  </SimpleTable>
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
      name: "resizableColumns",
      type: "boolean",
      description: "Enables column resizing.",
      default: "false",
    },
    {
      name: "resizedColumnSizeWithPadding",
      type: "{ [value: string]: number } | undefined",
      description: "Stores column widths after resizing.",
      default: "undefined",
    },
    {
      name: "pointerOnRowHover",
      type: "boolean",
      description: "Changes the cursor on row hover.",
      default: "false",
    },
    {
      name: "lang",
      type: "'en' | 'it'",
      description: "Language of the table.",
      default: "'en'",
    },
    {
      name: "noItemsText",
      type: "string",
      description: "Message to appear when there are no items",
      default: "No data available",
    },
    {
      name: "loading",
      type: "boolean",
      description: "Adds a loading bar",
      default: "false",
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
      type: "{ container?: string, header?: string, row?: string, cell?: string }",
      description: "CSS class names for table elements.",
      default: "{}",
    },
  ]}
  styleProps={[
    {
      name: "--simple-table-header-hover-color",
      type: "color",
      description: "Hover color for header.",
      default: "rgb(var(--global-color-contrast-800), .7)",
    },
    {
      name: "--simple-table-background-color",
      type: "color",
      description: "Table background color.",
      default: "transparent",
    },
    {
      name: "--simple-table-header-background-color",
      type: "color",
      description: "Header background color.",
      default: "rgb(var(--global-color-background-400))",
    },
    {
      name: "--simple-table-separator-color",
      type: "color",
      description: "Row separator color.",
      default: "rgb(var(--global-color-background-400))",
    },
    {
      name: "--simple-table-header-height",
      type: "size",
      description: "Height of the table header.",
      default: "30px",
    },
    {
      name: "--simple-table-header-border-radius",
      type: "size",
      description: "Border radius of the table header.",
      default: "5px",
    },
    {
      name: "--simple-table-width",
      type: "size",
      description: "Table width.",
      default: "100%",
    },
    {
      name: "--simple-table-row-height",
      type: "size",
      description: "Row height.",
      default: "60px",
    },
    {
      name: "--simple-table-row-hover-background-color",
      type: "color",
      description: "Row hover background color.",
      default: "rgb(var(--global-color-background-200))",
    },
    {
      name: "--simple-table-header-padding",
      type: "size",
      description: "Padding of the table header.",
      default: ".2rem .5rem",
    },
    {
      name: "--simple-table-header-font-weight",
      type: "weight",
      description: "Font weight of the table header.",
      default: "700",
    },
    {
      name: "--simple-table-overflow-x",
      type: "overflow",
      description: "Table horizontal overflow behavior.",
      default: "auto",
    },
    {
      name: "--simple-table-header-label-margin",
      type: "margin",
      description: "Table header label margin.",
      default: "0 5px 0 0",
    },
    {
      name: "--simple-table-loader-height",
      type: "size",
      description: "Table loader height.",
      default: "5px",
    },
    {
      name: "--simple-table-loader-background-color",
      type: "color",
      description: "Table loader color.",
      default: "rgb(var(--global-color-primary-500))",
    },
    {
      name: "--simple-table-loader-border-radius",
      type: "size",
      description: "Table loader border radius.",
      default: "20px",
    },
    { 
      name: "--simple-table-customize-headers-icon-size", 
      type: "size", 
      description: "Size of the icon to open the headers drawer", 
      default: "17px" 
    },
    { 
      name: "--simple-table-non-resizable-header-width", 
      type: "size", 
      description: "Width of non-resizable headers", 
      default: "37px" 
    },
    { 
      name: "--simple-table-sticked-background-color", 
      type: "color", 
      description: "Background color for sticked header", 
      default: "rgb(var(--global-color-background-50))" 
    },
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
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
    {#if !!head.icon}
      <Icon name={head.icon}/>
    {/if}
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
      `
    },
    {
      name: "headerLabelSnippet",
      description: "Custom rendering for header labels.",
      properties: [
        { name: "head", type: "TableHeader", description: "Header object." },
      ],
      default: `
{#if !!head.icon}
  <Icon name={head.icon}/>
{/if}
{head.label}`
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
      name: "prependSnippet",
      description: "Custom rendering at the start of rows.",
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
    {
      name: 'stickyAppendSnippet',
      description: 'Appends a sticky header',
    },
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
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
</style>
