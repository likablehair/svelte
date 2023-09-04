<script context="module" lang="ts">
    
  export type HeaderColumnDateFormat = "toISO" | "toISODate" | "toLocaleString" | 'setLocale' | 'fromISO'
  
  export type ColumnDate = {
      key: "date",
      params: {
        format?: HeaderColumnDateFormat,
      }
  }

  export type ColumnIcon = {
      key: "icon",
      params: {
          name: string,
          color: string,
          size: string
      }
  }

  export type HeaderTypeAdvanced =  ColumnDate | ColumnIcon
  export type HeaderType = "boolean" | "string" | "number"  | "custom" | 'checkbox';

  export type Header = {
    value: string;
    label: string;
    type: HeaderType | HeaderTypeAdvanced; 
    width?: string;
    minWidth?: string;
    sortable?: boolean;
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    data?: { [key: string]: any };
  };
</script>

<script lang="ts">
  import '../../../css/main.css'
  import './SimpleTable.css'
  import { dateToString } from "$lib/components/simple/dates/utils";
  import Icon from '../media/Icon.svelte';
  import Checkbox from '../forms/Checkbox.svelte';
  import { createEventDispatcher } from 'svelte';
  import { includes } from 'lodash'
  import { DateTime } from 'luxon';

  

  const dispatch = createEventDispatcher<{
    'sort': {
      sortedBy: string | undefined,
      sortDirection: string
    }
  }>()

  export let headers: Header[] = [],
    items: { [key: string]: any }[] = [],
    sortedBy: string | undefined = undefined,
    sortDirection: 'asc' | 'desc' = 'asc';

  function handleHeaderClick(header: Header) {
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

  
  function isHeaderTypeDate(header: Header) {
    return typeof header.type === 'object' && header.type.key === "date";
  }
  function isHeaderTypeIcon(header: Header) {
    return typeof header.type === 'object' && header.type.key === "icon";
  }
  function formatDate(dateTime: DateTime, format?: HeaderColumnDateFormat): string | null  {
    const _format = format || 'toISO';
    console.log(dateTime)
    if(!!dateTime) {    
      const formatFunctions: Record<HeaderColumnDateFormat, () => string | null> = {
      toLocaleString: () =>  dateTime.toLocaleString(),
      toISO: () =>  dateTime.toISO(),
      toISODate: () => dateTime.toISODate(),
      setLocale: () => dateTime.setLocale('it').toFormat('yyyy MM dd'),
      fromISO: () =>   DateTime.fromISO(dateTime.toISO()).toFormat('ff') 
      };  

      return formatFunctions[_format](); 
    } 
    else return null;  

  }

  function handleFormatDateHeader(dateTime: DateTime, format?: HeaderColumnDateFormat) {
    
    const formattedDate = formatDate(dateTime, format);
    return formattedDate
  }

  function handleCheckboxValue(value: any) {
    console.log(value)
    return true
  }



</script>

{#if !!items && Array.isArray(items)}
  <div class="simple-table-container">
    <table class="table">
      <thead class="thead">
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
          <tr class="item-tr">
            {#each headers as header, j}
              <td>
                {#if header.type == "custom"}
                  <slot
                    name="custom"
                    index={i}
                    columnIndex={j}
                    {header}
                    {item}
                  />
                {:else if  typeof header.type === 'object' &&  header.type.key == "date"}
                  {handleFormatDateHeader(item[header.value], header.type.params?.format)}
                {:else if  typeof header.type === 'object' &&  header.type.key == "icon"}
                    <Icon  --icon-color={header.type.params?.color }  
                           --icon-size={header.type.params?.size} 
                           name={header.type.params?.name || ''}/>
                <!-- {:else if header.type == "checkbox"} <Checkbox  bind:value={handleCheckboxValue(item[header.value])} disabled ></Checkbox>     -->
                {:else} 
                  {item[header.value]}
                {/if}
              </td>
            {/each}
            {#if $$slots.rowActions || $$slots.append}
              <td>
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
