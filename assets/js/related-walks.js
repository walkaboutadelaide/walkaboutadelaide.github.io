/* Related Walks — cookie/localStorage personalisation layer.
 *
 * The server already rendered a broad, metadata-scored set of suggested walks
 * (crawlable static HTML — that is what builds the SEO authority network).
 * This script only RE-ORDERS / re-selects those suggestions for the human
 * visitor based on an interest profile learned from the pages they view.
 * It never removes the server links from the DOM before crawlers see them.
 */
(function () {
  'use strict';

  var KEY = 'wa_profile_v1';
  var MAX_AGE_DAYS = 90;

  function loadProfile() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      var p = JSON.parse(raw);
      if (!p || !p.ts) return blank();
      var ageDays = (Date.now() - p.ts) / 86400000;
      if (ageDays > MAX_AGE_DAYS) return blank();
      return p;
    } catch (e) {
      return blank();
    }
  }

  function blank() {
    return { ts: Date.now(), visits: 0, region: {}, trail: {}, diff: {}, type: {}, tag: {} };
  }

  function bump(map, k) {
    if (!k) return;
    map[k] = (map[k] || 0) + 1;
  }

  function recordVisit(profile, cur) {
    if (!cur || !cur.u) return;
    bump(profile.region, cur.r);
    bump(profile.trail, cur.tr);
    bump(profile.diff, cur.d);
    bump(profile.type, cur.ty);
    (cur.tg || []).forEach(function (t) { bump(profile.tag, t); });
    profile.visits = (profile.visits || 0) + 1;
    profile.ts = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch (e) {}
  }

  function affinity(profile, w) {
    // Weight a candidate by how strongly the visitor has shown interest in
    // its attributes. Mirrors the server weighting (region/trail heaviest).
    var s = 0;
    s += (profile.region[w.r] || 0) * 5;
    s += (profile.trail[w.tr] || 0) * 4;
    s += (profile.diff[w.d] || 0) * 2;
    s += (profile.type[w.ty] || 0) * 1;
    (w.tg || []).forEach(function (t) { s += (profile.tag[t] || 0) * 2; });
    return s;
  }

  function diffClass(d) {
    return 'rw-diff-' + String(d || '').toLowerCase().replace(/[^a-z]+/g, '');
  }

  function tagChip(t) {
    var slug = String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    var label = String(t).replace(/-/g, ' ');
    return '<span class="tag tag-' + slug + '">' + label + '</span>';
  }

  function cardHTML(w) {
    var stats = '';
    if (w.km) stats += '<span>' + w.km + ' km</span>';
    if (w.asc) stats += '<span>' + w.asc + ' m</span>';
    if (w.d) stats += '<span class="rw-diff ' + diffClass(w.d) + '">' + w.d + '</span>';
    var tags = (w.tg || []).slice(0, 2).map(tagChip).join('');
    return '<a class="rw-card" href="' + w.u + '"' +
      ' data-region="' + (w.r || '') + '"' +
      ' data-trail="' + (w.tr || '') + '"' +
      ' data-difficulty="' + (w.d || '') + '"' +
      ' data-type="' + (w.ty || '') + '"' +
      ' data-tags="' + (w.tg || []).join(',') + '">' +
      '<div class="rw-tags">' + tags + '</div>' +
      '<h3 class="rw-title">' + w.t + '</h3>' +
      '<div class="rw-stats">' + stats + '</div></a>';
  }

  function personalise(profile) {
    var grid = document.getElementById('related-walks-grid');
    if (!grid || !window.WA_POOL || !WA_POOL.length) return;
    if ((profile.visits || 0) < 2) return; // not enough signal yet — keep broad server set

    var curUrl = grid.getAttribute('data-current') || '';
    var pool = WA_POOL.filter(function (w) {
      return w.u.indexOf(curUrl.replace(/^\//, '')) === -1 || !curUrl;
    });

    var scored = pool.map(function (w) {
      return { w: w, s: affinity(profile, w) };
    }).sort(function (a, b) { return b.s - a.s; });

    // Only intervene if personalisation actually finds signal.
    if (!scored.length || scored[0].s === 0) return;

    var top = scored.slice(0, 4).map(function (x) { return cardHTML(x.w); }).join('');
    if (top) {
      grid.innerHTML = top;
      grid.setAttribute('data-personalised', '1');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var profile = loadProfile();
    if (window.WA_CURRENT) recordVisit(profile, window.WA_CURRENT);
    personalise(profile);
  });
})();
