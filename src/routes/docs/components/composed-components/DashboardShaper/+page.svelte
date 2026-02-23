<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import DashboardShaper from "$lib/components/composed/dashboard/DashboardShaper.svelte";
  import type { ComponentProps } from "svelte";

  let availableWidgetCells: ComponentProps<typeof DashboardShaper>['availableWidgetCells'] = [
			{
				name: 'Clock',
				title: 'Clock',
				description: 'A simple clock',
				icon: 'mdi-clock',
				availableSizes: [[1, 1]],
			},
			{
				name: 'Calendar',
				title: 'Calendar',
				description: 'A simple calendar',
				icon: 'mdi-calendar',
				availableSizes: [[1, 1], [1, 2], [2, 1]],
			},
			{
				name: 'ADMDeclarationsByType',
				title: 'ADM Declarations By Type',
				description: 'A list of ADM declarations grouped by type',
				icon: 'mdi-file-cabinet',
				availableSizes: [[1, 3], [2, 2], [2, 3], [3, 2]],
			},
			{
				name: 'PlafondVatRatio',
				title: 'Plafond VAT Ratio',
				description: 'The ratio between declared and used plafond VAT',
				icon: 'mdi-percent',
				availableSizes: [[2, 2], [2, 3], [2, 4]],
			},
			{
				name: 'PlafondVatUsedValueByTime',
				title: 'Plafond VAT Used Value By Time',
				description: 'The used value of the plafond VAT grouped by time',
				icon: 'mdi-chart-timeline-variant',
				availableSizes: [[2, 2], [2, 3], [2, 4]],
			},
			{
				name: 'DeclarationGoodsByNcCode',
				title: 'Imported Goods By NC Code',
				description: 'A list of imported goods grouped by NC code',
				icon: 'mdi-barcode-scan',
				availableSizes: [[1, 2], [2, 2], [3, 3]],
			},
			{
				name: 'ExportDeclarationGoodsByNcCode',
				title: 'Exported Goods By NC Code',
				description: 'A list of exported goods grouped by NC code',
				icon: 'mdi-barcode-scan',
				availableSizes: [[1, 2], [2, 2], [3, 3]],
			},
			{
				name: 'CbamGoodsByCategory',
				title: 'CBAM Goods By Category',
				description: 'A list of CBAM goods grouped by category',
				icon: 'mdi-package-variant-closed',
				availableSizes: [[1, 1], [2, 2], [3, 3]],
			},
			{
				name: 'TotalTaxesAndDuties',
				title: 'Total Taxes and Duties',
				description: 'The total of taxes, duties and vat in import declarations',
				icon: 'mdi-cash-register',
				availableSizes: [[1, 1], [1, 2], [2, 2]],
			},
			{
				name: 'TotalTaxesAndDutiesByTime',
				title: 'Total Taxes and Duties By Time',
				description: 'The total of taxes, duties and vat in import declarations, grouped by time',
				icon: 'mdi-chart-line',
				availableSizes: [[2, 2], [2, 3]],
			},
			{
				name: 'CbamGoodsRatio',
				title: 'CBAM Goods Ratio',
				description: 'The ratio between the CBAM and non CBAM goods',
				icon: 'mdi-chart-donut-variant',
				availableSizes: [[1, 1], [2, 2], [3, 3]],
			},
			{
				name: 'ADMDeclarationsByIncoterm',
				title: 'ADM Declarations by Incoterm',
				description: 'A list of import declarations grouped by the Incoterm',
				icon: 'mdi-chart-timeline-variant-shimmer',
				availableSizes: [[1, 1], [1, 2], [2, 2], [2, 3]],
			},
			{
				name: 'ImportedDeclarationsByRegion',
				title: 'Customs Import Declaration by Region',
				description: 'A list of imported declarations grouped by Country Region',
				icon: 'mdi-earth',
				availableSizes: [[2, 2], [2, 3], [3, 3]],
			},
			{
				name: 'ExportedDeclarationsByRegion',
				title: 'Customs Export Declarations by Region',
				description: 'A list of exported declarations grouped by Country Region',
				icon: 'mdi-earth-arrow-right',
				availableSizes: [[2, 2], [2, 3], [3, 3]],
			},
			{
				name: 'ImportedCbamGoodsByCountry',
				title: 'Imported CBAM Goods By Country',
				description: 'A list of imported CBAM goods grouped by country',
				icon: 'mdi-leaf',
				availableSizes: [[2, 2], [2, 3], [3, 3]],
			},
			{
				name: 'ImportedCbamGoodsByRegion',
				title: 'Imported CBAM Goods By Region',
				description: 'A list of imported CBAM goods grouped by country region',
				icon: 'mdi-leaf',
				availableSizes: [[2, 2], [2, 3], [3, 3]],
			},
			{
				name: 'DutiesByType',
				title: 'Oil Duties By Type',
				description: 'A list of duties grouped by type',
				icon: 'mdi-cash-register',
				availableSizes: [[2, 2], [2, 3], [3, 3]],
			},
		]

  let widgets: ComponentProps<typeof DashboardShaper>['widgets'] = [
    {
      id: 1,
      name: "TotalTaxesAndDuties",
      height: 2,
      width: 2,
      top: 1,
      left: 1,
    },
    {
      id: 2,
      name: "ADMDeclarationsByType",
      height: 2,
      width: 3,
      top: 1,
      left: 3,
    },
    {
      id: 3,
      name: "Clock",
      height: 1,
      width: 1,
      top: 1,
      left: 6,
    },
    {
      id: 4,
      name: "Calendar",
      height: 1,
      width: 1,
      top: 2,
      left: 6,
    },
    {
      id: 5,
      name: "CbamGoodsRatio",
      height: 2,
      width: 2,
      top: 3,
      left: 1,
    },
    {
      id: 6,
      name: "TotalTaxesAndDutiesByTime",
      height: 2,
      width: 2,
      top: 3,
      left: 3,
    },
    {
      id: 7,
      name: "ExportedDeclarationsByRegion",
      height: 2,
      width: 2,
      top: 3,
      left: 5,
    }
  ]
</script>

<h1>Dashboard Shaper</h1>
<ComponentSubtitle>Shape your dashboard into life.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  {#snippet widgetCellSnippet(parameters: Parameters<NonNullable<ComponentProps<typeof DashboardShaper>['widgetCellSnippet']>>[0])}
    {@const randomColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`}
    <div
      class="widget"
      style:background-color={randomColor}
    >
      {parameters.widgetCell.widget?.name}
    </div>
  {/snippet}
  <DashboardShaper
    {availableWidgetCells}
    {widgets}
    {widgetCellSnippet}
  >
  </DashboardShaper>

  <DashboardShaper
		{availableWidgetCells}
		widgets={[]}
		{widgetCellSnippet}
	></DashboardShaper>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
		{
			name: 'layoutWidth',
			type: 'number',
			description: 'Width of the dashboard grid',
			default: '6',
		},
		{
			name: 'layoutHeight',
			type: 'number',
			description: 'Height of the dashboard grid',
			default: '4',
		},
		{
			name: 'widgets',
			type: 'Widget[]',
			description: 'Widgets to display',
		},
		{
			name: 'availableWidgetCells',
			type: 'AvailableWidget[]',
			description: 'Every available widget to choose from',
		},
		{
			name: 'someRowSlotEmpty',
			type: 'boolean',
			description: 'True if there is a row that is not fully complete',
		},
		{
			name: 'preview',
			type: 'boolean',
			description: 'Puts the dashboard in preview mode',
			default: 'false',
		},
		{
			name: 'canAdd',
			type: 'boolean',
			description: 'Enables add widget button',
			default: 'true',
		},
		{
			name: 'lang',
			type: '"it" | "en"',
			description: 'Language of the text',
			default: '"en"',
		},
  ]}
  styleProps={[
		{
			name: '--dashboard-shaper-widget-height',
			type: 'height',
			description: 'Widget height',
			default: '200px',
		},
		{
			name: '--dashboard-shaper-gap',
			type: 'gap',
			description: 'Gap between widgets',
			default: '4px',
		},
		{
			name: '--dashboard-shaper-cell-preview-background-color',
			type: 'color',
			description: 'Preview widgets background color',
			default: 'rgb(var(--global-color-primary-500), 0.5)',
		},
		{
			name: '--dashboard-shaper-widget-preview-border-radius',
			type: 'border-radius',
			description: 'Preview widgets border radius',
			default: '8px',
		},
		{
			name: '--dashboard-shaper-display-mobile',
			type: 'display',
			description: 'Dashboard display on mobile screen',
			default: 'flex',
		},
		{
			name: '--dashboard-shaper-flex-direction-mobile',
			type: 'flex-direction',
			description: 'Dashboard flex direction on mobile screen',
			default: 'column',
		},
		{
			name: '--dashboard-shaper-dialog-background-color',
			type: 'color',
			description: 'Selection dialog background color',
			default: 'rgb(var(--global-color-background-300))',
		},
		{
			name: '--dashboard-shaper-dialog-header-background-color',
			type: 'color',
			description: 'Selection dialog header background color',
			default: 'rgb(var(--global-color-background-400))',
		},
		{
			name: '--dashboard-shaper-add-widget-button-background-color',
			type: 'color',
			description: 'Add widget button background color',
			default: 'rgb(var(--global-color-background-300))',
		},
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
		{
			name: 'widgetCellSnippet',
			description: 'Snippet containing the actual widget',
			properties: [
				{
					name: 'widgetCell',
					type: 'Widget',
					description: 'The widget to display',
				},
				{
					name: 'removeWidgetCell',
					type: '({ id }) => void',
					description: 'Function to call when deleting a widget',
				},
			],
			default: `
{widgetCell.widget.name}
`
		},
		{
			name: 'addWidgetButtonSnippet',
			description: 'The button to add widget',
			properties: [
				{
					name: 'handleAddClick',
					type: '({ slot }) => void',
					description: 'Function to call to add a widget',
				},
				{
					name: 'slot',
					type: 'Slot',
					description: 'Slot to pass to the handleAddClick function',
				},
			],
			default: `
<button 
	class="add-button" 
	onclick={() => handleAddClick({ slot })}
>
	<Icon name="mdi-plus" --icon-default-size="1.5rem" />
	<div class="description">{lang == 'en' ? 'Add widget' : 'Aggiungi widget'}</div>
</button>
`
		},
		{
			name: 'widgetSelectionDialogHeaderSnippet',
			description: 'Header of the dialog to select widgets',
			default: `
<div class="header">
	<Icon name={"mdi-widgets-outline"} --icon-size="30px"/>
	<div class="title">{lang == 'en' ? 'Add widget' : 'Aggiungi widget'}</div>
</div>
`
		},
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
		{
			name: 'onaddWidgetCell',
			description: 'Event dispatched when a widget is added',
			properties: [
				{
					name: 'widgetCell',
					type: 'Widget',
					description: 'The widget added',
				}
			],
		},
		{
			name: 'onremoveWidgetCell',
			description: 'Event dispatched when a widget is removed',
			properties: [
				{
					name: 'widgetCell',
					type: 'Widget',
					description: 'The widget removed',
				}
			],
		},
  ]}
></EventsViewer>

<style>
  .widget {
    width: 100%;
    height: 100%;
    overflow: auto;
    min-height: 200px;
  }
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 24px;
    margin-bottom: 20px;
  }
</style>