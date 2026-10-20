import type { Attachment } from 'svelte/attachments';

type SheetDragOptions = {
	persistent: () => boolean;
	dismiss: (event: Event) => void;
};

const ZONE = '.aurora-drawer-handle, .aurora-drawer-header';
const INTERACTIVE =
	'a[href], button, input, select, textarea, label, summary, [contenteditable], [tabindex], [role="button"], [role="link"]';
const START_DISTANCE = 4;
const MIN_DISTANCE = 48;
const MAX_DISTANCE = 160;
const FLICK_SPEED = 0.5;
const FLICK_DISTANCE = 24;
const SPEED_WINDOW = 100;

function inZone(panel: HTMLElement, target: EventTarget | null) {
	if (!(target instanceof Element)) return false;
	const zone = target.closest(ZONE);
	if (!zone || zone.closest('.aurora-drawer-panel') !== panel) return false;
	const interactive = target.closest(INTERACTIVE);
	return !interactive || !zone.contains(interactive);
}

export function sheetDrag({ persistent, dismiss }: SheetDragOptions): Attachment<HTMLElement> {
	return (panel) => {
		let stop: (() => void) | undefined;

		const onPointerDown = (down: PointerEvent) => {
			if (stop || !down.isPrimary || down.button !== 0 || !inZone(panel, down.target)) return;
			const root = panel.parentElement!;
			let dragging = false;
			let offset = 0;
			let last = { y: down.clientY, time: down.timeStamp, speed: 0 };

			const onMove = (event: PointerEvent) => {
				if (event.pointerId !== down.pointerId) return;
				const distance = event.clientY - down.clientY;
				if (!dragging) {
					if (Math.abs(distance) < START_DISTANCE) return;
					dragging = true;
					root.dataset.dragging = '';
					getSelection()?.removeAllRanges();
				}
				const elapsed = event.timeStamp - last.time;
				if (elapsed > 0)
					last = { y: event.clientY, time: event.timeStamp, speed: (event.clientY - last.y) / elapsed };
				offset = distance <= 0 ? 0 : persistent() ? distance / 4 : distance;
				panel.style.translate = `0 ${offset}px`;
			};

			const onUp = (event: PointerEvent) => {
				if (event.pointerId !== down.pointerId) return;
				const moved = dragging;
				stop?.();
				if (!moved) return;
				const speed = event.timeStamp - last.time < SPEED_WINDOW ? last.speed : 0;
				const distance = Math.min(Math.max(panel.offsetHeight / 4, MIN_DISTANCE), MAX_DISTANCE);
				const far = offset > distance || (offset > FLICK_DISTANCE && speed > FLICK_SPEED);
				if (event.type === 'pointerup' && far && !persistent()) dismiss(event);
				else panel.style.translate = '';
			};

			stop = () => {
				window.removeEventListener('pointermove', onMove);
				window.removeEventListener('pointerup', onUp);
				window.removeEventListener('pointercancel', onUp);
				delete root.dataset.dragging;
				stop = undefined;
			};
			window.addEventListener('pointermove', onMove);
			window.addEventListener('pointerup', onUp);
			window.addEventListener('pointercancel', onUp);
		};

		panel.addEventListener('pointerdown', onPointerDown);
		return () => {
			panel.removeEventListener('pointerdown', onPointerDown);
			stop?.();
		};
	};
}
