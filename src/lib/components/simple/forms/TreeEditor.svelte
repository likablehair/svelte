<script lang="ts" context="module">
  export type Item = {
    id: number | string,
    title: string,
    expanded?: boolean,
    sortable?: Sortable
    children?: Item[],
    data?: any
  };

  export type CleanItem = {
    id: number | string,
    title: string,
    expanded?: boolean,
    children?: CleanItem[],
    data?: any
  };
</script>

<script lang="ts">
  import Sortable from 'sortablejs';
  import { onMount, createEventDispatcher, type ComponentProps } from 'svelte';
  import TreeEditorItem from './TreeEditorItem.svelte';
  import { createId } from '@paralleldrive/cuid2';
  import lodash from 'lodash';

  let dispatch = createEventDispatcher<{
    'change': {
      items: Item[]
    },
    'input': {
      item: Item
    },
  }>()

  export let items: Item[] = [],
    groupName: string = createId(),
    cleanItems: CleanItem[] = convertItemsInClean(items),
    collapsable: boolean = true,
    editable: boolean = true,
    updateItem: ComponentProps<TreeEditorItem>['updateItem'] = ({ item }) => { return item }

  let itemList: HTMLElement,
    sortable: Sortable | undefined = undefined,
    rerender: boolean = true,
    mounted: boolean = false

  onMount(() => {
    mounted = true
    initSortable()
  })

  async function initSortable() {
    if(!mounted) return

    sortable = Sortable.create(itemList, {
      handle: '.handle',
      group: groupName,
      animation: 150,
      ghostClass: 'ghost-drag-element',
      onEnd(event) {
        sortTree()
      }
    })
  }

  $: if(!!items) initSortable() 

  function handleEnd(event: CustomEvent<{ ev: Sortable.SortableEvent }>) {
    sortTree()
  }

  async function sortTree() {
    let clonedItems = lodash.cloneDeep(items)
    let sortedItems = sortSubTree(clonedItems, items, sortable, 'main')

    dispatch('change', {
      items: sortedItems
    })

    items = sortedItems
    rerender = !rerender
  }

  function sortSubTree(totalItems: Item[], itemsToSort: Item[], parentSortable: Sortable | undefined, parentId?: Item['id']): Item[] {
    if(!parentSortable) throw new Error('Parent sortable could not be undefined')
    parentSortable.save()

    for(let i = 0; i < itemsToSort.length; i += 1) {
      let itemToSort = itemsToSort[i]
      
      if(!!itemToSort.children) {
        itemsToSort[i].children = sortSubTree(totalItems, itemToSort.children, itemToSort.sortable, itemToSort.id)
      }
    }

    let orderedIds: Item['id'][] = []
    for(let k = 0; k < parentSortable.el.children.length; k += 1) {
      let id = parentSortable.el.children[k].getAttribute('data-sortable-id')?.toString()
      if(!id) throw new Error('All html element must have data-sortbale-id')
      orderedIds.push(id)
    }

    let newItems: Item[] = []
    for(let j = 0; j < orderedIds.length; j += 1) {
      let id = orderedIds[j]
      let itemIndex = itemsToSort.findIndex((its) => its.id.toString() == id)
      if(itemIndex === -1) {
        let itemToAdd = findItem(totalItems, id)
        if(!itemToAdd) continue

        newItems.push(itemToAdd)
      } else {
        newItems.push(itemsToSort[itemIndex])
      }
    }

    return newItems
  }

  function findItem(itemsToSearch: Item[], id: Item['id']): Item | undefined {
    for(let i = 0; i < itemsToSearch.length; i += 1) {
      let item = itemsToSearch[i]

      if(item.id == id) return item

      if(!!item.children) {
        let result = findItem(item.children, id)
        if(!!result) return result
      }
    }
  }

  function convertItemsInClean(items: Item[]): CleanItem[] {
    return items.map((i) => {
      return {
        id: i.id,
        title: i.title,
        expanded: i.expanded,
        children: !!i.children ? convertItemsInClean(i.children) : [],
        data: i.data
      }
    })
  }

  $: cleanItems = convertItemsInClean(items)
</script>

{#key rerender}
  <ul 
    class="main-ul"
    bind:this={itemList}
  >
    {#each items as item (item.id)}
      <TreeEditorItem
        title={item.title}
        id={item.id}
        group={groupName}
        data={item.data}
        bind:updateItem
        bind:collapsable
        bind:editable
        bind:subItems={item.children}
        bind:expanded={item.expanded}
        bind:sortable={item.sortable}
        on:end={handleEnd}
        on:input={(e) => {
          if(e.detail.item.id == item.id) {
            item = e.detail.item
            if(!!updateItem) item = updateItem({ item: e.detail.item, inputData: e.detail.inputData })
          }

          dispatch('input', {
            item
          })
        }}
        on:click
      >
        <svelte:fragment slot="append" let:item let:doUpdateItem >
          <slot name="append" item={item} {doUpdateItem}>
          </slot>
        </svelte:fragment>
      </TreeEditorItem>
    {/each}
  </ul>
{/key}
  
<style>

  .main-ul {
    padding: 0px;
    padding-bottom: 30px;
    list-style: none;
  }
</style>