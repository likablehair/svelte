<script lang="ts">
  import '../../../../../app.css'
  import CollapsibleSideBarLayout from "$lib/components/layouts/CollapsibleSideBarLayout.svelte";
  import type { Option } from "$lib/components/simple/lists/ColorInvertedSelector.svelte";
  import { type ComponentProps } from 'svelte';
  import HierarchyMenu from "$lib/components/simple/lists/HierarchyMenu.svelte";

	let baseOptions: NonNullable<ComponentProps<HierarchyMenu>['options']> = [
		{
			label: 'Articoli',
			name: 'warehouse-products',
			icon: 'mdi-cube'
		},
		{
			label: 'Movimenti',
			name: 'choose-handling-type',
			icon: 'mdi-warehouse',
      options: [
        {
          label: 'Acquisto',
          name: 'purchase',
          icon: 'mdi-cart-arrow-down',
        }, {
          label: 'Vendita',
          name: 'sales',
          icon: 'mdi-brightness-percent',
        }, {
          label: 'Carico',
          name: 'load',
          icon: 'mdi-database-arrow-left',
        }, {
          label: 'Scarico',
          name: 'unload',
          icon: 'mdi-database-arrow-right-outline',
        }
      ]
		},
		{
			label: 'Lista Movimenti',
			name: 'warehouse-handlings',
			icon: 'mdi-cart'
		},
		{
			label: 'Anagrafiche',
			name: 'anagraphics',
			icon: 'mdi-card-account-details',
      options: [
        {
          label: 'Clienti',
          name: 'customers',
          icon: 'mdi-store',
        }, {
          label: 'Fornitori',
          name: 'suppliers',
          icon: 'mdi-truck',
        }
      ]
		},
		{
			label: 'Statistiche',
			name: 'analysis',
			icon: 'mdi-google-analytics',
      options: [
        {
          label: 'Statistica Movimenti',
          name: 'handlings-analysis',
          icon: 'mdi-chart-bar',
        },
      ]
		},
		{
			label: 'Stampe',
			name: 'prints',
			icon: 'mdi-clipboard-file'
		},
		{
			label: 'Impostazioni',
			name: 'settings',
			icon: 'mdi-tune-variant',
      options: [
        {
          label: 'Profilo e Licenza',
          name: 'profile',
          icon: 'mdi-account-tie',
        }, {
          label: 'Unità di misura',
          name: 'measurementUnits',
          icon: 'mdi-ruler',
        },
				{
          label: 'Assistenza',
          name: 'assistance',
          icon: 'mdi-face-agent',
        },
      ]
		},
    {
			label: 'Altri movimenti',
			name: 'other-handlings',
			icon: 'mdi-warehouse',
      options: [
        {
          label: 'Acquisto',
          name: 'purchase',
          icon: 'mdi-cart-arrow-down',
        }, {
          label: 'Vendita',
          name: 'sales',
          icon: 'mdi-brightness-percent',
        }, {
          label: 'Carico',
          name: 'load',
          icon: 'mdi-database-arrow-left',
        }, {
          label: 'Scarico',
          name: 'unload',
          icon: 'mdi-database-arrow-right-outline',
        }
      ]
		},
    {
			label: 'Altre impostazioni',
			name: 'other-settings',
			icon: 'mdi-tune-variant',
      options: [
        {
          label: 'Profilo e Licenza',
          name: 'profile',
          icon: 'mdi-account-tie',
        }, {
          label: 'Unità di misura',
          name: 'measurementUnits',
          icon: 'mdi-ruler',
        },
				{
          label: 'Assistenza',
          name: 'assistance',
          icon: 'mdi-face-agent',
        },
      ]
		},
	];

  let selectedItem = 0;
  let sidebarExpanded = false;
  let isPinned = false;
  let drawerOpened = false;
  
  function handleMenuSelect(event: CustomEvent<{ option: Option }>) {
    const option = event.detail.option;
    const index = baseOptions.findIndex(item => item.name === option.name);
    if (index !== -1) {
      selectedItem = index;
    }
  }
  
  function handlePinnedChange(event: CustomEvent<{ pinned: boolean }>) {
    isPinned = event.detail.pinned;
  }
  
  function handleSidebarToggle(event: CustomEvent<{ expanded: boolean }>) {
    sidebarExpanded = event.detail.expanded;
  }
  
  function handleDrawerChange(event: CustomEvent<{ opened: boolean }>) {
    drawerOpened = event.detail.opened;
  }
</script>

<CollapsibleSideBarLayout
  bind:sidebarExpanded={sidebarExpanded}
  bind:drawerOpened={drawerOpened}
  on:menu-select={handleMenuSelect}
  on:pinned-change={handlePinnedChange}
  on:sidebar-toggle={handleSidebarToggle}
  on:drawer-change={handleDrawerChange}
  --collapsible-divided-side-bar-layout-content-padding="4px 16px"
  --collapsible-divided-side-bar-layout-header-menu-padding="8px 4px 8px 16px"
>
  <svelte:fragment slot="inner-menu" let:hamburgerVisible>
    <div class="ml-auto flex gap-2">
      
    </div>
  </svelte:fragment>

  <svelte:fragment slot="logo" let:hamburgerVisible let:sidebarExpanded>
    <div class="logo">{!sidebarExpanded ? "LS" : "Logo Sidebar"}</div>
  </svelte:fragment>

  <svelte:fragment slot="menu" let:hamburgerVisible let:sidebarExpanded >
    <div class="hierarchyMenu">
      <HierarchyMenu
        options={baseOptions}
        iconsOnly={!sidebarExpanded && !hamburgerVisible}
        selected={baseOptions[selectedItem]?.name}
        --icon-size="20px"
        --hierarchy-menu-element-selected-background-color="rgb(var(--global-color-primary-500))"
        --hierarchy-menu-element-selected-color="white"
        --hierarchy-menu-default-gap=0px
        on:optionClick={handleMenuSelect}
      ></HierarchyMenu>
    </div>
  </svelte:fragment>
  
  <div class="content-area">
    <h1>Componente Sidebar con Toggle</h1>
    <p>Questo è un esempio di utilizzo del componente CollapsibleSideBarLayout con la funzionalità di toggle.</p>
    <p>Stato della sidebar:</p>
    <ul>
      <li>Espansa: {sidebarExpanded ? 'Sì' : 'No'}</li>
      <li>Bloccata: {isPinned ? 'Sì' : 'No'}</li>
      <li>Elemento selezionato: {baseOptions[selectedItem]?.label}</li>
    </ul>
    <p>Prova a:</p>
    <ul>
      <li>Cliccare sull'icona del menu nella barra in alto per aprire/chiudere la sidebar</li>
      <li>Cliccare sull'icona "pin" nella sidebar per bloccarla in posizione espansa</li>
      <li>Selezionare un elemento del menu per vederlo evidenziato</li>
    </ul>
  </div>
</CollapsibleSideBarLayout>

<style>
  .hierarchyMenu {
    margin-left: 1rem;
    margin-top: 1rem;
    margin-right: 0.5rem;
  }

  .content-area {
    padding: 20px;
    max-width: 800px;
  }
  
  .logo {
    font-weight: bold;
    font-size: 1.2rem;
    padding: 10px;
    border-radius: 4px;
    text-align: center;
  }
  
  h1 {
    margin-bottom: 20px;
  }
  
  ul {
    margin-bottom: 20px;
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 5px;
  }
</style>