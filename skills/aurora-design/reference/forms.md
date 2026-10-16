# Forms

## Fields

- **Every field has a visible `label`.** The placeholder is only an example of the format ("es. 333 123 4567"), never the label: it disappears when typing.
- The right component and input: `SimpleTextField` with the native `type` (`email`, `tel`, `number`, `url`, `password`) and `autocomplete` (`name`, `email`, `tel`, `street-address`…) so phones show the right keyboard and browsers can fill it; `Textarea` for long text (`counter` with `maxlength`, `autoGrow`); `Select` for a few fixed options; `Autocomplete` for many; `RadioGroup` or `ToggleList` for 2–4 visible choices; `Switch` for an immediate on/off setting, `Checkbox` for a choice confirmed by submit; date and time pickers instead of free text.
- **Hints before errors**: a `hint` under a field that is not obvious ("Used for reminders"), and why you ask for anything unusual. Do not repeat the label in the hint.
- **Required vs optional**: mark the minority. If most fields are required, mark the optional ones "(optional)"; otherwise mark the required ones. Use the native `required` so the browser and screen readers know.
- **Smart defaults**: today's date, the current user, the most common choice. Never ask twice for something the app knows.
- Pickers and selects prevent errors better than validation does.

## Validation

- Validate **on blur** and **on submit**, not on every keystroke (exception: things like a password strength meter). Clear the error as soon as the value becomes valid.
- Show the error **under the field**: `state="error"` and the message in `hint`. The component links it to the field for screen readers.
- The message says how to fix it: "Enter an email like name@example.com", not "Invalid input".
- **Never wipe the form on error**; keep every value, also after a server error.
- After a failed submit, move focus to the first invalid field (or, in long forms, to a short summary at the top that lists the errors as links, keeping the messages under the fields too).
- Server-side errors on a field go under that field; general ones in an `AlertBanner variant="error"` above the actions, with what to do next.

## Grouping and length

- Group related fields under a heading (or a `fieldset` with `legend`), at most ~4 fields per group before a visual break. Related short fields can sit side by side (first and last name, start and end time); everything else one per row.
- Order fields as the user thinks of them, not as the database stores them.
- Show only what is needed now; advanced options behind a "More options" disclosure, or only after the choice that makes them relevant.
- Long forms: sections with a title and one line of explanation (`get_pattern form-page`), actions in a sticky footer, and if losing the input would hurt, autosave a draft or warn before leaving.
- Multi-step flows only when steps are really separate: show "Step 2 of 4", allow going back without losing data.

## Actions of a form

- At the end, aligned with the fields: `ConfirmOrCancelButtons` (cancel left, confirm right) or a single primary `Button type="submit"`.
- The submit label says what happens: "Create booking", "Save changes". While saving: `loading`.
- Disable submit only when the reason is visible; otherwise let the user submit and show the errors.
- After success: a toast ("Booking created") and go where the user expects (the new record, or back to the list), or stay with the form reset if they usually add several in a row.

## Forms in a Dialog

The dialog is unmounted when closed: keep the draft in the page. Put the `<form id="…">` in the body and the buttons in `actionsSnippet`, with `form="…"` on the submit `Button` (`get_example Dialog`). A dialog form should be short (≤ ~6 fields); longer forms deserve a page or a `Drawer`.

## Editing in place

For one value at a time (a status, a note, a toggle in a list) inline editing is faster than a form: change it where it is, save at once, show the result, offer undo on failure.
