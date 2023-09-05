<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import PaginatedTable from "$lib/components/composed/list/PaginatedTable.svelte";
  import type {Filter} from "$lib/utils/filters/filters"
  import type { Header } from "$lib/components/simple/lists/SimpleTable.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";

  let headers : Header[] =[
      {
        value: 'businessName',
        label: 'Business name',
        type: {
          key:"string"
        }
      }, {
        value: 'productName',
        label: 'Product Name',
        type: {
          key:"string"
        },
        sortable: true,
      }, {
        value: 'progress',
        label: 'Progress',
        type: {
          key:"string"
        },
      }, {
        value: 'rating',
        label: 'Rating',
        type: {
          key:"custom"
        },     
        sortable: true,
      }
    ]
    
  let filters: Filter[] | undefined  = [{
    label: "Business name",
    active: false,
    type: 'string',
    name: "businessName",
    column: "businessName"
  }]
    
</script>

<h1>PaginatedTable With Filter Panel</h1>
<ComponentSubtitle>Table and pagination agreement with filter.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <PaginatedTable
    filters={filters}
    headers={headers}
    items={[
      {
        businessName: 'GQ Creators',
        productName: 'Data Protection',
        progress: '339 sold',
        rating: 5
      }, {
        businessName: 'Dribblers Agency',
        productName: 'Job Search',
        progress: '212 sold',
        rating: 4.5
      }, {
        businessName: 'Popular My',
        productName: 'Financial Transactions',
        progress: '94 sold',
        rating: 4.2
      },
    ]}
    totalElements={40}
  >
  <svelte:fragment slot="custom" let:header let:item>
    {#if header.value == 'rating'}
      {item.rating}
      <Icon name="mdi-star" --icon-color="green"></Icon>
    {/if}
  </svelte:fragment>
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
</style>