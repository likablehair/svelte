<script lang="ts" module>
  export type Menu = {
    title: string,
    name: string | number,
    url?: string,
    disabled?: boolean,
    children?: Menu[]
  };
</script>

<script lang="ts">
  import '../../../css/main.css'
  import './SidebarMenuList.css'
  import Self from './SidebarMenuList.svelte'
  import { page } from "$app/state";

  interface Props {
    menus: Menu[];
    level?: number;
    selected?: string | number;
    bookmarkColor?: string;
    color?: string;
    hoverColor?: string;
    selectedTextColor?: string;
    selectedFontWeight?: string;
    autoDetectUrl?: boolean;
  }

  let {
    menus,
    level = 0,
    selected = $bindable(undefined),
    bookmarkColor = "rgb(var(--global-color-primary-500))",
    color = "inherit",
    hoverColor = 'inherit',
    selectedTextColor = "inherit",
    selectedFontWeight = "600",
    autoDetectUrl = false,
  }: Props = $props();
  
  let selectedIndex: number | undefined = $state(undefined)

  $effect(() => {
    if(autoDetectUrl && !!page) {
      const results = getMenuNameMatchingUrl({ menus: menus })
      selected = results.name
    }
  }) 

  $effect(() => {
    if(level == 0) {
      if(selected !== undefined && selected !== null) {
        let results = getSelectionIndex({
          menus: menus,
          offset: 0,
          search: selected
        })
  
        if(results.found) selectedIndex = results.offset
        else selectedIndex = undefined
      } else {
        selectedIndex = undefined
      }
    }
  })

  let isSelected = $derived(selectedIndex !== undefined)

  function getSelectionIndex(params: {
    menus: Menu[],
    offset: number,
    search: string | number
  }): { found: boolean, offset: number } {
    let initialOffset = params.offset

    for(let i = 0; i < params.menus.length; i += 1) {
      initialOffset += 1
      let currentMenu = params.menus[i]
      if(currentMenu.name == params.search) {
        return { found: true, offset: initialOffset }
      } else if(!!currentMenu.children) {
        let results = getSelectionIndex({
          menus: currentMenu.children,
          offset: initialOffset,
          search: params.search
        })

        initialOffset = results.offset
        if(results.found) {
          return { found: true, offset: initialOffset }
        }
      }
    }

    return { found: false, offset: initialOffset }
  }

  function getMenuNameMatchingUrl(params: {
    menus: Menu[]
  }): {
    name: string | number | undefined,
    matchType: 'startsWith' | 'equal' | undefined
  } {
    let foundName: string | number | undefined = undefined
    let foundMatchType: 'startsWith' | 'equal' | undefined = undefined

    for(let i = 0; i < params.menus.length; i += 1) {
      let currentMenu = params.menus[i]

      if(!!currentMenu.children) {
        let found = getMenuNameMatchingUrl({ menus: currentMenu.children })
        if(found.name !== undefined) {
          foundName = found.name
          foundMatchType = found.matchType
        }
      }
      
      if(!!currentMenu.url && page.url.pathname === currentMenu.url) {
        foundName = currentMenu.name
        foundMatchType = 'equal'
      } else if(foundMatchType !== 'equal' && !!currentMenu.url && page.url.pathname.startsWith(currentMenu.url)) {
        foundName = currentMenu.name
        foundMatchType = 'startsWith'
      }
    }

    return {
      name: foundName,
      matchType: foundMatchType
    }
  }

  function handleUrlClick(e: Event, menu: Menu) {
    if(menu.disabled) e.preventDefault()
    else selected = menu.name
  }
</script>

<ul
  style:--sidebar-menu-list-selected-index={selectedIndex}
  style:--sidebar-menu-list-primary-color={bookmarkColor}
  style:--sidebar-menu-list-selected-text-color={selectedTextColor}
  style:--sidebar-menu-list-selected-font-weight={selectedFontWeight}
  style:--sidebar-menu-list-color={color}
  style:--sidebar-menu-list-hover-color={hoverColor}
>
  {#if level == 0}
    <div class="guide"></div>
    {#if isSelected}
      <div class="bookmark"></div>
    {/if}
  {/if}
  {#each menus as menu}
    <li>
      <a 
        href={menu.url} 
        onclick={(event) => handleUrlClick(event, menu)} 
        title={menu.title}
        aria-disabled={menu.disabled}
        data-sveltekit-preload-data={menu.disabled ? 'off' : 'hover'}
        class="menu-link"
        class:active={selected == menu.name}
      >{menu.title}</a>
      {#if !!menu.children}
        <Self
          menus={menu.children}
          level={level + 1}
          bind:selected={selected}
        >
        </Self>
      {/if}
    </li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    padding-left: 1rem;
    position: relative;
    line-height: 1rem;
  }

  a {
    font-size: .875rem;
    line-height: 2rem;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    display: inline-block;
  }

  a[aria-disabled=true] {
    opacity: 50%;
  }

  .guide {
    background-color: rgb(var(--global-color-contrast-50));
    width: 1px;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0.5rem;
  }

  .bookmark {
    background-color: var(
      --sidebar-menu-list-primary-color,
      var(--sidebar-menu-list-default-primary-color)
    );
    width: 2px;
    position: absolute;
    top: calc((var(--sidebar-menu-list-selected-index) - 1) * 2.2rem);
    height: 2rem;
    left: 0.5rem;
    transition-property: top;
    transition-duration: .4s;
    transition-timing-function: cubic-bezier(0.075, 0.82, 0.165, 1);
  }

  .menu-link {
    padding-left: 0.5rem;
    text-decoration: none;
    color: var(
      --sidebar-menu-list-color,
      var(--sidebar-menu-list-default-color)
    );
    transition-property: color;
    transition-duration: .4s;
    transition-timing-function: cubic-bezier(0.075, 0.82, 0.165, 1);
  }

  .menu-link:hover {
    color: var(
      --sidebar-menu-list-hover-color,
      var(--sidebar-menu-list-default-hover-color)
    )
  }

  .menu-link.active {
    color: var(
      --sidebar-menu-list-selected-text-color,
      var(--sidebar-menu-list-default-selected-text-color)
    );
    font-weight: var(
      --sidebar-menu-list-selected-font-weight,
      var(--sidebar-menu-list-default-selected-font-weight)
    )
  }
</style>