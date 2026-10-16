<!-- @component Upload progress
`fileStatus` tells each row how its upload is going: a progress bar while `uploading` (with `progress` from 0 to 100), a check when `done`, an alert and the message on `error`. Here every added file is "uploaded" with a timer; a `SvelteMap` keeps the states reactive. Removing a file is reported by `onchange` as `removed`, so the app can stop its upload. -->
<script lang="ts">
	import { FileInputList, type FileStatus } from '#lib';
	import { SvelteMap } from 'svelte/reactivity';

	const invoice = new File([new Uint8Array(284_000)], 'invoice_2026_09.pdf', {
		type: 'application/pdf',
		lastModified: 0
	});
	const photo = new File([new Uint8Array(2_400_000)], 'before_after_color.jpg', { lastModified: 0 });
	const archive = new File([new Uint8Array(31_000_000)], 'salon_photos_2025.zip', {
		type: 'application/zip',
		lastModified: 0
	});

	let files: File[] = $state([invoice, photo, archive]);
	const statuses = new SvelteMap<File, FileStatus>([
		[invoice, { state: 'done' }],
		[photo, { state: 'uploading', progress: 64 }],
		[archive, { state: 'error', message: 'larger than the 25 MB limit' }]
	]);

	function upload(file: File) {
		let progress = 0;
		statuses.set(file, { state: 'uploading', progress });
		const timer = setInterval(() => {
			if (!statuses.has(file)) return clearInterval(timer);
			progress = Math.min(100, progress + 20);
			statuses.set(file, progress < 100 ? { state: 'uploading', progress } : { state: 'done' });
			if (progress === 100) clearInterval(timer);
		}, 400);
	}
</script>

<div class="demo">
	<FileInputList
		label="Documents"
		bind:files
		fileStatus={(file) => statuses.get(file)}
		onchange={({ added, removed }) => {
			added.forEach(upload);
			removed.forEach((file) => statuses.delete(file));
		}}
	/>
</div>

<style>
	.demo {
		width: 100%;
		max-width: 420px;
	}
</style>
