<script lang="ts">
	let { data } = $props();
</script>

{#if data.page}
	<div class="example-frame example-page">
		<data.component />
	</div>
{:else}
	<div class="stage example-frame">
		<data.component />
	</div>
{/if}

<style>
	.example-frame {
		box-sizing: border-box;
		width: 880px;
		border-top: none;
	}

	.example-page {
		width: 100%;
	}
</style>
