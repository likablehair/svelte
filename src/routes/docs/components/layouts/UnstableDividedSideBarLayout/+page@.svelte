<script lang="ts">
  import "../../../../../app.css";
  import UnstableDividedSideBarLayout from "$lib/components/layouts/UnstableDividedSideBarLayout.svelte";
  import type { Filter } from "$lib/utils/filters/filters";
  import type { Header } from "$lib/components/simple/lists/SimpleTable.svelte";
  import PaginatedTable from "$lib/components/composed/list/PaginatedTable.svelte";

  let headers: Header[] = [
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
</script>

<UnstableDividedSideBarLayout
  expandOn="hover"
  options={[
    { label: "Dashboard", name: "dashboard", icon: "mdi-home" },
    { label: "Portfolio", name: "portfolio", icon: "mdi-wallet" },
    { label: "Market", name: "market", icon: "mdi-cloud" },
    { label: "Wallet", name: "wallet", icon: "mdi-newspaper" },
    { label: "News", name: "news", icon: "mdi-store" },
  ]}
>
  <PaginatedTable
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
    showActiveFilters={false}
  ></PaginatedTable>
</UnstableDividedSideBarLayout>

<style>
</style>