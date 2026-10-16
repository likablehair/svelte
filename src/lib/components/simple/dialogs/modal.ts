import type { Attachment } from 'svelte/attachments';

export const CLOSE_ICON =
	'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z';

type ModalOptions = {
	persistent: () => boolean;
	dismiss: (event: Event) => void;
};

export function modal({ persistent, dismiss }: ModalOptions): Attachment<HTMLDialogElement> {
	return (dialog) => {
		const previous = document.activeElement;
		let pressedOutside = false;

		const isBackdrop = (target: EventTarget | null) =>
			target === dialog ||
			(target instanceof HTMLElement &&
				target.parentElement === dialog &&
				target.hasAttribute('data-backdrop'));
		const hasOpenPopover = () =>
			dialog.querySelector(':popover-open:not(.aurora-toaster)') !== null;
		const request = (event: Event) => {
			if (!persistent()) dismiss(event);
		};

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || event.defaultPrevented || hasOpenPopover()) return;
			event.preventDefault();
			request(event);
		};
		const onCancel = (event: Event) => {
			event.preventDefault();
			request(event);
		};
		const onPointerDown = (event: PointerEvent) => {
			pressedOutside = isBackdrop(event.target) && !hasOpenPopover();
		};
		const onClick = (event: MouseEvent) => {
			if (pressedOutside && isBackdrop(event.target)) request(event);
			pressedOutside = false;
		};
		const onSubmit = (event: SubmitEvent) => {
			const form = event.target as HTMLFormElement;
			const method = event.submitter?.getAttribute('formmethod') ?? form.getAttribute('method');
			if (method?.toLowerCase() !== 'dialog' || form.closest('dialog') !== dialog) return;
			event.preventDefault();
			dismiss(event);
		};

		dialog.addEventListener('keydown', onKeyDown);
		dialog.addEventListener('cancel', onCancel);
		dialog.addEventListener('close', dismiss);
		dialog.addEventListener('pointerdown', onPointerDown);
		dialog.addEventListener('click', onClick);
		dialog.addEventListener('submit', onSubmit);
		dialog.showModal();

		return () => {
			dialog.removeEventListener('keydown', onKeyDown);
			dialog.removeEventListener('cancel', onCancel);
			dialog.removeEventListener('close', dismiss);
			dialog.removeEventListener('pointerdown', onPointerDown);
			dialog.removeEventListener('click', onClick);
			dialog.removeEventListener('submit', onSubmit);
			const focused = document.activeElement;
			if (previous instanceof HTMLElement && (!focused || focused === document.body))
				previous.focus();
		};
	};
}

export function leave(node: HTMLElement) {
	node.inert = true;
	node.dataset.closing = '';
	const raw = getComputedStyle(node).getPropertyValue('--_duration').trim();
	const value = parseFloat(raw) || 0;
	return { duration: raw.endsWith('ms') ? value : value * 1000 };
}
