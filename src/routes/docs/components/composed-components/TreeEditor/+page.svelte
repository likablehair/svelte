<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import TreeEditor, { type CleanItem, type Item } from "$lib/components/simple/forms/TreeEditor.svelte";
  import { writable } from "svelte/store";

  let items = writable<Item[]>([
      {
        id: 1,
        title: 'ID 1',
        data: {
          ciao: 'sono data'
        }
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
      },
      {
        id: 5,
        title: 'Banana',
        children: [
          {
            id: 6,
            title: 'Strawberry'
          },
          {
            id: 7,
            title: 'Kiwi'
          }
        ]
      },
      {
        id: 8,
        title: 'Orange',
      },
      {
        id: 9,
        title: 'Apple',
        children: [
          {
            id: 10,
            title: 'Watermelon'
          },
          {
            id: 11,
            title: 'Peach'
          }
        ]
      },
      {
        id: 12,
        title: 'Mango',
      },
      {
        id: 13,
        title: 'Banana',
        children: [
          {
            id: 14,
            title: 'Grapes'
          },
          {
            id: 15,
            title: 'Pineapple'
          }
        ]
      },
      {
        id: 16,
        title: 'Pineapple',
      },
      {
        id: 17,
        title: 'Peach',
      },
      {
        id: 18,
        title: 'Mango',
      },
      {
        id: 19,
        title: 'Strawberry',
        children: [
          {
            id: 20,
            title: 'Apple'
          },
          {
            id: 21,
            title: 'Watermelon'
          }
        ]
      },
      {
        id: 22,
        title: 'Kiwi',
      },
      {
        id: 23,
        title: 'Grapes',
        children: [
          {
            id: 24,
            title: 'Orange'
          },
          {
            id: 25,
            title: 'Watermelon'
          }
        ]
      },
      {
        id: 26,
        title: 'Watermelon',
      },
      {
        id: 27,
        title: 'Peach',
      },
      {
        id: 28,
        title: 'Orange',
      },
      {
        id: 29,
        title: 'Grapes',
      },
      {
        id: 30,
        title: 'Banana',
      },
      {
        id: 31,
        title: 'Watermelon',
      },
      {
        id: 32,
        title: 'Grapes',
      },
      {
        id: 33,
        title: 'Mango',
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
    updateItem={(params) => {
      console.log(params.inputData)
      return params.item
    }}
    on:click={(e) => console.log('click', e.detail.item)}
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