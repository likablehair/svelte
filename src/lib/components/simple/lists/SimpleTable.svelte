<script module lang="ts">
  export type HeaderType = ColumnBoolean |
    ColumnString |
    ColumnNumber |
    ColumnDate |
    ColumnIcon |
    ColumnCheckBox |
    ColumnCustom

  export type Header<Data = any> = {
    value: string
    label: string
    type: HeaderType
    width?: string
    minWidth?: string
    sortable?: boolean
    data?: Data
  };

  export type CalculateRowStyles<T> = (item: T) => {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string;
  };

  export type CalculateRowClasses<T> = (item: T) => string | undefined;
</script>

<script lang="ts" generics="Item extends {[key: string]: any}, Data">
  import '../../../css/main.css'
  import './SimpleTable.css'
  import Icon from '../media/Icon.svelte';
  import { onMount, type Snippet } from 'svelte';
  import type { DateTime } from 'luxon';
  import type { ColumnBoolean, ColumnCheckBox, ColumnCustom, ColumnDate, ColumnIcon, ColumnNumber, ColumnString } from './columnTypes';

  type TableHeader = Header<Data>

  interface Props {
    headers: TableHeader[];
    items: Item[];
    sortedBy?: string;
    sortDirection?: "asc" | "desc";
    resizableColumns?: boolean;
    resizedColumnSizeWithPadding?: { [value: string]: number };
    pointerOnRowHover?: boolean;
    calculateRowStyles?: CalculateRowStyles<Item> | undefined
    calculateRowClasses?: CalculateRowClasses<Item> | undefined
    onsort?: (event: {
      detail: {
        sortedBy: string | undefined,
        sortDirection: string
      }
    }) => void
    onrowClick?: (event: {
      detail: {
        item: Item
      }
    }) => void
    oncolumnResize?: (event: {
      detail: {
        id: string,
        newWidthPx: number
      }
    }) => void
    headerSnippet?: Snippet<[{
      head: TableHeader
    }]>
    headerLabelSnippet?: Snippet<[{
      head: TableHeader
    }]>
    appendSnippet?: Snippet<[{
      index: number
      item?: Item
    }]>
    rowActionsSnippet?: Snippet<[{
      index: number
      item: Item
    }]>
    customSnippet?: Snippet<[{
      index: number
      columnIndex: number
      header: TableHeader
      item: Item
    }]>
    class?:{
      container?: string;
      header?: string;
      row?: string;
      cell?: string;
    }
  }

  let {
    headers = [],
    items = [],
    sortedBy = $bindable(undefined),
    sortDirection = $bindable("asc"),
    resizableColumns = false,
    resizedColumnSizeWithPadding = $bindable(),
    pointerOnRowHover = false,
    calculateRowStyles = undefined,
    calculateRowClasses = undefined,
    oncolumnResize,
    onrowClick,
    onsort,
    headerSnippet,
    headerLabelSnippet,
    appendSnippet,
    rowActionsSnippet,
    customSnippet,
    class: clazz = {},
  }: Props = $props();

  onMount(() => {
    if(resizableColumns) {
      if(!resizedColumnSizeWithPadding) resizedColumnSizeWithPadding = {}

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
    }
  })


  function handleHeaderClick(header: TableHeader) {
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
      if(onsort) {
        onsort({
          detail: {
            sortedBy,
            sortDirection
          }
        })
      }
    }
  }

  function handleRowClick(item: Item) {
    if(onrowClick) {
      onrowClick({
        detail: {
          item
        }
      })
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
          if(!resizedColumnSizeWithPadding) resizedColumnSizeWithPadding = {}
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
            if(oncolumnResize) {
              oncolumnResize({
                detail: {
                  id: th.id,
                  newWidthPx: width
                }
              })
            }
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

</script>

{#if !!items && Array.isArray(items)}
  <div class="simple-table-container {clazz.container || ''}" class:resizable={resizableColumns}>
    <table class="table">
      <thead class="thead {clazz.header || ''}">
        <tr>
          {#each headers as head}
            <th
              tabindex="0"
              style={`${resizableColumns || !head.width ? '' : `width: ${head.width}`}`}
              style:min-width={head.minWidth}
              class:sortable={head.sortable}
              onmousedown={() => handleHeaderClick(head)}
              onkeydown={(e) => {
                if(e.key == 'Enter') {
                  handleHeaderClick(head)
                }
              }}
              id={head.value}
            >
              {#if resizableColumns}
                <div class="resizer" use:resize></div>
              {/if}
              {#if headerSnippet}
                {@render headerSnippet({ head })}
              {:else}
                <span class="header-label">
                  {#if headerLabelSnippet}
                    {@render headerLabelSnippet({ head })}
                  {:else}
                    {head.label}
                  {/if}
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
              {/if}
            </th>
          {/each}
          {#if rowActionsSnippet || appendSnippet}
            <th class="slot-append">
              {#if appendSnippet}
                {@render appendSnippet({ index: -1 })}
              {/if}
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
            onclick={() => handleRowClick(item)}
            onkeydown={(event) => {
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
                  {#if customSnippet}
                    {@render customSnippet({ index: i, columnIndex: j, header, item})}
                  {/if}
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
            {#if rowActionsSnippet || appendSnippet}
              <td class="{clazz.cell || ''} append" style:width="fit-content">
                {#if rowActionsSnippet}
                  {@render rowActionsSnippet({ index: i, item })}
                {/if}
                {#if appendSnippet}
                  {@render appendSnippet({ index: i, item })}
                {/if}
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
