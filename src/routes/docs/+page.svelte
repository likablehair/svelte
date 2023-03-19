<script lang="ts">
  import GlobalSearchTextField from "$lib/components/composed/search/GlobalSearchTextField.svelte";
  import StableDividedSideBarLayout from "$lib/components/layouts/StableDividedSideBarLayout.svelte";
  import Navigator from "$lib/components/simple/navigation/Navigator.svelte";
</script>

<StableDividedSideBarLayout>
  <div slot="sidebar">ciao sono una sidebar</div>
  <svelte:fragment slot="inner-menu">
    <div
      style:flex="1 1 auto"
    >
      <GlobalSearchTextField></GlobalSearchTextField>
    </div>
    <Navigator
      variant="standard"
      items={[
        { title: 'API', name: 'api' },
        { title: 'Components', name: 'components' }
      ]}
      textColor="grey"
      hoverTextColor="inherit"
    ></Navigator>
  </svelte:fragment>

  {#each Array(20) as _, i}
    <p>
      Est nulla commodo ullamco non. Irure et pariatur cillum mollit laborum non ea non adipisicing eu sit qui. Nulla nisi enim esse cupidatat do commodo aliqua aute et nisi. Mollit occaecat aliqua cillum veniam minim minim excepteur laboris. Deserunt laboris reprehenderit ea dolor occaecat laboris ut aliqua. Dolor irure magna sit incididunt non non sint officia et anim voluptate velit dolore duis. Aliquip officia culpa ad dolore commodo culpa dolore exercitation do elit deserunt esse amet velit.
    </p>
  {/each}
</StableDividedSideBarLayout>