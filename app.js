(function () {
  "use strict";

  var D = window.QUEST_DATA;
  var KEY = "questToMLS.v1";
  var app = document.getElementById("app");
  var view = { tab: "home", drill: null, challenge: null };
  var timer = null;

  /* ---------- state ---------- */
  function blankState() {
    return { v: 1, player: "Player", created: dayKey(new Date()), days: {}, xp: 0, totalReps: 0, rightReps: 0,
      pbs: {}, badges: {}, pin: null, lastBackup: null, seenInstallTip: false };
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blankState();
      var s = JSON.parse(raw);
      var b = blankState();
      for (var k in b) if (!(k in s)) s[k] = b[k];
      return s;
    } catch (e) { return blankState(); }
  }
  var S = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast("Couldn't save. Back up from the Me tab."); }
  }

  /* ---------- dates ---------- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dayKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function today() { return dayKey(new Date()); }
  function addDays(key, n) { var p = key.split("-"); var d = new Date(+p[0], +p[1] - 1, +p[2]); d.setDate(d.getDate() + n); return dayKey(d); }
  function weekId(key) { // Monday-based week id
    var p = key.split("-"); var d = new Date(+p[0], +p[1] - 1, +p[2]);
    var dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return dayKey(d);
  }
  function getDay(key) {
    if (!S.days[key]) S.days[key] = { sets: {}, reps: 0, xp: 0, complete: false };
    return S.days[key];
  }

  /* ---------- quest logic ---------- */
  function levelIndex(xp) { var i = 0; D.levels.forEach(function (l, j) { if (xp >= l.xp) i = j; }); return i; }
  function unlockedMoves() { var li = levelIndex(S.xp); return D.mbappeMoves.filter(function (m) { return li >= m.unlockLevel; }); }
  function bonusMoveFor(key) { // rotate one unlocked Mbappé move per day
    var u = unlockedMoves(); if (!u.length) return null;
    var p = key.split("-"); var n = Math.floor(new Date(+p[0], +p[1] - 1, +p[2]).getTime() / 864e5);
    var m = u[n % u.length];
    return Object.assign({ block: "mbappe", foot: "both", builds: "Bonus move: extra XP, beyond the 500" }, m);
  }
  function questFor(key) {
    var list = D.drills.slice(); var b = bonusMoveFor(key); if (b) list.push(b); return list;
  }
  function findDrill(id) { var all = D.drills.concat(D.mbappeMoves.map(function (m) { return Object.assign({ block: "mbappe", foot: "both" }, m); })); return all.filter(function (d) { return d.id === id; })[0]; }
  function setsDone(day, d) { return day.sets[d.id] || 0; }
  function setsTotal(d) { return Math.ceil(d.reps / d.setSize); }
  function drillComplete(day, d) { return setsDone(day, d) >= setsTotal(d); }
  function xpFor(d) { var m = 1; if (d.foot === "right") m = 1.5; if (d.block === "mbappe") m = 1.5; return Math.round(d.setSize * m); }
  function rightFor(d) { return d.foot === "right" ? d.setSize : d.foot === "both" ? d.setSize / 2 : 0; }

  function isComplete(key) { var d = S.days[key]; return !!(d && d.reps >= D.dailyGoal); }
  function streak() {
    var cur = today(); if (!isComplete(cur)) cur = addDays(cur, -1);
    var count = 0, restWeeks = {}, guard = 0;
    while (guard++ < 800 && cur >= S.created) {
      if (isComplete(cur)) { count++; }
      else {
        var w = weekId(cur);
        if (restWeeks[w]) break;
        restWeeks[w] = true;
      }
      cur = addDays(cur, -1);
    }
    return count;
  }
  function bestStreak() { // longest run with the same one-rest-day-per-week rule
    var keys = Object.keys(S.days).filter(isComplete).sort(); if (!keys.length) return 0;
    var best = 0, k = keys[0], end = today(), run = 0, rest = {};
    while (k <= end) {
      if (isComplete(k)) { run++; best = Math.max(best, run); }
      else { var w = weekId(k); if (rest[w]) { run = 0; rest = {}; } else rest[w] = true; }
      k = addDays(k, 1);
    }
    return best;
  }

  function logSet(d) {
    var key = today(), day = getDay(key);
    if (drillComplete(day, d)) return;
    var wasComplete = day.complete;
    var oldLevel = levelIndex(S.xp);
    day.sets[d.id] = setsDone(day, d) + 1;
    day.reps += d.setSize;
    var gain = xpFor(d);
    day.xp += gain; S.xp += gain;
    S.totalReps += d.setSize; S.rightReps += rightFor(d);
    var msg = "+" + d.setSize + " reps · +" + gain + " XP";
    if (!wasComplete && day.reps >= D.dailyGoal) {
      day.complete = true; day.xp += 100; S.xp += 100;
      msg = "QUEST COMPLETE! +100 bonus XP";
      beep(880, 0.15); setTimeout(function () { beep(1320, 0.25); }, 160);
    } else { beep(660, 0.08); }
    var newLevel = levelIndex(S.xp);
    if (newLevel > oldLevel) msg = "LEVEL UP: " + D.levels[newLevel].name + "!";
    checkBadges();
    save(); toast(msg); render();
  }
  function undoSet(d) {
    var day = getDay(today()); if (!setsDone(day, d)) return;
    day.sets[d.id]--; day.reps -= d.setSize;
    var gain = xpFor(d); day.xp -= gain; S.xp = Math.max(0, S.xp - gain);
    S.totalReps -= d.setSize; S.rightReps -= rightFor(d);
    if (day.complete && day.reps < D.dailyGoal) { day.complete = false; day.xp -= 100; S.xp = Math.max(0, S.xp - 100); }
    save(); render();
  }

  function award(id) {
    if (S.badges[id]) return;
    S.badges[id] = today();
    var b = D.badges.filter(function (x) { return x.id === id; })[0];
    if (b) setTimeout(function () { toast("Badge: " + b.name); }, 1300);
  }
  function checkBadges() {
    var st = streak();
    if (Object.keys(S.days).some(isComplete)) award("first");
    if (st >= 3) award("streak3"); if (st >= 7) award("streak7"); if (st >= 14) award("streak14"); if (st >= 30) award("streak30");
    if (S.rightReps >= 1000) award("right1k"); if (S.rightReps >= 5000) award("right5k");
    if (S.totalReps >= 10000) award("reps10k"); if (S.totalReps >= 50000) award("reps50k");
    var j = (S.pbs.juggle && S.pbs.juggle.value) || 0;
    if (j >= 25) award("juggle25"); if (j >= 50) award("juggle50");
    if (unlockedMoves().length) award("mbappe");
  }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n) { return Math.round(n).toLocaleString(); }
  var toastT;
  function toast(t) {
    var el = document.getElementById("toast"); el.textContent = t; el.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }
  var actx;
  function beep(f, dur, vol, type) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
      o.type = type || "square"; o.frequency.value = f; o.connect(g); g.connect(actx.destination);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.35, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  function tick() { beep(1500, 0.04, 0.18, "square"); }
  function countBeep() { beep(880, 0.16, 0.4, "square"); }
  function horn() { beep(1320, 0.5, 0.45, "sawtooth"); setTimeout(function () { beep(990, 0.35, 0.35, "sawtooth"); }, 90); }
  function whistle() { beep(2100, 0.25, 0.35, "triangle"); setTimeout(function () { beep(2100, 0.45, 0.35, "triangle"); }, 280); }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }
  function isStandalone() { return window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches; }

  function ring(reps) {
    var r = 54, c = 2 * Math.PI * r, p = Math.min(1, reps / D.dailyGoal);
    return '<svg class="ring" viewBox="0 0 132 132" role="img" aria-label="' + reps + ' of ' + D.dailyGoal + ' reps">' +
      '<circle class="bg" cx="66" cy="66" r="' + r + '"/>' +
      '<circle class="fg" cx="66" cy="66" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - p)).toFixed(1) + '"/>' +
      '<text x="66" y="68" font-size="34">' + reps + '</text>' +
      '<text x="66" y="92" font-size="14" fill="#9fb0d8">of ' + D.dailyGoal + '</text></svg>';
  }
  /* Videos, in order of reliability:
     1. Coach video: recorded on this phone (or a clip file in the repo). Plays inside the app, always, even offline.
     2. YouTube demo: on iPhone it opens the YouTube app (no sign-in check). Elsewhere it plays embedded. */
  function videoBlock(d) {
    var v = d.video, alt = d.altVideo, h = "";
    h += '<div id="coachClip" data-id="' + esc(d.id) + '">' + (d.clip ? nativeVideo(d.clip, "Demo") : "") + "</div>";
    if (!v) return h;
    var thumb = "https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg";
    h += '<div class="video" data-vid="' + esc(v.id) + '">' +
      '<img src="' + thumb + '" alt="" loading="lazy">' +
      '<button class="play" data-action="play" data-vid="' + esc(v.id) + '" aria-label="Play video: ' + esc(v.title) + '"><span>▶ Watch how' + (isIOS() ? " (YouTube app)" : "") + "</span></button></div>" +
      '<div class="vidlinks"><span class="muted">' + esc(v.title) + " · " + esc(v.channel) + "</span></div>";
    if (isIOS()) h += '<p class="small muted" style="margin:6px 0 0">Opens in the YouTube app. Swipe back here when it ends. <a href="#" data-action="embed" data-vid="' + esc(v.id) + '">Try playing here instead</a></p>';
    if (alt) h += '<p class="small muted" style="margin:8px 0 0">Still stuck? <a href="#" data-action="swapvid" data-vid="' + esc(alt.id) + '">Watch another video</a> (' + esc(alt.channel) + ")</p>";
    return h;
  }
  function nativeVideo(src, label) {
    return '<div class="clipcard"><div class="row between"><b>🎥 ' + esc(label) + '</b></div>' +
      '<video class="clip" src="' + esc(src) + '" controls playsinline preload="metadata"></video></div>';
  }

  /* ---------- coach videos (stored on this phone in IndexedDB) ---------- */
  var dbP = null;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error("no idb"));
      var r = indexedDB.open("questToMLS-clips", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("clips"); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
    return dbP;
  }
  function clipOp(mode, fn) {
    return db().then(function (d) { return new Promise(function (res, rej) {
      var tx = d.transaction("clips", mode), st = tx.objectStore("clips"), req = fn(st);
      tx.oncomplete = function () { res(req && req.result); }; tx.onerror = function () { rej(tx.error); };
    }); });
  }
  var clipURL = null;
  function showCoachClip(id) {
    var box = document.getElementById("coachClip"); if (!box || box.dataset.id !== id) return;
    var d = findDrill(id);
    clipOp("readonly", function (st) { return st.get(id); }).then(function (blob) {
      if (!document.getElementById("coachClip")) return;
      if (clipURL) { URL.revokeObjectURL(clipURL); clipURL = null; }
      var h = "";
      if (blob) {
        clipURL = URL.createObjectURL(blob);
        h = nativeVideo(clipURL, "Coach video") .replace("</b></div>", '</b><span class="row"><a href="#" data-action="recClip" data-id="' + esc(id) + '">Re-record</a><a href="#" data-action="delClip" data-id="' + esc(id) + '">Delete</a></span></div>');
      } else if (!d.clip) {
        h = '<button class="reccard" data-action="recClip" data-id="' + esc(id) + '"><b>🎥 Add a coach video</b><span>Record 10–20 seconds of this drill. It plays right here, every time, no YouTube needed.</span></button>';
      } else { h = box.innerHTML; }
      box.innerHTML = h;
    }).catch(function () {});
  }
  function pickClip(id) {
    var inp = document.createElement("input");
    inp.type = "file"; inp.accept = "video/*"; inp.setAttribute("capture", "environment");
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      if (f.size > 200 * 1024 * 1024) { toast("That clip is over 200 MB. Record a shorter one."); return; }
      toast("Saving video…");
      clipOp("readwrite", function (st) { return st.put(f, id); })
        .then(function () { toast("Coach video saved"); showCoachClip(id); })
        .catch(function () { toast("Couldn't save the video. Phone storage may be full."); });
    };
    inp.click();
  }
  function delClip(id) {
    if (!confirm("Delete the coach video for this drill?")) return;
    clipOp("readwrite", function (st) { return st.delete(id); }).then(function () { showCoachClip(id); });
  }

  /* ---------- views ---------- */
  function viewHome() {
    var key = today(), day = getDay(key), li = levelIndex(S.xp), lvl = D.levels[li], next = D.levels[li + 1];
    var pct = next ? Math.round(100 * (S.xp - lvl.xp) / (next.xp - lvl.xp)) : 100;
    var st = streak();
    var quest = questFor(key);
    var left = Math.max(0, D.dailyGoal - day.reps);
    var h = '<div class="top"><div class="brand">QUEST TO <b>MLS</b></div><span class="pill">🔥 ' + st + ' day' + (st === 1 ? "" : "s") + '</span></div>';
    h += '<div class="hero"><div class="lvl">Level ' + (li + 1) + ' · ' + esc(lvl.name) + '</div>' +
      '<h1>' + (day.complete ? "Quest complete!" : "Today's quest: " + D.dailyGoal) + '</h1>' +
      '<div class="ringwrap">' + ring(day.reps) + '<div class="stats">' +
      '<div class="stat"><b>' + (day.complete ? "✓ Done" : left) + '</b><span>' + (day.complete ? "Extra reps still earn XP" : "reps to go · about " + questMinutes(day, D.drills) + " min") + '</span></div>' +
      '<div class="stat"><b>' + fmt(S.xp) + '</b><span>XP' + (next ? " · " + fmt(next.xp - S.xp) + " to " + esc(next.name) : " · max level") + '</span></div>' +
      '</div></div><div class="bar" style="margin-top:14px"><i style="width:' + pct + '%"></i></div></div>';

    if (isIOS() && !isStandalone() && !S.seenInstallTip) {
      h += '<div class="tip"><b>Protect your progress:</b> tap Share, then <b>Add to Home Screen</b>. It opens like an app and keeps your saves safe. <a href="#" data-action="hidetip">Got it</a></div>';
    }

    ["mastery", "passing", "mbappe"].forEach(function (b) {
      var items = quest.filter(function (d) { return d.block === b; }); if (!items.length) return;
      var sum = items.reduce(function (a, d) { return a + d.reps; }, 0);
      h += '<h2>' + esc(D.blocks[b].name) + ' <span class="muted small" style="font-family:var(--body)">' + (b === "mbappe" ? "bonus" : sum + " reps") + '</span></h2><div class="list">';
      items.forEach(function (d) {
        var done = setsDone(day, d), tot = setsTotal(d), ok = done >= tot;
        h += '<button class="drill' + (ok ? " done" : "") + '" data-action="open" data-id="' + d.id + '">' +
          '<span class="ico">' + (ok ? "✓" : d.reps) + '</span><span class="t"><b>' + esc(d.name) + '</b>' +
          '<span>' + done + ' of ' + tot + ' sets' + (d.foot === "right" ? ' · <span class="tag right">Right foot ×1.5 XP</span>' : "") + (b === "mbappe" ? ' · <span class="tag mb">×1.5 XP</span>' : "") + '</span>' +
          '<div class="bar mini"><i style="width:' + Math.round(100 * done / tot) + '%"></i></div></span><span class="muted">›</span></button>';
      });
      h += "</div>";
    });
    if (!unlockedMoves().length) h += '<div class="lock" style="margin-top:16px">🔒 Mbappé moves unlock at <b>' + esc(D.levels[D.mbappeMoves[0].unlockLevel].name) + '</b>.</div>';
    return h;
  }

  function setLabel(d, i) { return d.sides ? d.sides[i % d.sides.length] : "Set " + (i + 1); }

  function runnerPanel(d, done, tot) {
    var left = run.paused ? Math.ceil(run.remain / 1000) : Math.max(0, Math.ceil((run.end - Date.now()) / 1000));
    var label, sub, cls = run.phase;
    if (run.phase === "pre") { label = "Get ready"; sub = setLabel(d, done) + " · " + d.setSize + " reps"; }
    else if (run.phase === "work") { label = "GO!"; sub = setLabel(d, done) + " of " + tot + " · " + d.setSize + " reps"; }
    else { label = "Rest"; sub = "Next: " + setLabel(d, done) + " · get the ball ready"; }
    var h = '<div class="runner ' + cls + '"><div class="runlabel">' + esc(label) + '</div><div class="small">' + esc(sub) + "</div>" +
      bigRing(left, run.total) + '<div class="runbtns">' +
      '<button class="btn sm alt" data-action="runPause">' + (run.paused ? "▶ Resume" : "❚❚ Pause") + "</button>";
    if (run.phase === "work") h += '<button class="btn sm" data-action="runDone" data-id="' + d.id + '">✓ Done early</button>';
    else h += '<button class="btn sm" data-action="runSkip">Skip ›</button>';
    h += '</div><p style="margin:10px 0 0"><a href="#" data-action="runStop">Stop timer</a></p></div>';
    h += '<div class="card" style="margin-top:12px"><ul class="cues" style="margin:0">' + d.cues.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></div>";
    return h;
  }
  function bigRing(left, total) {
    var r = 88, c = 2 * Math.PI * r, p = total ? Math.max(0, Math.min(1, left / total)) : 0;
    return '<svg class="bigring" viewBox="0 0 200 200" aria-hidden="true"><circle class="bg" cx="100" cy="100" r="' + r + '"/>' +
      '<circle class="fg" id="runArc" cx="100" cy="100" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - p)).toFixed(1) + '"/>' +
      '<text id="runNum" x="100" y="122" font-size="72">' + left + "</text></svg>";
  }

  function viewDrill(d) {
    var day = getDay(today()), done = setsDone(day, d), tot = setsTotal(d);
    var h = '<button class="back" data-action="home">‹ Back to quest</button>';
    h += '<div class="row between"><h1>' + esc(d.name) + '</h1></div>';
    h += '<p class="muted" style="margin:6px 0 0">' + d.reps + ' reps · ' + tot + ' sets of ' + d.setSize + ' · ' + d.secs + ' sec each' + (d.foot === "right" ? ' · <span class="tag right">Right foot</span>' : d.foot === "left" ? ' · <span class="tag">Left foot</span>' : "") + '</p>';
    if (run && run.id === d.id && done < tot) return h + runnerPanel(d, done, tot);
    h += videoBlock(d);
    h += '<div class="card" style="margin-top:14px"><h3>How</h3><p style="margin:6px 0 0">' + esc(d.how) + '</p>' +
      '<h3 style="margin-top:12px">Coach says</h3><ul class="cues">' + d.cues.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul>" +
      (d.builds ? '<div class="builds">⚡ ' + esc(d.builds) + "</div>" : "") + "</div>";
    h += '<div class="sets">';
    for (var i = 0; i < tot; i++) {
      h += '<div class="set' + (i < done ? " on" : "") + '"><b>' + (i < done ? "✓" : d.setSize) + "</b>" + esc(setLabel(d, i)) + "</div>";
    }
    h += "</div>";
    if (done < tot) {
      h += '<button class="btn" data-action="runStart" data-id="' + d.id + '">▶ Start ' + esc(setLabel(d, done)) + ' · ' + d.secs + ' sec timer</button>';
      h += '<p style="text-align:center;margin:12px 0 0"><a href="#" data-action="set" data-id="' + d.id + '">Log set without the timer (+' + d.setSize + ")</a></p>";
    } else {
      h += '<button class="btn blue" data-action="home">Drill complete! Next drill ›</button>';
    }
    if (d.logBest) h += '<button class="btn alt" style="margin-top:10px" data-action="challenge" data-id="juggle">Log a juggling record</button>';
    if (done > 0) h += '<p style="text-align:center"><a href="#" data-action="undo" data-id="' + d.id + '">Undo last set</a></p>';
    return h;
  }

  function viewMoves() {
    var li = levelIndex(S.xp);
    var h = '<div class="top"><div class="brand">MBAPPÉ <b>MOVES</b></div></div>';
    h += '<p class="muted" style="margin-top:0">Level up to unlock real match moves. Each unlocked move shows up as a bonus drill in your daily quest.</p><div class="list">';
    D.mbappeMoves.forEach(function (m) {
      var open = li >= m.unlockLevel;
      if (open) {
        h += '<button class="drill" data-action="open" data-id="' + m.id + '"><span class="ico">⚡</span><span class="t"><b>' + esc(m.name) + '</b><span>Unlocked · tap to train</span></span><span class="muted">›</span></button>';
      } else {
        h += '<div class="drill" aria-disabled="true" style="opacity:.55"><span class="ico">🔒</span><span class="t"><b>' + esc(m.name) + '</b><span>Unlocks at ' + esc(D.levels[m.unlockLevel].name) + " (" + fmt(D.levels[m.unlockLevel].xp) + " XP)</span></span></div>";
      }
    });
    h += "</div>";
    h += '<h2>The path</h2><div class="card">';
    D.levels.forEach(function (l, i) {
      h += '<div class="row between" style="padding:6px 0;' + (i ? "border-top:1px solid var(--line)" : "") + '"><span>' + (i <= li ? "✅" : "⬜") + " " + esc(l.name) + '</span><span class="muted small">' + fmt(l.xp) + " XP</span></div>";
    });
    return h + "</div>";
  }

  function viewRecords() {
    var h = '<div class="top"><div class="brand">PERSONAL <b>BESTS</b></div></div><div class="list">';
    D.challenges.forEach(function (c) {
      var pb = S.pbs[c.id];
      h += '<button class="drill" data-action="challenge" data-id="' + c.id + '"><span class="ico">⏱</span><span class="t"><b>' + esc(c.name) + '</b><span>' + (pb ? "Best: " + pb.value + " " + esc(c.unit) + " · " + pb.date : "No record yet. Set one!") + '</span></span><span class="muted">›</span></button>';
    });
    return h + "</div>";
  }

  function viewChallenge(c) {
    var pb = S.pbs[c.id];
    var h = '<button class="back" data-action="records">‹ Records</button><h1>' + esc(c.name) + '</h1>';
    h += '<p class="muted">' + (pb ? "Record to beat: <b>" + pb.value + " " + esc(c.unit) + "</b>" : "First attempt sets the record.") + "</p>";
    if (c.seconds) {
      h += '<div class="big-timer" id="clock">' + c.seconds + '</div>';
      h += '<button class="btn" id="go" data-action="startTimer" data-id="' + c.id + '">Start: 3, 2, 1, go</button>';
    }
    h += '<div class="field"><label for="score">How many ' + esc(c.unit) + '?</label><input id="score" type="number" inputmode="numeric" min="0" max="999"><div class="err" id="err"></div></div>';
    h += '<button class="btn blue" data-action="saveScore" data-id="' + c.id + '">Save score</button>';
    return h;
  }

  function viewMe() {
    var h = '<div class="top"><div class="brand">' + esc(S.player.toUpperCase()) + "'S <b>LOCKER</b></div></div>";
    h += '<div class="grid2"><div class="card"><b style="font-family:var(--display);font-size:26px;font-weight:400">' + fmt(S.totalReps) + '</b><div class="muted small">lifetime reps</div></div>' +
      '<div class="card"><b style="font-family:var(--display);font-size:26px;font-weight:400">' + fmt(S.rightReps) + '</b><div class="muted small">right-foot reps</div></div>' +
      '<div class="card"><b style="font-family:var(--display);font-size:26px;font-weight:400">' + streak() + '</b><div class="muted small">current streak</div></div>' +
      '<div class="card"><b style="font-family:var(--display);font-size:26px;font-weight:400">' + bestStreak() + '</b><div class="muted small">best streak</div></div></div>';
    h += '<p class="small muted">One rest day per week (Mon–Sun) keeps your streak alive.</p>';

    h += "<h2>Last 4 weeks</h2>" + calendar();

    h += '<h2>Badges</h2><div class="grid2">';
    var em = { first: "🏁", streak3: "🎩", streak7: "📅", streak14: "🚀", streak30: "🏆", right1k: "🦶", right5k: "⚖️", reps10k: "🔟", reps50k: "💎", juggle25: "🤹", juggle50: "🌪️", pb: "📈", mbappe: "⚡", dad: "👑" };
    D.badges.forEach(function (b) {
      var got = S.badges[b.id];
      h += '<div class="badge' + (got ? "" : " off") + '"><div class="em">' + (em[b.id] || "★") + "</div><b>" + esc(b.name) + "</b><span>" + (got ? "Earned " + got : esc(b.desc)) + "</span></div>";
    });
    h += "</div>";

    h += '<h2>Coach (Dad) zone</h2><div class="card">';
    h += '<p style="margin-top:0">Watch one clip of today\'s work, then award a <b>Coach\'s Pick</b> (+250 XP).</p>';
    h += '<div class="field"><label for="pin">' + (S.pin ? "Coach PIN" : "Set a 4-digit coach PIN") + '</label><input id="pin" type="password" inputmode="numeric" maxlength="4" autocomplete="off"><div class="err" id="pinerr"></div></div>';
    h += '<button class="btn alt" data-action="coach">' + (S.pin ? "Award Coach's Pick" : "Save PIN") + "</button></div>";

    h += '<h2>Backup</h2><div class="card"><p style="margin-top:0" class="small">Progress saves on this phone automatically after every set. Back up weekly in case the phone is reset or replaced.' +
      (S.lastBackup ? " Last backup: " + S.lastBackup + "." : " <b>No backup yet.</b>") + '</p>' +
      '<div class="row"><button class="btn sm" data-action="export">Download backup</button><button class="btn sm alt" data-action="import">Restore</button></div>' +
      '<input type="file" id="file" accept="application/json,.json" hidden></div>';
    h += '<h2>Sound</h2><div class="card row between"><span><b>Voice coach</b><br><span class="small muted">Says "Get ready", "Go!", "10 seconds", "3, 2, 1" and "Rest" during the timer.</span></span>' +
      '<button class="btn sm ' + (S.voice === false ? "alt" : "") + '" data-action="voice">' + (S.voice === false ? "Off" : "On") + "</button></div>";
    h += '<div class="field"><label for="pname">Player name</label><input id="pname" value="' + esc(S.player) + '" maxlength="20"></div>';
    h += '<p class="small muted">Drills follow the U.S. Soccer Foundation Phase (U11–U12) technical focus: ball mastery, passing on the ground with pace, receiving away from pressure, turning (Cruyff, cuts) and the driven pass.</p>';
    return h;
  }
  function calendar() {
    var t = today(), start = addDays(weekId(t), -21), h = '<div class="cal">';
    ["M", "T", "W", "T", "F", "S", "S"].forEach(function (x) { h += '<div style="background:none">' + x + "</div>"; });
    for (var i = 0; i < 28; i++) {
      var k = addDays(start, i), d = S.days[k], cls = d && d.reps >= D.dailyGoal ? "full" : d && d.reps > 0 ? "part" : "";
      if (k === t) cls += " today";
      h += '<div class="' + cls + '" title="' + k + (d ? ": " + d.reps + " reps" : "") + '">' + (k > t ? "" : +k.slice(8)) + "</div>";
    }
    return h + "</div>";
  }

  /* ---------- render + events ---------- */
  function render() {
    var h;
    if (view.drill) h = viewDrill(findDrill(view.drill));
    else if (view.challenge) h = viewChallenge(D.challenges.filter(function (c) { return c.id === view.challenge; })[0]);
    else if (view.tab === "moves") h = viewMoves();
    else if (view.tab === "records") h = viewRecords();
    else if (view.tab === "me") h = viewMe();
    else h = viewHome();
    app.innerHTML = h;
    if (view.drill && document.getElementById("coachClip")) showCoachClip(view.drill);
    document.querySelectorAll(".tab").forEach(function (b) { b.classList.toggle("is-on", b.dataset.tab === view.tab); });
  }
  function go(tab) { stopRun(); stopTimer(); view = { tab: tab, drill: null, challenge: null }; render(); window.scrollTo(0, 0); }

  document.querySelector(".tabbar").addEventListener("click", function (e) {
    var b = e.target.closest(".tab"); if (b) go(b.dataset.tab);
  });

  app.addEventListener("click", function (e) {
    var el = e.target.closest("[data-action]"); if (!el) return;
    var a = el.dataset.action, id = el.dataset.id;
    if (el.tagName === "A") e.preventDefault();
    if (a === "open") { view.drill = id; render(); window.scrollTo(0, 0); }
    else if (a === "home") go("home");
    else if (a === "records") go("records");
    else if (a === "set") { stopRun(); logSet(findDrill(id)); }
    else if (a === "runStart") runStart(findDrill(id));
    else if (a === "runPause") runPause();
    else if (a === "runDone") { if (run) finishSet(findDrill(run.id)); }
    else if (a === "runSkip") { if (run) { horn(); say("Go!"); startPhase("work", findDrill(run.id).secs); } }
    else if (a === "runStop") { stopRun(); try { speechSynthesis.cancel(); } catch (e) {} render(); }
    else if (a === "voice") { S.voice = S.voice === false; save(); toast(S.voice ? "Voice coach on" : "Voice coach off"); if (S.voice) say("Voice coach on."); render(); }
    else if (a === "undo") undoSet(findDrill(id));
    else if (a === "play" || a === "swapvid") { if (isIOS()) openYouTubeApp(el.dataset.vid); else playVideo(el.dataset.vid); }
    else if (a === "embed") playVideo(el.dataset.vid);
    else if (a === "recClip") pickClip(id);
    else if (a === "delClip") delClip(id);
    else if (a === "hidetip") { S.seenInstallTip = true; save(); render(); }
    else if (a === "challenge") { view.drill = null; view.challenge = id; view.tab = "records"; render(); window.scrollTo(0, 0); }
    else if (a === "startTimer") startTimer(D.challenges.filter(function (c) { return c.id === id; })[0]);
    else if (a === "saveScore") saveScore(id);
    else if (a === "coach") coach();
    else if (a === "export") exportData();
    else if (a === "import") document.getElementById("file").click();
  });
  app.addEventListener("change", function (e) {
    if (e.target.id === "file") importData(e.target.files[0]);
    if (e.target.id === "pname") { S.player = e.target.value.trim() || "Player"; save(); }
  });
  app.addEventListener("input", function (e) {
    if (e.target.id === "score") document.getElementById("err").textContent = "";
    if (e.target.id === "pin") document.getElementById("pinerr").textContent = "";
  });

  /* Hand off to the YouTube app: no sign-in/bot check there. Falls back to the web page if the app isn't installed. */
  function openYouTubeApp(id) {
    var web = "https://www.youtube.com/watch?v=" + encodeURIComponent(id);
    var left = false;
    function hid() { if (document.hidden) left = true; }
    document.addEventListener("visibilitychange", hid);
    window.location.href = "youtube://www.youtube.com/watch?v=" + encodeURIComponent(id);
    setTimeout(function () {
      document.removeEventListener("visibilitychange", hid);
      if (!left && !document.hidden) window.open(web, "_blank");
    }, 1600);
  }
  function playVideo(id) {
    var box = app.querySelector(".video"); if (!box) return;
    /* youtube.com (not youtube-nocookie) so YouTube can see the viewer's normal session and skip its "not a bot" check */
    box.innerHTML = '<iframe src="https://www.youtube.com/embed/' + encodeURIComponent(id) +
      '?autoplay=1&playsinline=1&rel=0&origin=' + encodeURIComponent(location.origin) +
      '" title="Drill video" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    var link = app.querySelector(".ytapp"); if (link) link.href = "https://www.youtube.com/watch?v=" + encodeURIComponent(id);
  }

  /* ---------- follow-along set timer ---------- */
  var run = null, runTick = null;
  /* iPhone mutes web sounds when the side switch is on silent. Two fixes, both run on the tap that starts the timer:
     1. audioSession "playback" (Safari 16.4+) tells iOS this is media, like a video, so it plays on silent.
     2. Playing a silent <audio> clip switches older iOS into the same media mode. */
  var silentEl = null;
  function silentWav() {
    var n = 800, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
    function s(o, t) { for (var i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); }
    s(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); s(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
    v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true);
    v.setUint16(34, 16, true); s(36, "data"); v.setUint32(40, n * 2, true);
    return URL.createObjectURL(new Blob([b], { type: "audio/wav" }));
  }
  function unlockAudio() {
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
    try {
      if (!silentEl) { silentEl = new Audio(silentWav()); silentEl.setAttribute("playsinline", ""); silentEl.loop = true; silentEl.volume = 0.01; }
      var p = silentEl.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); } catch (e) {}
  }
  function releaseAudio() { try { if (silentEl) silentEl.pause(); } catch (e) {} }
  function keepAwake() {
    try { if (navigator.wakeLock && !wakeLock) navigator.wakeLock.request("screen").then(function (w) { wakeLock = w; w.addEventListener("release", function () { wakeLock = null; }); }).catch(function () {}); } catch (e) {}
  }
  function stopRun() {
    run = null; if (runTick) { clearInterval(runTick); runTick = null; } releaseAudio();
    if (wakeLock && !timer) { try { wakeLock.release(); } catch (e) {} wakeLock = null; }
  }
  function startPhase(phase, secs) {
    run.phase = phase; run.total = secs; run.end = Date.now() + secs * 1000; run.paused = false; run.lastBeep = null;
    if (!runTick) runTick = setInterval(runStep, 200);
    render();
  }
  /* Spoken coach cues. */
  function say(text) {
    if (S.voice === false || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; u.rate = 1.05; u.pitch = 1.05;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function runStart(d) {
    unlockAudio(); stopRun(); keepAwake();
    run = { id: d.id };
    var done = setsDone(getDay(today()), d);
    say("Get ready. " + setLabel(d, done) + ". " + d.setSize + " reps.");
    startPhase("pre", 5);
    window.scrollTo(0, 0);
  }
  function runStep() {
    if (!run || run.paused) return;
    var left = Math.ceil((run.end - Date.now()) / 1000);
    var num = document.getElementById("runNum"), arc = document.getElementById("runArc");
    if (num) num.textContent = Math.max(0, left);
    if (arc) { var c = 2 * Math.PI * 88; arc.setAttribute("stroke-dashoffset", (c * (1 - Math.max(0, left) / run.total)).toFixed(1)); }
    if (left > 0 && run.lastBeep !== left && left < run.total + 1) {
      run.lastBeep = left;
      /* Sound every second of the countdown: tick, tick... then a louder beep on 3, 2, 1. */
      if (left <= 3) { countBeep(); say(String(left)); }
      else if (run.phase !== "work" || left <= 5) tick();
      if (run.phase === "work" && left === 10 && run.total >= 20) say("10 seconds");
      else if (run.phase === "work" && run.total >= 30 && left === Math.round(run.total / 2) && left !== 10) say("Halfway");
    }
    if (left <= 0) phaseDone();
  }
  function phaseDone() {
    var d = findDrill(run.id);
    if (run.phase !== "work") { horn(); say("Go!"); startPhase("work", d.secs); return; }
    finishSet(d);
  }
  function finishSet(d) {
    whistle();
    var wasComplete = getDay(today()).complete;
    logSet(d);
    if (!run) return;
    var day = getDay(today());
    if (!wasComplete && day.complete) say("Quest complete! 500 reps. Great work.");
    if (drillComplete(day, d)) {
      if (wasComplete || !day.complete) say("Drill complete. Nice work.");
      stopRun(); render(); return;
    }
    say("Stop. Rest. Next, " + setLabel(d, setsDone(day, d)) + ".");
    startPhase("rest", D.restSecs);
  }
  function runPause() {
    if (!run) return;
    if (run.paused) { run.end = Date.now() + run.remain; run.paused = false; keepAwake(); }
    else { run.remain = Math.max(0, run.end - Date.now()); run.paused = true; }
    render();
  }
  function questMinutes(day, quest) {
    var s = 0;
    quest.forEach(function (d) { var left = setsTotal(d) - setsDone(day, d); if (left > 0) s += left * d.secs + (left - 1) * D.restSecs; });
    return Math.ceil(s / 60);
  }

  /* ---------- timed challenges ---------- */
  var wakeLock = null;
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } if (wakeLock) { try { wakeLock.release(); } catch (e) {} wakeLock = null; } }
  function startTimer(c) {
    stopTimer(); unlockAudio();
    var clock = document.getElementById("clock"), btn = document.getElementById("go");
    btn.disabled = true;
    try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(function (w) { wakeLock = w; }).catch(function () {}); } catch (e) {}
    var pre = 3; clock.textContent = pre; beep(520, 0.12);
    timer = setInterval(function () {
      pre--;
      if (pre > 0) { clock.textContent = pre; beep(520, 0.12); return; }
      clearInterval(timer); beep(990, 0.3);
      var left = c.seconds; clock.textContent = "GO";
      timer = setInterval(function () {
        left--; clock.textContent = left;
        if (left <= 3 && left > 0) beep(700, 0.08);
        if (left <= 0) { stopTimer(); clock.textContent = "STOP"; beep(440, 0.6); btn.disabled = false; btn.textContent = "Go again"; var s = document.getElementById("score"); if (s) s.focus(); }
      }, 1000);
    }, 1000);
  }
  function saveScore(id) {
    var input = document.getElementById("score"), err = document.getElementById("err");
    var v = parseInt(input.value, 10);
    if (isNaN(v) || v < 0 || v > 999) { err.textContent = "Enter a number from 0 to 999 first."; input.focus(); return; }
    var pb = S.pbs[id], c = D.challenges.filter(function (x) { return x.id === id; })[0];
    if (!pb || v > pb.value) {
      var beat = !!pb;
      S.pbs[id] = { value: v, date: today() };
      S.xp += 25;
      if (beat) award("pb");
      checkBadges(); save();
      toast((beat ? "NEW RECORD! " : "Record set! ") + v + " " + c.unit + " · +25 XP");
    } else { toast("Nice! Record is still " + pb.value + ". Keep going."); }
    go("records");
  }

  /* ---------- coach + backup ---------- */
  function coach() {
    var input = document.getElementById("pin"), err = document.getElementById("pinerr"), v = (input.value || "").trim();
    if (!/^\d{4}$/.test(v)) { err.textContent = "PIN must be 4 digits."; return; }
    if (!S.pin) { S.pin = v; save(); toast("Coach PIN saved"); render(); return; }
    if (v !== S.pin) { err.textContent = "Wrong PIN."; return; }
    S.xp += 250; S.badges.dad = today(); S.coachPicks = (S.coachPicks || 0) + 1; save();
    toast("Coach's Pick! +250 XP"); render();
  }
  function exportData() {
    S.lastBackup = today(); save();
    var blob = new Blob([JSON.stringify(S, null, 1)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "quest-to-mls-backup-" + today() + ".json"; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    render();
  }
  function importData(file) {
    if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var s = JSON.parse(r.result);
        if (!s || typeof s.days !== "object" || typeof s.xp !== "number") throw new Error("bad");
        if (!confirm("Replace progress on this phone with the backup from " + (s.lastBackup || "the file") + "?")) return;
        S = s; var b = blankState(); for (var k in b) if (!(k in S)) S[k] = b[k];
        save(); toast("Backup restored"); render();
      } catch (e) { toast("That file isn't a Quest to MLS backup."); }
    };
    r.readAsText(file);
  }

  /* ---------- boot ---------- */
  if (navigator.storage && navigator.storage.persist) { try { navigator.storage.persist(); } catch (e) {} }
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) return;
    if (run) { keepAwake(); unlockAudio(); return; }
    if (!view.drill && !view.challenge) render();
  });
  checkBadges(); save(); render();

  window.__quest = { state: function () { return S; }, logSet: function (id) { logSet(findDrill(id)); }, streak: streak }; // used by tests
})();
