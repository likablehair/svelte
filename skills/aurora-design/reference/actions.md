# Actions and buttons

## Hierarchy of actions

| Role | Component | How many |
|---|---|---|
| Primary: the main thing to do here | `Button` (default `variant="primary"`) | one per view (one per dialog) |
| Secondary: useful alternatives | `Button variant="secondary"` | 1–2 |
| Tertiary: cancel, minor links | `Button buttonType="text" variant="secondary"`, `LinkButton` | as needed |
| Rare or many actions | a "⋯" `Button buttonType="icon"` opening `MenuOrDrawer` + `MenuOrDrawerOptions` | the rest |
| Destructive | `variant="danger"` (button or menu option) | apart from the primary |

`variant="gradient"` is only for the single most important call to action of a page that needs it (an onboarding step, an upgrade), never for routine actions.

## Placement and order

- **Page actions**: in the `actionsSnippet` of `PageHeader`, right side; primary last (rightmost).
- **Dialogs and form footers**: secondary/cancel on the left, primary on the right (`ConfirmOrCancelButtons` and `ConfirmDialog` already do this; in a `Dialog` put the `Button`s in `actionsSnippet` in that order).
- **Toolbar of a table**: page-level buttons in `toolbarSnippet` of `DataTable`; actions on selected rows in `selectionActions` (the floating bar), actions on one row in `actionsSnippet` (always visible by default; `actionsVisibility="hover"` only on desktop-dense tables, touch devices still see them).
- Keep destructive actions away from the primary: at the far left of a footer, at the end of a menu after a divider, or in a "danger zone" section of settings.
- An action is in the same place on every screen of the same kind.

## Labels

- Verb + object, saying what happens: "Save changes", "Create booking", "Send reminder", "Delete 3 clients". Show the count on bulk actions.
- Never "OK", "Submit", "Yes/No", "Click here", and no "→" after the text.
- The result uses the same verb: "Publish" → toast "Published".
- "Delete" for permanent removal, "Remove" when it can be recovered or only leaves a list.
- Icon-only buttons (`buttonType="icon"`) only for universal icons (edit, close, more, search) and always with `aria-label`; prefer text in navigation and for anything not obvious.

## Destructive actions: undo or confirm

- **Recoverable** (archive, remove from a list, a delete the backend can restore): do it at once and show a toast with undo:

```ts
addToast({ title: 'Booking deleted', action: { label: 'Undo', onclick: restore } });
```

- **Irreversible or expensive** (permanent delete, sending messages to clients, bulk changes): confirm with a `ConfirmDialog` that names the thing and the consequence, with specific buttons:
  title "Delete Mario Rossi?", text "His 12 bookings are deleted too. This cannot be undone.", buttons "Keep client" and "Delete client". Never "Are you sure?". Return the request's Promise from `onconfirm`: the dialog shows the spinner, cannot be closed meanwhile, closes when it succeeds and stays open when it fails. `variant="primary"` for confirmations that are not destructive (sending, publishing).

```svelte
<ConfirmDialog
	bind:open
	title="Delete Mario Rossi?"
	description="His 12 bookings are deleted too. This cannot be undone."
	confirmText="Delete client"
	cancelText="Keep client"
	onconfirm={() => deleteClient(client.id)}
/>
```
- Ask before closing a dialog or leaving a page with unsaved changes.

## Async and disabled

- While an action runs: `loading` on the button (it also blocks repeated clicks); in `selectionActions` return a promise from `onclick` and the bar shows the spinner.
- Disabled (`disabled`) only when the reason is obvious or explained: a `Tooltip` or a hint saying why ("Choose a date first"); `disabledInfo` on selection actions. If the user can never use it, hide it instead.
- Read-only is not disabled: show values as text (or `readonly` fields), not as greyed-out controls.
- No permission: explain it ("Only owners can change prices") rather than showing a control that fails.

## Every state of an interactive element

Default, hover, focus (visible, from the library), active, disabled, loading, and where it applies selected, error and success. The library components already have them: do not remove or restyle them.

Never put an action only on hover or only behind a gesture (swipe, long press, drag) without a visible button too.
