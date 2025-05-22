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
    sortModify?: (params: { builder: FilterBuilder, sortDirection: 'asc' | 'desc' }) => FilterBuilder
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
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import type { DateTime } from 'luxon';
  import type { ColumnBoolean, ColumnCheckBox, ColumnCustom, ColumnDate, ColumnIcon, ColumnNumber, ColumnString } from './columnTypes';
  import type { FilterBuilder } from '$lib';

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
      sortModify: Header['sortModify']
    },
    'rowClick': {
      item: Item
    },
    'rowDoubleClick': {
      item: Item
    },
    columnResize: {
      id: string,
      newWidthPx: number
    }
  }>()

  export let headers: Header[] = [],
    items: Item[] = [],
    sortedBy: string | undefined = undefined,
    sortDirection: "asc" | "desc" = "asc",
    resizableColumns: boolean = false,
    resizedColumnSizeWithPadding: { [value: string]: number } = {},
    pointerOnRowHover: boolean = false,
    doubleClickActive: boolean = false,
    doubleClickDelay: number = 250;

  let clickTimeout: NodeJS.Timeout | undefined = undefined,
    sortModify: Header['sortModify'],
    tableContainer: HTMLElement,
    mainHeader: HTMLElement,
    remainingWidth: number = 0,
    resizeObserver: ResizeObserver


  export let calculateRowStyles: CalculateRowStyles | undefined = undefined;
  export let calculateRowClasses: CalculateRowClasses | undefined = undefined;

  onMount(() => {
    if(resizableColumns) {
      for(const head of [...headers, { value: 'slot-append' }]) {
        let th
        if(head.value == 'slot-append') {
          th = document.getElementsByClassName(head.value).item(0) as HTMLElement
        } else {
          th = document.getElementById(head.value) as HTMLElement
        }
        if(!!th) {
          let widthWihtPadding;
          if (!!resizedColumnSizeWithPadding[head.value]) {
            widthWihtPadding = resizedColumnSizeWithPadding[head.value];
          } else {
            widthWihtPadding = th.getBoundingClientRect().width;
            resizedColumnSizeWithPadding[head.value] = widthWihtPadding;
          }
        }
      }

      for(const head of [...headers, { value: 'slot-append' }]) {
        let th
        if(head.value == 'slot-append') {
          th = document.getElementsByClassName(head.value).item(0) as HTMLElement
        } else {
          th = document.getElementById(head.value) as HTMLElement
        }
        if(!!th) {
          let { paddingLeft, paddingRight } = getComputedStyle(th);
          let width = resizedColumnSizeWithPadding[head.value] - parseFloat(paddingLeft) - parseFloat(paddingRight);
          th.style.width = `${width}px`
        }
      }

      let table = document.getElementsByClassName('table')[0] as HTMLElement
      table.classList.add('resizable')

      resizeObserver = new ResizeObserver(() => {
        updateRemainingWidth();
      });
      resizeObserver.observe(tableContainer);

      return () => {
        resizeObserver?.disconnect();
      };
    }
  })


  function handleHeaderClick(header: Header) {
    if(header.sortable) {
      if(!!sortedBy && header.value == sortedBy) {
        if(sortDirection == 'asc') sortDirection = 'desc'
        else if(sortDirection == 'desc') {
          sortedBy = undefined
          sortModify = undefined
        }
      } else {
        sortedBy = header.value
        sortDirection = 'asc'
        sortModify = header.sortModify
      }
      dispatch('sort', {
        sortedBy, sortDirection, sortModify
      })
    }
  }

  function handleRowClick(item: { [key: string]: any }) {
    if(doubleClickActive) {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = undefined;
    
        dispatch('rowDoubleClick', { item });
      } else {
        clickTimeout = setTimeout(() => {
          dispatch('rowClick', { item });
          clickTimeout = undefined;
        }, doubleClickDelay);
      }
    } else {
      dispatch('rowClick', { item });
    }
}

  function formatDate(dateTime: DateTime, dateFormat: ColumnDate['params']): string  {
    return dateTime.setLocale(dateFormat.locale).toFormat(dateFormat.format)
  }


  function resize(node: HTMLElement) {
    let th: HTMLElement | null = node.parentElement
    let thead: Element | null = document.getElementsByClassName('thead').item(0)

    if(!!th && !!thead && thead instanceof HTMLElement) {
      let resizing = false
      let { width } = th.getBoundingClientRect()

      function mouseMoveHandler(e: MouseEvent) {
        if(resizing && !!th) {
          width += e.movementX
          let { paddingLeft, paddingRight } = getComputedStyle(th)

          let minWidth: string | undefined = headers.find(h => h.value === th.id)?.minWidth
          let minWidthPx: number | undefined = undefined
          if(!!minWidth && minWidth.endsWith('px')) {
            minWidthPx = parseInt(minWidth, 10)
          }

          let actualMinWidth = (minWidthPx || 50) - parseFloat(paddingLeft) - parseFloat(paddingRight)
          if(width > actualMinWidth) {
            th.style.width = width + 'px'
            resizedColumnSizeWithPadding[th.id] = th.getBoundingClientRect().width
            dispatch('columnResize', {
              id: th.id,
              newWidthPx: width
            })
          }
        }
      }

      function mouseUpHandler(e: MouseEvent) {
        if(!!th) {
          resizing = false
          let { paddingLeft, paddingRight } = getComputedStyle(th)
          width = th.getBoundingClientRect().width - parseFloat(paddingLeft) - parseFloat(paddingRight)
        }
      }

      function mouseDownHandler(e: MouseEvent) {
        if(!!th) {
          e.stopPropagation()
          resizing = true
          let { paddingLeft, paddingRight } = getComputedStyle(th)
          width = th.getBoundingClientRect().width - parseFloat(paddingLeft) - parseFloat(paddingRight)
        }
      }

      node.addEventListener('mousedown', mouseDownHandler)
      document.addEventListener('mouseup', mouseUpHandler)
      document.addEventListener('mousemove', mouseMoveHandler)


      return {
        destroy() {
          node.removeEventListener('mousedown', mouseDownHandler)
          document.removeEventListener('mouseup', mouseUpHandler)
          document.removeEventListener('mousemove', mouseMoveHandler)
        }
      }
    }
  }

  $: if (
    resizableColumns &&
    !!tableContainer &&
    resizableColumns &&
    headers.length > 0 &&
    resizedColumnSizeWithPadding &&
    mainHeader
  ) {
    tick().then(updateRemainingWidth);
  }
  
  async function updateRemainingWidth() {
    if(tableContainer != null && !!tableContainer) {
      const containerWidth = tableContainer?.getBoundingClientRect().width - 30;

      if(containerWidth){
        const totalResizableWidth = headers.reduce((sum, head) => {
          let th = document.getElementById(head.value)
          if(!!th) {
            resizeHeader(th, head)
          }
          const width = th?.getBoundingClientRect().width || 0
          return sum + width + 1;
        }, 0);
    
        const extraStaticWidth = Array.from(mainHeader.querySelectorAll('th.non-resizable, th.slot-append, th.customize-headers'))
          .reduce((sum, th) => sum + th.getBoundingClientRect().width + 1, 0);
    
        remainingWidth = Math.max(0, containerWidth - totalResizableWidth - extraStaticWidth);
      }
    }
  }

  function resizeHeader(th: HTMLElement, header: { value: string, minWidth?: string, maxWidth?: string }){
    if (!resizedColumnSizeWithPadding[header.value]) {
      let widthWihtPadding = th.getBoundingClientRect().width
      resizedColumnSizeWithPadding[header.value] = widthWihtPadding;
    }
    let { paddingLeft, paddingRight } = getComputedStyle(th);
    let width = resizedColumnSizeWithPadding[header.value] - parseFloat(paddingLeft) - parseFloat(paddingRight);
    th.style.width = `${width}px`
  }

</script>

{#if !!items && Array.isArray(items)}
  <div class="simple-table-container {clazz.container || ''}" class:resizable={resizableColumns} bind:this={tableContainer}>
    <table class="table">
      <thead class="thead {clazz.header || ''}" bind:this={mainHeader}>
        <tr>
          {#each headers as head}
            <th
              tabindex="0"
              style={`${resizableColumns || !head.width ? '' : `width: ${head.width}`}`}
              style:min-width={head.minWidth}
              class:sortable={head.sortable}
              on:mousedown={() => handleHeaderClick(head)}
              on:keydown={(e) => {
                if(e.key == 'Enter') {
                  handleHeaderClick(head)
                }
              }}
              id={head.value}
            >
              {#if resizableColumns}
                <div class="resizer" use:resize></div>
              {/if}
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
          {#if resizableColumns && remainingWidth}
            <th
              style:width={remainingWidth + 'px'}
              class="filler"
              aria-hidden="true"
            />
          {/if}
          {#if $$slots.rowActions || $$slots.append}
            <th class="slot-append">
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
            on:keydown={(event) => {
              if (event.key === 'Enter') {
                handleRowClick(item);
              }
            }}
            tabindex="0"
            style:background-color={styles.backgroundColor}
            style:color={styles.color}
            style:font-weight={styles.fontWeight}
            class:pointer={pointerOnRowHover}
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
            {#if resizableColumns && remainingWidth}
              <td/>
            {/if}
            {#if $$slots.rowActions || $$slots.append}
              <td class="{clazz.cell || ''} append" style:width="fit-content">
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

  th.slot-append {
    width: 1px;
    min-width: unset;
  }

  .table.resizable .slot-append {
    box-sizing: content-box;
  }

  .table.resizable td.append {
    padding: 0;
  }

  .simple-table-container.resizable {
    overflow-x: auto;
  }

  .resizer {
    width: 2px;
    display: none;
    position: absolute;
    right: 5%;
    top: 10%;
    bottom: 10%;
    z-index: 1000;
    background-color: rgb(var(--simple-table-column-resizer-color, var(--global-color-contrast-400)));
    cursor: col-resize;
    background-clip: content-box;
    padding: 0px 5px 0px 5px;
    box-sizing: content-box;
  }

  th:hover .resizer {
    display: inline-block;
  }


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

  .table.resizable .thead th.sortable {
    transition: none;
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

  .table.resizable {
    table-layout: fixed;
    width: fit-content;
  }

  .table.resizable td, th {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  th {
    text-align: start;
    padding-left: 10px;
    min-width: 100px;
    position: relative;
    user-select: none;
    box-sizing: content-box;
  }

  td {
    padding-left: 10px;
  }

  .pointer {
    cursor: pointer;
  }
</style>
