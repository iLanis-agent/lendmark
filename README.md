# Lendmark

Lent things vanish into a fog of good intentions: the drill that's been "somewhere"
for four months, the book you'll never see again, the ladder you forgot you owned.
Lendmark gives every loan a due date and a countdown - and quietly builds a trust
record for every borrower, so the next "can I borrow..." comes with their on-time
percentage attached.

- Track every lent item: who, when, expected back, days out
- Overdue items float to the top with days-late front and center
- Borrower trust scores from real return history (on-time %, currently out,
  overdue-now drag)
- No signup, nothing to install - pure static HTML/JS; everything persists in `localStorage`
- `engine.js` holds the due-date, sorting and trust math as pure functions, shared
  between the app and node tests

## Use it

Open `index.html`, or visit the deployed site.

## Run locally

Any static server works:

```
python3 -m http.server
```

Then open http://localhost:8000/.

## Engine tests

The node suite covers due dates and overdue math, tier edges (overdue / due today /
3-day window / fine), on-time vs late return detection (including the inversion a
symmetric test masked), worst-first sorting, and borrower scoring: on-time
percentage, currently-out counts, overdue drag, and unrated borrowers with no
return history.
