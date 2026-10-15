# States and feedback

Every screen and every component that loads or changes data has these states. Write them all.

## Loading

- Within ~100ms of a click something must change: the button `loading`, a pressed state, a progress bar.
- Content that loads: placeholders with the shape of the content (`Skeleton` with `rect`, `circle`, `text`), or the component's own loading state (`Table`/`DataTable` show a progress bar or placeholder rows; charts and pickers handle theirs). Avoid a big spinner in the middle of the page.
- Do not flash a loader for work under ~300ms; keep the old content until the new one is ready when possible.
- Long operations: say what is happening ("Importing 1 240 clients…"), show progress (`ProgressBar`, or a toast with `loading`/`progress`), and allow cancel when it makes sense.
- Reserve the space of async content so the page does not jump.

## Empty

An empty state is a chance to explain, never just "No data". Use `NoData` (`size="md"` for pages and panels, `size="sm"` in tables and cards) with:
- **First use**: what will appear here and why it is useful, plus the action that fills it ("No clients yet. Add the first client to start booking." + "Add client").
- **No results** after search or filters: say so and offer "Clear filters" or another search.
- **Cleared by the user** (inbox zero, all done): a light, positive message.
- **No permission**: why, and whom to ask.

`DataTable` shows `NoData` itself; customize it with `noDataSnippet` when the page has a better message or an action.

## Error

- Never fail silently; never show raw codes or stack traces.
- Say what happened and what to do, with a way out: retry, go back, contact. `DataTable` gives `errorSnippet` with `retry`.
- Put the error where the problem is: under a field, inside the component that failed, in an `AlertBanner` for the page. One failed widget must not blank the whole page.
- By cause: not logged in → back to login; no permission → explain; not found → a not-found state with a link back; too many requests or server down → "Try again in a moment" with retry; offline → say so and keep the user's input.

## Success

- Confirm what happened, briefly, with the same verb as the action: a toast `addSuccessToast('Settings saved')`, or the visible change itself (the new row appears, the status chip changes) when it is obvious.
- Say what comes next when it is not obvious ("Booking created. The client will get a reminder the day before.").

## Toasts or inline?

| Use | When |
|---|---|
| Toast (`addSuccessToast`, `addInfoToast`…) | short confirmations, background events, undo (`action`) |
| Inline (`hint`, `AlertBanner`, component error) | errors the user must fix, information needed to continue |
| `Dialog` | a decision is required before going on |

Toasts close by themselves, never steal focus, and are announced politely by the `Toaster` (mounted once in the root layout). Do not use a toast for an error that needs action: it disappears.

## Optimistic updates

For low-risk, frequent actions (toggle, status change, reorder) update the UI at once and roll back with an error toast if the server fails. Never for payments, deletes without undo or anything with side effects for others.

## Disabled, read-only, no permission

Disabled controls say why (tooltip or hint). Read-only data is shown as text, not as disabled fields. Missing permission is explained, not hidden behind controls that fail.
