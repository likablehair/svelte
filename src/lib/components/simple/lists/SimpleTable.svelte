<script context="module" lang="ts">
  export type HeaderType = ColumnBoolean | 
    ColumnString | 
    ColumnNumber | 
    ColumnDate | 
    ColumnIcon | 
    ColumnCheckBox | 
    ColumnCustom 

  export type Header = {
    value: string
    label: string
    type: HeaderType
    width?: string
    minWidth?: string
    sortable?: boolean
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    data?: { [key: string]: any }
  };

  export interface Item {
    [key: string]: any;
  }

  export type CalculateRowStyles = (item: Item) => {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string;
  };

  export type CalculateRowClasses = (item: Item) => string | undefined;
</script>

<script lang="ts">
  import '../../../css/main.css'
  import './SimpleTable.css'
  import Icon from '../media/Icon.svelte';
  import { createEventDispatcher } from 'svelte';
  import type { DateTime } from 'luxon';
  import type { ColumnBoolean, ColumnCheckBox, ColumnCustom, ColumnDate, ColumnIcon, ColumnNumber, ColumnString } from './columnTypes';

  let clazz: {
    container?: string;
    header?: string;
    row?: string;
    cell?: string;
  } = {};
	export { clazz as class };

  const dispatch = createEventDispatcher<{
    'sort': {
      sortedBy: string | undefined,
      sortDirection: string
    },
    'rowClick': {
      item: Item
    }
  }>()

  export let headers: Header[] = [],
    items: Item[] = [],
    sortedBy: string | undefined = undefined,
    sortDirection: "asc" | "desc" = "asc";

  export let calculateRowStyles: CalculateRowStyles | undefined = undefined;
  export let calculateRowClasses: CalculateRowClasses | undefined = undefined;

  function handleHeaderClick(header: Header) {
    if(header.sortable) {
      if(!!sortedBy && header.value == sortedBy) {
        if(sortDirection == 'asc') sortDirection = 'desc'
        else if(sortDirection == 'desc') {
          sortedBy = undefined
        }
      } else {
        sortedBy = header.value
        sortDirection = 'asc'
      }
      dispatch('sort', {
        sortedBy, sortDirection
      })
    }
  }

  function handleRowClick(item: { [key: string]: any }) {
    dispatch('rowClick', {
      item
    })
  }

  function formatDate(dateTime: DateTime, dateFormat: ColumnDate['params']): string  {
    return dateTime.setLocale(dateFormat.locale).toFormat(dateFormat.format)
  }
</script>

{#if !!items && Array.isArray(items)}
  <div class="simple-table-container {clazz.container || ''}">
    <table class="table">
      <thead class="thead {clazz.header || ''}">
        <tr>
          {#each headers as head}
            <th
              style:width={head.width}
              style:min-width={head.minWidth}
              class:sortable={head.sortable}
              on:click={() => handleHeaderClick(head)}
            >
              <slot name="header" {head}>
                <span class="header-label">
                  <slot name="headerLabel">
                    {head.label}
                  </slot>
                </span>
                {#if head.sortable}
                  <span
                    class="header-sort-icon"
                    class:active={sortedBy == head.value}
                    class:asc={sortDirection == "asc"}
                    class:desc={sortDirection == "desc"}
                  >
                    {#if sortDirection == "asc"}
                      <Icon name="mdi-arrow-up" />
                    {:else}
                      <Icon name="mdi-arrow-down" />
                    {/if}
                  </span>
                {/if}
              </slot>
            </th>
          {/each}
          {#if $$slots.rowActions || $$slots.append}
            <th>
              <slot name="append" index={-1} items={undefined} />
            </th>
          {/if}
        </tr>
      </thead>
      <tbody>
        {#each items as item, i}
          {@const styles = !!calculateRowStyles ? calculateRowStyles(item) : {}}
          {@const classes = !!calculateRowClasses ? calculateRowClasses(item) : ""}
          <tr
            class="item-tr {clazz.row || ''} {classes}"
            on:click={() => handleRowClick(item)}
            style:background-color={styles.backgroundColor}
            style:color={styles.color}
            style:font-weight={styles.fontWeight}
          >
            {#each headers as header, j}
              <td class="{clazz.cell || ''}">
                {#if header.type.key == "custom"}
                  <slot
                    name="custom"
                    index={i}
                    columnIndex={j}
                    {header}
                    {item}
                  />
                {:else if  header.type.key == "date"}
                  {formatDate(item[header.value], header.type.params)}
                {:else if header.type.key == "icon"}
                  <Icon
                    --icon-color={header.type.params?.color}
                    --icon-size={header.type.params?.size}
                    name={header.type.params?.name || ""}
                  />
                {:else if header.type.key == 'string'}
                  {#if item[header.value] !== undefined && item[header.value] !== null}
                    {item[header.value]}
                  {:else if !!header.type.params?.nullText}
                    {#if typeof header.type.params.nullText == 'function'}
                      {header.type.params.nullText(item)}
                    {:else}
                      {header.type.params.nullText}
                    {/if}
                  {:else}
                    {item[header.value]}
                  {/if}
                {:else} 
                  {item[header.value]}
                {/if}
              </td>
            {/each}
            {#if $$slots.rowActions || $$slots.append}
              <td class="{clazz.cell || ''}">
                <slot name="rowActions" index={i} {item} />
                <slot name="append" index={i} {item} />
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .simple-table-container {
    width: var(--simple-table-width, var(--simple-table-default-width));
    min-width: var(
      --simple-table-min-width,
      var(--simple-table-default-min-width)
    );
    max-width: var(
      --simple-table-max-width,
      var(--simple-table-default-max-width)
    );
    height: var(--simple-table-height, var(--simple-table-default-height));
    min-height: var(
      --simple-table-min-height,
      var(--simple-table-default-min-height)
    );
    max-height: var(
      --simple-table-max-height,
      var(--simple-table-default-max-height)
    );
    overflow-x: var(
      --simple-table-overflow-x,
      var(--simple-table-default-overflow-x)
    );
  }

  .table {
    background-color: var(
      --simple-table-background-color,
      var(--simple-table-default-background-color)
    );
  }

  .thead th {
    background-color: var(
      --simple-table-header-background-color,
      var(--simple-table-default-header-background-color)
    );
    padding: var(
      --simple-table-header-padding,
      var(--simple-table-default-header-padding)
    );
    font-size: var(
      --simple-table-header-font-size,
      var(--simple-table-default-header-font-size)
    );
    font-weight: var(
      --simple-table-header-font-weight,
      var(--simple-table-default-header-font-weight)
    );
  }

  .thead th.sortable {
    cursor: pointer;
    transition: all 0.1s ease-in;
    user-select: none;
  }

  .thead th.sortable:hover {
    color: var(
      --simple-table-header-hover-color,
      var(--simple-table-default-hover-color)
    );
  }

  .header-label {
    margin-right: 5px;
  }

  .header-sort-icon {
    display: none;
  }

  .header-sort-icon.active {
    display: inline;
  }

  .thead th:first-child {
    border-top-left-radius: var(
      --simple-table-header-border-radius,
      var(--simple-table-default-header-border-radius)
    );
    border-bottom-left-radius: var(
      --simple-table-header-border-radius,
      var(--simple-table-default-header-border-radius)
    );
  }

  .thead th:last-child {
    border-top-right-radius: var(
      --simple-table-header-border-radius,
      var(--simple-table-default-header-border-radius)
    );
    border-bottom-right-radius: var(
      --simple-table-header-border-radius,
      var(--simple-table-default-header-border-radius)
    );
  }

  .thead {
    height: var(
      --simple-table-header-height,
      var(--simple-table-default-header-height)
    );
  }

  .item-tr {
    border-bottom: solid;
    border-width: 1px 0;
    border-color: var(
      --simple-table-separator-color,
      var(--simple-table-default-separator-color)
    );
    height: var(
      --simple-table-row-height,
      var(--simple-table-default-row-height)
    );
    transition: background-color 0.1s ease-in-out;
  }

  .item-tr:hover {
    background-color: var(
      --simple-table-row-hover-background-color,
      var(--simple-table-default-row-hover-background-color)
    );
  }

  table {
    border-collapse: collapse;
    width: 100%;
  }

  th {
    text-align: start;
    padding-left: 10px;
    min-width: 100px;
  }

  td {
    padding-left: 10px;
  }
</style>
