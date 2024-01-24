<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import TreeEditor, { type CleanItem, type Item } from "$lib/components/simple/forms/TreeEditor.svelte";
  import { writable } from "svelte/store";

  let items = writable<Item[]>([
      {
        id: 1,
        title: 'ID 1',
      },
      {
        id: 2,
        title: 'ID 2',
        children: [
          {
            id: 3,
            title: 'ID 3'
          },
          {
            id: 4,
            title: 'ID 4'
          },
        ]
      }
    ])

  let cleanItems: CleanItem[]
</script>

<h1>TreeEditor</h1>
<ComponentSubtitle>Save the trees.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <TreeEditor
    bind:items={$items}
    bind:cleanItems={cleanItems}
  ></TreeEditor>
  <div class="descriptor">
    {JSON.stringify(cleanItems)}
  </div>
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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    margin-bottom: 20px;
  }

  .descriptor {
    margin-top: 10px;
  }
</style>