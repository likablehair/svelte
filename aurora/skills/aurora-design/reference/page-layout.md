# Page layout

## Structure

A page inside the app shell is usually:

1. **Header**: title (`h1` in `--global-font-family-display`), one line of description in `--global-color-text-2`, the main action on the right (`Button`, at most one primary per page; the others `variant="secondary"` or in a menu).
2. **Attention** (optional): an `AlertBanner` for what the user must act on.
3. **Content**: one main component (a `DataTable`, a form, a grid of cards), or sections switched by a `TabSwitcher`.

The page container is a grid with `gap: 1.25rem`–`1.5rem` and `padding: 1.5rem` (less on phones).

## Cards and sections

There is no card component: a card is an element with the surface tokens.

```css
.card {
	padding: 1.25rem;
	border: var(--global-border-width) solid var(--global-color-border);
	border-radius: var(--global-radius-lg);
	background: var(--global-color-surface);
	box-shadow: var(--global-shadow-sm);
}
```

Section titles inside cards are small (`0.85rem`–`0.95rem`, `--global-color-text` or `-text-2`); facts are a `<dl>` grid with `dt` in `--global-color-text-3`.

## Grids and responsive

- Card grids: `grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr))`; indicators `min(100%, 9rem)`. They reflow without media queries.
- Two-column forms (explanation left, fields right) become one column under 640px.
- Components already adapt: `DataTable` turns rows into cards under 640px of its own width, `MenuOrDrawer` and the date fields open a bottom sheet on phones, `SidebarLayout` moves the sidebar into a drawer under 1024px. Do not rebuild these behaviours.
- The library breakpoints are exported (`breakpoints`, `MediaQuery`) when the page itself needs them.

## Forms

- Fields stacked in a grid with `gap: 1rem`; related short fields side by side.
- Show errors after the first submit or on blur, with `state="error"` and the message in `hint`.
- Long forms: sections with a title and one line of explanation; the actions in a sticky footer (`position: sticky; bottom: 0`) with `ConfirmOrCancelButtons`.
- In a `Dialog`: the form in the body with an `id`, the buttons in `actionsSnippet`, the submit button with `form="<id>"`.
