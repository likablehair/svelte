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
    maxWidth?: string
    sortable?: boolean
    icon?: string
    pinned?: boolean
    locked?: boolean
    sortModify?: (params: { builder: FilterBuilder, sortDirection: 'asc' | 'desc' }) => FilterBuilder
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
  import { onMount, tick, type Snippet } from 'svelte';
  import type { DateTime } from 'luxon';
  import type { ColumnBoolean, ColumnCheckBox, ColumnCustom, ColumnDate, ColumnIcon, ColumnNumber, ColumnString } from './columnTypes';
  import NoData from '../common/NoData.svelte';
  import type { FilterBuilder } from '$lib';

  type TableHeader = Header<Data>

  interface Props {
    headers: TableHeader[];
    items: Item[];
    sortedBy?: string;
    sortDirection?: "asc" | "desc";
    resizableColumns?: boolean;
    resizedColumnSizeWithPadding?: { [value: string]: number };
    pointerOnRowHover?: boolean;
    lang?: 'it' | 'en'
    noItemsText?: string
    loading?: boolean
    doubleClickActive?: boolean,
    doubleClickDelay?: number;
    stickFirstColumn?: boolean;
    calculateRowStyles?: CalculateRowStyles<Item> | undefined
    calculateRowClasses?: CalculateRowClasses<Item> | undefined
    onsort?: (event: {
      detail: {
        sortedBy: string | undefined,
        sortDirection: string,
        sortModify: Header['sortModify']
      }
    }) => void
    onrowClick?: (event: {
      detail: {
        item: Item
      }
    }) => void
    onrowDoubleClick?: (event: {
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
    prependSnippet?: Snippet<[{
      index: number
      item?: Item
    }]>
    stickyAppendSnippet?: Snippet<[]>
    customSnippet?: Snippet<[{
      index: number
      columnIndex: number
      header: TableHeader
      item: Item
    }]>
    noDataSnippet?: Snippet<[]>
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
    resizedColumnSizeWithPadding = $bindable({}),
    pointerOnRowHover = false,
    lang = 'en',
    doubleClickActive = false,
    doubleClickDelay = 250,
    noItemsText,
    loading,
    stickFirstColumn,
    calculateRowStyles = undefined,
    calculateRowClasses = undefined,
    oncolumnResize,
    onrowClick,
    onrowDoubleClick,
    onsort,
    headerSnippet,
    headerLabelSnippet,
    appendSnippet,
    prependSnippet,
    stickyAppendSnippet,
    customSnippet,
    noDataSnippet,
    class: clazz = {},
  }: Props = $props();

  if(!onrowClick && !!onrowDoubleClick) {
    throw new Error('cannot define an onrowDoubleClick event without defining an onrowClick event')
  }

  let clickTimeout: NodeJS.Timeout | undefined = undefined,
    sortModify: Header['sortModify'],
    tableContainer: HTMLElement | undefined = $state(),
    mainHeader: HTMLElement | undefined = $state(),
    remainingWidth: number = $state(0),
    resizeObserver: ResizeObserver,
    headersHTML: { [value: string]: HTMLElement } = $state({}),
    tableHTML: HTMLElement | undefined = $state(),
    resizing = false,
    colspan = $derived.by(() => {
      return headers.length +
        (stickyAppendSnippet ? 1 : 0) +
        (appendSnippet ? 1 : 0) +
        (prependSnippet ? 1 : 0) +
        (resizableColumns && remainingWidth ? 1 : 0);
    })

  const DEFAULT_MIN_WIDTH_PX = 100,
    DEFAULT_MAX_WIDTH_PX = 400

  onMount(() => {
    if(resizableColumns) {
      if (appendSnippet && headersHTML['row-append-header']) {
        const actionCells = tableContainer?.querySelectorAll('.row-append-cell');
        
        if (actionCells && actionCells.length > 0) {
          let maxActionWidth = 0;

          for (let i = 0; i < actionCells.length; i++) {
            const cellContent = actionCells[i];
            const width = cellContent.getBoundingClientRect().width;
            if (width > maxActionWidth) {
              maxActionWidth = width;
            }
          }

          const finalWidth = Math.ceil(maxActionWidth + 15);
          
          headersHTML['row-append-header'].style.width = `${finalWidth}px`;
          headersHTML['row-append-header'].style.minWidth = `${finalWidth}px`;
        } 
      }

      for(const head of headers) {
        let th = headersHTML[head.value]
        if(!!th) {
          resizeHeader(th, head)
        }
      }

      tableHTML?.classList.add('resizable')

      resizeObserver = new ResizeObserver(() => {
        updateRemainingWidth();
      });

      if(tableContainer){
        resizeObserver.observe(tableContainer);
      }

      return () => {
        resizeObserver?.disconnect();
      };
    }
  })


  function handleHeaderClick(header: TableHeader) {
    if(header.sortable && !resizing) {
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
      if(onsort) {
        onsort({
          detail: {
            sortedBy,
            sortDirection,
            sortModify
          }
        })
      }
    }
  }

  function handleRowClick(item: Item) {
    if(doubleClickActive) {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = undefined;
    
        if(onrowDoubleClick) {
          onrowDoubleClick({
            detail: {
              item
            }
          })
        }
      } else {
        clickTimeout = setTimeout(() => {
          if(onrowClick) {
            onrowClick({
              detail: {
                item
              }
            })
          }
          clickTimeout = undefined;
        }, doubleClickDelay);
      }
    } else {
      if(onrowClick) {
        onrowClick({
          detail: {
            item
          }
        })
      }
    }
  }

  function formatDate(dateTime: DateTime, dateFormat: ColumnDate['params']): string  {
    return dateTime.setLocale(dateFormat.locale).toFormat(dateFormat.format)
  }


  function resize(node: HTMLElement) {
    let th: HTMLElement | null = node.parentElement
    let resizingInner = false

    if(!!th) {
      let { width } = th.getBoundingClientRect()

      function mouseMoveHandler(e: MouseEvent) {
        if (resizingInner && !!th && !!tableContainer) {
          width += e.movementX;
          const { paddingLeft, paddingRight } = getComputedStyle(th);

          const minWidth: string | undefined = headers.find(h => h.value === th.id)?.minWidth;
          let minWidthPx: number | undefined;
          if (!!minWidth && minWidth.endsWith('px')) {
            minWidthPx = parseInt(minWidth, 10);
          }

          const maxWidth: string | undefined = headers.find(h => h.value === th.id)?.maxWidth;
          let maxWidthPx: number | undefined;
          if (!!maxWidth && maxWidth.endsWith('px')) {
            maxWidthPx = parseInt(maxWidth, 10);
          }

          const actualMinWidth = (minWidthPx || DEFAULT_MIN_WIDTH_PX) - parseFloat(paddingLeft) - parseFloat(paddingRight);
          const actualMaxWidth = (maxWidthPx || DEFAULT_MAX_WIDTH_PX) - parseFloat(paddingLeft) - parseFloat(paddingRight);

          if (width > actualMinWidth && width < actualMaxWidth) {
            th.style.width = width + 'px';
            resizedColumnSizeWithPadding[th.id] = th.getBoundingClientRect().width;
            resizedColumnSizeWithPadding = {
              ...resizedColumnSizeWithPadding,
            }
          }
        }
      }
      

      function mouseUpHandler(e: MouseEvent, setResize: boolean = true) {
        if(!!th) {
          resizingInner = false
          let { paddingLeft, paddingRight } = getComputedStyle(th)
          width = th.getBoundingClientRect().width - parseFloat(paddingLeft) - parseFloat(paddingRight)
          if(setResize){
            setTimeout(() => resizing = false, 20)
          }
          if(oncolumnResize){
            oncolumnResize({
              detail: {
                id: th.id,
                newWidthPx: width
              }
            })
          }
        }
      }

      function mouseDownHandler(e: MouseEvent) {
        if(!!th) {
          resizing = true
          resizingInner = true
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

  $effect(() => {
    if (
      resizableColumns &&
      !!tableContainer &&
      resizableColumns &&
      headers.length > 0 &&
      resizedColumnSizeWithPadding &&
      mainHeader
    ) {
      tick().then(updateRemainingWidth);
    }
  })

  async function updateRemainingWidth() {
    if(tableContainer != null && !!tableContainer && mainHeader) {
      const containerWidth = tableContainer?.getBoundingClientRect().width - 10;

      if(containerWidth){
        const totalResizableWidth = headers.reduce((sum, head) => {
          let th = headersHTML[head.value]
          if(!!th) {
            resizeHeader(th, head)
          }
          const width = th?.getBoundingClientRect().width || 0
          return sum + width + 1;
        }, 0);
    
        const extraStaticWidth = Array.from(mainHeader.querySelectorAll('th.non-resizable, th.row-append-header, th.fixed-col'))
          .reduce((sum, th) => sum + th.getBoundingClientRect().width + 1, 0);
    
        remainingWidth = Math.max(0, containerWidth - totalResizableWidth - extraStaticWidth);
      }
    }
  }

  function resizeHeader(th: HTMLElement, header: { value: string, minWidth?: string, maxWidth?: string }){
    if (!resizedColumnSizeWithPadding[header.value]) {
      let widthWithPadding = th.getBoundingClientRect().width

      let minWidth = header.minWidth,
        minWidthPx = DEFAULT_MIN_WIDTH_PX
      if (!!minWidth && minWidth.endsWith('px')) {
        minWidthPx = parseInt(minWidth, 10);
      }
      if(widthWithPadding < minWidthPx) {
        widthWithPadding = minWidthPx
      }

      let maxWidth = header.maxWidth,
        maxWidthPx = DEFAULT_MAX_WIDTH_PX
      if (!!maxWidth && maxWidth.endsWith('px')) {
        maxWidthPx = parseInt(maxWidth, 10);
      }
      if(widthWithPadding > maxWidthPx) {
        widthWithPadding = maxWidthPx
      }

      resizedColumnSizeWithPadding[header.value] = widthWithPadding;
    }
    let { paddingLeft, paddingRight } = getComputedStyle(th);
    let width = resizedColumnSizeWithPadding[header.value] - parseFloat(paddingLeft) - parseFloat(paddingRight);
    th.style.width = `${width}px`
  }

</script>

{#if !!items && Array.isArray(items)}
  <div class="simple-table-container {clazz.container || ''}" class:resizable={resizableColumns} bind:this={tableContainer}>
    <table class="table" bind:this={tableHTML}>
      <thead class="thead {clazz.header || ''}" bind:this={mainHeader}>
        <tr>
          {#if prependSnippet}
            <th 
              class="non-resizable"
              class:sticky-col={headers.find(h => h.pinned)}
              style:left={"0"}
            >
              {@render prependSnippet({ index: -1 })}
            </th>
          {/if}
          {#each headers as head, index}
            {@const baseLeft = headers.slice(0, index).reduce((sum, h) => sum + (resizedColumnSizeWithPadding[h.value] || 0), 0)}
            {@const extraLeft = 'var(--simple-table-non-resizable-header-width, var(--simple-table-default-non-resizable-header-width))'}
            <th
              style={`${resizableColumns || !head.width ? '' : `width: ${head.width}`}`}
              style:min-width={head.minWidth}
              style:max-width={head.maxWidth}
              class:sortable={head.sortable}
              class:sticky-col={head.pinned}
              style:left={
                head.pinned 
                  ? (prependSnippet)
                    ? `calc(${baseLeft}px + ${extraLeft})`
                    : `${baseLeft}px`
                  : undefined
              }
              onclick={() => handleHeaderClick(head)}
              id={head.value}
              bind:this={headersHTML[head.value]}
              tabindex="0"
              onkeyup={(e) => {
                if(e.key == 'Enter') {
                  handleHeaderClick(head)
                }
              }}
              bind:this={headersHTML[head.value]}
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
                    {#if !!head.icon}
                      <Icon name={head.icon}/>
                    {/if}
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
          {#if appendSnippet}
            <th
              class="row-append-header"
              bind:this={headersHTML['row-append-header']}
            >
              {@render appendSnippet({ index: -1, })}
            </th>
          {/if}
          {#if stickyAppendSnippet}
            <th
              class="fixed-col"
            >
              {@render stickyAppendSnippet()}
            </th>
          {/if}
          {#if resizableColumns && remainingWidth}
            <th
              style:width={remainingWidth + 'px'}
              class="filler"
              aria-hidden="true"
            ></th>
          {/if}
        </tr>
        {#if loading}
          <tr>
            <th
              {colspan}
              class="loading"
            >
              <div class="loader-line"></div>
            </th>
          </tr>
        {/if}
      </thead>
      <tbody>
        {#if items.length > 0}
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
              style:--row-bg={styles.backgroundColor}
              style:color={styles.color}
              style:font-weight={styles.fontWeight}
              class:pointer={pointerOnRowHover}
            >
              {#if prependSnippet}
                <td 
                  class="{clazz.cell || ''} non-resizable"
                  class:sticky-col={headers.find(h => h.pinned)}
                  style:left={"0"}
                >
                  {@render prependSnippet({ index: i, item })}
                </td>
              {/if}
              {#each headers as header, j}
                {@const baseLeft = headers.slice(0, j).reduce((sum, h) => sum + (resizedColumnSizeWithPadding[h.value] || 0), 0)}
                {@const extraLeft = 'var(--simple-table-non-resizable-header-width, var(--simple-table-default-non-resizable-header-width))'}
                <td 
                  class="{clazz.cell || ''}"
                  class:sticky-col={header.pinned}
                  style:left={
                    header.pinned 
                      ? (prependSnippet)
                        ? `calc(${baseLeft}px + ${extraLeft})`
                        : `${baseLeft}px`
                      : undefined
                  }
                >
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
              {#if appendSnippet}
                <td 
                  class="{clazz.cell || ''}"
                >
                  <div class="row-append-cell" style="display: inline-block; white-space: nowrap;">
                    {@render appendSnippet({ index: i, item })}
                  </div>
                </td>
              {/if}
              {#if stickyAppendSnippet}
                <td></td>
              {/if}
              {#if resizableColumns && remainingWidth}
                <td></td>
              {/if}
            </tr>
          {/each}
        {:else}
          <tr>
            <td
              {colspan}
              style="text-align: center;"
              style:border="none"
              style:cursor="default"
              style:padding="10px"
              style:font-size="1.2em"
            >
              {#if noDataSnippet}{@render noDataSnippet()}{:else}
                <NoData {lang} {noItemsText} />
              {/if}
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
{/if}

<style>

  th.row-append-header {
    width: 1px;
    min-width: unset;
  }

  .table.resizable .row-append-header, .table.resizable {
    box-sizing: content-box;
  }

  .table.resizable td.append, .table.resizable td.prepend {
    padding: 0;
  }

  .simple-table-container.resizable {
    overflow-x: auto;
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
    margin: var(
      --simple-table-header-label-margin,
      var(--simple-table-default-header-label-margin)
    );
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
    background-color: var(--row-bg);
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

  .loading {
    padding: 0px !important;
  }

  .loader-line {
    margin-top: -1px;
    height: var(
      --simple-table-loader-height,
      var(--simple-table-default-loader-height)
    );
    position: relative;
    overflow: hidden;
    background-color: var(
      --simple-table-header-background-color,
      var(--simple-table-default-header-background-color)
    );
    -webkit-border-radius: var(
      --simple-table-loader-border-radius,
      var(--simple-table-default-loader-border-radius)
    );
    -moz-border-radius: var(
      --simple-table-loader-border-radius,
      var(--simple-table-default-loader-border-radius)
    );
    border-radius: var(
      --simple-table-loader-border-radius,
      var(--simple-table-default-loader-border-radius)
    );
  }

  .loader-line:before {
    content: "";
    position: absolute;
    left: -50%;
    height: var(
      --simple-table-loader-height,
      var(--simple-table-default-loader-height)
    );
    width: 40%;
    background-color: var(
      --simple-table-loader-background-color,
      var(--simple-table-default-loader-background-color)
    );
    -webkit-animation: lineAnim 1s linear infinite;
    -moz-animation: lineAnim 1s linear infinite;
    animation: lineAnim 1s linear infinite;
    -webkit-border-radius: var(
      --simple-table-loader-border-radius,
      var(--simple-table-default-loader-border-radius)
    );
    -moz-border-radius: var(
      --simple-table-loader-border-radius,
      var(--simple-table-default-loader-border-radius)
    );
    border-radius: var(
      --simple-table-loader-border-radius,
      var(--simple-table-default-loader-border-radius)
    );
  }

  @keyframes lineAnim {
    0% {
      left: -40%;
    }
    50% {
      left: 20%;
      width: 80%;
    }
    100% {
      left: 100%;
      width: 100%;
    }
  }

  .resizer {
    position: absolute;
    top: 0;
    right: 0;
    width: 12px;
    height: 100%;
    cursor: col-resize;
    z-index: 3;
    display: flex;
    align-items: center; 
    justify-content: center;
  }
  .resizer::after {
    content: '';
    width: 2.8px;
    border-radius: 4px;
    height: 75%;
    background-color: transparent;
    transition: background-color 0.2s;
  }
  th:hover .resizer::after {
    background-color: var(
      --simple-table-resizer-color,
      var(--simple-table-default-resizer-color)
    );
  }
  .non-resizable {
    padding-left: 0px !important;
    text-align: center;
    width: var(
      --simple-table-non-resizable-header-width,
      var(--simple-table-default-non-resizable-header-width)
    );
  }
  .thead th.fixed-col {
    position: sticky;
    right: 0;
    z-index: 3;
    width: 23px;
    min-width: 23px;
  }
  .sticky-col {
    position: sticky;
  }
  th.sticky-col {
    z-index: 3;
    background-color: var(
      --simple-table-header-background-color, 
      var(--simple-table-default-header-background-color)
    );
  }

  td.sticky-col {
    z-index: 2; 
    background-color: var(
      --row-bg, 
      var(--simple-table-sticked-background-color, var(--simple-table-default-sticked-background-color))
    );
  }

  .item-tr:hover td.sticky-col {
    background-color: var( 
      --simple-table-row-hover-background-color, var(--simple-table-default-row-hover-background-color)
    );
  }
</style>
