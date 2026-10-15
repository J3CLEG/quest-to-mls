# Quest to MLS

A daily soccer training app for a U11 player. The goal: **500 reps a day**, made up of 310 ball-mastery reps and 190 wall-passing reps, with in-app video demos for every drill.

**Live app:** https://j3cleg.github.io/quest-to-mls/

## Put it on the iPhone
1. Open the live link in **Safari**.
2. Tap **Share**, then **Add to Home Screen**.
3. Open it from the home-screen icon. It runs full-screen, works offline (except videos), and keeps progress safer than a browser tab.

## How it works
- **Daily quest:** 13 drills, about 23 minutes. Progress saves after every set.
- **Follow-along timer:** "Start set" runs 3-2-1, a work countdown sized to each drill (15–45 sec), then a 10-second rest before the next set starts on its own. Beeps on the last 3 seconds, keeps the screen awake, and has Pause, Done early, Skip rest and Stop. Each drill's `secs` and the global `restSecs` live in `drills.js`.
- **Videos:** every drill has an embedded YouTube demo that plays inside the app, plus a backup video on harder moves.
- **XP and levels:** Rec League → Club → Academy → MLS NEXT → Homegrown → MLS Debut → All-Star → Mbappé Mode. Right-foot drills earn 1.5× XP. Finishing 500 reps earns +100 XP.
- **Mbappé moves:** unlock from Academy level up. One unlocked move shows up each day as a bonus drill.
- **Streaks:** one rest day per week (Mon–Sun) doesn't break the streak.
- **Records:** timed challenges (toe taps in 30 sec, wall passes in 60 sec, juggling record).
- **Coach zone:** Dad sets a 4-digit PIN and awards a "Coach's Pick" (+250 XP) after reviewing a clip.
- **Backup:** Me tab → Download backup. Restore on any phone.

## Change drills or videos
Everything is in [`drills.js`](drills.js): rep counts, coaching cues and YouTube video IDs (the part after `watch?v=`). Edit it on GitHub and the app updates on the next open. If you change the file list, bump `VERSION` in `sw.js`.

Drill content follows the U.S. Soccer Foundation Phase III (U11–U12) technical focus.
