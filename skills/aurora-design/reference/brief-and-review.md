# Brief and review

## Before designing: the brief

Answer these in a few lines (in your head or in the reply) before writing code:

1. **Who and when**: role (owner, receptionist, stylist, accountant), how often (many times a day or once a month), device (desk, phone at the counter), state of mind (in a hurry with a client in front, focused at month end).
2. **The one main task** of the screen, and what success looks like ("the booking is saved and visible in the agenda").
3. **The data**: what it shows or collects, realistic sizes (0, 1, 5, 500, 10 000 rows; names of 3 and of 60 characters; amounts in the millions), what comes from the server and how slowly.
4. **The states**: first use (empty), normal, loading, error, no results after a filter, no permission, read-only, offline or slow.
5. **The flow**: where the user comes from, where they go after, what they can undo.
6. **Phone**: what changes, what must stay one tap away.
7. **What it is not**: features that belong elsewhere, decoration that does not help.

Then write the brief: the primary action; what gets emphasis and in which order the eye moves; every state above; the interaction (what each click does and what feedback it gives); the texts (labels, empty and error messages).

Look at the app before inventing: a similar screen already there decides the shape (dialog or page, inline edit or form, save button or autosave, optimistic or not) and the words. Consistency beats a local improvement.

## Before finishing: the review

### 1. Two quick tests
- **Squint test**: blur your eyes (or look at a small screenshot). Can you still see the most important element, the second one and the groups?
- **2-second test**: is the primary action obvious at first glance?

### 2. Heuristics (score each 0–4, be strict)

| # | Heuristic | Questions |
|---|---|---|
| 1 | Status visible | Does the user see what is happening (loading, saved, selected, filtered)? |
| 2 | Real-world language | Are the words those of the user's job, not of the database? |
| 3 | Control and freedom | Can they cancel, go back, undo? Does Escape close? |
| 4 | Consistency | Same component, word and position for the same thing as elsewhere in the app? |
| 5 | Error prevention | Defaults, constraints, pickers instead of free text, confirmations only where needed? |
| 6 | Recognition over recall | Is what they need visible, or must they remember it from another screen? |
| 7 | Efficiency | Bulk actions, keyboard, few clicks for the frequent task? |
| 8 | Minimalism | Does every element serve the task? Anything to remove? |
| 9 | Error recovery | Do errors say what happened and how to fix it, with a retry? |
| 10 | Help | Is the hint there where a field is not obvious? |

Total out of 40: 36+ ship, 28–35 good, 20–27 fix before shipping, under 20 rethink. Fix every heuristic under 3.

### 3. Cognitive load (count the failures; 0–1 good, 2–3 fix, 4+ redesign)
One focus per screen · chunks of at most ~4 items · related things grouped · clear hierarchy · one decision at a time · at most ~4 options visible at a decision point · nothing to remember across screens · advanced things revealed only when needed.

### 4. Hardening with real data
Try (or reason through): a name of 60+ characters and one of 1 character, accents and emoji, an empty list, 1 000+ rows, a select with 50+ options, amounts over a million, a 30% longer translation, the server answering 400/401/403/404/500 or never, a slow network, the submit pressed ten times.

### 5. Final checklist
- [ ] Only library components and tokens; no hex/rgb colors, no new shadows, radii or z-index values (`validate_usage` clean).
- [ ] One primary action; button labels are verbs; destructive actions apart and explicit.
- [ ] Every state written: loading, empty, error with retry, success feedback, disabled with a reason.
- [ ] Every field labelled; errors under the field; input kept on error.
- [ ] Works at 390px and 1280px, no horizontal page scroll, touch targets fine.
- [ ] Keyboard only: reachable, visible focus, Escape closes, order follows the screen.
- [ ] Light and dark mode both readable; no information by color only.
- [ ] Same words as the rest of the app, in the app's language.
- [ ] `svelte-check` clean, no console errors.

Tag what you could not fix by severity when you report: **P0** blocks the task, **P1** major or an accessibility failure (would someone call support?), **P2** minor with a workaround, **P3** polish.
