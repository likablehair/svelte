<script lang="ts">
  import '../../../../../app.css'
  import CollapsibleSideBarLayout from '$lib/components/layouts/CollapsibleSideBarLayout.svelte';
</script>

<CollapsibleSideBarLayout>
  {#snippet sidebarFooterSnippet({ collapsed, drawer })}
    Footer
  {/snippet}
  {#snippet logoSnippet({ collapsed, mAndDown })}
    Logo
  {/snippet}
  Content
</CollapsibleSideBarLayout>

<style>
</style>