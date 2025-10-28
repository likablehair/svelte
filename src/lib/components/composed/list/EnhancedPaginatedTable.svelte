<script lang="ts" generics="Item extends {[key: string]: any}, Data">
    import type { ComponentProps } from "svelte";
    import PaginatedTable from "./PaginatedTable.svelte";
    import HeadersDrawer from "../common/HeadersDrawer.svelte";
    import { Icon } from "$lib";


  interface Props extends ComponentProps<typeof PaginatedTable<Item, Data>> {
    headersToShowInTable: ComponentProps<typeof PaginatedTable<Item, Data>>['headers']
    headerDrawerProps?: ComponentProps<typeof HeadersDrawer>['drawerProps']
    onsaveHeadersToShow?: ComponentProps<typeof HeadersDrawer>['onsaveHeadersToShow']
    headerDrawerContentSnippet?: ComponentProps<typeof HeadersDrawer>['contentSnippet']
    headerDrawerHeadersToAddSnippet?: ComponentProps<typeof HeadersDrawer>['headersToAddSnippet']
    headerDrawerItemSnippet?: ComponentProps<typeof HeadersDrawer>['itemSnippet']
  }

  let {
    headersToShowInTable,
    headerDrawerProps,
    onsaveHeadersToShow,
    headerDrawerContentSnippet,
    headerDrawerItemSnippet,
    headerDrawerHeadersToAddSnippet,
    lang = 'en',
    headers,
    appendSnippet: internalAppendSnippet,
    ...rest
  }: Props = $props()

  let openHeaderDrawer: boolean = $state(false),
    availableHeaders: {
      id: string;
      name: string;
      icon?: string;
    }[] = $state(!!headers
      ? headers
          .filter((h) => {
            return !headersToShowInTable.find((hst) => hst.value == h.value);
          })
          .map((h) => {
            return {
              id: h.value,
              name: h.label,
            };
          })
      : []),
    headersToShow: {
      id: string;
      name: string;
      icon?: string;
    }[] = $state(headersToShowInTable.map((h) => {
      return {
        id: h.value,
        name: h.label,
      };
    }))
</script>

<PaginatedTable {...rest} {lang} {headers}>
  {#snippet appendSnippet({ index, item, })}
    {#if index == -1}
      <Icon
        name="mdi-plus-circle-outline"
        onclick={() => (openHeaderDrawer = true)}
      />
    {/if}
    {@render internalAppendSnippet?.({ index, item, })}
  {/snippet}
</PaginatedTable>

<HeadersDrawer
  bind:open={openHeaderDrawer}
  {lang}
  {onsaveHeadersToShow}
  {availableHeaders}
  {headersToShow}
  contentSnippet={headerDrawerContentSnippet}
  drawerProps={headerDrawerProps}
  headersToAddSnippet={headerDrawerHeadersToAddSnippet}
  itemSnippet={headerDrawerItemSnippet}
/>