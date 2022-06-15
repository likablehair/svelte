<script lang="ts">
  interface Component {
    name: string,
    url: string
  }

  let components: Component[] = [
    {
      name: 'ImageGrid',
      url: 'media/ImageGrid'
    }, {
      name: 'Gallery',
      url: 'media/Gallery'
    }, {
      name: 'Carousel',
      url: 'media/Carousel'
    }, {
      name: 'Card',
      url: 'common/Card'
    }, {
      name: 'Skeleton',
      url: 'loaders/Skeleton'
    }, {
      name: 'CircularLoader',
      url: 'loaders/CircularLoader'
    }, {
      name: 'Calendar',
      url: 'dates/Calendar'
    }, {
      name: 'MonthSelector',
      url: 'dates/MonthSelector'
    }, {
      name: 'YearSelector',
      url: 'dates/YearSelector'
    }, {
      name: 'Textfield',
      url: 'forms/Textfield'
    }, {
      name: 'HeaderMenu',
      url: 'navigation/HeaderMenu'
    }, {
      name: 'Button',
      url: 'buttons/Button'
    }, {
      name: 'TabSwitcher',
      url: 'navigation/TabSwitcher'
    }, {
      name: 'SimpleTimeLine',
      url: 'timeline/SimpleTimeLine'
    }, {
      name: 'ScrollTimeLine',
      url: 'timeline/ScrollTimeLine'
    }, {
      name: 'Breadcrumb',
      url: 'navigation/Breadcrumb'
    }, {
      name: 'Avatar',
      url: 'media/Avatar'
    }, {
      name: 'DescriptiveAvatar',
      url: 'media/DescriptiveAvatar'
    }, {
      name: 'AttachmentDownloader',
      url: 'media/AttachmentDownloader'
    }, {
      name: 'ProductCard',
      url: 'shop/ProductCard'
    }, {
      name: 'ProductsGrid',
      url: 'shop/ProductsGrid'
    }, {
      name: 'Drawer',
      url: 'navigation/Drawer'
    }, {
      name: 'Navigator',
      url: 'navigation/Navigator'
    },  {
      name: 'MediaQuery',
      url: 'common/MediaQuery'
    }, {
      name: 'Dialog',
      url: 'dialogs/Dialog'
    },
  ]

</script>

<svelte:head>
  <title>Svelte likablehair components kit</title>
</svelte:head>

<div 
  style:display="flex"
  style:justify-content="center"
  style:align-items="center"
  style:padding-top="20px"
>
  <table>
    <thead>
      <th>Component Name</th>
      <th>URL</th>
    </thead>
    <tbody>
      {#each components as component }
        <tr>
          <td>{component.name}</td>
          <td>
            <a href={component.url}>{component.url}</a>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>


<style>
  table {
    border-spacing: 0px;
  }

  td, th {
    border: 1px solid black;
    border: 1px solid black;
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 5px;
    padding-bottom: 5px;
    min-width: 200px;
  }
</style>