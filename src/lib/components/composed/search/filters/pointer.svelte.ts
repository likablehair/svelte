export function pointerPress() {
	let down = false;

	$effect(() => {
		const press = () => (down = true);
		const release = () => (down = false);
		window.addEventListener('pointerdown', press, true);
		window.addEventListener('pointerup', release, true);
		window.addEventListener('pointercancel', release, true);
		return () => {
			window.removeEventListener('pointerdown', press, true);
			window.removeEventListener('pointerup', release, true);
			window.removeEventListener('pointercancel', release, true);
		};
	});

	return {
		get down() {
			return down;
		},
		afterRelease(callback: () => void) {
			const done = new AbortController();
			const later = () => {
				done.abort();
				setTimeout(callback);
			};
			window.addEventListener('pointerup', later, { capture: true, signal: done.signal });
			window.addEventListener('pointercancel', later, { capture: true, signal: done.signal });
		}
	};
}
