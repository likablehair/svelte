<script lang="ts">
  import '../../../../lib/css/main.css'
  import GlobalSearchTextField from "$lib/components/composed/search/GlobalSearchTextField.svelte";
  import StableDividedSideBarLayout from "$lib/components/layouts/StableDividedSideBarLayout.svelte";
  import SidebarMenuList from "$lib/components/simple/lists/SidebarMenuList.svelte";
  import Navigator from "$lib/components/simple/navigation/Navigator.svelte";
  import logo from '../../logo.svg'
  import logoPartial from  '../../logo_partial.svg'
  import "../../../../app.css";
  import colors from  "../../stores/colors";
  import { beforeNavigate, goto } from "$app/navigation";
  import componentDatabase from '../../search/components.database'
  import CollapsibleSideBarLayout from "$lib/components/layouts/NewCollapsibleSideBarLayout.svelte";

  let searchDialogOpened: boolean = false,
    drawerOpened: boolean = false

  beforeNavigate(() => {
    drawerOpened = false
  })

  async function search(params: { searchText: string }): Promise<{ title: string, name: string, subtitle: string, data?: any }[]> {
    let response = await fetch('/docs/search?text=' + params.searchText)
    let results = await response.json()
    return results.map((el: {
      title: string,
      name: string,
      data?: any,
      url?: string,
      description: string,
      subtitle?: string
    }) => {
      el.subtitle = el.url
      el.data = {
        url: el.url
      }
      return el
    })
  }

  async function handleSearchSelect(event: CustomEvent<{element: { data?: { url: string }}}>) {
    if(!!event.detail.element.data) goto(event.detail.element.data.url)
    searchDialogOpened = false
  }
</script>

<CollapsibleSideBarLayout
  bind:drawerOpened={drawerOpened}
  fullLogo={logo}
  partialLogo={logoPartial}
  menuItems={[
    {
      name: 'home',
      icon: "mdi-home",
      label: "Home"
    }, {
      name: 'registry',
      icon: "mdi-domain",
      label: "Elezioni"
    }, {
      name: 'registration',
      icon: "mdi-clipboard-outline",
      label: "Raccolta dati"
    }, {
      name: 'monitor',
      icon: "mdi-checkbox-marked-outline",
      label: "Monitor"
    }, {
      name: 'settings',
      icon: "mdi-cog-outline",
      label: "Configurazioni"
    }
  ]}
>
  <div class="content-container">
    <div class="content">
      Pagina
    </div>
  </div>
</CollapsibleSideBarLayout>

<style>
  .content {
    max-width: 1100px;
    width: 100%;
  }
</style>