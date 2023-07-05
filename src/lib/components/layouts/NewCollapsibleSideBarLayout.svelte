<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import CollapsibleDivider from "../simple/common/CollapsibleDivider.svelte";
  import Icon from "../simple/media/Icon.svelte";
  import MediaQuery from "../simple/common/MediaQuery.svelte";
  import type { MenuItem } from "../simple/lists/SelectableMenuList.svelte";
  import SelectableMenuList from "../simple/lists/SelectableMenuList.svelte";

  export let _pagePadding: string = "20px 0 0 30px",
    _menuElementMarginBottom: string = "30px",
    _menuElementFontSize: string = "1.1rem",
    _menuElementFontWeight: string = "400",
    _menuColor: string = "#454444",
    _selectedMenuColor: string = "#0b66cc",
    _expandedSideBarWidth: string = "16rem",
    _collapsedSideBarWidth: string = "4.6rem",
    _headerHeight: string = "80px",
    _collapseTransitionTime: string = "0.4s",
    _sideBarBackgroundColor: string = "white",
    _overlayColor: string = "hsla(240,5%,65%,.2)",
    _headerBackgroundColor: string = "#FFFF",
    _dividersColor: string = '#d2d2d2'

  export let drawerOpened: boolean = false,
    drawerCollapsed: boolean = false,
    menuItems: MenuItem[] = [],
    menuIconsSize: number = 16,
    selectedMenuElementId: string | undefined = undefined,
    fullLogo: string | undefined = undefined,
    partialLogo: string | undefined = undefined,
    openedHeader: boolean = false

  let dispatch = createEventDispatcher<{
    'collapse': {
      collapsed: boolean
    },
    'drawer-change': {
      opened: boolean
    },
    'menu-click': {
      menu: MenuItem
    }
  }>()
</script>

<MediaQuery let:mAndDown>
  <SelectableMenuList
    items={menuItems}
  ></SelectableMenuList>
</MediaQuery>