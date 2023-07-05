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
      marginTop: "20px",
      marginBottom: "20px",
      divider: true
    }, {
      name: 'registration',
      icon: "mdi-clipboard-outline",
      label: "Raccolta dati"
    }, {
      name: 'monitor',
      icon: "mdi-checkbox-marked-outline",
      label: "Monitor"
    }, {
      marginTop: "10px",
      marginBottom: "100px",
      divider: true
    }, {
      name: 'settings',
      icon: "mdi-cog-outline",
      label: "Configurazioni"
    }
  ]}
>
  <svelte:fragment slot="inner-menu" let:hamburgerVisible>
    {#if !hamburgerVisible}
      <div
        style:flex="1 1 auto"
        style:margin-right="10px"
      >
        <GlobalSearchTextField
          searcher={search}
          bind:searchDialogOpened={searchDialogOpened}
          on:select={handleSearchSelect}
        ></GlobalSearchTextField>
      </div>
    {:else}
      <div
        class="application-bar-logo-container"
        style:flex="1 1 auto"
      >
        <img
          src={logo}
          alt="application logo"
          class="application-logo"
        />
      </div>
      <GlobalSearchTextField
        searcher={search}
        bind:searchDialogOpened={searchDialogOpened}
        on:select={handleSearchSelect}
      >
        <div
          style:display="flex"
          style:align-items="center"
          style:margin-right="1rem"
          style:color="grey"
          slot="search-button"
          let:toggleSearchDialog
        >
          <svg
            on:click={toggleSearchDialog}
            style:height="1.5rem"
            style:width="1.5rem"
            style:stroke="currentColor"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
            class="search-icon"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
            /></svg
          >
        </div>
      </GlobalSearchTextField>
    {/if}
    <Navigator
      variant="standard"
      items={[
        {
          icon: 'mdi-github',
          name: 'github',
          url: 'https://github.com/likablehair/svelte'
        }, {
          icon: 'mdi-linkedin',
          name: 'linkedin',
          url: 'https://www.linkedin.com/company/lh-s-r-l-likablehair'
        }, {
          icon: 'mdi-instagram',
          name: 'instagram',
          url: 'https://instagram.com/likablehair?igshid=YmMyMTA2M2Y='
        },
      ]}
      textColor="grey"
      hoverTextColor="inherit"
    ></Navigator>
  </svelte:fragment>
  <div class="content-container">
    <div class="content">
      Pagina
    </div>
  </div>
</CollapsibleSideBarLayout>

<style>
  .application-logo {
    height: 50px;
  }

  .application-bar-logo-container {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }


  .content {
    max-width: 1100px;
    width: 100%;
  }
</style>