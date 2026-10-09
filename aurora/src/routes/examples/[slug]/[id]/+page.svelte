<script lang="ts">
	let { data } = $props();
</script>

<div class="stage example-frame">
	<data.component />
</div>

<style>
	.example-frame {
		box-sizing: border-box;
		width: 880px;
		border-top: none;
	}
</style>
