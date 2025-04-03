<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Skeleton from "$lib/components/simple/loaders/Skeleton.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
    import Breadcrumb from "$lib/components/simple/navigation/Breadcrumb.svelte";
</script>

<h1>Breadcrumb</h1>
<ComponentSubtitle>Never leave any crumbs left.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Breadcrumb 
    items={[
      { name: "home", title: "Home", },
      { name: "products", title: "Products", },
      { name: "electronics", title: "Electronics", },
      { name: "laptops", title: "Laptops", },
      { name: "gaming-laptop", title: "Gaming Laptop", }
    ]}
  ></Breadcrumb>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: 'items', type: 'BreadcrumbItem[]', description: 'An array of breadcrumb items.' },
    { name: 'underliner', type: 'boolean', description: 'Whether to underline the breadcrumb items.', default: 'true' },
    { name: 'separatorIcon', type: 'string', description: 'The icon used as a separator between breadcrumb items.', default: '"mdi-chevron-right"' },
    { name: 'separatorIconSize', type: 'string', description: 'The size of the separator icon.', default: '"10px"' },
    { name: 'spacing', type: 'string', description: 'Spacing between breadcrumb items.', default: '"20px"' },
  ]}
  styleProps={[]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    {
      name: 'onitemClick',
      description: 'Triggered when a breadcrumb item is clicked.',
      properties: [
        { name: 'item', type: 'BreadcrumbItem', description: 'The clicked breadcrumb item.' },
        { name: 'nativeEvent', type: 'KeyboardEvent', description: 'The keyboard event that triggered the click.' }
      ]
    }
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