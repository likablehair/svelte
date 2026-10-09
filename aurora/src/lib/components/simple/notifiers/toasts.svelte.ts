import type { Snippet } from 'svelte';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

/** Why a toast closed: its time ran out, the user closed it, the user clicked its action, or `removeToast` / the limit removed it. */
export type ToastCloseReason = 'timeout' | 'dismiss' | 'action' | 'remove';

export type ToastOptions = {
	/** Color and default icon. Default `info`. */
	variant?: ToastVariant;
	/** Bold first line. */
	title?: string;
	/** Text under the title. */
	description?: string;
	/** SVG path of the icon, instead of the default one of the variant. An empty string removes it. */
	icon?: string;
	/** Milliseconds before the toast closes by itself; `0` keeps it open. Default 5000, or `0` while `loading`. */
	duration?: number;
	/** Shows the close button. Default `true`. */
	closable?: boolean;
	/** Button on the right. A click closes the toast, unless `onclick` calls `event.preventDefault()`. */
	action?: { label: string; onclick?: (event: MouseEvent) => void };
	/** Shows a spinner and a sliding bar, for work in progress. Update the toast when it ends. */
	loading?: boolean;
	/** Shows a progress bar at this percentage (0–100). */
	progress?: number;
	/** Called when the toast closes, with the reason. */
	onclose?: (reason: ToastCloseReason) => void;
};

export type Toast = ToastOptions & { id: number; variant: ToastVariant };

export type ToasterConfig = {
	position: 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';
	limit: number;
	closeLabel: string;
	label: string;
	className?: string;
	toastSnippet?: Snippet<[{ toast: Toast; close: () => void }]>;
};

const DEFAULT_DURATION = 5000;

export const toaster = $state({
	items: [] as Toast[],
	outlets: [] as symbol[],
	config: {
		position: 'bottom-end',
		limit: 5,
		closeLabel: 'Dismiss',
		label: 'Notifications'
	} as ToasterConfig
});

let nextId = 1;
const timers = new Map<
	number,
	{ timer?: ReturnType<typeof setTimeout>; remaining: number; startedAt: number }
>();
const pauses = new Set<string>();

function find(id: number) {
	return toaster.items.find((toast) => toast.id === id);
}

function lifetime(toast: Toast) {
	return toast.duration ?? (toast.loading ? 0 : DEFAULT_DURATION);
}

function start(id: number) {
	const entry = timers.get(id);
	if (!entry || entry.timer) return;
	entry.startedAt = Date.now();
	entry.timer = setTimeout(() => close(id, 'timeout'), entry.remaining);
}

function arm(id: number) {
	clearTimeout(timers.get(id)?.timer);
	timers.delete(id);
	const toast = find(id);
	const duration = toast ? lifetime(toast) : 0;
	if (duration <= 0) return;
	timers.set(id, { remaining: duration, startedAt: 0 });
	if (!pauses.size) start(id);
}

function close(id: number, reason: ToastCloseReason) {
	const index = toaster.items.findIndex((toast) => toast.id === id);
	if (index === -1) return;
	const [toast] = toaster.items.splice(index, 1);
	clearTimeout(timers.get(id)?.timer);
	timers.delete(id);
	toast.onclose?.(reason);
}

function enforceLimit() {
	const overflow = toaster.items.length - toaster.config.limit;
	if (overflow <= 0) return;
	const removable = toaster.items.filter((toast) => lifetime(toast) > 0).slice(0, overflow);
	for (const toast of removable) close(toast.id, 'remove');
}

export function closeToast(id: number, reason: ToastCloseReason) {
	close(id, reason);
}

export function pauseToasts(reason: string) {
	if (pauses.has(reason)) return;
	pauses.add(reason);
	if (pauses.size > 1) return;
	for (const entry of timers.values()) {
		if (!entry.timer) continue;
		clearTimeout(entry.timer);
		entry.timer = undefined;
		entry.remaining -= Date.now() - entry.startedAt;
	}
}

export function resumeToasts(reason: string) {
	if (!pauses.delete(reason) || pauses.size) return;
	for (const id of timers.keys()) start(id);
}

function normalize(options: ToastOptions | string): ToastOptions {
	return typeof options === 'string' ? { title: options } : options;
}

/**
 * Shows a toast and returns its id. A string is the title. An identical toast (same variant, title and description) that is still visible restarts its timer instead of showing twice. Does nothing on the server.
 */
export function addToast(options: ToastOptions | string): number {
	if (typeof window === 'undefined') return 0;
	const toast = normalize(options);
	const variant = toast.variant ?? 'info';
	if (!toast.loading && toast.progress === undefined) {
		const same = toaster.items.find(
			(item) =>
				item.variant === variant &&
				item.title === toast.title &&
				item.description === toast.description &&
				!item.loading &&
				item.progress === undefined
		);
		if (same) {
			arm(same.id);
			return same.id;
		}
	}
	const id = nextId++;
	toaster.items.push({ ...toast, variant, id });
	arm(id);
	enforceLimit();
	return id;
}

/** Shows a success toast and returns its id. A string is the title. */
export function addSuccessToast(options: Omit<ToastOptions, 'variant'> | string): number {
	return addToast({ ...normalize(options), variant: 'success' });
}

/** Shows an error toast and returns its id. A string is the title. */
export function addErrorToast(options: Omit<ToastOptions, 'variant'> | string): number {
	return addToast({ ...normalize(options), variant: 'error' });
}

/** Shows a warning toast and returns its id. A string is the title. */
export function addWarningToast(options: Omit<ToastOptions, 'variant'> | string): number {
	return addToast({ ...normalize(options), variant: 'warning' });
}

/** Shows an info toast and returns its id. A string is the title. */
export function addInfoToast(options: Omit<ToastOptions, 'variant'> | string): number {
	return addToast({ ...normalize(options), variant: 'info' });
}

/**
 * Changes a visible toast, for example to turn a `loading` toast into a success with a title and a `duration`. Changing `duration` or `loading` restarts its timer.
 */
export function updateToast(id: number, patch: ToastOptions) {
	const toast = find(id);
	if (!toast) return;
	const before = lifetime(toast);
	Object.assign(toast, patch);
	if ('duration' in patch || 'loading' in patch || lifetime(toast) !== before) arm(id);
}

/** Closes a toast. Its `onclose` receives `'remove'`. */
export function removeToast(id: number) {
	close(id, 'remove');
}
