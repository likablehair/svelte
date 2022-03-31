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
      name: 'Carousel',
      url: 'media/Carousel'
    }, {
      name: 'Card',
      url: 'common/Card'
    }, {
      name: 'Calendar',
      url: 'dates/Calendar'
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
    },
  ]

  import '$lib/common/tailwind.css'
</script>

<svelte:head>
  <title>Svelte likablehair components kit</title>
</svelte:head>

<div class="flex items-center justify-center pt-10">
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