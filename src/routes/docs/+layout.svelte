<script lang="ts">
  import GlobalSearchTextField from "$lib/components/composed/search/GlobalSearchTextField.svelte";
  import StableDividedSideBarLayout from "$lib/components/layouts/StableDividedSideBarLayout.svelte";
  import SidebarMenuList from "$lib/components/simple/lists/SidebarMenuList.svelte";
  import Navigator from "$lib/components/simple/navigation/Navigator.svelte";
  import logo from './logo.svg'
  import "../../app.css";
  import colors from  "./stores/colors";
  import { beforeNavigate, goto } from "$app/navigation";

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

<StableDividedSideBarLayout
  bind:drawerOpened={drawerOpened}
>
  <div slot="sidebar" let:hamburgerVisible>
    {#if !hamburgerVisible}
      <div
        class="application-logo-container"
      >
        <img 
          src={logo} 
          alt="application logo"
          class="application-logo"
        />
      </div>
    {/if}
    <SidebarMenuList 
      menus={[
        {
          title: 'Introduction',
          name: 'introduction',
          url: '/docs/introduction'
        }, {
          title: 'Quickstart',
          name: 'quickstart',
          url: '/docs/quickstart'
        }, {
          title: 'Components',
          name: 'components',
          url: '/docs/components',
          children: [
            {
              title: 'Simple components',
              name: 'simpleComponents',
              disabled: true,
              url: '/docs/components/simple-components',
              children: [
                {
                  title: 'Button',
                  name: 'button',
                  url: '/docs/components/simple-components/Button',
                }, {
                  title: 'Card',
                  name: 'card',
                  url: '/docs/components/simple-components/Card',
                },  {
                  title: 'Gesture',
                  name: 'gesture',
                  url: '/docs/components/simple-components/Gesture',
                },
              ]
            }, {
              title: 'Composed components',
              name: 'composedComponents',
              url: '/docs/components/composed-components',
            }, {
              title: 'Layouts',
              name: 'layouts',
              url: '/docs/components/layouts',
            },
          ]
        }
      ]}
      bookmarkColor={$colors.primary}
      selectedTextColor={$colors.primary}
      autoDetectUrl
    ></SidebarMenuList>
  </div>
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
      <slot></slot>
    </div>
  </div>
</StableDividedSideBarLayout>

<style>
  .application-logo {
    height: 50px;
  }

  .application-logo-container {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .application-bar-logo-container {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }

  .content-container {
    display: flex;
    justify-content: center;
  }

  .content {
    max-width: 1100px;
    width: 100%;
  }
</style>