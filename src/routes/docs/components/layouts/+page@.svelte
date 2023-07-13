<script lang="ts">
  import logo from '../../logo.svg'
  import logoPartial from  '../../logo_partial.svg'
  import "../../../../app.css";
  import { beforeNavigate, goto } from "$app/navigation";
  import CollapsibleSideBarLayout from "$lib/components/layouts/CollapsibleSideBarLayout.svelte";

  let drawerOpened: boolean = false

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