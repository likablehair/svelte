<script lang="ts">
  import GlobalSearchTextField from "$lib/components/composed/search/GlobalSearchTextField.svelte";
  import StableDividedSideBarLayout from "$lib/components/layouts/StableDividedSideBarLayout.svelte";
  import SidebarMenuList from "$lib/components/simple/lists/SidebarMenuList.svelte";
  import Navigator from "$lib/components/simple/navigation/Navigator.svelte";
  import logo from './logo.svg'
  import "../../app.css";
  import colors from  "./stores/colors";

  let searchDialogOpened: boolean = false

  function search(params: { searchText: string }): Promise<{ title: string, name: string, subtitle: string }[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { title: 'Ciao', name: 'ciao', subtitle: 'sottotitolo di ciao' },
          { title: 'Come', name: 'come', subtitle: 'sottotitolo di come' },
          { title: 'Stai', name: 'stai', subtitle: 'sottotitolo di stai' }
        ])
      }, 2000);
    })
  }
</script>

<StableDividedSideBarLayout>
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
              url: '/docs/components/simple-components',
              children: [
                {
                  title: 'Button',
                  name: 'button',
                  url: '/docs/components/simple-components/button',
                }, {
                  title: 'Card',
                  name: 'card',
                  url: '/docs/components/simple-components/card',
                },  {
                  title: 'Gesture',
                  name: 'gesture',
                  url: '/docs/components/simple-components/gesture',
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
          on:select={() => searchDialogOpened = false}
        ></GlobalSearchTextField>
      </div>
    {:else}
      <div
        class="application-bar-logo-container"
      >
        <img 
          src={logo} 
          alt="application logo"
          class="application-logo"
        />
      </div>
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

  <slot></slot>
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
</style>