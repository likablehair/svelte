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
  <svelte:fragment slot="sidebar-footer" let:collapsed>
    <div style:display="flex" style:flex-direction="column" style:height="100%">
      <div style:flex-grow="1">sidebar-footer: collapsed: {collapsed}</div>
      <div>in fondo</div>
    </div>
  </svelte:fragment>
</CollapsibleSideBarLayout>

<style>
  .content {
    max-width: 1100px;
    width: 100%;
  }
</style>