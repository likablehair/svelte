<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import SimpleTable from "$lib/components/simple/lists/SimpleTable.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
</script>

<h1>SimpleTable</h1>
<ComponentSubtitle>Grid beutiful view.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <SimpleTable 
    headers={[
      {
        value: 'businessName',
        label: 'Business name',
        type: 'string',
      }, {
        value: 'productName',
        label: 'Product Name',
        type: 'string',
      }, {
        value: 'progress',
        label: 'Progress',
        type: 'string',
      }, {
        value: 'rating',
        label: 'Rating',
        type: 'custom',
      }
    ]}
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
  >
      <svelte:fragment slot="custom" let:header let:item>
        {#if header.value == 'rating'}
          {item.rating}
          <Icon name="mdi-star" --icon-color="green"></Icon>
        {/if}
      </svelte:fragment>
  </SimpleTable>
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