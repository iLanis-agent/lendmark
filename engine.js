/* Lendmark engine - pure functions for lent-item tracking and borrower trust. */
(function (root) {
  'use strict';
  var DAY = 86400000;

  function toDate(iso) {
    var d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
    if (isNaN(d.getTime())) throw new Error('bad date: ' + iso);
    return d;
  }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function diffDays(laterISO, earlierISO) {
    return Math.round((toDate(laterISO) - toDate(earlierISO)) / DAY);
  }

  function dueDate(lentISO, expectedDays) {
    return iso(new Date(toDate(lentISO).getTime() + expectedDays * DAY));
  }

  // positive = days overdue; <=0 = days until due
  function daysUntilDue(dueISO, nowISO) { return diffDays(dueISO, nowISO); }

  function tier(daysUntil) {
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 3) return 'due-soon';
    return 'fine';
  }
  var TIER_RANK = { overdue: 0, 'due-soon': 1, fine: 2 };

  // item: {name, borrower, lent (ISO), expectedDays, returned (ISO or null)}
  function status(item, nowISO) {
    if (item.returned) {
      var was = diffDays(item.returned, dueDate(item.lent, item.expectedDays));
      return { tier: 'returned', daysUntil: null, wasLate: was > 0, lateBy: was > 0 ? was : 0, item: item };
    }
    var due = dueDate(item.lent, item.expectedDays);
    var until = daysUntilDue(due, nowISO);
    return { tier: tier(until), due: due, daysUntil: until, daysOut: diffDays(nowISO, item.lent), item: item };
  }

  // open items: most overdue first, then due-soon, then fine (soonest first)
  function sortOpen(items, nowISO) {
    return items.filter(function (i) { return !i.returned; })
      .map(function (i) { return status(i, nowISO); })
      .sort(function (a, b) {
        var r = TIER_RANK[a.tier] - TIER_RANK[b.tier];
        if (r !== 0) return r;
        return a.daysUntil - b.daysUntil;
      });
  }

  // borrower trust from completed returns: on-time % and current count out.
  // score 0-100; no history yet = null (unrated)
  function borrowerScore(borrower, items, nowISO) {
    var mine = items.filter(function (i) { return i.borrower === borrower; });
    var returned = mine.filter(function (i) { return i.returned; });
    var outNow = mine.filter(function (i) { return !i.returned; });
    var overdueNow = outNow.filter(function (i) {
      return status(i, nowISO).tier === 'overdue';
    }).length;
    if (!returned.length && !outNow.length) return { score: null, onTime: null, total: 0, outNow: 0, overdueNow: 0 };
    var onTime = returned.length
      ? returned.filter(function (i) { return !status(i).wasLate; }).length / returned.length
      : 1;
    var score = Math.round(onTime * 100) - overdueNow * 15;
    score = Math.max(0, Math.min(100, score));
    return { score: returned.length ? score : null, onTime: Math.round(onTime * 100), total: returned.length, outNow: outNow.length, overdueNow: overdueNow };
  }

  var api = { dueDate: dueDate, daysUntilDue: daysUntilDue, tier: tier, status: status, sortOpen: sortOpen, borrowerScore: borrowerScore };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Lendmark = api;
})(typeof window !== 'undefined' ? window : this);
