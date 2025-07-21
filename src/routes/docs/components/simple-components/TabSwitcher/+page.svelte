<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import TabSwitcher from "$lib/components/simple/navigation/TabSwitcher.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
    import type { ComponentProps } from "svelte";

  let dynamicTabs: ComponentProps<typeof TabSwitcher>['tabs'] = $state([
    { name: 'tab1', label: 'Tab 1', icon: 'mdi-plus'},
  ])

  $effect(() => {
    setTimeout(() => {
      dynamicTabs = [
        { name: 'tab2', label: 'Tab 2', icon: 'mdi-minus'},
        ...(dynamicTabs || []),
      ]
    }, 1000);
  })
</script>

<h1>TabSwitcher</h1>
<ComponentSubtitle>Switch to a new tab, switch to a new life.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div style:width="100%">
    <TabSwitcher 
      tabs={[
        { name: 'pippo', label: 'Pippo', icon: 'mdi-cog'},
        { name: 'pluto', label: 'Pluto', icon: 'mdi-cog'},
        { name: 'paperino', label: 'Paperino', icon: 'mdi-cog'},
      ]}
      selected="pippo"
    ></TabSwitcher>
  </div>
  <div style:width="100%">
    <TabSwitcher 
      tabs={dynamicTabs}
      selected="tab1"
    ></TabSwitcher>
  </div>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: 'tabs', type: 'Tab[]', description: 'List of tabs to be displayed', default: '[]' },
    { name: 'selected', type: 'string', description: 'The currently selected tab', default: 'undefined' },
    { name: 'mandatory', type: 'boolean', description: 'Whether a tab must be selected at all times', default: 'true' },
    { name: 'class', type: '{ container?: string, tabs?: string, selected?: string, bookmark?: string, guide?: string }', description: 'CSS classes to customize the component', default: 'undefined' }
  ]}
  styleProps={[
    { name: '--tab-switcher-selected-color', type: 'color', description: 'Color for the selected tab', default: 'rgb(var(--global-color-primary-400))' },
    { name: '--tab-switcher-guide-color', type: 'color', description: 'Color for the guide line below the tabs', default: 'rgb(var(--global-color-contrast-200))' },
    { name: '--tab-switcher-bookmark-color', type: 'color', description: 'Color for the bookmark indicator', default: 'rgb(var(--global-color-primary-400))' },
    { name: '--tab-switcher-gap', type: 'size', description: 'Gap between tabs', default: '1rem' },
    { name: '--tab-switcher-width', type: 'size', description: 'Width of the tab switcher container', default: '100%' }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { 
      name: 'appendSnippet', 
      description: 'A snippet that is appended to the tab container',
    }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
    { 
      name: 'ontabClick', 
      description: 'Triggered when a tab is clicked', 
      properties: [
        { name: 'nativeEvent', type: 'MouseEvent', description: 'The native mouse click event' },
        { name: 'tab', type: 'Tab', description: 'The clicked tab object' }
      ]
    },
    { 
      name: 'ontabKeypress', 
      description: 'Triggered when a key is pressed while focusing on a tab', 
      properties: [
        { name: 'nativeEvent', type: 'KeyboardEvent', description: 'The native keyboard event' },
        { name: 'tab', type: 'Tab', description: 'The tab that was selected via keypress' }
      ]
    }
  ]}
></EventsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }
</style>