<script lang="ts">
  import '../../../../../app.css'
  import UnstableDividedSideBarLayout from "$lib/components/layouts/UnstableDividedSideBarLayout.svelte";
</script>

<UnstableDividedSideBarLayout
  expandOn="hover"
  options={[
    { label: 'Dashboard', name: 'dashboard', icon: 'mdi-home' },
    { label: 'Portfolio', name: 'portfolio', icon: 'mdi-wallet' },
    { label: 'Market', name: 'market', icon: 'mdi-cloud' },
    { label: 'Wallet', name: 'wallet', icon: 'mdi-newspaper' },
    { label: 'News', name: 'news', icon: 'mdi-store' },
  ]}
></UnstableDividedSideBarLayout>

<style>
</style>