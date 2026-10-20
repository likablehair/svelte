<script lang="ts">
	let { size = 34 }: { size?: number } = $props();

	const id = $props.id();
	const left = '14,86 34,86 60,14 40,14';
	const right = '66,86 86,86 60,14 40,14';
</script>

<svg class="brand-mark" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
	<defs>
		<linearGradient id="{id}-left" x1="24" y1="86" x2="50" y2="14" gradientUnits="userSpaceOnUse">
			<stop class="left-0" />
			<stop class="left-1" offset="1" />
		</linearGradient>
		<linearGradient id="{id}-right" x1="76" y1="86" x2="50" y2="14" gradientUnits="userSpaceOnUse">
			<stop class="right-0" />
			<stop class="right-1" offset="1" />
		</linearGradient>
		<linearGradient id="{id}-fold" x1="50" y1="14" x2="50" y2="42" gradientUnits="userSpaceOnUse">
			<stop class="fold-0" />
			<stop class="fold-1" offset="1" />
		</linearGradient>
		<linearGradient id="{id}-shadow" x1="55" y1="27.9" x2="67" y2="32.2" gradientUnits="userSpaceOnUse">
			<stop class="shadow-0" />
			<stop class="shadow-1" offset="1" />
		</linearGradient>
		<clipPath id="{id}-clip"><polygon points={left} /></clipPath>
	</defs>
	<polygon points={left} fill="url(#{id}-left)" />
	<polygon points={right} fill="url(#{id}-right)" />
	<polygon points={right} fill="url(#{id}-shadow)" />
	<polygon points={right} fill="url(#{id}-fold)" clip-path="url(#{id}-clip)" />
</svg>

<style>
	.brand-mark {
		flex-shrink: 0;
		display: block;
	}

	.left-0 {
		stop-color: light-dark(#1748c9, #1f4fe0);
	}

	.left-1 {
		stop-color: light-dark(#2f6bff, #3d8bff);
	}

	.right-0 {
		stop-color: light-dark(#0a7fbf, #22a8f5);
	}

	.right-1 {
		stop-color: light-dark(#21b0ec, #6fdcff);
	}

	.fold-0 {
		stop-color: light-dark(#0c2a7a, #ffffff);
	}

	.fold-1 {
		stop-color: light-dark(#163fa8, #c9efff);
	}

	.shadow-0 {
		stop-color: light-dark(rgb(4 16 46 / 0.35), rgb(4 16 46 / 0.55));
	}

	.shadow-1 {
		stop-color: rgb(4 16 46 / 0);
	}
</style>
