import type { LocalMigration } from '../../types.js';

const functions = ['addToast', 'addSuccessToast', 'addErrorToast', 'addWarningToast', 'addInfoToast'];

export default {
	from: 'Toaster',
	to: 'Toaster',
	files: ['Toaster.svelte'],
	contains: ['createToaster'],
	summary: 'The local melt-ui `Toaster` copy becomes `Toaster` of the library, and the toast functions are imported from the library.',
	exports: [...functions, 'removeToast'].map((name) => ({ from: name, to: name })),
	calls: {
		functions,
		unwrap: 'data',
		keys: [
			{ from: 'closeDelay', to: 'duration' },
			{ from: 'showLoading', to: 'loading' },
			{ from: 'color', to: 'variant' },
			{ from: 'action.handler', to: 'action.onclick' },
			{ from: 'action.urlToPreload', to: 'action.href' }
		],
		values: [
			{
				key: 'color',
				values: {
					'#0CF574': 'success',
					'#FFC857': 'warning',
					'#0000ff': 'info',
					info: 'info',
					green: 'success',
					blue: 'info',
					gray: 'info',
					'': 'info'
				}
			}
		],
		drop: ['action.usePreloadData'],
		note: 'The options go directly to the function: `duration` (ms, `0` keeps the toast open; default 5000) replaces `closeDelay`, `loading` replaces `showLoading`, `action.onclick` replaces `action.handler`, `action.href` replaces `action.urlToPreload`; the color comes from the function or `variant`.'
	},
	manual: [
		{
			id: 'toaster-id',
			summary: 'The `add*` functions return the id of the toast, a number, instead of the melt-ui toast object.',
			action:
				'Replace `addXToast(...).id` with the returned value (`const id = addSuccessToast(...)`, then `removeToast(id)`), and types such as `ReturnType<typeof addSuccessToast>` or `Toast` from `@melt-ui/svelte` with `number`. A loading toast can also become the result with `updateToast(id, { variant: "success", title, loading: false })`.'
		},
		{
			id: 'toaster-delays',
			summary:
				'Each copy had its own delays (3000 ms by default, some ignored `closeDelay`, some turned `0` into 3000); the library uses `duration` as given, 5000 ms by default.',
			action: 'Nothing to do unless a page relied on the old timing: toasts that passed `closeDelay` and were ignored now honour it.'
		},
		{
			id: 'toaster-mount',
			summary: 'The Toaster must be mounted once, in the root layout, to show the toasts of every page.',
			action:
				'If the app mounts `<Toaster />` in a nested layout (for example `(main)/+layout.svelte`), move it to `src/routes/+layout.svelte`.',
			scope: 'app'
		}
	]
} satisfies LocalMigration;
