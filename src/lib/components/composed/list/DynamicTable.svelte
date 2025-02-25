<script lang="ts">
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
  import { createEventDispatcher, onMount, type ComponentProps } from "svelte";
  import { quintOut } from "svelte/easing";
  import { crossfade } from "svelte/transition";
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

  onMount(() => {
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  });

  let mainHeader: Element

  function updateHeaderHeight() {
    if (mainHeader) {
      const headerHeight = mainHeader.getBoundingClientRect().height;
      document.documentElement.style.setProperty('--main-header-height', headerHeight + 'px');
    }
  }
  
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

  type Item = {
    [key: string]: any;
    disableEdit?: boolean,
    rowDisableBackgroundColor?: string
  };

  type Row = {
    item: Item;
    subItems: Item[];
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

  type Headers = NonNullable<ComponentProps<PaginatedTable>["headers"]>;
  type Header = Headers[number] & {
    cellEditorInfo?: CellEditorInfo;
    info?: string;
  };
  type HeaderType = Header["type"];

  let clazz: {
    container?: string;
    header?: string;
    row?: string;
    cell?: string;
  } = {};
  export { clazz as class };

  const dispatch = createEventDispatcher<{
    sort: {
      sortedBy: string | undefined;
      sortDirection: string;
    };
    rowClick: {
      item: Item;
    };
    cellClick: {
      item: Item;
    };
    saveCellEdit: {
      item: any;
    };
    saveHeadersToShow: {
      headersToShow: {
        id: string;
        name: string;
      }[];
    };
    filtersChange: {
      builder: FilterBuilder;
    };
    fetchData: {};
    removeFilter: {filter: Filter}
    removeAllFilters: {}
    removeCustomQuickFilter: {
      quickFilter: QuickFilter
    }
    applyCustomQuickFilter: { 
      quickFilter: QuickFilter
      setQuickFilterValue: (quickFilter: QuickFilter, value?: any) => void
    }
  }>();

  export let headers: Header[] = [],
    headersToShowInTable: Header[] = headers,
    subHeaders: Header[] = [],
    customizeHeaders: boolean = false,
    rows: Row[] = [],
    sortedBy: string | undefined = undefined,
    sortDirection: "asc" | "desc" = "asc",
    cellEdit: boolean = false,
    noItemsText: string = "No items to show",
    showSelect: boolean = false,
    showSelectContainer: boolean = true,
    selectMode: "single" | "multiple" = "single",
    selectedItems: Item[] = [],
    showExpand: boolean = false,
    loading: boolean = false,
    disabled: boolean = false,
    filters: ComponentProps<Filters>["filters"] = [],
    searchBarColumns: string[] | undefined = undefined,
    searchBarVisible: boolean = false,
    searchBarPlaceholder: string =
      "Type to search for identification code, description and MRN...",
    filtersVisible: boolean = false,
    quickFiltersVisible: boolean = false,
    lang: "it" | "en" = "en",
    editFilterMode: "one-edit" | "multi-edit" = "one-edit",
    showActiveFilters: boolean = true,
    quickFilters: QuickFilter[] = [],
    actionsForSelectedItems: Action[] = [],
    hasMoreToLoad: boolean = false,
    totalRows: number = rows.length,
    searchText: string | undefined = undefined,
    renderedRowsNumber = 100,
    sectionRowsNumber = 20,
    sectionTreshold = 2,
    backwardTresholdPixel = 100,
    forwardTresholdPixel = 100

  let openCellEditor: boolean = false,
    cellEditorActivator: HTMLElement | undefined,
    cellEditorContainer: HTMLElement | undefined,
    menuElementCellEditor: HTMLElement,
    menuElementQuickFilters: HTMLElement,
    cellEditorInfoActive: CellEditorInfo & {
      value?: any;
      item?: Item;
    },
    saveEditDisabled: boolean = false,
    searchBarInput: HTMLElement | undefined = undefined,
    openQuickFilter: boolean = false,
    quickFilterActivator: HTMLElement | undefined,
    quickFilterActive: QuickFilter,
    globalBuilder: FilterBuilder = new FilterBuilder(),
    slotSelectActionsContainer: HTMLElement | undefined,
    isSelectedAll: boolean = false,
    calendarOpened: boolean = false,
    calendarOpened2: boolean = false,
    selectedIndexes: number[] = [],
    cellEditorIndexRow: number | undefined,
    cellEditorIndexHeader: number | undefined,
    cellEditorSubItem: boolean | undefined,
    currentSectionNumber = 0,
    tableBody: HTMLElement,
    tableContainer: HTMLElement,
    userScrolling = true

    $: totalSections = rows.length / sectionRowsNumber
    $: renderedRows = rows.slice(currentSectionNumber * sectionRowsNumber, currentSectionNumber * sectionRowsNumber + renderedRowsNumber)

  let openHeaderDrawer: boolean = false,
    headersToSelect: {
      id: string;
      name: string;
    }[] = !!headers
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
      : [],
    headersToShow: {
      id: string;
      name: string;
    }[] = headersToShowInTable.map((h) => {
      return {
        id: h.value,
        name: h.label,
      };
    }),
    infoActivators = Array(headersToShowInTable.length)

  let totalBatchLength: number = 0,
    expandedRows: Row[] = [];    

  function saveHeadersToShow() {
    dispatch("saveHeadersToShow", {
      headersToShow: headersToShow,
    });
    openHeaderDrawer = false;
  }

  function handleHeaderClick(header: Header) {
    if (header.sortable && !loading) {
      if (!!sortedBy && header.value == sortedBy) {
        if (sortDirection == "asc") sortDirection = "desc";
        else if (sortDirection == "desc") {
          sortedBy = undefined;
        }
      } else {
        sortedBy = header.value;
        sortDirection = "asc";
      }

      handleSearchChange(searchText);

      dispatch("sort", {
        sortedBy,
        sortDirection,
      });
    }
  }

  function handleRowClick(item: { [key: string]: any }) {
    if (disabled || loading) return;
    dispatch("rowClick", {
      item,
    });
  }

  function handleCellClick(
    mouseEvent: MouseEvent & {
      currentTarget: EventTarget & HTMLTableCellElement;
    },
    item: Item,
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

    dispatch("cellClick", {
      item,
    });
  }

  function handleSaveClick() {
    cellEditorIndexHeader = undefined
    cellEditorIndexRow = undefined
    cellEditorSubItem = undefined

    dispatch("saveCellEdit", {
      item: cellEditorInfoActive,
    });

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
    let index = selectedItems.findIndex((i) => i.id == item.id);
    // if item is not in the selected items array, add it
    if (index == -1) {
      if (selectMode == "single") {
        selectedItems = [item];
        selectedIndexes = [rows.findIndex(r => r.item.id == item.id)]
      } else if (selectMode == "multiple") {
        if(shiftKeyPressed && selectedIndexes.length > 0 && !isSelectedAll) {
          let lastSelectedIndex = selectedIndexes[selectedIndexes.length - 1],
            selectedIndex = rows.findIndex(r => r.item.id == item.id)
          if(selectedIndex != -1) {
            if(selectedIndex < lastSelectedIndex) {
              let x = lastSelectedIndex
              lastSelectedIndex = selectedIndex - 1
              selectedIndex = x
            }
            for (let i = lastSelectedIndex + 1; i <= selectedIndex; i++) {
              if(!selectedItems.find((selectedItem) => selectedItem.id == rows[i].item.id)) {
                selectedItems = [...selectedItems, rows[i].item]
              }
            }
          }
        }
        else {
          selectedItems = [...selectedItems, item];
          selectedIndexes.push(rows.findIndex(r => r.item.id == item.id))
        }
      }
    } else {
      selectedItems = selectedItems.filter((i) => i.id != item.id);
      selectedIndexes = selectedIndexes.filter(r => r != rows.findIndex(r => r.item.id == item.id))
      isSelectedAll = false;
    }
  }

  function handleSelectAll() {
    if (selectMode == "multiple") {
      if (selectedItems.length == rows.length) {
        selectedItems = [];
        selectedIndexes = []
        isSelectedAll = false;
      } else {
        selectedItems = rows.map((r) => r.item);
        isSelectedAll = true;
      }
    }
  }

  function expandRow(row: Row) {
    let index = expandedRows.findIndex((r) => r.item.id == row.item.id);
    if (index == -1) {
      expandedRows = [...expandedRows, row];
    } else {
      expandedRows = expandedRows.filter((r) => r.item.id != row.item.id);
    }
  }

  function formatDate(
    dateTime: DateTime,
    dateFormat: Extract<HeaderType, { key: "date" }>["params"]
  ): string {
    return dateTime.setLocale(dateFormat.locale).toFormat(dateFormat.format);
  }

  $: {
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

    if (
      !!isSelectedAll &&
      rows.length > 0 &&
      !loading &&
      !disabled &&
      selectedItems.length < rows.length
    ) {
      selectedItems = rows.map((r) => r.item);
    }
  }

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

    if (!!sortedBy) {
      builder.orderBy(sortedBy, sortDirection || "asc");
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

  $: if (searchText != undefined) handleSearchChange(searchText);

  function handleFiltersChange() {
    userScrolling = false
    currentSectionNumber = 0
    tableContainer.scrollTop = 0
    setTimeout(() => userScrolling = true, 20)
    
    dispatch("filtersChange", {
      builder: globalBuilder,
    });
  }

  function handleClearQuickFilter(
    quickFilter: QuickFilter,
    dispatchFiltersChange: boolean = true
  ) {
    if (quickFilter.type.key == 'custom') {
      quickFilter.type.value = undefined;
      quickFilter.type.missingValue = undefined;
      if(dispatchFiltersChange) {
        dispatch('removeCustomQuickFilter', { quickFilter })
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
      dispatch('applyCustomQuickFilter', { quickFilter, setQuickFilterValue})
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
            DateTime.fromJSDate(from).toString()
          );
        }
        if (!!to) {
          builder.where(
            quickFilter.column,
            "<=",
            DateTime.fromJSDate(to).toString()
          );
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

    if (!!sortedBy) {
      builder.orderBy(sortedBy, sortDirection || "asc");
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

  function handleRemoveAllFilters(removeAllFilters?: () => void) {
    if(!!removeAllFilters) {
      removeAllFilters()
    }
    dispatch('removeAllFilters', {})
    handleSearchChange(searchText);
  }

  function handleRemoveFilter(filter: Filter) {
    dispatch('removeFilter', { filter})
    handleSearchChange(searchText);
  }

  function handleLoadForward() {
    userScrolling = false
    
    let topElementsHeight = 0
    for (let i = 0; i < sectionRowsNumber; i++) {
      topElementsHeight += tableBody?.children.item(i)?.getBoundingClientRect().height || 0
    }
    
    currentSectionNumber = currentSectionNumber + 1

    tableContainer.scrollTop -= topElementsHeight

    setTimeout(() => userScrolling = true, 20)

    if(totalSections - sectionTreshold < currentSectionNumber) {
      dispatch("fetchData", {});
    }
  }

  function handleLoadBackward() {
    userScrolling = false
    
    let topElementsHeight = 0
    for (let i = renderedRows.length - 1; i > renderedRows.length - sectionRowsNumber + 1; i--) {
      topElementsHeight += tableBody?.children.item(i)?.getBoundingClientRect().height || 0
    }
    
    currentSectionNumber = currentSectionNumber - 1

    tableContainer.scrollTop += topElementsHeight

    setTimeout(() => userScrolling = true, 20)
  }
</script>

{#if !!rows && Array.isArray(rows) && !!headersToShowInTable && Array.isArray(headersToShowInTable)}
  <QuickActions
    {selectedItems}
    {showSelectContainer}
    {isSelectedAll}
    {totalRows}
    {slotSelectActionsContainer}
    {disabled}
    {loading}
    {actionsForSelectedItems}
  />

  <slot name="search-bar" {handleSearchChange}>
    <div class="search-bar-container">
      {#if searchBarVisible}
        <SimpleTextField
          placeholder={searchBarPlaceholder}
          appendInnerIcon="mdi-magnify"
          bind:value={searchText}
          bind:input={searchBarInput}
          on:keydown={handleSearchBoxKeydown}
          --simple-textfield-default-width="450px"
          --simple-textfield-border-radius= 0.5rem
          --simple-textfield-background-color= transparent
          --simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
          --simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
        />
      {/if}

      {#if filtersVisible}
        <div style="margin-left: 20px;">
          <Filters
            bind:filters
            on:applyFilter={() => {
              handleSearchChange(searchText);
            }}
            on:removeFilter={e => { handleRemoveFilter(e.detail.filter) }}
            on:removeAllFilters={() => handleRemoveAllFilters()}
            --filters-default-wrapper-width="100%"
            {lang}
            {editFilterMode}
            {showActiveFilters}
          >
            <svelte:fragment slot="append">
              <slot name="filter-append" />
            </svelte:fragment>
            <svelte:fragment slot="custom-chip" let:filter>
              <slot name="custom-filter-chip" {filter} />
            </svelte:fragment>
            <svelte:fragment
              slot="custom"
              let:filter
              let:updateFunction
              let:mAndDown
            >
              <slot name="custom-filter" {filter} {updateFunction} {mAndDown} />
            </svelte:fragment>

            <svelte:fragment slot="content" let:mAndDown let:filters let:updateMultiFilterValues let:handleRemoveAllFilters={removeAllFilters}>
              {#key filters}
                <DynamicFilters
                  {lang}
                  {filters}                      
                  {mAndDown}
                  on:change={e => updateFilterValues(e.detail.filter, updateMultiFilterValues)}    
                  on:removeAllFilters={() => handleRemoveAllFilters(removeAllFilters)}
                >
                  <svelte:fragment slot="custom" let:filter let:mAndDown>
                    <slot name="custom-filter" {filter} {updateMultiFilterValues} {mAndDown}></slot>
                  </svelte:fragment>
                </DynamicFilters>
              {/key}
            </svelte:fragment>
          </Filters>
        </div>
      {/if}
    </div>
  </slot>

  {#if quickFiltersVisible}
    <div class="quick-filters">
      {#if !!quickFilters && quickFilters.length > 0}
        {#each quickFilters as quickFilter}
          <div
            class={quickFilter.active ? "active-quick-filters" : "non-active-quick-filters"}
          >
            <button
              on:click={(e) => {
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
                  click
                  --icon-size="14px"
                  on:click={() => {
                    handleClearQuickFilter(quickFilter);
                  }}
                />
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  {/if}

  <div class="table-container" bind:this={tableContainer}>
    <InfiniteScroll
      on:loadMore={handleLoadBackward}
      treshold={backwardTresholdPixel}
      hasMore={currentSectionNumber > 0 && userScrolling}
      direction='backward'
    />
    <table style="display: table;" class="table">
      <thead class="table-header" bind:this={mainHeader}>
        <tr>
          {#if !!showSelect && !showExpand && rows.length > 0}
            <th
              style:width="30px"
              style:min-width="30px"
              style:text-align="center"
            >
              {#if selectMode === "multiple"}
                <Checkbox
                  id="select-all"
                  value={selectedItems.length == totalBatchLength}
                  disabled={disabled || loading}
                  on:change={handleSelectAll}
                />
              {/if}
            </th>
          {/if}
          {#if showExpand}
            <th
              style:min-width="60px"
              style:text-align="center"
            />
          {/if}
          {#each headersToShowInTable as head, index}
            <th
              style:width={head.width}
              style:min-width={head.minWidth}
              class:sortable={head.sortable}
              on:click={() => handleHeaderClick(head)}
            >
              <slot name="header" {head}>
                <span class="header-label" bind:this={infoActivators[index]}>
                  <slot name="headerLabel">{head.label}</slot>
                  {#if !!head.info}
                    <Icon						
                      name="mdi-help-circle-outline"
                      --icon-size="16px"
                    />
                  {/if}
                </span>
                {#if !!head.info}
                  <ToolTip
                    appearTimeout={1000}
                    activator={infoActivators[index]}
                  >
                    <div
                      style:background-color='rgb(var(--global-color-background-300), .95)'
                      style:border-radius="5px"
                      style:padding="10px"
                    >
                      {head.info}
                    </div>
                  </ToolTip>
                {/if}
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
          {#if customizeHeaders}
            <th
              style:width="30px"
              style:min-width="30px"
              style:text-align="center"
            >
              <div style="display: flex; gap: 8px;">
                <Icon
                  name="mdi-plus-circle-outline"
                  click
                  on:click={() => (openHeaderDrawer = true)}
                />
              </div>
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
              <div class="loader-line" />
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
              {noItemsText}
            </td>
          </tr>
        {:else}
          {#each renderedRows as row, indexRow}
            <tr
              class="item-row"
              style:background-color={
                !!row.item.disableEdit ?
                  !!row.item.rowDisableBackgroundColor ?
                    row.item.rowDisableBackgroundColor : 
                    'var(--dynamic-table-row-disabled-background-color, var(--dynamic-table-row-default-disabled-background-color))' : 
                expandedRows.findIndex((r) => r.item.id == row.item.id ) != -1 ? 
                  'var(--dynamic-table-expanded-row-background-color, var(--dynamic-table-expanded-row-default-background-color))' :
                  !!selectedItems.find(i => i.id == row.item.id) ?
                    'var(--dynamic-table-selected-row-background-color, var(--dynamic-table-selected-row-default-background-color))' :
                    ""
                }
              class:row-activator={cellEditorIndexRow == indexRow && !cellEditorSubItem}
              on:click={() => handleRowClick(row)}
            >
              {#if !!showSelect && !showExpand}
                <td style:padding-left="0px" style:text-align="center">
                  <Checkbox
                    id={row.item.id}
                    value={selectedItems.findIndex(
                      (i) => i.id == row.item.id
                    ) != -1}
                    disabled={disabled || loading}
                    on:change={(e) => handleSelect(row.item, e.detail.shiftKeyPressed)}
                  />
                </td>
              {/if}
              {#if showExpand}
                <td style:padding-left="0px" style:text-align="center">
                  <Icon
                    name={expandedRows.findIndex(
                      (r) => r.item.id == row.item.id
                    ) == -1
                      ? "mdi-chevron-down"
                      : "mdi-chevron-up"}
                    click
                    --icon-size="24px"
                    on:click={() => expandRow(row)}
                  />
                </td>
              {/if}
              {#each headersToShowInTable as header, indexHeader}
                <td
                  class:hover-cell={cellEdit && !loading && !!header.cellEditorInfo}
                  class:cell-edit-activator={cellEditorIndexHeader == indexHeader && cellEditorIndexRow == indexRow && !cellEditorSubItem}
                  on:click={(e) => {
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
                    <slot
                      name="custom"
                      index={indexRow}
                      columnIndex={indexHeader}
                      {header}
                      {row}
                    />
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
              {#if $$slots.rowActions || $$slots.append}
                <td class={clazz.cell || ""}>
                  <slot name="rowActions" index={indexRow} {row} />
                  <slot name="append" index={indexRow} {row} />
                </td>
              {/if}
            </tr>
            {#if showExpand}
              {#if expandedRows.findIndex((r) => r.item.id == row.item.id) != -1}
                <tr>
                  <td
                    colspan={headersToShowInTable.length + 1}
                    style:border="none"
                  >
                    <table style="display: table;">
                      <thead class="table-header table-subheader">
                        <tr>
                          {#each subHeaders as subHeader}
                            <th
                              style:width={subHeader.width}
                              style:min-width={subHeader.minWidth}
                              class:sortable={subHeader.sortable}
                              on:click={() => handleHeaderClick(subHeader)}
                            >
                              <slot name="header" {subHeader}>
                                <span class="header-label">
                                  <slot name="headerLabel">
                                    {subHeader.label}
                                  </slot>
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
                              </slot>
                            </th>
                          {/each}
                          {#if $$slots.subRowActions || $$slots.subAppend}
                            <th>
                              <slot
                                name="subAppend"
                                index={-1}
                                items={undefined}
                              />
                            </th>
                          {/if}
                        </tr>
                      </thead>

                      <tbody>
                        {#each row.subItems as subItem, indexSubItem}
                          <tr
                            on:click={() => handleRowClick(subItem)}
                            class:row-activator={cellEditorIndexRow == indexSubItem && cellEditorSubItem}
                          >
                            {#each subHeaders as subHeader, indexSubHeader}
                              <td
                                class:cell-edit-activator={cellEditorIndexHeader == indexSubHeader && cellEditorIndexRow == indexSubItem && cellEditorSubItem}
                                class:hover-cell={cellEdit}
                                on:click={(e) => {
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
                                  <slot
                                    name="custom-subheader"
                                    index={indexSubItem}
                                    columnIndex={indexSubHeader}
                                    {subHeader}
                                    {subItem}
                                  />
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
                                    {subItem[subHeader.value]}
                                  {/if}
                                {:else}
                                  {subItem[subHeader.value]}
                                {/if}
                              </td>
                            {/each}
                            {#if $$slots.subRowActions || $$slots.subAppend}
                              <td class={clazz.cell || ""}>
                                <slot
                                  name="subRowActions"
                                  index={indexSubItem}
                                  {subItem}
                                />
                                <slot
                                  name="subAppend"
                                  index={indexSubItem}
                                  {subItem}
                                />
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
      on:loadMore={handleLoadForward}
      treshold={forwardTresholdPixel}
      hasMore={hasMoreToLoad && userScrolling}
    />
  </div>
{/if}

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
        on:cancel-click={handleCancelClick}
        on:confirm-click={handleSaveClick}
      />
    </div>
  </div>
</Menu>

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
        <slot name="custom-quick-filter" quickFilter={quickFilterActive} {setQuickFilterMissingValue}>
        </slot>
      {:else if quickFilterActive.type.key === "string"}
        <div class="space-between" style="font-weight: 500;">
          {quickFilterActive.title}
          {#if !!quickFilterActive.type.missingLabel}
            <button
              on:click={() =>
                setQuickFilterMissingValue(quickFilterActive)}
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
              on:click={() =>
                setQuickFilterMissingValue(quickFilterActive)}
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
              on:click={() =>
                setQuickFilterMissingValue(quickFilterActive)}
              >{quickFilterActive.type.missingLabel}</button
            >
          {/if}
        </div>
        <Autocomplete
          multiple
          items={quickFilterActive.type.items}
          bind:values={quickFilterActive.type.values}
          --autocomplete-border="1px solid rgb(var(--global-color-background-500))"
          --autocomplete-focus-box-shadow="0 0 0 2px rgb(var(--global-color-primary-500))"
        >
          <svelte:fragment slot="selection" let:selection let:unselect>
            <slot name="selection" {selection} {unselect}>
              <div tabindex="-1">
                <Chip
                  close={true}
                  on:close={() => unselect(selection)}
                  --chip-default-border-radius="var(--autocomplete-border-radius, var(--autocomplete-default-border-radius))"
                  buttonTabIndex={-1}
                  truncateText
                >
                  <slot name="chip-label" {selection}>
                    {#if !!quickFilterActive.type.countriesAlpha2 && quickFilterActive.type.countriesAlpha2.find((c) => c.value == selection.value)}
                      <div>
                        <FlagIcon
                          alpha2={quickFilterActive.type.countriesAlpha2
                            .find((c) => c.value == selection.value)
                            ?.label?.toString()
                            .toLowerCase() ?? ""}
                          --flag-icon-size="16px"
                        />
                      </div>
                    {/if}
                    {selection.label}
                  </slot>
                </Chip>
              </div>
            </slot>
          </svelte:fragment>
          <svelte:fragment slot="item-label" let:item>
            <slot name="item-label" {item}>
              {#if !!quickFilterActive.type.countriesAlpha2 && quickFilterActive.type.countriesAlpha2.find((c) => c.value == item.value)}
                <FlagIcon
                  alpha2={quickFilterActive.type.countriesAlpha2
                    .find((c) => c.value == item.value)
                    ?.label?.toString()
                    .toLowerCase() ?? ""}
                />
              {/if}
              {item.label}
            </slot>
          </svelte:fragment>
        </Autocomplete>
      {:else if quickFilterActive.type.key === "boolean"}
        {#if quickFilterActive.type.params}
          <div class="vertical-quick-filters">
            <button
              on:click={() => setQuickFilterValue(quickFilterActive, true)}
            >
              {quickFilterActive.type.params.labelTrue}
            </button>
            <button
              on:click={() => setQuickFilterValue(quickFilterActive, false)}
            >
              {quickFilterActive.type.params.labelFalse}
            </button>
            <button
              on:click={() => setQuickFilterValue(quickFilterActive, undefined)}
            >
              All
            </button>
          </div>
        {/if}
      {:else if quickFilterActive.type.key === "country"}
        <div class="space-between" style="font-weight: 500; margin-bottom: 8px;">
          {quickFilterActive.title}
          {#if !!quickFilterActive.type.missingLabel}
            <button
              on:click={() =>
                setQuickFilterMissingValue(quickFilterActive)}
              >{quickFilterActive.type.missingLabel}</button
            >
          {/if}
        </div>
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
          --autocomplete-border="1px solid rgb(var(--global-color-background-500))"
          --autocomplete-focus-box-shadow="0 0 0 2px rgb(var(--global-color-primary-500))"
        />
      {:else if quickFilterActive.type.key === "date"}
        <div on:click|stopPropagation role="presentation" tabindex="-1">
          <div>
            <DatePickerTextField
              bind:selectedDate={quickFilterActive.type.from}
              placeholder={"From"}
              --simple-textfield-width="100%"
              --simple-textfield-border-radius= 0.5rem
              --simple-textfield-background-color= transparent
              --simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
              --simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
              flipOnOverflow
              bind:menuOpened={calendarOpened}
              on:day-click={() => (calendarOpened = false)}
            >
              <svelte:fragment slot="append-inner">
                <Icon
                  name="mdi-close-circle"
                  click
                  on:click={() => {
                    if (
                      !!quickFilterActive &&
                      quickFilterActive.type.key === "date"
                    ) {
                      quickFilterActive.type.from = undefined;
                    }
                  }}
                />
              </svelte:fragment>
            </DatePickerTextField>
          </div>
          <div>
            <DatePickerTextField
              bind:selectedDate={quickFilterActive.type.to}
              placeholder={"To"}
              --simple-textfield-width="100%"
              --simple-textfield-border-radius= 0.5rem
              --simple-textfield-background-color= transparent
              --simple-textfield-box-shadow= 'inset 0 0 0 1px rgb(var(--global-color-background-500))'
              --simple-textfield-focus-box-shadow='inset 0 0 0 2px rgb(var(--global-color-primary-500))'
              flipOnOverflow
              bind:menuOpened={calendarOpened2}
              on:day-click={() => (calendarOpened2 = false)}
            >
              <svelte:fragment slot="append-inner">
                <Icon
                  name="mdi-close-circle"
                  click
                  on:click={() => {
                    if (
                      !!quickFilterActive &&
                      quickFilterActive.type.key === "date"
                    ) {
                      quickFilterActive.type.to = undefined;
                    }
                  }}
                />
              </svelte:fragment>
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
          confirmText="Apply"
          cancelText="Cancel"
          on:cancel-click={handleCancelClick}
          on:confirm-click={() => handleApplyClick(quickFilterActive, quickFilterActive.type.key == 'custom')}
        />
      </div>
    {/if}
  </div>
</Menu>

<MediaQuery let:sAndDown>
  <Drawer
    bind:open={openHeaderDrawer}
    _space={sAndDown ? "60vh" : "20vw"}
    position={sAndDown ? "bottom" : "right"}
  >
    <div style="padding: 20px;">
      <div class="personalize-header">Personalize your headers</div>

      <span class="headers-show grid-col-1">Headers shown in table</span>

      {#if headersToShow}
        <VerticalDraggableList
          items={headersToShow}
          on:changeOrder={(e) => {
            headersToShow = e.detail.items;
          }}
        >
          <svelte:fragment slot="item" let:item>
            <Switch
              --switch-label-width="90%"
              value={headersToShow.find((h) => h.id == item.id) != undefined}
              label={item.name}
              on:change={(e) => {
                if (e.detail.value == false) {
                  headersToShow = headersToShow.filter((h) => h.id != item.id);
                  headersToSelect = [...headersToSelect, item];
                }
              }}
            />
          </svelte:fragment>
        </VerticalDraggableList>
      {/if}
      <Divider --divider-color=rgb(var(--global-color-contrast-100) />
      <span class="headers-show grid-col-1">Headers to show</span>
      {#if headersToSelect && headersToSelect.length > 0}
        {#each headersToSelect as header (header.id)}
          <div
            animate:flip
            in:receive={{ key: header }}
            out:send={{ key: header }}
            class="headers-show grid-col-1"
          >
            <Switch
              --switch-label-width="90%"
              value={false}
              label={header.name}
              on:change={(e) => {
                if (e.detail.value == true) {
                  headersToSelect = headersToSelect.filter(
                    (h) => h.id != header.id
                  );
                  headersToShow = [...headersToShow, header];
                }
              }}
            />
          </div>
        {/each}
      {:else}
        <div class="headers-show grid-col-1">
          <span style="text-align: center;">No headers to add</span>
        </div>
      {/if}
      <div style="width: 100%; display: flex; justify-content: center;">
        <Button
          class="mr-3 mt-5"
          --button-width="70%"
          on:click={saveHeadersToShow}
        >
          Save preferences
        </Button>
      </div>
    </div>
  </Drawer>
</MediaQuery>

<style>
  .table-container {
    overflow-x: auto;
    overflow-y: auto;
    max-height: var(
      --dynamic-table-max-height,
      var(--dynamic-table-default-max-height)
    );
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .table {
    background-color: var(
      --dynamic-table-background-color,
      var(--dynamic-table-default-background-color)
    );
    border-collapse: separate;
  }

  .table-header {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .table-subheader {
  top: var(--main-header-height);
  z-index: 0;
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

  .table-header th.sortable {
    cursor: pointer;
    transition: all 0.1s ease-in;
    user-select: none;
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

  .thead {
    height: var(
      --dynamic-table-header-height,
      var(--dynamic-table-default-header-height)
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
    border: 1px solid transparent;
  }

  .hover-cell:hover, .hover-cell:focus, .cell-edit-activator {
    cursor: pointer;
    border: 1px solid rgb(var(--global-color-contrast-800));
    border-radius: 5px;
  }

  .item-row:hover {
    background-color: var(
      --dynamic-table-row-background-color-hover,
      var(--dynamic-table-row-default-background-color-hover)
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
      var(--dynamic-table-cell-editor-default-background-color)
    );
    height: 200px;
    width: 500px;
  }

  .row-activator {
    background-color: var(
      --dynamic-table-row-background-color-hover,
      var(--dynamic-table-row-default-background-color-hover)
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
      var(--dynamic-table-quick-filter-default-background-color)
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
    margin-bottom: 20px;
  }

  .quick-filters {
    display: flex;
    flex-direction: row;
    margin-bottom: 10px;
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
    padding: 20px;
  }

  .headers-show {
    display: grid;
    gap: 12px;
    padding: 8px;
  }
</style>
