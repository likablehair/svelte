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
    import EnhancedPaginatedTable from "$lib/components/composed/list/EnhancedPaginatedTable.svelte";

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
      icon: 'mdi-check'
    },
  ],
  headersToShowInTable = $state(headers.filter((h, i) => i % 2 == 0))

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

  let filters: Filter[] | undefined = $state([
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
  ]);
  let value: string | number | undefined = $state(undefined);
  let quickFilters: (Filter & { icon?: string })[] = $state([
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
      icon: 'mdi-card-account-details'
    },
    {
      label: "Product name",
      active: false,
      type: "string",
      name: "productName",
      column: "productName",
      advanced: true,
      mode: "like",
      icon: 'mdi-cube'
    },
  ])

  function handleFiltersChange(
    e: Parameters<
      NonNullable<ComponentProps<typeof PaginatedTable>["onfiltersChange"]>
    >[0],
  ) {
    let filterBuilder: Builder = e.detail.builder;
    console.log(filterBuilder)
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
  >Table and pagination agreement, with an upgrade.</ComponentSubtitle
>
<h2>Example</h2>
<div class="example">
  <EnhancedPaginatedTable
    resizableColumns={true}
    {filters}
    {headers}
    {headersToShowInTable}
    {items}
    searchBarColumns={["businessName", "productName"]}
    totalElements={40}
    onfiltersChange={handleFiltersChange}
    onremoveFilter={(e) => {
      if (e.detail.filter.name == "productCategory") {
        value = undefined;
      }
    }}
    quickFilters={quickFilters}
    quickFiltersVisible={true}
    editFilterMode="multi-edit"
    showActiveFilters={true}
    {calculateRowStyles}
    {calculateRowClasses}
    resizedColumnSizeWithPadding={{
      businessName: 200,
      productName: 200,
      rating: 200,
      progress: 200
    }}
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
    {#snippet appendSnippet({ index, item })}
      {#if index != -1}
        RowActions
      {/if}
    {/snippet}
  </EnhancedPaginatedTable>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: "headersToShowInTable",
      type: "Header[]",
      description: "Defines the table columns to show in the table.",
    },
    { name: "headerDrawerProps", type: "object", description: "Props of the headers drawer", },
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
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
      name: "onsaveHeadersToShow",
      description: "Triggered when the user saves which headers to show",
      properties: [{ name: "headersToShow", type: "Header[]", description: "Selected headers to show" }]
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
    flex-direction: column;
  }

  :global(.calculated-class) {
    background-color: rgba(var(--global-color-contrast-200), 0.2);
  }
</style>
