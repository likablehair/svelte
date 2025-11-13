<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import type { Filter } from "$lib/utils/filters/filters";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import DynamicTable from "$lib/components/composed/list/DynamicTable.svelte";
  import type { ComponentProps } from "svelte";
  import FlagIcon from "$lib/components/simple/media/FlagIcon.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";

  let headers : ComponentProps<typeof DynamicTable>['headers'] = [
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
      icon: 'mdi-check'
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

  function handleCustomInput(e: Event, filterName: string, updateFunction?: (filterName: string, newValue: any, newValid: boolean) => void) {
    //@ts-ignore
    let newValue: string = e.target.value
    let isValid = !!newValue && newValue.length > 2
    if(updateFunction){
      updateFunction(filterName, newValue, isValid)
    }
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
    dynamicFilters={false}
    {rows}
    totalRows={100000000}
    onfetchData={() => {
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
    resizableColumns
  >
    {#snippet customFilterSnippet({ filter, updateCustomFilterValues })}
      {#if !!filter}
        {#if filter.name == 'productCategory'}
          <label for="productCategory">Product Category</label>
          <SimpleTextField name="productCategory" bind:value oninput={(e) => handleCustomInput(e, filter.name, updateCustomFilterValues)}></SimpleTextField>
        {/if}
      {/if}
    {/snippet}
    {#snippet customFilterChipSnippet({ filter })}
      {#if filter.name === 'productCategory'}
        <span>Product category equal to {filter.type === 'custom' ? filter.value : undefined}</span>
      {/if}
    {/snippet}
    {#snippet customRowSnippet({ columnIndex, header, index, row, })}
      {#if header.value == 'rating'}
        {row.item.rating}
        <Icon name="mdi-star" --icon-color="green"></Icon>
      {/if}
    {/snippet}
    {#snippet subHeaderSnippet({ subHeader })}
      {#if subHeader.value == 'rating'}
        <FlagIcon alpha2='it'></FlagIcon>
      {/if}
    {/snippet}
  </DynamicTable>
</div>
<h2>READ ME</h2>
<p>If the initial amount of rows is not big enough to generate the scroll, the table will NOT dispatch the fetchData custom event. It is advised to keep the initial number of rows around the number of renderedRowsNumber (default is 100) and always not less that 25</p>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: "headers", type: "Header[]", description: "Main table headers", default: "[]" },
    { name: "headersToShowInTable", type: "Header[]", description: "Headers currently shown in table", default: "headers" },
    { name: "subHeaders", type: "Header[]", description: "Secondary row of headers", default: "[]" },
    { name: "customizeHeaders", type: "boolean", description: "Allow header customization", default: "false" },
    { name: "rows", type: "Row[]", description: "Table row data", default: "[]" },
    { name: "sortedBy", type: "string", description: "Sorted column key", default: "undefined" },
    { name: "sortDirection", type: "'asc' | 'desc'", description: "Sort order direction", default: "'asc'" },
    { name: "cellEdit", type: "boolean", description: "Enable inline cell editing", default: "false" },
    { name: "noItemsText", type: "string", description: "Text shown when no data is present", default: "'No items to show'" },
    { name: "showSelect", type: "boolean", description: "Enable row selection", default: "false" },
    { name: "showActions", type: "boolean", description: "Show actions", default: "true" },
    { name: "selectMode", type: "'single' | 'multiple'", description: "Selection mode", default: "'single'" },
    { name: "selectedItems", type: "RowItem[]", description: "Currently selected items", default: "[]" },
    { name: "unselectedItems", type: "RowItem[]", description: "Unselected items if selectedAll is active", default: "[]" },
    { name: "selectedAll", type: "boolean", description: "Toggles the selectedAll checkbox", default: "false" },
    { name: "showExpand", type: "boolean", description: "Allow row expansion", default: "false" },
    { name: "loading", type: "boolean", description: "Show loading state", default: "false" },
    { name: "disabled", type: "boolean", description: "Disable the table", default: "false" },
    { name: "filters", type: "Filter[]", description: "Filters applied to the table", default: "[]" },
    { name: "searchBarColumns", type: "string[]", description: "Columns to apply search bar filtering", default: "undefined" },
    { name: "searchBarVisible", type: "boolean", description: "Toggle search bar visibility", default: "false" },
    { name: "searchBarPlaceholder", type: "string", description: "Search bar placeholder text", default: "'Type to search...'" },
    { name: "filtersVisible", type: "boolean", description: "Show filters section", default: "false" },
    { name: "quickFiltersVisible", type: "boolean", description: "Show quick filters", default: "false" },
    { name: "lang", type: "'it' | 'en'", description: "Language for internal strings", default: "'en'" },
    { name: "dateLocale", type: "'it' | 'en'", description: "Locale for filter chips", default: "'it'" },
    { name: "editFilterMode", type: "'one-edit' | 'multi-edit'", description: "Filter editing mode", default: "'one-edit'" },
    { name: "showActiveFilters", type: "boolean", description: "Display currently active filters", default: "true" },
    { name: "quickFilters", type: "QuickFilter[]", description: "Quick filter options", default: "[]" },
    { name: "actionsForSelectedItems", type: "Action[]", description: "Actions to show for selected items", default: "[]" },
    { name: "quickActionsDisabled", type: "boolean", description: "Disables quick actions", default: "false" },
    { name: "totalRows", type: "number", description: "Total number of rows", default: "rows.length" },
    { name: "searchText", type: "string", description: "Current search string", default: "undefined" },
    { name: "renderedRowsNumber", type: "number", description: "Number of rows rendered in viewport", default: "100" },
    { name: "sectionRowsNumber", type: "number", description: "Rows per scroll section", default: "20" },
    { name: "sectionThreshold", type: "number", description: "Threshold to trigger new section loading", default: "2" },
    { name: "backwardThresholdPixel", type: "number", description: "Scroll threshold above to load new rows", default: "100" },
    { name: "forwardThresholdPixel", type: "number", description: "Scroll threshold below to load new rows", default: "100" },
    { name: "uniqueKey", type: "keyof RowItem", description: "Field used as unique key", default: "'id'" },
    { name: "numberOfResultsVisible", type: "boolean", description: "Show number of results", default: "false" },
    { name: "resizableColumns", type: "boolean", description: "Enables the resize of the columns", default: "false" },
    { name: "resizedColumnSizeWithPadding", type: "{ [value: string]: number }", description: "The width of the headers", default: "{}" },
    { name: "endLineVisible", type: "boolean", description: "Show end line at bottom", default: "false" },
    { name: "dynamicFilters", type: "boolean", description: "Switch Between Dynamic and normal filters", default: "true" },
    { name: "useSelectedItemsOnly", type: "boolean", description: "Uses only selectedItems if all rows are fetched initially", default: "false" },
    { name: "selectedAllDisabled", type: "boolean", description: "Disabled the selected all", default: "false" },
    { name: "headerDrawerProps", type: "object", description: "Props of the headers drawer", },
    { name: "class", type: "{ container?: string; header?: string; row?: string; cell?: string }", description: "Custom classes for table elements", default: "{}" }
  ]}
  styleProps={[
    { name: "--dynamic-table-cell-editor-background-color", type: "color", description: "Background color for editable cells", default: "rgb(var(--global-color-background-300))" },
    { name: "--dynamic-table-cell-border", type: "color", description: "Border color of each cell", default: "none" },
    { name: "--dynamic-table-quick-filter-background-color", type: "color", description: "Background of quick filter bar", default: "rgb(var(--global-color-background-300))" },
    { name: "--dynamic-table-row-background-color-hover", type: "color", description: "Hover background color for rows", default: "rgb(var(--global-color-background-200))" },
    { name: "--dynamic-table-expanded-row-background-color", type: "color", description: "Background color for expanded rows", default: "rgb(var(--global-color-background-300))" },
    { name: "--dynamic-table-selected-row-background-color", type: "color", description: "Background color of selected rows", default: "rgb(var(--global-color-primary-200))" },
    { name: "--dynamic-table-row-disabled-background-color", type: "color", description: "Background of disabled rows", default: "rgb(var(--global-color-primary-400))" },
    { name: "--dynamic-table-header-background-color", type: "color", description: "Table header background color", default: "rgb(var(--global-color-background-400))" },
    { name: "--dynamic-table-background-color", type: "color", description: "Overall background color of table", default: "transparent" },
    { name: "--dynamic-table-max-height", type: "size", description: "Maximum height of table scroll area", default: "70vh" },
    { name: "--dynamic-table-header-padding", type: "size", description: "Padding for header cells", default: "4px 0 4px 8px" },
    { name: "--dynamic-table-header-font-size", type: "size", description: "Font size for headers", default: "13px" },
    { name: "--dynamic-table-header-font-weight", type: "weight", description: "Font weight of headers", default: "700" },
    { name: "--dynamic-table-subheader-background-color", type: "color", description: "Subheader background color", default: "rgb(var(--global-color-background-100))" },
    { name: "--dynamic-table-hover-color", type: "color", description: "Text color on hover", default: "rgb(var(--global-color-contrast-800), .7)" },
    { name: "--dynamic-table-header-border-radius", type: "size", description: "Border radius of header cells", default: "5px" },
    { name: "--dynamic-table-header-height", type: "size", description: "Height of header row", default: "25px" },
    { name: "--dynamic-table-row-min-height", type: "size", description: "Minimum height for rows", default: "45px" },
    { name: "--dynamic-table-end-line-background-color", type: "color", description: "Background color of end line", default: "transparent" },
    { name: "--dynamic-table-end-line-color", type: "color", description: "Border color of end line", default: "rgb(var(--global-color-contrast-500))" },
    { name: "--dynamic-table-end-line-text-color", type: "color", description: "Text color in end line", default: "rgb(var(--global-color-contrast-500))" },
    { name: "--dynamic-table-border-collapse", type: "border", description: "Table borders collapsed or separated", default: "collapse" },
    { name: "--dynamic-table-header-label-margin", type: "margin", description: "Table header label margin", default: "0px 4px 0px 0px" },
    { name: "--dynamic-table-header-label-font-size", type: "font-size", description: "Table header label font size", default: "small" }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: "searchBarSnippet", description: "Custom search bar", default: `
<div style="margin-right: 20px;">
  <SimpleTextField
    placeholder={searchBarPlaceholder}
    appendInnerIcon="mdi-magnify"
    bind:value={searchText}
    bind:input={searchBarInput}
    onkeydown={handleSearchBoxKeydown}
    --simple-textfield-default-width="450px"
    --simple-textfield-border-radius= 0.5rem
    --simple-textfield-background-color= transparent
    --simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
    --simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
  />
</div>
    `, properties: [{ name: "handleSearchChange", type: "function", description: "Callback for search changes" }] },
    {
      name: "filterAppendSnippet",
      description: "Slot for appending additional elements to the filter component."
    },
    {
      name: "customChipSnippet",
      description: "Custom rendering of individual filter chip.",
      properties: [
        { name: "filter", type: "Filter", description: "The filter to render." }
      ]
    },
    { 
      name: "customFilterSnippet", description: "Custom filter content", properties: [
        { name: "filter", type: "Filter | undefined", description: "The filter definition" },
        { name: "updateCustomFilterValues", type: "function", description: "Updater for custom dynamic filters" },
        { name: "updateFunction", type: "function", description: "Updater for custom normal filters" },
        { name: "mAndDown", type: "boolean", description: "Screen size M and lower" }
      ] 
    },
    { 
      name: 'selectionSnippet', 
      description: 'Renders each selected item.', 
      default: `
<div tabindex="-1">
  <Chip
    close={true}
    onclose={() => unselect(selection)}
    --chip-default-border-radius="var(--autocomplete-border-radius, var(--autocomplete-default-border-radius))"
    buttonTabIndex={-1}
    truncateText
  >
    {#if chipLabelSnippet}
      {@render chipLabelSnippet({ selection })}
    {:else}
      {selection.label}
    {/if}
  </Chip>
</div>
      `, 
      properties: [
        { name: 'selection', type: 'ItemData', description: 'The selected item.' },
        { name: 'unselect', type: 'function', description: 'Function to unselect the item.' }
      ]
    },    
    { 
      name: 'itemLabelSnippet', 
      description: 'Renders the label of an item.', 
      default: '{item.label}', 
      properties: [
        { name: 'item', type: 'ItemData', description: 'The item to render the label for.' }
      ]
    },
    { 
      name: 'chipLabelSnippet', 
      description: 'Renders the label inside each chip.', 
      default: '{selection.label}', 
      properties: [
        { name: 'selection', type: 'ItemData', description: 'The selected item.' }
      ]
    },
    { name: "headerSnippet", description: "Custom header content", default: `
<span class="header-label" bind:this={infoActivators[index]}>
  {#if headerLabelSnippet}
    {@render headerLabelSnippet({ header })}
  {:else}
    {#if !!header.icon}
      <Icon name={header.icon} --icon-size=12px />
    {/if}
    {header.label}
  {/if}
  {#if !!header.info}
    <Icon						
      name="mdi-help-circle-outline"
      --icon-size="14px"
    />
  {/if}
</span>
{#if header.sortable}
  <span
    class="header-sort-icon"
    class:active={sortedBy == header.value}
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
    `, properties: [{ name: "header", type: "Header", description: "Header object" }] },
    { name: "headerLabelSnippet", description: "Custom header label", default: `
{#if !!header.icon}
  <Icon name={header.icon} --icon-size=12px />
{/if}
{header.label}`
      , properties: [{ name: "header", type: "Header", description: "Header object" }] },
    { name: "rowAppendSnippet", description: "Slot appended to each row", properties: [{ name: "index", type: "number", description: "Row index" }, { name: "row", type: "Row", description: "Row item" }] },
    { name: "customRowSnippet", description: "Custom row cell content", properties: [
      { name: "index", type: "number", description: "Row index" },
      { name: "columnIndex", type: "number", description: "Column index" },
      { name: "header", type: "Header", description: "Header definition" },
      { name: "row", type: "Row", description: "Row item" }
    ] },
    { name: "subHeaderSnippet", description: "Subheader custom content", default: `
<span class="header-label">
  {#if subHeaderLabelSnippet}
    {@render subHeaderLabelSnippet({ subHeader })}
  {:else}
    {subHeader.label}
  {/if}
</span>
{#if subHeader.sortable}
  <span
    class="header-sort-icon"
    class:active={sortedBy == subHeader.value}
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
    `, properties: [{ name: "subHeader", type: "Header", description: "Subheader" }] },
    { name: "subHeaderLabelSnippet", description: "Label for subheader", default: "{subHeader.label}", properties: [{ name: "subHeader", type: "Header", description: "Subheader" }] },
    { name: "subRowAppendSnippet", description: "Appended content for sub-rows", properties: [{ name: "index", type: "number", description: "Row index" }, { name: "row", type: "RowItem", description: "Row item" }] },
    { name: "subRowActionsSnippet", description: "Action buttons for sub-rows", properties: [{ name: "index", type: "number", description: "Row index" }, { name: "row", type: "RowItem", description: "Row item" }] },
    { name: "customSubRowSnippet", description: "Custom sub-row cell content", properties: [
      { name: "index", type: "number", description: "Row index" },
      { name: "columnIndex", type: "number", description: "Column index" },
      { name: "header", type: "Header", description: "Header" },
      { name: "row", type: "RowItem", description: "Row item" }
    ] },
    { name: "customQuickFilterSnippet", description: "Slot for quick filter UI", properties: [
      { name: "quickFilter", type: "QuickFilter", description: "Quick filter object" },
      { name: "setQuickFilterMissingValue", type: "function", description: "Callback to mark quick filter as incomplete" }
    ] },
    { name: "appendSnippet", description: "General purpose append slot" },
    { name: "headerDrawerContentSnippet", description: "Headers drawer custom content", },
    { 
      name: "headerDrawerHeadersToAddSnippet", 
      description: "Headers drawer custom items", 
      properties: [
        { name: "item", type: "Header", description: "The item being rendered." }
      ],
      default: `
<div
  style:display=flex
>
  <div
    style:flex-grow=1
  >
    {#if !!item.icon}
      <Icon name={item.icon} />
    {/if}
    {item.name}
  </div>
  <div
    style:display=flex
    style:min-width=50px
    style:justify-content=end
  >
    <Switch
      --switch-label-width="90%"
      value={headersToShow.find((h) => h.id == item.id) != undefined}
      onchange={(e) => {
        if (e.detail.value == false) {
          headersToShow = headersToShow.filter((h) => h.id != item.id);
          availableHeaders = [...availableHeaders, item];
        }
      }}
    />
  </div>
</div>
`
    },
    { 
      name: "headerDrawerItemSnippet",
      description: "Headers drawer custom headers to add", 
      properties: [
        { name: "header", type: "{ id: string; name: string; }", description: "The item being rendered." }
      ],
      default: `
<div
  class="headers-show"
>
  <div
    style:display=flex
  >
    <div
      style:flex-grow=1
    >
      {#if !!header.icon}
        <Icon name={header.icon} />
      {/if}
      {header.name}
    </div>
    <div
      style:display=flex
      style:min-width=50px
      style:justify-content=end
    >
      <Switch
        --switch-label-width="90%"
        value={false}
        onchange={(e) => {
          if (e.detail.value == true) {
            availableHeaders = availableHeaders.filter(
              (h) => h.id != header.id
            );
            headersToShow = [...headersToShow, header];
          }
        }}
      />
    </div>
  </div>
</div>`
    },
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: "onsort",
      description: "Fired when the sort column or direction changes",
      properties: [
        { name: "sortedBy", type: "string | undefined", description: "Sorted column" },
        { name: "sortDirection", type: "string", description: "Sort direction" }
      ]
    },
    {
      name: "onrowClick",
      description: "Fired when a row is clicked",
      properties: [{ name: "item", type: "RowItem", description: "Clicked item" }]
    },
    {
      name: "oncellClick",
      description: "Fired when a cell is clicked",
      properties: [{ name: "item", type: "RowItem", description: "Row item of clicked cell" }]
    },
    {
      name: "onsaveCellEdit",
      description: "Triggered after editing a cell",
      properties: [{ name: "item", type: "any", description: "Updated item" }]
    },
    {
      name: "onsaveHeadersToShow",
      description: "Triggered when the user saves which headers to show",
      properties: [{ name: "headersToShow", type: "Header[]", description: "Selected headers to show" }]
    },
    {
      name: "onfiltersChange",
      description: "Emitted when filters are updated",
      properties: [{ name: "builder", type: "FilterBuilder", description: "Current filter builder state" }]
    },
    {
      name: "onfetchData",
      description: "Emitted to trigger data reload"
    },
    {
      name: "onremoveFilter",
      description: "Triggered when a single filter is removed",
      properties: [{ name: "filter", type: "Filter", description: "Removed filter" }]
    },
    {
      name: "onremoveAllFilters",
      description: "Triggered when all filters are removed"
    },
    {
      name: "onremoveCustomQuickFilter",
      description: "Triggered when a custom quick filter is removed",
      properties: [{ name: "quickFilter", type: "QuickFilter", description: "Quick filter removed" }]
    },
    {
      name: "onapplyCustomQuickFilter",
      description: "Triggered when a custom quick filter is applied",
      properties: [
        { name: "quickFilter", type: "QuickFilter", description: "Quick filter being applied" },
        { name: "setQuickFilterValue", type: "(quickFilter: QuickFilter, value?: any) => void", description: "Function to update the quick filter value" }
      ]
    },
    {
      name: "onscroll",
      description: "Fired on scroll event of the container"
    },
    {
      name: "oncolumnResize",
      description: "Fired when a column is resized",
      properties: [
        {
          name: 'id',
          description: 'The header resized',
          type: 'string'
        },
        {
          name: 'newWidthPx',
          description: 'The new header width',
          type: 'number'
        },
      ]
    },
  ]}
></EventsViewer>

<style>
  :global(.calculated-class) {
    background-color: rgba(var(--global-color-contrast-200), 0.2);
  }
</style>