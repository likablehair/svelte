<script lang="ts" generics="Data, WidgetName extends string">
  import './DashboardShaper.css'
  import type { Snippet } from "svelte"
	import lodash from 'lodash'
  import { Dialog, Icon } from "$lib";
  import { createId } from "@paralleldrive/cuid2";
  import Chip from "$lib/components/simple/navigation/Chip.svelte";

	const deepEqual = lodash.isEqual

  type Widget = {
    id: number | string
    name: WidgetName
    height: number
    width: number
    left: number
    top: number,
    data?: Data
  }
  type AvailableWidget = {
    name: WidgetName,
    title: string
    description?: string
    icon: string
    availableSizes: [number, number][], // [height, width][]
  }

  interface Props {
    layoutWidth?: number
    layoutHeight?: number
    widgets: Widget[];
		availableWidgetCells: AvailableWidget[]
		someRowSlotEmpty?: boolean
		preview?: boolean
		canAdd?: boolean
    lang?: 'it' | 'en'
		onaddWidgetCell?: (event: {
      widgetCell: (typeof widgetCells)[number]
		}) => void
		onremoveWidgetCell?: (event: {
      widgetCell: (typeof widgetCells)[number]
		}) => void
		widgetCellSnippet?: Snippet<[{
			widgetCell: (typeof filledWidgetGrid)[number] & { title?: string }
			removeWidgetCell: typeof removeWidgetCell
		}]>
    widgetSelectionDialogHeaderSnippet?: Snippet<[]>
    addWidgetButtonSnippet?: Snippet<[{
      handleAddClick: typeof handleAddClick,
      slot: Parameters<typeof handleAddClick>[0]['slot']
    }]>
  }

  let {
    layoutWidth = 6,
    layoutHeight = 4,
    widgets = $bindable([]),
    availableWidgetCells,
    someRowSlotEmpty = $bindable(true),
    preview = false,
    canAdd = true,
    lang = 'en',
    onaddWidgetCell,
    onremoveWidgetCell,
    widgetCellSnippet,
    widgetSelectionDialogHeaderSnippet,
    addWidgetButtonSnippet,
  }: Props = $props()

  let widgetCells: {
			widget: Widget
			columnSpanFrom: number
			columnSpanTo: number
			rowSpanFrom: number
			rowSpanTo: number
			availableHeight?: number
			availableWidth?: number
		}[] = $state([])

  let normalizedWidgetGrid: ((typeof widgetCells)[number] | undefined)[][] = $derived.by(() => {
      return computeNormalizedWidgetGrid(widgetCells || [], layoutWidth, layoutHeight)
    }),
    filledWidgetGrid: (Omit<(typeof widgetCells)[number], 'widget'> & {
      widget?: (typeof widgetCells)[number]['widget'] | undefined
    })[] = $derived.by(() => {
      return computeFilledWidgetGrid(normalizedWidgetGrid || [], layoutWidth, layoutHeight)
    }),
    addWidgetDialog: boolean = $state(false),
    addWidgetInfo:
      | {
          availableHeight: number
          availableWidth: number
          fromRow: number
          fromColumn: number
        }
      | undefined = $state()

  $effect(() => {
		if (widgets) {
			calculateLocalWidgetsFromWidgets()
		}
	});
	function calculateLocalWidgetsFromWidgets() {
		widgetCells = widgets?.map((w) => {
			return {
        widget: {
          id: w.id,
          name: w.name,
          height: w.height,
          width: w.width,
          left: w.left,
          top: w.top,
          data: w.data,
        },
				columnSpanFrom: w.left,
				columnSpanTo: w.left + w.width,
				rowSpanFrom: w.top,
				rowSpanTo: w.top + w.height,
			}
		})
	}

  $effect(() => {
    const newVal = (normalizedWidgetGrid || []).some((row) => {
      for (let i = 0; i < layoutWidth; i += 1) {
        if (row[i] === undefined) return true
      }
      return false
    })
    if (newVal !== someRowSlotEmpty) {
      someRowSlotEmpty = newVal
    }
  })

  function computeNormalizedWidgetGrid(
    cells: (typeof widgetCells)[number][],
    layoutWidthParam: number,
    layoutHeightParam: number
  ) {
    const grid: ((typeof widgetCells)[number] | undefined)[][] = []

    for (let i = 0; i < cells.length; i++) {
      const widgetCell = cells[i]
      
      const rowFrom = widgetCell.rowSpanFrom - 1
      const rowTo = widgetCell.rowSpanTo - 1 
      const colFrom = widgetCell.columnSpanFrom - 1
      const colTo = widgetCell.columnSpanTo - 1 

      for (let r = rowFrom; r < rowTo; r++) {
        if (!grid[r]) grid[r] = []
        for (let c = colFrom; c < colTo; c++) {
          grid[r][c] = widgetCell
        }
      }
    }
    
    for (let r = 0; r < grid.length; r++) {
      if (!grid[r]) grid[r] = []
      for (let c = 0; c < layoutWidthParam; c++) {
        if (grid[r][c] === undefined) grid[r][c] = undefined
      }
    }
    
    return grid
  }
  
  function computeFilledWidgetGrid(
    normGrid: ((typeof widgetCells)[number] | undefined)[][],
    layoutWidthParam: number,
    layoutHeightParam: number
  ) {
    const filled: (Omit<(typeof widgetCells)[number], 'widget'> & {
      widget?: (typeof widgetCells)[number]['widget'] | undefined
    })[] = []

    for (let r = 0; r < normGrid.length; r++) {
      const normalizedRow = normGrid[r] ?? []
      for (let c = 0; c < layoutWidthParam; c++) {
        const rowItem = normalizedRow[c]
        if (rowItem === undefined && (normalizedRow[c - 1] !== undefined || c === 0)) {
          
          let availableHeight = 1
          while (
            normGrid[r + availableHeight]?.[c] === undefined &&
            r + availableHeight < layoutHeightParam
          ) {
            availableHeight += 1
          }

          
          let availableWidth = 1
          while (
            normGrid[r]?.[c + availableWidth] === undefined &&
            c + availableWidth < layoutWidthParam
          ) {
            availableWidth += 1
          }

          filled.push({
            rowSpanFrom: r + 1,
            rowSpanTo: r + 2,
            columnSpanFrom: c + 1,
            columnSpanTo: c + availableWidth + 1,
            availableHeight,
            availableWidth
          })
        } else if (
          rowItem !== undefined &&
          filled.every((w) => w.widget?.id !== rowItem?.widget.id)
        ) {
          filled.push(rowItem)
        }
      }
    }

    return filled
  }

  function handleAddClick(params: { slot: (typeof filledWidgetGrid)[number] }) {
    addWidgetDialog = true
    addWidgetInfo = {
      availableHeight: params.slot.availableHeight || 1,
      availableWidth: params.slot.availableWidth || 1,
      fromRow: params.slot.rowSpanFrom,
      fromColumn: params.slot.columnSpanFrom
    }
  }

  function addWidgetCell(params: {
    widget: Widget
    fromRow: number
    fromColumn: number
    width: number
    height: number
  }) {
    const widgetCellToAdd = {
      widget: params.widget,
      rowSpanFrom: params.fromRow,
      rowSpanTo: params.fromRow + params.height,
      columnSpanFrom: params.fromColumn,
      columnSpanTo: params.fromColumn + params.width
    }

    const newCells = [...(widgetCells || []), widgetCellToAdd]
    if (!deepEqual(newCells, widgetCells)) {
      widgetCells = newCells
    }
    
    calculateWidgetsFromLocalWidgets()

    onaddWidgetCell?.({
      widgetCell: widgetCellToAdd
    })
  }

  function removeWidgetCell(params: { id: string | number }) {
    const widgetCellToRemove = (widgetCells || []).find((w) => w.widget.id === params.id)
    const newCells = (widgetCells || []).filter((w) => w.widget.id !== params.id)

    if (!deepEqual(newCells, widgetCells)) {
      widgetCells = newCells
    }

    calculateWidgetsFromLocalWidgets()

    if (!!widgetCellToRemove) {
      onremoveWidgetCell?.({
        widgetCell: widgetCellToRemove
      })
    }
  }

  function calculateWidgetsFromLocalWidgets() {
		widgets = widgetCells?.map((lWidget) => {
			return {
				id: lWidget.widget.id,
				name: lWidget.widget.name,
				height: lWidget.widget.height,
				width: lWidget.widget.width,
				left: lWidget.widget.left,
				top: lWidget.widget.top,
			}
		})
	}

  function closeAddWidgetDialog() {
    addWidgetDialog = false
  }

  function availableSizes(params: {
		availableHeight: number
		availableWidth: number
		availableSizes: [number, number][]
	}): [number, number][] {
		return params.availableSizes.filter(
			(as) => as[0] <= params.availableHeight && as[1] <= params.availableWidth
		)
	}
</script>

<div
  class="shaper"
  style:--dashboard-shaper-grid-template-columns={`repeat(${layoutWidth}, 1fr)`}
  style:--dashboard-shaper-grid-template-rows={`repeat(${layoutHeight}, var(--dashboard-shaper-widget-height, var(--dashboard-shaper-default-widget-height)))`}
>
  {#each filledWidgetGrid as widgetCell}
    {#if !!widgetCell.widget}
      <div
        style:grid-column={`${widgetCell.columnSpanFrom} / ${widgetCell.columnSpanTo}`}
        style:grid-row={`${widgetCell.rowSpanFrom} / ${widgetCell.rowSpanTo}`}
      >
        {#if preview}
          <div class="widget-cell-preview"></div>
        {:else}
					{#if widgetCellSnippet}
						{@render widgetCellSnippet({ 
              widgetCell: {
                ...widgetCell,
                title: availableWidgetCells.find((awc) => awc.name === widgetCell.widget?.name)?.title
              },
              removeWidgetCell
            })}
					{:else}
						{widgetCell.widget.name}
					{/if}
        {/if}
      </div>
    {:else if !preview && canAdd}
      <div
        style:grid-column={`${widgetCell.columnSpanFrom} / ${widgetCell.columnSpanTo}`}
        style:grid-row={`${widgetCell.rowSpanFrom} / ${widgetCell.rowSpanTo}`}
      >
        {@render addWidgetButton(widgetCell)}
      </div>
    {/if}
  {/each}
	{#if normalizedWidgetGrid.length < layoutHeight && !preview && canAdd}
		<div style:grid-column={`1 / ${layoutWidth + 1}`}>
      {@render addWidgetButton({
        columnSpanFrom: 1,
        columnSpanTo: layoutWidth + 1,
        rowSpanFrom: normalizedWidgetGrid.length + 1,
        rowSpanTo: normalizedWidgetGrid.length + 2,
        availableHeight: layoutHeight - normalizedWidgetGrid.length,
        availableWidth: layoutWidth
      })}
		</div>
	{/if}
</div>

{#snippet addWidgetButton(slot: Parameters<typeof handleAddClick>[0]['slot'])}
  {#if addWidgetButtonSnippet}
    {@render addWidgetButtonSnippet({ handleAddClick, slot})}
  {:else}
    <button 
      class="add-button" 
      onclick={() => handleAddClick({ slot })}
    >
      <Icon name="mdi-plus" --icon-default-size="1.5rem" />
      <div class="description">{lang == 'en' ? 'Add widget' : 'Aggiungi widget'}</div>
    </button>
  {/if}
{/snippet}

<Dialog 
	bind:open={addWidgetDialog}
>
	<div class="card">
    {#if widgetSelectionDialogHeaderSnippet}
      {@render widgetSelectionDialogHeaderSnippet()}
    {:else}
      <div class="header">
        <Icon name={"mdi-widgets-outline"} --icon-size="30px"/>
        <div class="title">{lang == 'en' ? 'Add widget' : 'Aggiungi widget'}</div>
      </div>
    {/if}
    {#key addWidgetInfo}
      {#if !!addWidgetInfo}
        <div class="widget-selection-list">
          {#each availableWidgetCells
            .filter((ws) => availableSizes({ 
              availableHeight: addWidgetInfo!.availableHeight, 
              availableWidth: addWidgetInfo!.availableWidth, 
              availableSizes: ws.availableSizes 
            }).length > 0)
            .sort((a, b) => {
              if (a.title == 'Placeholder') return -1
              if (a.title < b.title) return -1
              if (a.title > b.title) return 1
              return 0
            }) as widgetSpec
          }
            <div class="widget-card">
              <div class="widget-info">
                {#if widgetSpec.icon}
                  <Icon name={widgetSpec.icon} --icon-size="30px" />
                {/if}
                <div class="widget-title">{widgetSpec.title}</div>
                <div class="widget-desc">{widgetSpec.description}</div>
              </div>

              <div class="widget-actions">
                {#each availableSizes({ 
                  availableHeight: addWidgetInfo.availableHeight, 
                  availableWidth: addWidgetInfo.availableWidth, 
                  availableSizes: widgetSpec.availableSizes 
                  }) as sizes
                }
                  <Chip
                    inactive
                    onclick={() => {
                      addWidgetCell({
                        widget: {
                          id: createId(),
                          name: widgetSpec.name,
                          height: sizes[0],
                          width: sizes[1],
                          top: addWidgetInfo!.fromRow,
                          left: addWidgetInfo!.fromColumn,
                        },
                        fromColumn: addWidgetInfo!.fromColumn,
                        fromRow: addWidgetInfo!.fromRow,
                        height: sizes[0],
                        width: sizes[1]
                      })
                      closeAddWidgetDialog()
                    }}
                    --chip-height=25px
                    --chip-min-height=0px
                    --chip-padding="2px 4px 0px"
                    --chip-inactive-background-color=rgb(var(--global-color-background-500))
                  >
                    {sizes[0]} x {sizes[1]}
                  </Chip>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/key}
	</div>
</Dialog>

<style>
	.shaper {
		width: 100%;
		min-height: 200px;
		display: grid;
		gap: var(--dashboard-shaper-gap, var(--dashboard-shaper-default-gap));
		grid-template-columns: var(--dashboard-shaper-grid-template-columns);
		grid-template-rows: var(--dashboard-shaper-grid-template-rows);
	}

	.widget-cell-preview {
		width: 100%;
		height: 100%;
		background-color: var(--dashboard-shaper-cell-preview-background-color, var(--dashboard-shaper-default-cell-preview-background-color));
		border-radius: var(--dashboard-shaper-widget-preview-border-radius, var(--dashboard-shaper-default-widget-preview-border-radius));
	}

	@media screen and (max-width: 800px) {
		.shaper {
			display: var(--dashboard-shaper-display-mobile, var(--dashboard-shaper-default-display-mobile));
			flex-direction: var(--dashboard-shaper-flex-direction-mobile, var(--dashboard-shaper-default-flex-direction-mobile));
		}
	}

  .card {
		background-color: var(--dashboard-shaper-dialog-background-color, var(--dashboard-shaper-default-dialog-background-color));
		border-radius: 8px;
		padding: 0px;
    max-width: 80vw;
    overflow-x: auto;
	}

	.header {
		display: flex;
		padding: 20px;
		gap: 12px;
		background-color: var(--dashboard-shaper-dialog-header-background-color, var(--dashboard-shaper-default-dialog-header-background-color));
		border-block-end: 1px solid rgb(var(--global-color-contrast-100));
		height: min-content;
	}
  
  .title {
		font-size: 1.35rem;
		font-weight: bold;
		text-align: center;
	}

  .add-button {
		width: 100%;
		height: 100%;
		min-height: 200px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: var(--dashboard-shaper-add-widget-button-background-color, var(--dashboard-shaper-default-add-widget-button-background-color));
		border-radius: 8px;
	}

	.description {
		font-size: 0.9rem;
		font-weight: 300;
		opacity: 0.7;
	}

  .widget-selection-list {
    display: flex;
    flex-wrap: wrap;
    max-width: 800px;
    padding: 1rem;
    max-height: 70vh;
    overflow-y: auto;
  }

  @media screen and (max-width: 800px) {
		.widget-selection-list {
			width: 100%;
			flex-direction: column;
      flex-wrap: nowrap;
		}
	}

  .widget-card {
    padding: 0.625rem;
    border-radius: 0.375rem;
    display: flex;
    flex-direction: column;
    position: relative;
    flex-basis: 50%;
    box-sizing: border-box;
  }

  .widget-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .widget-title {
    font-size: 1.25rem;
    line-height: 1.75rem;
    font-weight: 700;
  }

  .widget-desc {
    font-size: 0.875rem;
    font-weight: 300;
  }

  .widget-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }
</style>