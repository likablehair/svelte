<script lang="ts" generics="Item extends {[key: string]: any}">
  import {
    Checkbox,
    Chip,
    Converter,
    CountriesAutocomplete,
    DatePickerTextField,
    Drawer,
    FilterBuilder,
    FlagIcon,
    Icon,
    MediaQuery,
    Menu,
    ToolTip,
    type PaginatedTable
  } from "$lib";
  import { DateTime } from "luxon";
  import { onMount, tick, type ComponentProps, type Snippet } from "svelte";
  import { quintOut } from "svelte/easing";
  import { crossfade, fade } from "svelte/transition";
  import { type Item as ItemAutocomplete } from "$lib/components/simple/forms/Autocomplete.svelte"
  import Filters from "../search/Filters.svelte";
  import ConfirmOrCancelButtons from "../forms/ConfirmOrCancelButtons.svelte";
  import { flip } from "svelte/animate";
  import InfiniteScroll from "$lib/components/simple/common/InfiniteScroll.svelte";
  import Divider from "$lib/components/simple/common/Divider.svelte";
  import VerticalDraggableList from "$lib/components/simple/common/VerticalDraggableList.svelte";
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
  import Autocomplete from "$lib/components/simple/forms/Autocomplete.svelte";
  import LabelAndSelect from "../forms/LabelAndSelect.svelte";
  import LabelAndTextField from "../forms/LabelAndTextField.svelte";
  import DynamicFilters from "../search/DynamicFilters.svelte";
  import type { DateMode, Filter, NumberMode, SelectMode, StringMode } from "$lib/utils/filters/filters";
  import QuickActions, { type Action } from "../common/QuickActions.svelte";
  import './DynamicTable.css'
  import type { QuickFilter } from "$lib/utils/filters/quickFilters";
  import Switch from "$lib/components/simple/forms/Switch.svelte";
  import CircularLoader from "$lib/components/simple/loaders/CircularLoader.svelte";
  import type { UIEventHandler } from "svelte/elements";
  import NoData from "$lib/components/simple/common/NoData.svelte";

  onMount(() => {
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    tableContainer?.addEventListener("scroll", setReachedBottomOrTop);

    if(tableContainer?.scrollHeight && tableContainer.clientHeight){
      hideScrollbar = tableContainer.scrollHeight > tableContainer.clientHeight
    }

    for(const head of [...headers, { value: 'non-resizable', minWidth: DEFAULT_MIN_WIDTH_PX + 'px', maxWidth: DEFAULT_MAX_WIDTH_PX + 'px' }, { value: 'customize-headers', minWidth: DEFAULT_MIN_WIDTH_PX + 'px', maxWidth: DEFAULT_MAX_WIDTH_PX + 'px' }]) {
      let th
      if(head.value == 'non-resizable' || head.value == 'customize-headers') {
        th = document.getElementsByClassName(head.value).item(0) as HTMLElement
      } else {
        th = document.getElementById(head.value) as HTMLElement
      }
      if(!!th) {
        resizeHeader(th, head)
      }
    }

    let table = document.getElementsByClassName('dynamic-table')[0] as HTMLElement
    table.classList.add('dynamic-resizable')

    resizeObserver = new ResizeObserver(() => {
      updateRemainingWidth();
      updateHeaderHeight();
    });

    if(tableContainer){
      resizeObserver.observe(tableContainer);
    }
    
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      tableContainer?.removeEventListener("scroll", setReachedBottomOrTop);
      resizeObserver?.disconnect();
    }
  });

  function updateHeaderHeight() {
    if (mainHeader) {
      const headerHeight = mainHeader.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--main-header-height', headerHeight + 'px');
    }
  }

  function setReachedBottomOrTop(){
    if(tableContainer) {
      reachedBottom = tableContainer.scrollHeight - tableContainer.scrollTop === tableContainer.clientHeight
      reachedTop = tableContainer.scrollTop === 0
      hideScrollbar = tableContainer.scrollHeight > tableContainer.clientHeight
    }
  }

  $effect(() => {
    if(reachedBottom && rows.length < totalRows) {
      setTimeout(() => {
        if(reachedBottom) {
          handleLoadForward()
        }
      }, 30)
    }
  })

  $effect(() => {
    if(reachedTop && currentSectionNumber > 0) {
      setTimeout(() => {
        if(reachedTop) {
          handleLoadBackward()
        }
      }, 30)
    }
  })
  
  const [send, receive] = crossfade({
    duration: 500,
    fallback(node, params) {
      const style = getComputedStyle(node);
      const transform = style.transform === "none" ? "" : style.transform;

      return {
        duration: 500,
        easing: quintOut,
        css: (t) => `
        transform: ${transform} scale(${t});
        opacity: ${t}
      `,
      };
    },
  });

  type RowItem = Item & {
    disableEdit?: boolean,
    rowDisableBackgroundColor?: string
  };

  type Row = {
    item: RowItem;
    subItems: RowItem[];
  };

  type MenuStringType = {
    key: "string";
  };

  type MenuNumberType = {
    key: "number";
    params?: {
      min?: number;
      max?: number;
    };
  };

  type MenuDateType = {
    key: "date";
  };

  type MenuSelectType = {
    key: "select";
    params: {
      options: {
        icon?: string;
        value: string | number | undefined;
        id?: number | undefined;
        text: string;
      }[];
    };
  };

  type MenuBooleanType = {
    key: "boolean";
  };

  type CellEditorInfoType =
    | MenuStringType
    | MenuNumberType
    | MenuDateType
    | MenuSelectType
    | MenuBooleanType;

  type CellEditorInfo = {
    title: string;
    description: string;
    type: CellEditorInfoType;
    column: string;
    info?: string;
  };

  type Headers = NonNullable<ComponentProps<typeof PaginatedTable>["headers"]>;
  type Header = Headers[number] & {
    cellEditorInfo?: CellEditorInfo;
    info?: string;
    maxWidth?: string
  };
  type HeaderType = Header["type"];

  interface Props {
    headers?: Header[];
    headersToShowInTable?: Header[];
    subHeaders?: Header[];
    customizeHeaders?: boolean;
    rows?: Row[];
    sortedBy?: string;
    sortDirection?: "asc" | "desc";
    cellEdit?: boolean;
    noItemsText?: string;
    showSelect?: boolean;
    showActions?: boolean;
    selectMode?: "single" | "multiple";
    selectedItems?: RowItem[];
    unselectedItems?: RowItem[];
    selectedAll?: boolean;
    showExpand?: boolean;
    loading?: boolean;
    disabled?: boolean;
    filters?: ComponentProps<typeof Filters>["filters"];
    searchBarColumns?: string[];
    searchBarVisible?: boolean;
    searchBarPlaceholder?: string;
    filtersVisible?: boolean;
    quickFiltersVisible?: boolean;
    lang?: "it" | "en";
    dateLocale?: "it" | "en";
    editFilterMode?: "one-edit" | "multi-edit";
    showActiveFilters?: boolean;
    quickFilters?: QuickFilter[];
    actionsForSelectedItems?: Action[];
    quickActionsDisabled?: boolean;
    totalRows?: number;
    searchText?: string;
    renderedRowsNumber?: number;
    sectionRowsNumber?: number;
    sectionThreshold?: number;
    backwardThresholdPixel?: number;
    forwardThresholdPixel?: number;
    uniqueKey?: keyof RowItem;
    numberOfResultsVisible?: boolean;
    endLineVisible?: boolean;
    resizableColumns?: boolean;
    resizedColumnSizeWithPadding?: { [value: string]: number };
    dynamicFilters?: boolean;
    class?: {
      container?: string;
      header?: string;
      row?: string;
      cell?: string;
    }
    onsort?: (event: {
      detail: {
        sortedBy: string | undefined;
        sortDirection: string;
      }
    }) => void
    onrowClick?: (event: {
      detail: {
        item: RowItem;
      }
    }) => void
    oncellClick?: (event: {
      detail: {
        item: RowItem;
      }
    }) => void
    onsaveCellEdit?: (event: {
      detail: {
        item: any;
      }
    }) => void
    onsaveHeadersToShow?: (event: {
      detail: {
        headersToShow: {
          id: string;
          name: string;
        }[];
      }
    }) => void
    onfiltersChange?: (event: {
      detail: {
        builder: FilterBuilder;
      }
    }) => void
    onfetchData?: () => void;
    onremoveFilter?: (event: {
      detail: {
        filter: Filter
      }
    }) => void
    onremoveAllFilters?: () => void;
    onremoveCustomQuickFilter?: (event: {
      detail: {
        quickFilter: QuickFilter
      }
    }) => void 
    onapplyCustomQuickFilter?: (event: {
      detail: {
        quickFilter: QuickFilter
        setQuickFilterValue: (quickFilter: QuickFilter, value?: any) => void
      }
    }) => void
    oncolumnResize?: (event: {
      detail: {
        id: string,
        newWidthPx: number
      }
    }) => void
    searchBarSnippet?: Snippet<[{
      handleSearchChange: typeof handleSearchChange
    }]>
    filterAppendSnippet?: ComponentProps<typeof Filters>['appendSnippet']
    customFilterChipSnippet?: ComponentProps<typeof Filters>['customChipSnippet']
    customFilterSnippet?: Snippet<[{
      filter: Filter | undefined,
      mAndDown: boolean;
      updateCustomFilterValues?: Parameters<NonNullable<ComponentProps<typeof Filters>['contentSnippet']>>[0]['updateMultiFilterValues'],
      updateFunction?: Parameters<NonNullable<ComponentProps<typeof Filters>['customSnippet']>>[0]['updateFunction']
    }]>
    onscroll?: UIEventHandler<HTMLDivElement>
    selectionSnippet?: ComponentProps<typeof Autocomplete>['selectionSnippet']
    itemLabelSnippet?: ComponentProps<typeof Autocomplete>['itemLabelSnippet']
    chipLabelSnippet?: Snippet<[{
      selection: ItemAutocomplete
    }]>
    headerSnippet?: Snippet<[{
      header: Header
    }]>
    headerLabelSnippet?: Snippet<[{
      header: Header
    }]>
    rowAppendSnippet?: Snippet<[{
      index: number,
      row?: Row
    }]>
    customRowSnippet?: Snippet<[{
      index: number,
      columnIndex: number,
      header: Header,
      row: Row
    }]>
    subHeaderSnippet?: Snippet<[{
      subHeader: Header
    }]>
    subHeaderLabelSnippet?: Snippet<[{
      subHeader: Header
    }]>
    subRowAppendSnippet?: Snippet<[{
      index: number,
      row?: RowItem
    }]>
    subRowActionsSnippet?: Snippet<[{
      index: number,
      row?: RowItem
    }]>
    customSubRowSnippet?: Snippet<[{
      index: number,
      columnIndex: number,
      header: Header,
      row: RowItem
    }]>
    customQuickFilterSnippet?: Snippet<[{
      quickFilter: QuickFilter,
      setQuickFilterMissingValue: typeof setQuickFilterMissingValue
    }]>
    appendSnippet?: Snippet<[]>
  }

  let {
    headers = [],
    headersToShowInTable = headers,
    subHeaders = [],
    customizeHeaders = false,
    rows = [],
    sortedBy = $bindable(),
    sortDirection = $bindable("asc"),
    cellEdit = false,
    lang = "en",
    dateLocale,
    noItemsText = lang == 'en' ? "No items to show" : 'Nessun elemento da visualizzare',
    showSelect = false,
    showActions = true,
    selectMode = "single",
    selectedItems = $bindable([]),
    unselectedItems = $bindable([]),
    selectedAll = $bindable(false),
    showExpand = false,
    loading = false,
    disabled = false,
    filters = $bindable([]),
    searchBarColumns,
    searchBarVisible = false,
    searchBarPlaceholder = lang == 'en' ? "Type to search..." : "Scrivi per cercare...",
    filtersVisible = false,
    quickFiltersVisible = false,
    editFilterMode = "one-edit",
    showActiveFilters = true,
    quickFilters = [],
    actionsForSelectedItems = [],
    quickActionsDisabled = false,
    totalRows = rows.length,
    searchText = $bindable(),
    renderedRowsNumber = 100,
    sectionRowsNumber = 20,
    sectionThreshold = 2,
    backwardThresholdPixel = 100,
    forwardThresholdPixel = 100,
    uniqueKey = 'id',
    numberOfResultsVisible = false,
    endLineVisible = false,
    resizableColumns = false,
    resizedColumnSizeWithPadding = {},
    dynamicFilters = true,
    class: clazz = {},
    onapplyCustomQuickFilter,
    oncellClick,
    onfetchData,
    onfiltersChange,
    onsort,
    onremoveAllFilters,
    onremoveCustomQuickFilter,
    onremoveFilter,
    onrowClick,
    onsaveCellEdit,
    onsaveHeadersToShow,
    oncolumnResize,
    searchBarSnippet,
    customFilterChipSnippet,
    customFilterSnippet,
    filterAppendSnippet,
    onscroll,
    selectionSnippet: selectionInternalSnippet,
    itemLabelSnippet: itemLabelInternalSnippet,
    chipLabelSnippet,
    headerSnippet,
    headerLabelSnippet,
    rowAppendSnippet,
    customRowSnippet,
    subRowAppendSnippet,
    subHeaderLabelSnippet,
    subHeaderSnippet,
    subRowActionsSnippet,
    customSubRowSnippet,
    customQuickFilterSnippet,
    appendSnippet,
  }: Props = $props();

  let openCellEditor: boolean = $state(false),
    cellEditorActivator: HTMLElement | undefined = $state(),
    cellEditorContainer: HTMLElement | undefined = $state(),
    menuElementCellEditor: HTMLElement | undefined = $state(),
    menuElementQuickFilters: HTMLElement | undefined= $state(),
    cellEditorInfoActive: CellEditorInfo & {
      value?: any;
      item?: RowItem;
    } | undefined = $state(),
    saveEditDisabled: boolean = $state(false),
    searchBarInput: HTMLElement | undefined = $state(undefined),
    openQuickFilter: boolean = $state(false),
    quickFilterActivator: HTMLElement | undefined = $state(),
    quickFilterActive: QuickFilter | undefined = $state(),
    globalBuilder: FilterBuilder = new FilterBuilder(),
    calendarOpened: boolean = $state(false),
    calendarOpened2: boolean = $state(false),
    selectedIndexes: number[] = [],
    cellEditorIndexRow: number | undefined = $state(),
    cellEditorIndexHeader: number | undefined = $state(),
    cellEditorSubItem: boolean | undefined = $state(),
    currentSectionNumber = $state(0),
    tableBody: HTMLElement | undefined = $state(),
    tableContainer: HTMLElement | undefined = $state(),
    userScrolling = $state(true),
    reachedBottom = $state(false),
    reachedTop = false,
    resizing = false,
    remainingWidth = $state(0),
    hideScrollbar = $state(false),
    sortModify: Header['sortModify'],
    mainHeader: Element | undefined = $state(),
    resizeObserver: ResizeObserver

  const DEFAULT_MIN_WIDTH_PX = 100,
    DEFAULT_MAX_WIDTH_PX = 400
  
  let totalSections = $derived((totalRows - renderedRowsNumber) / sectionRowsNumber)
  let hasMoreToRender = $derived(totalSections > currentSectionNumber)
  let totalCachedSections = $derived((rows.length - renderedRowsNumber) / sectionRowsNumber)
  let renderedRows = $derived(rows.slice(currentSectionNumber * sectionRowsNumber, currentSectionNumber * sectionRowsNumber + renderedRowsNumber))

  let openHeaderDrawer: boolean = $state(false),
    headersToSelect: {
      id: string;
      name: string;
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
    }[] = $state(headersToShowInTable.map((h) => {
      return {
        id: h.value,
        name: h.label,
      };
    })),
    infoActivators = $state(Array(headersToShowInTable.length))

  let totalBatchLength: number = $state(0),
    expandedRows: Row[] = $state([]);    

  function saveHeadersToShow() {
    if(onsaveHeadersToShow){
      onsaveHeadersToShow({
        detail: {
          headersToShow: headersToShow,
        }
      })
    }
    openHeaderDrawer = false;
  }

  function handleHeaderClick(header: Header) {
    if (header.sortable && !loading && !resizing) {
      if (!!sortedBy && header.value == sortedBy) {
        if (sortDirection == "asc") sortDirection = "desc";
        else if (sortDirection == "desc") {
          sortedBy = undefined;
          sortModify = undefined
        }
      } else {
        sortedBy = header.value;
        sortDirection = "asc";
        sortModify = header.sortModify
      }

      handleSearchChange(searchText);

      if(onsort) {
        onsort({
          detail: {
            sortedBy,
            sortDirection,
          }
        })
      }
    }
  }

  function handleRowClick(item: RowItem) {
    if (disabled || loading) return;
    if(onrowClick) {
      onrowClick({
        detail: {
          item,
        }
      })
    }
  }

  function handleCellClick(
    mouseEvent: MouseEvent & {
      currentTarget: EventTarget & HTMLTableCellElement;
    },
    item: RowItem,
    cellEditorInfo?: CellEditorInfo,
    value?: any,
    indexRow?: number,
    indexHeader?: number,
    subItem?: boolean
  ) {
    if (disabled || loading) return;
    if (cellEdit && cellEditorInfo && !item.disableEdit) {
      if (!cellEditorActivator) {
        let target = mouseEvent.target as unknown as HTMLElement;
        cellEditorActivator = target;

        cellEditorIndexRow = indexRow
        cellEditorIndexHeader = indexHeader
        cellEditorSubItem = subItem

        cellEditorInfoActive = {
          ...cellEditorInfo,
          value: value,
          item: item,
        };

        openCellEditor = !openCellEditor;

        const element = target.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;

        if (openCellEditor) {
          setTimeout(() => {
            if (windowHeight - element.bottom < 300) {
              cellEditorContainer!.style.bottom = `${
                windowHeight - element.top
              }px`;
            } else {
              cellEditorContainer!.style.top = `${element.bottom}px`;
            }

            if (windowWidth - element.right < 400) {
              cellEditorContainer!.style.right = `${
                windowWidth - element.left - cellEditorActivator!.clientWidth
              }px`;
            }
          }, 0);
        }
      }
    }

    if(oncellClick) {
      oncellClick({
        detail: {
          item,
        }
      })
    }
  }

  function handleSaveClick() {
    cellEditorIndexHeader = undefined
    cellEditorIndexRow = undefined
    cellEditorSubItem = undefined

    if(onsaveCellEdit) {
      onsaveCellEdit({
        detail: {
          item: cellEditorInfoActive,
        }
      })
    }

    cellEditorActivator = undefined;
    openCellEditor = false;
  }

  function handleCancelClick() {
    cellEditorIndexHeader = undefined
    cellEditorIndexRow = undefined
    cellEditorSubItem = undefined

    cellEditorActivator = undefined;
    openCellEditor = false;

    quickFilterActivator = undefined;
    openQuickFilter = false;
  }

  function handleSelect(item: Item, shiftKeyPressed: boolean) {
    let index = -1
    if(selectedAll) {
      index = unselectedItems.findIndex((i) => i[uniqueKey] == item[uniqueKey]);
    } else {
      index = selectedItems.findIndex((i) => i[uniqueKey] == item[uniqueKey]);
    }
    // if item is not in the selected/unselected items array, add it
    if (index == -1) {
      if (selectMode == "single") {
        selectedItems = [item];
        selectedIndexes = [rows.findIndex(r => r.item[uniqueKey] == item[uniqueKey])]
      } else if (selectMode == "multiple") {
        if(shiftKeyPressed && selectedIndexes.length > 0) {
          let lastSelectedIndex = selectedIndexes[selectedIndexes.length - 1],
            selectedIndex = rows.findIndex(r => r.item[uniqueKey] == item[uniqueKey])
          if(selectedIndex != -1) {
            if(selectedIndex < lastSelectedIndex) {
              let x = lastSelectedIndex
              lastSelectedIndex = selectedIndex - 1
              selectedIndex = x
            }
            for (let i = lastSelectedIndex + 1; i <= selectedIndex; i++) {
              if(selectedAll) {
                if(!unselectedItems.find((unselectedItem) => unselectedItem[uniqueKey] == rows[i].item[uniqueKey])) {
                  unselectedItems = [...unselectedItems, rows[i].item]
                }
              } else {
                if(!selectedItems.find((selectedItem) => selectedItem[uniqueKey] == rows[i].item[uniqueKey])) {
                  selectedItems = [...selectedItems, rows[i].item]
                }
              }
            }
          }
        }
        else {
          if(selectedAll) {
            unselectedItems = [...unselectedItems, item];
          } else {
            selectedItems = [...selectedItems, item];
          }
          selectedIndexes.push(rows.findIndex(r => r.item[uniqueKey] == item[uniqueKey]))
        }
      }
    } else {
      if(selectedAll) {
        unselectedItems = unselectedItems.filter((i) => i[uniqueKey] != item[uniqueKey]);
      } else {
        selectedItems = selectedItems.filter((i) => i[uniqueKey] != item[uniqueKey]);
      }
      selectedIndexes = selectedIndexes.filter(r => r != rows.findIndex(r => r.item[uniqueKey] == item[uniqueKey]))
    }
  }

  function handleSelectAll() {
    if (selectMode == "multiple") {
      selectedItems = []
      selectedIndexes = []
      unselectedItems = []
      selectedAll = !selectedAll
    }
  }

  function expandRow(row: Row) {
    let index = expandedRows.findIndex((r) => r.item[uniqueKey] == row.item[uniqueKey]);
    if (index == -1) {
      expandedRows = [...expandedRows, row];
    } else {
      expandedRows = expandedRows.filter((r) => r.item[uniqueKey] != row.item[uniqueKey]);
    }
  }

  function formatDate(
    dateTime: DateTime,
    dateFormat: Extract<HeaderType, { key: "date" }>["params"]
  ): string {
    return dateTime.setLocale(dateFormat.locale).toFormat(dateFormat.format);
  }

  $effect(() => {
    if (!showExpand) {
      totalBatchLength = rows.length;
    } else {
      totalBatchLength = rows.reduce(
        (acc, row) => acc + row.subItems.length,
        rows.length
      );
    }

    if (
      !!cellEditorInfoActive &&
      cellEditorInfoActive.type.key == "number" &&
      ((cellEditorInfoActive.type.params?.min != undefined &&
        cellEditorInfoActive.value < cellEditorInfoActive.type.params.min) ||
        (cellEditorInfoActive.type.params?.max != undefined &&
          cellEditorInfoActive.value > cellEditorInfoActive.type.params.max))
    ) {
      saveEditDisabled = true;
    } else {
      saveEditDisabled = false;
    }
  })

  function searchTextBuilder(searchText?: string) {
    let builder: FilterBuilder;

    let converter = new Converter();
    builder = converter.createBuilder({
      filters: filters || [],
    });

    if (!!searchText && !!searchBarColumns && searchBarColumns.length > 0) {
      builder.where((b) => {
        b.where(searchBarColumns![0], "ilike", "%" + searchText + "%");
        for (let i = 1; i < searchBarColumns!.length; i += 1) {
          b.orWhere(searchBarColumns![i], "ilike", "%" + searchText + "%");
        }
      });
    }

    return builder;
  }

  let syncTimer: NodeJS.Timeout;
  function handleSearchChange(searchText: string | undefined) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(async () => {
      globalBuilder = searchTextBuilder(searchText);
      for (let i = 0; i < quickFilters.length; i++) {
        globalBuilder = quickFilterBuilder(globalBuilder, quickFilters[i]);
      }

      handleFiltersChange();
    }, 800);
  }

  $effect(() => {
    if (searchText != undefined) handleSearchChange(searchText);
  })

  function handleFiltersChange() {
    if(!!tableContainer) {
      userScrolling = false
      currentSectionNumber = 0
      tableContainer.scrollTop = 0
      setTimeout(() => userScrolling = true, 20)
    }
    
    if (!!sortedBy) {
      if(sortModify){
        globalBuilder = sortModify({ builder: globalBuilder, sortDirection })
      }
      else {
        globalBuilder.orderBy(sortedBy, sortDirection || "asc");
      }
    }

    if(onfiltersChange) {
      onfiltersChange({
        detail: {
          builder: globalBuilder,
        }
      })
    }
  }

  function handleClearQuickFilter(
    quickFilter: QuickFilter,
    dispatchFiltersChange: boolean = true
  ) {
    if (quickFilter.type.key == 'custom') {
      quickFilter.type.value = undefined;
      quickFilter.type.missingValue = undefined;
      if(dispatchFiltersChange) {
        if(onremoveCustomQuickFilter) {
          onremoveCustomQuickFilter({
            detail: {
              quickFilter
            }
          })
        }
      }
    }
    else if (quickFilter.type.key == "string") {
      quickFilter.type.value = undefined;
      quickFilter.type.missingValue = undefined;
    } else if (quickFilter.type.key == "number") {
      quickFilter.type.value = undefined;
      quickFilter.type.missingValue = undefined;
    } else if (quickFilter.type.key == "boolean") {
      quickFilter.type.value = undefined;
    } else if (quickFilter.type.key == "country") {
      quickFilter.type.selected = undefined;
      quickFilter.type.missingValue = undefined;
    } else if (quickFilter.type.key == "date") {
      quickFilter.type.from = undefined;
      quickFilter.type.to = undefined;
    } else if (quickFilter.type.key == "multi-select") {
      quickFilter.type.values = [];
      quickFilter.type.missingValue = false;
      quickFilter.type.missingValue = undefined;
    }

    if (dispatchFiltersChange) {
      quickFilter.active = false;
    }

    globalBuilder = searchTextBuilder(searchText);

    for (let i = 0; i < quickFilters.length; i++) {
      if (quickFilters[i].active) {
        globalBuilder = quickFilterBuilder(
          globalBuilder,
          quickFilters[i],
          false
        );
      }
    }

    if (dispatchFiltersChange) {
      quickFilters = quickFilters;
      handleFiltersChange();
    }

    return globalBuilder;
  }

  function handleSearchBoxKeydown(e: KeyboardEvent) {
    if (e.key == "Enter") {
      handleFiltersChange();
    }
  }

  function handleQuickFilterClick(
    mouseEvent: MouseEvent & {
      currentTarget: EventTarget & HTMLButtonElement;
    },
    quickFilter?: QuickFilter
  ) {
    handleCancelClick();
    setTimeout(() => {
      if (quickFilter) {
        if (!quickFilterActivator) {
          let target = mouseEvent.target as unknown as HTMLElement;
          quickFilterActivator = target;
          quickFilterActive = quickFilter;
          openQuickFilter = !openQuickFilter;
        }
      }
    }, 300);
  }

  function setQuickFilterMissingValue(quickFilter: QuickFilter) {
    if (quickFilter.type.key == 'custom') {
      quickFilter.type.missingValue = true;
      quickFilter.type.value = undefined;
    }
    else if (quickFilter.type.key == "multi-select") {
      quickFilter.type.missingValue = true;
      quickFilter.type.values = [];
    } else if (quickFilter.type.key == "string") {
      quickFilter.type.missingValue = true;
      quickFilter.type.value = undefined;
    } else if (quickFilter.type.key == "country") {
      quickFilter.type.missingValue = true;
      quickFilter.type.selected = undefined;
    } else if (quickFilter.type.key == "number") {
      quickFilter.type.missingValue = true;
      quickFilter.type.value = undefined;
    }

    handleApplyClick(quickFilter);
  }

  function setQuickFilterValue(quickFilter: QuickFilter, value?: any) {
    if (quickFilter.type.key == "custom") {
      quickFilter.type.value = value;
    } 
    else if (quickFilter.type.key == "boolean") {
      quickFilter.type.value = value;
    } 

    handleApplyClick(quickFilter);
  }

  function handleApplyClick(quickFilter: QuickFilter, dispatchCustomFilterClick: boolean = false) {
    if(quickFilter.type.key == 'custom' && dispatchCustomFilterClick) {
      if(onapplyCustomQuickFilter) {
        onapplyCustomQuickFilter({
          detail: {
            quickFilter,
            setQuickFilterValue
          }
        })
      }
    }
    else {
      quickFilter.active = true;
      quickFilters = quickFilters;
      globalBuilder = quickFilterBuilder(globalBuilder, quickFilter);
  
      handleFiltersChange();
  
      quickFilterActivator = undefined;
      openQuickFilter = false;
    }
  }

  function quickFilterBuilder(
    builder: FilterBuilder,
    quickFilter: QuickFilter,
    clearPreaviousValue: boolean = true
  ) {
    if (quickFilter.type.key == 'custom') {
      let value = quickFilter.type.value,
        missingValue = quickFilter.type.missingValue;
      if (clearPreaviousValue) {
        builder = handleClearQuickFilter(quickFilter, false);
      }
      quickFilter.type.value = value;
      quickFilter.type.missingValue = missingValue;

      builder = quickFilter.type.modify({
        builder,
        value: { value, missingValue },
      });
    }
    else if (quickFilter.type.key == "string") {
      let value = quickFilter.type.value,
        missingValue = quickFilter.type.missingValue;
      if (clearPreaviousValue) {
        builder = handleClearQuickFilter(quickFilter, false);
      }
      quickFilter.type.value = value;
      quickFilter.type.missingValue = missingValue;

      if (quickFilter.type.modify) {
        builder = quickFilter.type.modify({
          builder,
          value: { value, missingValue },
        });
      }

      if (!!quickFilter.column) {
        if (missingValue) {
          builder.whereNull(quickFilter.column);
        } else if (!!value) {
          builder.where(
            quickFilter.column,
            quickFilter.type.mode ?? "equal",
            value
          );
        }
      }
    } else if (quickFilter.type.key == "boolean") {
      let value = quickFilter.type.value;
      if (clearPreaviousValue) {
        builder = handleClearQuickFilter(quickFilter, false);
      }
      quickFilter.type.value = value;

      if (quickFilter.type.modify) {
        builder = quickFilter.type.modify({
          builder,
          value,
        });
      }

      if (!!quickFilter.column && value != undefined) {
        builder.where(quickFilter.column, value);
      }
    } else if (quickFilter.type.key == "country") {
      let value = quickFilter.type.selected,
        missingValue = quickFilter.type.missingValue;
      if (clearPreaviousValue) {
        builder = handleClearQuickFilter(quickFilter, false);
      }
      quickFilter.type.selected = value;
      quickFilter.type.missingValue = missingValue;

      const values = value?.map((item) => item.value);
      if (quickFilter.type.modify) {
        builder = quickFilter.type.modify({
          builder,
          value: { values, missingValue },
        });
      }

      if (!!quickFilter.column) {
        if (missingValue) {
          builder.whereNull(quickFilter.column);
        } else if (!!values && values.length > 0) {
          builder.whereIn(quickFilter.column, values);
        }
      }
    } else if (quickFilter.type.key == "date") {
      let from = quickFilter.type.from,
        to = quickFilter.type.to;
      if (clearPreaviousValue) {
        builder = handleClearQuickFilter(quickFilter, false);
      }
      quickFilter.type.from = from;
      quickFilter.type.to = to;

      if (quickFilter.type.modify) {
        builder = quickFilter.type.modify({
          builder,
          value: { from, to },
        });
      } else if (!!quickFilter.column) {
        if (!!from) {
          builder.where(
            quickFilter.column,
            ">=",
            DateTime.fromJSDate(from).setLocale('it-IT').startOf('day').toString()
          );
        }
        if (!!to) {
          builder.where(
            quickFilter.column,
            "<=",
            DateTime.fromJSDate(to).setLocale('it-IT').endOf('day').toString()          );
        }
      }
    } else if (quickFilter.type.key == "multi-select") {
      let value = quickFilter.type.values,
        missingValue = quickFilter.type.missingValue;
      if (clearPreaviousValue) {
        builder = handleClearQuickFilter(quickFilter, false);
      }
      quickFilter.type.values = value;
      quickFilter.type.missingValue = missingValue;

      const values = value.map(item => item.value);

      if (quickFilter.type.modify) {
        builder = quickFilter.type.modify({
          builder,
          value: { values: values, missingValue },
        });
      } else if (quickFilter.column) {
        if (missingValue) {
          builder.whereNull(quickFilter.column);
        } else if (values.length > 0) {
          builder.whereIn(quickFilter.column, values);
        }
      }
    } else if (quickFilter.type.key == "number") {
      let value = quickFilter.type.value,
        missingValue = quickFilter.type.missingValue;
      if (clearPreaviousValue) {
        builder = handleClearQuickFilter(quickFilter, false);
      }
      quickFilter.type.value = value;
      quickFilter.type.missingValue = missingValue;

      if (quickFilter.type.modify) {
        builder = quickFilter.type.modify({
          builder,
          value: { value, missingValue },
        });
      }

      if (quickFilter.column) {
        if (missingValue) {
          builder.whereNull(quickFilter.column);
        } else if (!!value) {
          builder.where(quickFilter.column, value);
        }
      }
    }

    return builder;
  }

  function updateFilterValues(filter: Filter, updateMultiFilterValues: (filterName: string, newValue: any, newValid: boolean, newMode?: NumberMode | StringMode | SelectMode | DateMode) => void) {
    let newValue: any = {},
      newValid: boolean = false,
      newMode = filter.type == 'date' ||
        filter.type == 'number' ||
        filter.type == 'select' ||
        filter.type == 'string' ?
          filter.mode :
          undefined
    if(filter.type == 'select') {
      newValue = filter.values 
      if(newValue.length > 0) {
        newValid = true
      }
    } else if('mode' in filter && filter.mode == 'between') {
      newValue.to = filter.to
      newValue.from = filter.from
      if(!!newValue.from || !!newValue.to) {
        newValid = true
      }
    } else {
      newValue = filter.value
      if(!!newValue) {
        newValid = true
      }
    }
    updateMultiFilterValues(filter.name, newValue, newValid, newMode)
  }

  function handleRemoveAllFilters() {
    if(onremoveAllFilters){
      onremoveAllFilters()
    }
    handleSearchChange(searchText);
  }

  function handleRemoveFilter(filter: Filter) {
    if(onremoveFilter) {
      onremoveFilter({
        detail: {
          filter
        }
      })
    }
    handleSearchChange(searchText);
  }

  async function handleLoadForward() {
    if(renderedRows.length >= renderedRowsNumber) {
      userScrolling = false
      
      const anchorIndex = renderedRowsNumber - 1
      const anchorUniqueKey = renderedRows[anchorIndex].item[uniqueKey]
      const anchorElement = findAnchorElement(anchorUniqueKey)
      const anchorOffsetBefore = anchorElement?.getBoundingClientRect().top || 0
      
      let removedRowCount = 0

      for (let i = 0; removedRowCount < sectionRowsNumber; i++) {
        let row = tableBody?.children.item(i)
        removedRowCount++

        const rowKey = row?.getAttribute("data-key")
        const isExpanded = expandedRows.some(r => r.item[uniqueKey] == rowKey)
        
        if (isExpanded) {
          i++
        }
      }

      currentSectionNumber = currentSectionNumber + 1

      await tick()

      if(tableContainer) {
        const anchorElementAfter = findAnchorElement(anchorUniqueKey)
        const anchorOffsetAfter = anchorElementAfter?.getBoundingClientRect().top || 0
        const offsetDiff = anchorOffsetAfter - anchorOffsetBefore
        tableContainer.scrollTop += offsetDiff

        userScrolling = true
      }
    }

    if(totalCachedSections - sectionThreshold <= currentSectionNumber 
      && !loading 
      && totalRows > rows.length
    ) {
      if(onfetchData) {
        onfetchData()
      }
    }
  }

  async function handleLoadBackward() {
    if(currentSectionNumber > 0) {
      userScrolling = false
  
      const anchorIndex = 0
      const anchorUniqueKey = renderedRows[anchorIndex].item[uniqueKey]
      const anchorElement = findAnchorElement(anchorUniqueKey)
      const anchorOffsetBefore = anchorElement?.getBoundingClientRect().top || 0
  
      let removedRowCount = 0
  
      for (let i = renderedRows.length - 1; removedRowCount < sectionRowsNumber; i--) {
        let row = tableBody?.children.item(i)
        removedRowCount++
  
        const rowKey = row?.getAttribute("data-key")
        const isExpanded = expandedRows.some(r => r.item[uniqueKey] == rowKey)
        
        if (isExpanded) {
          i--
        }
      }
      
      currentSectionNumber = currentSectionNumber - 1
  
      await tick()
  
      if(tableContainer) {
        const anchorElementAfter = findAnchorElement(anchorUniqueKey)
        const anchorOffsetAfter = anchorElementAfter?.getBoundingClientRect().top || 0
        const offsetDiff = anchorOffsetAfter - anchorOffsetBefore
        tableContainer.scrollTop += offsetDiff
  
        userScrolling = true
      }
    }
  }

  function findAnchorElement(key: keyof RowItem) {
    if(tableBody) {
      for (let i = 0; i < tableBody.children.length; i++) {
        const child = tableBody.children.item(i)
        if (child?.getAttribute("data-key") == key) {
          return child
        }
      }
    }
    return undefined
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
      !!tableContainer &&
      headersToShowInTable.length > 0 &&
      resizedColumnSizeWithPadding &&
      headersToShow.length > 0 &&
      mainHeader
    ) {
      tick().then(updateRemainingWidth);
    }
  })
  
  async function updateRemainingWidth() {
    if(tableContainer != null && !!tableContainer && mainHeader) {
      const containerWidth = tableContainer.getBoundingClientRect().width - 30;

      if(containerWidth){
        const totalResizableWidth = headersToShowInTable.reduce((sum, head) => {
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

      let minWidth = header.minWidth,
        minWidthPx = DEFAULT_MIN_WIDTH_PX
      if (!!minWidth && minWidth.endsWith('px')) {
        minWidthPx = parseInt(minWidth, 10);
      }
      if(widthWihtPadding < minWidthPx) {
        widthWihtPadding = minWidthPx
      }

      let maxWidth = header.maxWidth,
        maxWidthPx = DEFAULT_MAX_WIDTH_PX
      if (!!maxWidth && maxWidth.endsWith('px')) {
        maxWidthPx = parseInt(maxWidth, 10);
      }
      if(widthWihtPadding > maxWidthPx) {
        widthWihtPadding = maxWidthPx
      }

      resizedColumnSizeWithPadding[header.value] = widthWihtPadding;
    }
    let { paddingLeft, paddingRight } = getComputedStyle(th);
    let width = resizedColumnSizeWithPadding[header.value] - parseFloat(paddingLeft) - parseFloat(paddingRight);
    th.style.width = `${width}px`
  }
</script>

{#if !!rows && Array.isArray(rows) && !!headersToShowInTable && Array.isArray(headersToShowInTable)}
  {#if showActions}
    <QuickActions
      selectedItems={selectedAll ? totalRows - unselectedItems.length : selectedItems.length}
      disabled={quickActionsDisabled}
      {actionsForSelectedItems}
      {lang}
      onClose={() => {
        selectedAll = false
        unselectedItems = []
        selectedItems = []
      }}
    />
  {/if}

  {#if searchBarVisible || filtersVisible || appendSnippet}
    <div class="filter-container">
      <div class="search-bar-container">
        {#if searchBarVisible}
          {#if searchBarSnippet}
            {@render searchBarSnippet({ handleSearchChange })}
          {:else}
            <div style="margin-right: 20px;">
              <SimpleTextField
                placeholder={searchBarPlaceholder}
                appendInnerIcon="mdi-magnify"
                bind:value={searchText}
                bind:input={searchBarInput}
                onkeydown={handleSearchBoxKeydown}
                --simple-textfield-default-width="450px"
                --simple-textfield-border-radius= 0.5rem
                --simple-textfield-background-color= transparent
                --simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
                --simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
              />
            </div>
          {/if}
        {/if}
  
        {#if filtersVisible}
          <div>
            {#if dynamicFilters}
              <Filters
                bind:filters
                onapplyFilter={() => {
                  handleSearchChange(searchText);
                }}
                onremoveFilter={e => { handleRemoveFilter(e.detail.filter) }}
                onremoveAllFilters={() => handleRemoveAllFilters()}
                --filters-default-wrapper-width="100%"
                {lang}
                {dateLocale}
                {editFilterMode}
                {showActiveFilters}
                appendSnippet={filterAppendSnippet}
                customChipSnippet={customFilterChipSnippet}
              >
                {#snippet contentSnippet({ filters, mAndDown, updateMultiFilterValues, })}  
                  {#key filters}
                    <DynamicFilters
                      {lang}
                      {filters}                      
                      {mAndDown}
                      onchange={e => updateFilterValues(e.detail.filter, updateMultiFilterValues)}    
                      {updateMultiFilterValues}
                    >
                      {#snippet customSnippet({ filter, mAndDown, updateCustomFilterValues })}
                        {@render customFilterSnippet?.({ filter, mAndDown, updateCustomFilterValues })}
                      {/snippet}
                    </DynamicFilters>
                  {/key}
                {/snippet}
              </Filters>
            {:else}
              <Filters
                bind:filters
                onapplyFilter={() => {
                  handleSearchChange(searchText);
                }}
                onremoveFilter={e => { handleRemoveFilter(e.detail.filter) }}
                onremoveAllFilters={() => handleRemoveAllFilters()}
                --filters-default-wrapper-width="100%"
                {lang}
                {dateLocale}
                {editFilterMode}
                {showActiveFilters}
                appendSnippet={filterAppendSnippet}
                customChipSnippet={customFilterChipSnippet}
                customSnippet={customFilterSnippet}
              >
              </Filters>
            {/if}
          </div>
        {/if}
      </div>

      <div>
        {@render appendSnippet?.()}
      </div>
    </div>
  {/if}

  {#if quickFiltersVisible || numberOfResultsVisible}
  <div class="quick-filters-results-container">
    <div class="quick-filters">
      {#if !!quickFilters && quickFilters.length > 0 && quickFiltersVisible}
        {#each quickFilters as quickFilter}
          <div
            class={quickFilter.active ? "active-quick-filters" : "non-active-quick-filters"}
          >
            <button
              onclick={(e) => {
                handleQuickFilterClick(e, quickFilter);
              }}
            >
              <div class="quick-filter-icon">
                <Icon name={quickFilter.icon} --icon-size="20px" />
                {quickFilter.title}
              </div>
            </button>
            {#if quickFilter.active}
              <div style:padding-top="1px" style:padding-right="3px">
                <Icon
                  name="mdi-close-circle"
                  --icon-size="14px"
                  onclick={() => {
                    handleClearQuickFilter(quickFilter);
                  }}
                />
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
    {#if numberOfResultsVisible}
      <div class='results-number'>
        { lang == 'en' ? 'Results: ' : 'Risultati: '}
        {#if !loading}
          {totalRows || rows.length}
        {:else}
          <CircularLoader 
            {loading}
            --circular-loader-height='10px'
          ></CircularLoader>
        {/if}
      </div>
    {/if}
  </div>
  {/if}

  <div class="outer-container">
    <div class="inner-container" class:hide-scrollbar={hideScrollbar} bind:this={tableContainer} {onscroll}>
    <InfiniteScroll
      onloadMore={handleLoadBackward}
      threshold={backwardThresholdPixel}
      hasMore={currentSectionNumber > 0 && userScrolling}
      direction='backward'
    />
    <table style="display: table;" class="dynamic-table">
      <thead class="table-header" bind:this={mainHeader}>
        <tr>
          {#if !!showSelect && !showExpand && rows.length > 0}
            <th
              style:width="30px"
              style:min-width="30px"
              style:text-align="center"
              class="non-resizable"
            > 
              {#if selectMode === "multiple"}
                <Checkbox
                  id="select-all"
                  value={selectedAll}
                  disabled={disabled || loading}
                  onchange={handleSelectAll}
                />
              {/if}
            </th>
          {/if}
          {#if showExpand}
            <th
              style:min-width="60px"
              style:max-width="60px"
              style:text-align="center"
              class="non-resizable"
            ></th>
          {/if}
          {#each headersToShowInTable as header, index}
            <th
              style={`${resizableColumns || !header.width ? '' : `width: ${header.width}`}`}
              style:min-width={header.minWidth}
              style:max-width={header.maxWidth}
              class:sortable={header.sortable}
              onclick={() => handleHeaderClick(header)}
              id={header.value}
            >
              {#if resizableColumns}
                <div class="resizer" use:resize></div>
              {/if}
              {#if headerSnippet}
                {@render headerSnippet({ header })}
              {:else}
                <span class="header-label" bind:this={infoActivators[index]}>
                  {#if headerLabelSnippet}
                    {@render headerLabelSnippet({ header })}
                  {:else}
                    {header.label}
                  {/if}
                  {#if !!header.info}
                    <Icon						
                      name="mdi-help-circle-outline"
                      --icon-size="16px"
                    />
                  {/if}
                </span>
                {#if !!header.info}
                  <ToolTip
                    appearTimeout={700}
                    activator={infoActivators[index]}
                  >
                    <div
                      style:background-color='rgb(var(--global-color-background-300), .95)'
                      style:border-radius="5px"
                      style:padding="10px"
                    >
                      {header.info}
                    </div>
                  </ToolTip>
                {/if}
                {#if header.sortable}
                  <span
                    class="header-sort-icon"
                    class:active={sortedBy == header.value}
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
          {#if remainingWidth && (customizeHeaders || resizableColumns)}
            <th
              style:width={remainingWidth + 'px'}
              class="filler"
              aria-hidden="true"
            ></th>
          {/if}
          {#if customizeHeaders || rowAppendSnippet}
            <th
              style:text-align="center"
              class="customize-headers"
            >
              {#if customizeHeaders}
                <div style="display: flex; justify-content: center;">
                  <Icon
                    name="mdi-plus-circle-outline"
                    onclick={() => (openHeaderDrawer = true)}
                  />
                </div>
              {:else}
                {@render rowAppendSnippet?.({ index: -1, row: undefined })}
              {/if}
            </th>
          {/if}
        </tr>
        {#if loading}
          <tr>
            <th
              colspan={headersToShowInTable.length + 1}
              class="loading"
              style="text-align: center;"
              style:border="none"
              style:cursor="default"
              style:font-size="1.2em"
              style:padding="0px"
            >
              <div class="loader-line"></div>
            </th>
          </tr>
        {/if}
      </thead>

      <tbody bind:this={tableBody}>
        {#if rows.length == 0}
          <tr>
            <td
              colspan={headersToShowInTable.length + 1}
              style="text-align: center;"
              style:border="none"
              style:cursor="default"
              style:padding="10px"
              style:font-size="1.2em"
            >
              <NoData {noItemsText} ></NoData>
            </td>
          </tr>
        {:else}
          {#each renderedRows as row, indexRow}
            <tr
              class="item-row"
              data-key={row.item[uniqueKey]}
              style:background-color={
                !!row.item.disableEdit
                  ? !!row.item.rowDisableBackgroundColor
                    ? row.item.rowDisableBackgroundColor
                    : 'var(--dynamic-table-row-disabled-background-color, var(--dynamic-table-default-row-disabled-background-color))'
                  : expandedRows.findIndex(r => r.item[uniqueKey] == row.item[uniqueKey]) != -1
                    ? 'var(--dynamic-table-expanded-row-background-color, var(--dynamic-table-default-expanded-row-background-color))'
                    : selectedAll
                      ? !unselectedItems.find(i => i[uniqueKey] == row.item[uniqueKey])
                        ? 'var(--dynamic-table-selected-row-background-color, var(--dynamic-table-default-selected-row-background-color))'
                        : ''
                      : selectedItems.find(i => i[uniqueKey] == row.item[uniqueKey])
                        ? 'var(--dynamic-table-selected-row-background-color, var(--dynamic-table-default-selected-row-background-color))'
                        : ''
                }
              class:row-activator={cellEditorIndexRow == indexRow && !cellEditorSubItem}
              onclick={() => handleRowClick(row.item)}
            >
              {#if !!showSelect && !showExpand}
                <td style:padding-left="0px" style:text-align="center">
                  <Checkbox
                    id={row.item[uniqueKey]}
                    value={
                      selectedAll ?
                        unselectedItems.findIndex(
                          (i) => i[uniqueKey] == row.item[uniqueKey]
                        ) == -1 :
                        selectedItems.findIndex(
                          (i) => i[uniqueKey] == row.item[uniqueKey]
                        ) != -1
                    }
                    disabled={disabled || loading}
                    onchange={(e) => handleSelect(row.item, e.detail.shiftKeyPressed)}
                  />
                </td>
              {/if}
              {#if showExpand}
                <td style:padding-left="0px" style:text-align="center">
                  <Icon
                    name={expandedRows.findIndex(
                      (r) => r.item[uniqueKey] == row.item[uniqueKey]
                    ) == -1
                      ? "mdi-chevron-down"
                      : "mdi-chevron-up"}
                    --icon-size="24px"
                    onclick={() => expandRow(row)}
                  />
                </td>
              {/if}
              {#each headersToShowInTable as header, indexHeader}
                <td
                  class:hover-cell={cellEdit && !loading && !!header.cellEditorInfo}
                  class:cell-edit-activator={cellEditorIndexHeader == indexHeader && cellEditorIndexRow == indexRow && !cellEditorSubItem}
                  onclick={(e) => {
                    handleCellClick(
                      e,
                      row.item,
                      header.cellEditorInfo,
                      row.item[header.value],
                      indexRow,
                      indexHeader,
                      false
                    );
                  }}
                >
                  {#if header.type.key == "custom"}
                    {@render customRowSnippet?.({ index: indexRow, columnIndex: indexHeader, header, row })}
                  {:else if header.type.key == "date"}
                    {formatDate(row.item[header.value], header.type.params)}
                  {:else if header.type.key == "icon"}
                    <Icon
                      --icon-color={header.type.params?.color}
                      --icon-size={header.type.params?.size}
                      name={header.type.params?.name || ""}
                    />
                  {:else if header.type.key == "string"}
                    {#if row.item[header.value] !== undefined && row.item[header.value] !== null}
                      {row.item[header.value]}
                    {:else if !!header.type.params?.nullText}
                      {#if typeof header.type.params.nullText == "function"}
                        {header.type.params.nullText(row.item)}
                      {:else}
                        {header.type.params.nullText}
                      {/if}
                    {:else}
                      <div style="display: flex; justify-content: center;">-</div>
                    {/if}
                  {:else}
                    {row.item[header.value]}
                  {/if}
                </td>
              {/each}
              {#if remainingWidth && (customizeHeaders || resizableColumns)}
                <td></td>
              {/if}
              {#if rowAppendSnippet}
                <td class={clazz.cell || ""}>
                  {@render rowAppendSnippet?.({ index: indexRow, row })}
                </td>
              {/if}
            </tr>
            {#if showExpand}
              {#if expandedRows.findIndex((r) => r.item[uniqueKey] == row.item[uniqueKey]) != -1}
                <tr>
                  <td
                    colspan={headersToShowInTable.length + 1}
                    style:border="none"
                    class="expanded-row"
                  >
                    <table style="display: table;">
                      <thead class="table-header table-subheader">
                        <tr>
                          {#each subHeaders as subHeader}
                            <th
                              style:width={subHeader.width}
                              style:min-width={subHeader.minWidth}
                              style:max-width={subHeader.maxWidth}
                              class:sortable={subHeader.sortable}
                              onclick={() => handleHeaderClick(subHeader)}
                            >
                              {#if subHeaderSnippet}
                                {@render subHeaderSnippet({ subHeader })}
                              {:else}
                                <span class="header-label">
                                  {#if subHeaderLabelSnippet}
                                    {@render subHeaderLabelSnippet({ subHeader })}
                                  {:else}
                                    {subHeader.label}
                                  {/if}
                                </span>
                                {#if subHeader.sortable}
                                  <span
                                    class="header-sort-icon"
                                    class:active={sortedBy == subHeader.value}
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
                          {#if subRowActionsSnippet || subRowAppendSnippet}
                            <th>
                              {@render subRowAppendSnippet?.({ index: -1, row: undefined })}
                            </th>
                          {/if}
                        </tr>
                      </thead>

                      <tbody>
                        {#each row.subItems as subItem, indexSubItem}
                          <tr
                            onclick={() => handleRowClick(subItem)}
                            class:row-activator={cellEditorIndexRow == indexSubItem && cellEditorSubItem}
                          >
                            {#each subHeaders as subHeader, indexSubHeader}
                              <td
                                class:cell-edit-activator={cellEditorIndexHeader == indexSubHeader && cellEditorIndexRow == indexSubItem && cellEditorSubItem}
                                class:hover-cell={cellEdit && !loading && !!subHeader.cellEditorInfo}
                                onclick={(e) => {
                                  handleCellClick(
                                    e,
                                    subItem,
                                    subHeader.cellEditorInfo,
                                    subItem[subHeader.value],
                                    indexSubItem,
                                    indexSubHeader,
                                    true
                                  );
                                }}
                              >
                                {#if subHeader.type.key == "custom"}
                                  {@render customSubRowSnippet?.({ index: indexSubItem, columnIndex: indexSubHeader, header: subHeader, row: subItem})}
                                {:else if subHeader.type.key == "date"}
                                  {formatDate(
                                    subItem[subHeader.value],
                                    subHeader.type.params
                                  )}
                                {:else if subHeader.type.key == "icon"}
                                  <Icon
                                    --icon-color={subHeader.type.params?.color}
                                    --icon-size={subHeader.type.params?.size}
                                    name={subHeader.type.params?.name || ""}
                                  />
                                {:else if subHeader.type.key == "string"}
                                  {#if subItem[subHeader.value] !== undefined && subItem[subHeader.value] !== null}
                                    {subItem[subHeader.value]}
                                  {:else if !!subHeader.type.params?.nullText}
                                    {#if typeof subHeader.type.params.nullText == "function"}
                                      {subHeader.type.params.nullText(subItem)}
                                    {:else}
                                      {subHeader.type.params.nullText}
                                    {/if}
                                  {:else}
                                    <div style="display: flex; justify-content: center;">-</div>
                                  {/if}
                                {:else}
                                  {subItem[subHeader.value]}
                                {/if}
                              </td>
                            {/each}
                            {#if subRowActionsSnippet || subRowAppendSnippet}
                              <td class={clazz.cell || ""}>
                                {@render subRowActionsSnippet?.({ index: indexSubItem, row: subItem})}
                                {@render subRowAppendSnippet?.({ index: indexSubItem, row: subItem})}
                              </td>
                            {/if}
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </td>
                </tr>
              {/if}
            {/if}
          {/each}
        {/if}
      </tbody>
    </table>
    <InfiniteScroll
      onloadMore={handleLoadForward}
      threshold={forwardThresholdPixel}
      hasMore={hasMoreToRender && userScrolling}
    />
  </div>
  {#if totalSections - 1 < currentSectionNumber && reachedBottom && endLineVisible}
    <div class="line-container" transition:fade>
      <span class="line"></span>
      <span class="text">{lang == 'en' ? 'End' : 'Fine'}</span>
      <span class="line"></span>
    </div>
  {/if}
  </div>
{/if}
{#if cellEditorInfoActive}
  <Menu
    bind:open={openCellEditor}
    activator={cellEditorActivator}
    bind:menuElement={menuElementCellEditor}
    _top={undefined}
    openingId="cell-editor"
  >
    <div
      class="cell-editor-container"
      bind:this={cellEditorContainer}
    >
      <div style:grid-column="1 / 3">
        {#if cellEditorInfoActive.type.key === "string"}
          <LabelAndTextField
            label={cellEditorInfoActive.title}
            description={cellEditorInfoActive.description}
            name={cellEditorInfoActive.title}
            info={cellEditorInfoActive.info}
            type="text"
            orientation="horizontal"
            bind:value={cellEditorInfoActive.value}
            --simple-textfield-border-radius= 0.5rem
            --simple-textfield-background-color= transparent
            --simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
            --simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
          />
        {:else if cellEditorInfoActive.type.key === "number"}
          <LabelAndTextField
            label={cellEditorInfoActive.title}
            description={cellEditorInfoActive.description}
            name={cellEditorInfoActive.title}
            info={cellEditorInfoActive.info}
            type="number"
            orientation="horizontal"
            error={saveEditDisabled}
            bind:value={cellEditorInfoActive.value}
            --simple-textfield-border-radius= 0.5rem
            --simple-textfield-background-color= transparent
            --simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
            --simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
          />
        {:else if cellEditorInfoActive.type.key === "select"}
          <LabelAndSelect
            label={cellEditorInfoActive.title}
            description={cellEditorInfoActive.description}
            name={cellEditorInfoActive.title}
            info={cellEditorInfoActive.info}
            options={cellEditorInfoActive.type.params.options}
            orientation="horizontal"
            bind:value={cellEditorInfoActive.value}
          />
        {:else if cellEditorInfoActive.type.key === "boolean"}
          <div class="container">
            <Checkbox
              id={cellEditorInfoActive.title}
              bind:value={cellEditorInfoActive.value}
            />
            <label style:margin-left="0.7rem" for={cellEditorInfoActive.title}
              >{cellEditorInfoActive.title}
            </label>
          </div>
        {/if}
      </div>

      <div style:margin-top="10px" style:grid-row="2" style:grid-column="1 / 3">
        <Divider --divider-color=rgb(var(--global-color-contrast-100) />
      </div>
      <div style:grid-row="3" style:grid-column="2" style:margin-top="-15px">
        <ConfirmOrCancelButtons
          confirmDisable={saveEditDisabled}
          confirmText="Save"
          cancelText="Cancel"
          oncancelClick={handleCancelClick}
          onconfirmClick={handleSaveClick}
        />
      </div>
    </div>
  </Menu>
{/if}

{#if quickFilterActive}
  <Menu
    bind:open={openQuickFilter}
    activator={quickFilterActivator}
    bind:menuElement={menuElementQuickFilters}
    anchor="bottom"
    openingId="quick-filter"
    closeOnClickOutside
  >
    <div
      class="quick-filter-container"
    >
      <div style:grid-column="1 / 3">
        {#if quickFilterActive.type.key == 'custom'}
          {@render customQuickFilterSnippet?.({ quickFilter: quickFilterActive, setQuickFilterMissingValue })}
        {:else if quickFilterActive.type.key === "string"}
          <div class="space-between" style="font-weight: 500;">
            {quickFilterActive.title}
            {#if !!quickFilterActive.type.missingLabel}
              <button
                onclick={() =>
                  setQuickFilterMissingValue(quickFilterActive!)}
                >{quickFilterActive.type.missingLabel}</button
              >
            {/if}
          </div>
          <LabelAndTextField
            description={quickFilterActive.description}
            name={quickFilterActive.title}
            info={quickFilterActive.info}
            type="text"
            bind:value={quickFilterActive.type.value}          
            --simple-textfield-border-radius= 0.5rem
            --simple-textfield-background-color= transparent
            --simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
            --simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
          />
        {:else if quickFilterActive.type.key === "number"}
          <div class="space-between" style="font-weight: 500; margin-bottom: 8px;">
            {quickFilterActive.title}
            {#if !!quickFilterActive.type.missingLabel}
              <button
                onclick={() =>
                  setQuickFilterMissingValue(quickFilterActive!)}
                >{quickFilterActive.type.missingLabel}</button
              >
            {/if}
          </div>
          <LabelAndTextField
            description={quickFilterActive.description}
            name={quickFilterActive.title}
            info={quickFilterActive.info}
            type="number"
            error={saveEditDisabled}
            bind:value={quickFilterActive.type.value}          
            --simple-textfield-border-radius= 0.5rem
            --simple-textfield-background-color= transparent
            --simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
            --simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
          />
        {:else if quickFilterActive.type.key === "multi-select"}
          <div class="space-between" style="font-weight: 500; margin-bottom: 8px;">
            {quickFilterActive.title}
            {#if !!quickFilterActive.type.missingLabel}
              <button
                onclick={() =>
                  setQuickFilterMissingValue(quickFilterActive!)}
                >{quickFilterActive.type.missingLabel}</button
              >
            {/if}
          </div>
          <div onclick={e => e.stopPropagation()} role="presentation" tabindex="-1">
            <Autocomplete
              multiple
              items={quickFilterActive.type.items}
              bind:values={quickFilterActive.type.values}
              --autocomplete-border-radius= 0.5rem
              --autocomplete-border="1px solid rgb(var(--global-color-background-500))"
              --autocomplete-focus-box-shadow="0 0 0 2px rgb(var(--global-color-primary-500))"
            >
              {#snippet selectionSnippet({ selection, unselect })}
                {#if selectionInternalSnippet}
                  {@render selectionInternalSnippet({ selection, unselect })}
                {:else}
                  <div tabindex="-1">
                    <Chip
                      close={true}
                      onclose={() => unselect(selection)}
                      --chip-default-border-radius="var(--autocomplete-border-radius, var(--autocomplete-default-border-radius))"
                      buttonTabIndex={-1}
                      truncateText
                    >
                      {#if chipLabelSnippet}
                        {@render chipLabelSnippet({ selection })}
                      {:else}
                        {#if quickFilterActive!.type.key == 'multi-select' && !!quickFilterActive!.type.countriesAlpha2 && quickFilterActive!.type.countriesAlpha2.find((c) => c.value == selection.value)}
                          <div>
                            <FlagIcon
                              alpha2={quickFilterActive!.type.countriesAlpha2
                                .find((c) => c.value == selection.value)
                                ?.label?.toString()
                                .toLowerCase() ?? ""}
                              --flag-icon-size="16px"
                            />
                          </div>
                        {/if}
                        {selection.label}
                      {/if}
                    </Chip>
                  </div>
                {/if}
              {/snippet}
              {#snippet itemLabelSnippet({ item })}
                {#if itemLabelInternalSnippet}
                  {@render itemLabelInternalSnippet({ item })}
                {:else}
                  {#if quickFilterActive!.type.key == 'multi-select' && !!quickFilterActive!.type.countriesAlpha2 && quickFilterActive!.type.countriesAlpha2.find((c) => c.value == item.value)}
                    <FlagIcon
                      alpha2={quickFilterActive!.type.countriesAlpha2
                        .find((c) => c.value == item.value)
                        ?.label?.toString()
                        .toLowerCase() ?? ""}
                    />
                  {/if}
                  {item.label}
                {/if}
              {/snippet}
            </Autocomplete>
          </div>
        {:else if quickFilterActive.type.key === "boolean"}
          {#if quickFilterActive.type.params}
            <div class="vertical-quick-filters">
              <button
                onclick={() => setQuickFilterValue(quickFilterActive!, true)}
              >
                {quickFilterActive.type.params.labelTrue}
              </button>
              <button
                onclick={() => setQuickFilterValue(quickFilterActive!, false)}
              >
                {quickFilterActive.type.params.labelFalse}
              </button>
              <button
                onclick={() => setQuickFilterValue(quickFilterActive!, undefined)}
              >
                {lang == 'en' ? 'All' : 'Tutti'}
              </button>
            </div>
          {/if}
        {:else if quickFilterActive.type.key === "country"}
          <div class="space-between" style="font-weight: 500; margin-bottom: 8px;">
            {quickFilterActive.title}
            {#if !!quickFilterActive.type.missingLabel}
              <button
                onclick={() =>
                  setQuickFilterMissingValue(quickFilterActive!)}
                >{quickFilterActive.type.missingLabel}</button
              >
            {/if}
          </div>
          <div onclick={e => e.stopPropagation()} role="presentation" tabindex="-1">
            <CountriesAutocomplete
              bind:selected={quickFilterActive.type.selected}
              {...((!!quickFilterActive.type.countriesOptions && quickFilterActive.type.countriesOptions.length > 0) && {
                items: quickFilterActive.type.countriesOptions,
              })}
              autocompleteProps={{
                placeholder: !!quickFilterActive.type.selected
                  ? quickFilterActive.type.selected.length > 0
                    ? ""
                    : quickFilterActive.description
                  : quickFilterActive.description,
                multiple: true,
              }}
              --autocomplete-border-radius= 0.5rem
              --autocomplete-border="1px solid rgb(var(--global-color-background-500))"
              --autocomplete-focus-box-shadow="0 0 0 2px rgb(var(--global-color-primary-500))"
            />
          </div>
        {:else if quickFilterActive.type.key === "date"}
          <div onclick={e => e.stopPropagation()} role="presentation" tabindex="-1">
            <div>
              <DatePickerTextField
                bind:selectedDate={quickFilterActive.type.from}
                placeholder={lang == 'en' ? "From" : 'Da'}
                --simple-textfield-width="100%"
                --simple-textfield-border-radius= 0.5rem
                --simple-textfield-background-color= transparent
                --simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
                --simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
                flipOnOverflow
                bind:menuOpened={calendarOpened}
                ondayClick={() => (calendarOpened = false)}
              >
                {#snippet appendInnerSnippet({ appendInnerIcon, iconSize })}
                  <Icon
                    name="mdi-close-circle"
                    onclick={() => {
                      if (
                        !!quickFilterActive &&
                        quickFilterActive.type.key === "date"
                      ) {
                        quickFilterActive.type.from = undefined;
                      }
                    }}
                  />
                {/snippet}
              </DatePickerTextField>
            </div>
            <div>
              <DatePickerTextField
                bind:selectedDate={quickFilterActive.type.to}
                placeholder={lang == 'en' ? "To" : 'A'}
                --simple-textfield-width="100%"
                --simple-textfield-border-radius= 0.5rem
                --simple-textfield-background-color= transparent
                --simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
                --simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
                flipOnOverflow
                bind:menuOpened={calendarOpened2}
                ondayClick={() => (calendarOpened2 = false)}
              >
                {#snippet appendInnerSnippet({ appendInnerIcon, iconSize })}
                  <Icon
                    name="mdi-close-circle"
                    onclick={() => {
                      if (
                        !!quickFilterActive &&
                        quickFilterActive.type.key === "date"
                      ) {
                        quickFilterActive.type.to = undefined;
                      }
                    }}
                  />
                {/snippet}
              </DatePickerTextField>
            </div>
          </div>
        {/if}
      </div>

      {#if quickFilterActive.type.key != "boolean"}
        <div style:margin-top="10px" style:grid-row="2" style:grid-column="1 / 3">
          <Divider --divider-color=rgb(var(--global-color-contrast-100)) />
        </div>
        <div style:grid-row="3" style:grid-column="2" style:margin-top="-15px">
          <ConfirmOrCancelButtons
            confirmDisable={saveEditDisabled}
            confirmText={lang == 'en' ? "Apply" : 'Applica'}
            cancelText={lang == 'en' ? "Cancel" : 'Annulla'}
            oncancelClick={handleCancelClick}
            onconfirmClick={() => handleApplyClick(quickFilterActive!, quickFilterActive!.type.key == 'custom')}
          />
        </div>
      {/if}
    </div>
  </Menu>
{/if}

<MediaQuery>
  {#snippet defaultSnippet({ sAndDown })}
    <Drawer
      bind:open={openHeaderDrawer}
      _space={sAndDown ? "60vh" : "400px"}
      position={sAndDown ? "bottom" : "right"}
    >
      <div class="personalize-header">{lang == 'en' ? 'Personalize your headers' : 'Personalizza le tue intestazioni'}</div>
      <div style="padding: 20px;">

        <span class="headers-show grid-col-1">{lang == 'en' ? 'Headers shown in table' : 'Intestazioni visualizzate in tabella'}</span>

        {#if headersToShow}
          <VerticalDraggableList
            items={headersToShow}
            onchangeOrder={(e) => {
              headersToShow = e.detail.items;
            }}
          >
            {#snippet itemSnippet({ item })}
              <div
                style:display=flex
              >
                <div
                  style:flex-grow=1
                >
                  {item.name}
                </div>
                <Switch
                  --switch-label-width="90%"
                  value={headersToShow.find((h) => h.id == item.id) != undefined}
                  onchange={(e) => {
                    if (e.detail.value == false) {
                      headersToShow = headersToShow.filter((h) => h.id != item.id);
                      headersToSelect = [...headersToSelect, item];
                    }
                  }}
                />
              </div>
            {/snippet}
          </VerticalDraggableList>
        {/if}
        <Divider --divider-color=rgb(var(--global-color-contrast-100) />
        <span class="headers-show grid-col-1">{lang == 'en' ? 'Headers to show' : 'Intestazioni da mostrare'}</span>
        {#if headersToSelect && headersToSelect.length > 0}
          {#each headersToSelect as header (header.id)}
            <div
              animate:flip
              in:receive={{ key: header }}
              out:send={{ key: header }}
              class="headers-show grid-col-1"
            >
              <div
                style:display=flex
              >
                <div
                  style:flex-grow=1
                >
                  {header.name}
                </div>
                <Switch
                  --switch-label-width="90%"
                  value={false}
                  onchange={(e) => {
                    if (e.detail.value == true) {
                      headersToSelect = headersToSelect.filter(
                        (h) => h.id != header.id
                      );
                      headersToShow = [...headersToShow, header];
                    }
                  }}
                />
              </div>
            </div>
          {/each}
        {:else}
          <div class="headers-show grid-col-1">
            <span style="text-align: center;">{lang == 'en' ? 'No headers to add' : 'Nessuna intestazione da aggiungere'}</span>
          </div>
        {/if}
        <div style="width: 100%; display: flex; justify-content: center; padding-top: 15px;">
          <Button
            class="mr-3 mt-5"
            --button-width="100%"
            onclick={saveHeadersToShow}
          >
            {lang == 'en' ? 'Save preferences' : 'Salva preferenze'}
          </Button>
        </div>
      </div>
    </Drawer>
  {/snippet}
</MediaQuery>

<style>
  .outer-container {
    overflow-x: hidden;
  }

  .inner-container {
    overflow-y: auto;
    max-height: var(--dynamic-table-max-height, var(--dynamic-table-default-max-height));
  }

  .hide-scrollbar {
    margin-right: -15px;
  }

  .dynamic-table {
    background-color: var(
      --dynamic-table-background-color,
      var(--dynamic-table-default-background-color)
    );
    border-collapse: separate;
  }

  .dynamic-table.dynamic-resizable {
    table-layout: fixed;
    width: fit-content;
  }

  .slot-append {
    width: 1px;
    min-width: unset;
    box-sizing: content-box;
  }

  .table-header {
    position: sticky;
    top: 0;
    z-index: 2;
    height: var(
      --dynamic-table-header-height,
      var(--dynamic-table-default-header-height)
    );
  }

  @media not all and (min-resolution:.001dpcm) { 
    .table-header {
      position: sticky;
      top: -2px;
      z-index: 2;
    }
  }

  .table-subheader {
    top: var(--main-header-height);
    z-index: 1;
  }
  .table-header th {
    padding: var(
      --dynamic-table-header-padding,
      var(--dynamic-table-default-header-padding)
    );
    font-size: var(
      --dynamic-table-header-font-size,
      var(--dynamic-table-default-header-font-size)
    );
    font-weight: var(
      --dynamic-table-header-font-weight,
      var(--dynamic-table-default-header-font-weight)
    );
    background-color: var(
      --dynamic-table-header-background-color, 
      var(--dynamic-table-default-header-background-color)
    );
  }

  .table-subheader th {
    background-color: var(
      --dynamic-table-subheader-background-color,
      var(--dynamic-table-default-subheader-background-color)
    );
  }

  .table-header th.sortable:hover {
    color: var(
      --dynamic-table-header-hover-color,
      var(--dynamic-table-default-hover-color)
    );
  }

  .header-label {
    margin-right: 5px;
    font-size: small;
  }

  .header-sort-icon {
    display: none;
  }

  .header-sort-icon.active {
    display: inline;
  }

  .table-header th:first-child {
    border-top-left-radius: var(
      --dynamic-table-header-border-radius,
      var(--dynamic-table-default-header-border-radius)
    );
    border-bottom-left-radius: var(
      --dynamic-table-header-border-radius,
      var(--dynamic-table-default-header-border-radius)
    );
  }

  .table-header th:last-child {
    border-top-right-radius: var(
      --dynamic-table-header-border-radius,
      var(--dynamic-table-default-header-border-radius)
    );
    border-bottom-right-radius: var(
      --dynamic-table-header-border-radius,
      var(--dynamic-table-default-header-border-radius)
    );
  }

  table {
    border-collapse: separate;
    width: 100%;
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
    border: 1px solid transparent;
  }
  table.dynamic-table > tbody > tr > td {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  table.dynamic-table > thead > tr > th {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  table.dynamic-table > tbody > tr > td.expanded-row {
  overflow: visible;
}

  .hover-cell:hover, .hover-cell:focus, .cell-edit-activator {
    cursor: pointer;
    border: 1px solid rgb(var(--global-color-contrast-800));
    border-radius: 5px;
  }

  .item-row > td {
    height: var(
      --dynamic-table-row-min-height,
      var(--dynamic-table-default-row-min-height)
    );
  }

  .item-row:hover {
    background-color: var(
      --dynamic-table-row-background-color-hover,
      var(--dynamic-table-default-row-background-color-hover)
    );
  }

  .cell-editor-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    justify-content: center;
    align-items: center;
    box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.2);
    position: fixed;
    padding: 10px;
    border-radius: 10px;
    background-color: var(
      --dynamic-table-cell-editor-background-color,
      var(--dynamic-table-default-cell-editor-background-color)
    );
    height: 200px;
    width: 500px;
  }

  .row-activator {
    background-color: var(
      --dynamic-table-row-background-color-hover,
      var(--dynamic-table-default-row-background-color-hover)
    );
  }

  .quick-filter-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    justify-content: center;
    align-items: center;
    box-shadow: 2px 2px 2px 2px rgba(0, 0, 0, 0.2);
    position: fixed;
    padding: 10px;
    border-radius: 10px;
    background-color: var(
      --dynamic-table-quick-filter-background-color,
      var(--dynamic-table-default-quick-filter-background-color)
    );
  }

  .container {
    display: flex;
    align-items: center;
  }

  .loader-line {
    margin-top: -1px;
    height: 5px;
    position: relative;
    overflow: hidden;
    background-color: rgb(var(--global-color-background-500));
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
    border-radius: 20px;
  }

  .loader-line:before {
    content: "";
    position: absolute;
    left: -50%;
    height: 5px;
    width: 40%;
    background-color: rgb(var(--global-color-primary-500));
    -webkit-animation: lineAnim 1s linear infinite;
    -moz-animation: lineAnim 1s linear infinite;
    animation: lineAnim 1s linear infinite;
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
    border-radius: 20px;
  }

  .search-bar-container {
    display: flex;
    flex-direction: row;
  }

  .filter-container {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .quick-filters {
    display: flex;
    flex-direction: row;
    margin-bottom: 10px;
  }

  .quick-filters-results-container {
    display: flex;
    justify-content: space-between;
  }

  .vertical-quick-filters {
    display: flex;
    flex-direction: column;
    align-items: start;
    width: 130px;
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

  .space-between {
    display: flex;
    justify-content: space-between;
  }

  .active-quick-filters {
    display: flex;
    margin-right: 15px;
    background-color: rgb(var(--global-color-primary-500));
    border-radius: 5px;
    width: fit-content;
  }

  .non-active-quick-filters {
    display: flex;
    margin-right: 16px;
  }

  .quick-filter-icon {
    display: flex;
    gap: 4px;
    margin: 0 8px;
  }

  .personalize-header {
    font-size: 20px;
    line-height: 28px;
    font-weight: 700;
    padding: 20px 20px 0px 20px;
  }

  .headers-show {
    display: grid;
    gap: 12px;
    padding: 8px;
  }

  .line-container {
    position: sticky;
    bottom: 0;
    left: 0;
    width: 100%;
    background: var(
      --dynamic-table-end-line-background-color,
      var(--dynamic-table-default-end-line-background-color)
    );
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 3;
  }

  .line {
    flex-grow: 1;
    height: 1px;
    background: var(
      --dynamic-table-end-line-color,
      var(--dynamic-table-default-end-line-color)
    );
    margin: 0 10px;
  }

  .text {
    color: var(
      --dynamic-table-end-line-text-color,
      var(--dynamic-table-default-end-line-text-color)
    );
  }

  .results-number {
    margin: 0px 0px 4px 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .resizer {
    position: absolute;
    top: 0;
    right: 0;
    width: 6px;
    height: 100%;
    cursor: col-resize;
    z-index: 100;
  }
  .filler {
    padding: 0 !important;
  }
</style>