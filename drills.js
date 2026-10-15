/*
  Quest to MLS — drill and video data.
  Edit this file to change drills, rep targets or videos. No other code needs to change.
  video.id is the YouTube video ID (the part after "watch?v=").
  Rep targets in the daily quest add up to dailyGoal (500).
*/
window.QUEST_DATA = {
  version: 3,
  dailyGoal: 500,
  restSecs: 10,      /* rest between sets of the same drill */
  /* secs on each drill = countdown length for ONE set at a good pace. */

  blocks: {
    mastery: { name: "Ball Mastery", short: "Mastery" },
    passing: { name: "Wall Passing", short: "Passing" },
    mbappe:  { name: "Mbappé Moves", short: "Mbappé" }
  },

  drills: [
    {
      id: "toe-taps", block: "mastery", name: "Toe Taps", reps: 60, setSize: 20, secs: 20, foot: "both",
      how: "Ball in front of you. Tap the top of the ball with the sole of one foot, then the other, hopping lightly. Stay on your toes.",
      cues: ["Soft taps on top of the ball", "Bounce on the balls of your feet", "Eyes up between taps"],
      builds: "Quick feet for Mbappé's fast touches at top speed",
      video: { id: "ovVq_7OF28Q", title: "Toe Taps step by step", channel: "CCJSA" }
    },
    {
      id: "bells", block: "mastery", name: "Bells (Inside-Inside)", reps: 60, setSize: 20, secs: 15, foot: "both",
      how: "Ball between your feet. Knock it side to side with the inside of each foot, like a bell ringing.",
      cues: ["Small, quick touches", "Ball stays between your feet", "Knees soft"],
      builds: "Close control when a defender is tight on you",
      video: { id: "Dnk1W8wxwrU", title: "Toe Taps and Bell Taps", channel: "SoccerCrafter" }
    },
    {
      id: "sole-roll", block: "mastery", name: "Sole Roll + Inside Push", reps: 40, setSize: 20, secs: 35, foot: "both",
      sides: ["Right foot leads", "Left foot leads"],
      how: "Roll the ball across your body with the sole, then push it forward with the inside of the other foot. Repeat across and back.",
      cues: ["Roll, don't stomp", "Push it just one step ahead", "Right foot set first, it's your power-up foot"],
      builds: "Shifting the ball sideways to open a shooting lane",
      video: { id: "iCLRtN0N0x4", title: "30 Ball Mastery / Coerver Drills", channel: "Fitspiration Coach" }
    },
    {
      id: "v-pull", block: "mastery", name: "V-Pull", reps: 40, setSize: 20, secs: 35, foot: "both",
      sides: ["Right foot", "Left foot"],
      how: "Pull the ball back with your sole, then push it forward diagonally with the inside of the same foot. The ball draws a V.",
      cues: ["Pull back toward your standing foot", "Push out at an angle", "Explode after the push"],
      builds: "Mbappé's stop-and-go: freeze the defender, then go",
      video: { id: "b8pL4-h6dyA", title: "4 V-Pull Ball Mastery Moves", channel: "Anytime Soccer Training" },
      altVideo: { id: "NwYHqyAHZCE", title: "Pull Push Inside V-90°", channel: "Ultimate Soccer Moves Collection" }
    },
    {
      id: "croqueta", block: "mastery", name: "La Croqueta", reps: 40, setSize: 20, secs: 35, foot: "both",
      how: "Moving forward, tap the ball from one foot's inside to the other foot's inside in one quick motion, sliding past a cone.",
      cues: ["Click-clack: two touches, super quick", "Low and balanced", "Speed up after the move"],
      builds: "Cutting inside past a defender on the wing",
      video: { id: "8WYQqnrBnVk", title: "Master the Click Clack (La Croqueta)", channel: "Coach Buckley Academy" }
    },
    {
      id: "cruyff", block: "mastery", name: "Cruyff Turn", reps: 20, setSize: 10, secs: 35, foot: "both",
      sides: ["Right foot", "Left foot"],
      how: "Fake a pass or shot, then drag the ball behind your standing leg with the inside of your foot and go the other way.",
      cues: ["Sell the fake first", "Drag behind your standing leg", "Turn and accelerate away"],
      builds: "Turning away from pressure, a USSF U11 must-have",
      video: { id: "_28dtWxJWn0", title: "Cruyff Turn Tutorial (TopTekkers)", channel: "The Coaching Manual" },
      altVideo: { id: "K4JR-gK1SXU", title: "How to Do a Cruyff Turn", channel: "Soccer Skills by MOJO" }
    },
    {
      id: "cuts", block: "mastery", name: "Inside & Outside Cuts", reps: 20, setSize: 10, secs: 40, foot: "both",
      how: "Dribble toward a cone. Cut sharply with the inside of your foot, dribble back, then cut with the outside.",
      cues: ["Plant hard before the cut", "Cut the ball, not just your body", "Burst for 3 steps after"],
      builds: "Sharp changes of direction at speed",
      video: { id: "Chfxyt24iNM", title: "Single Inside Outside Cuts", channel: "Ultimate Soccer Moves Collection" }
    },
    {
      id: "juggling", block: "mastery", name: "Juggling", reps: 30, setSize: 10, secs: 30, foot: "both",
      how: "Keep the ball in the air with your feet. Count touches. Each set is 10 touches, drops are fine.",
      cues: ["Lock your ankle, toes slightly up", "Small kicks, waist height", "Use both feet"],
      builds: "Soft first touch on balls out of the air",
      logBest: true,
      video: { id: "gYPb9AqtE7o", title: "How to Juggle for Beginners & Kids", channel: "Catalan Soccer" }
    },
    {
      id: "right-pass", block: "passing", name: "Right-Foot Inside Pass", reps: 50, setSize: 10, secs: 25, foot: "right",
      how: "Stand 5–8 yards from a wall. Pass with the inside of your RIGHT foot, control, pass again.",
      cues: ["Ankle locked, toe up", "Plant foot points at the target", "Ball on the ground with pace"],
      builds: "A right foot defenders have to respect",
      video: { id: "DuFc-pgZCn0", title: "Follow-Along Wall Passing for Beginners", channel: "Anytime Soccer Training" }
    },
    {
      id: "left-pass", block: "passing", name: "Left-Foot Inside Pass", reps: 30, setSize: 10, secs: 25, foot: "left",
      how: "Same as right foot. Inside of the LEFT foot, control, pass again.",
      cues: ["Ankle locked, toe up", "Follow through to the target", "Pass hard enough to hear it"],
      builds: "Clean, fast passing out of your strong foot",
      video: { id: "DuFc-pgZCn0", title: "Follow-Along Wall Passing for Beginners", channel: "Anytime Soccer Training" }
    },
    {
      id: "one-touch", block: "passing", name: "One-Touch, Both Feet", reps: 40, setSize: 10, secs: 25, foot: "both",
      how: "Pass back off the wall first time, alternating right foot and left foot. No control touch.",
      cues: ["Get your body behind the ball", "Short backswing", "Right, left, right, left"],
      builds: "Speed of play: 1–2 touch, USSF style",
      video: { id: "xJGHMjrHU3c", title: "11 Wall Drills for First Touch & Passing", channel: "Philip Blystone" }
    },
    {
      id: "receive-across", block: "passing", name: "Receive Across Body + Pass", reps: 40, setSize: 10, secs: 30, foot: "both",
      how: "Open your hips, let the ball run across you, receive with the back foot into space, then pass back to the wall.",
      cues: ["Check your shoulder before the ball arrives", "First touch away from pressure", "Receive on the back foot"],
      builds: "Receiving facing forward so you can attack",
      video: { id: "oSEUpuiz0Z8", title: "Master 1st Touch and Passing with a Wall", channel: "TRS Football" }
    },
    {
      id: "driven", block: "passing", name: "Driven Pass (15–25 yds)", reps: 30, setSize: 10, secs: 45, foot: "both",
      how: "Strike a low, driven pass with your laces from 15–25 yards to a wall or target.",
      cues: ["Toe down, strike with your laces", "Knee over the ball keeps it low", "Land on your kicking foot"],
      builds: "Switching play and long passes to a runner",
      video: { id: "wJWWGKb2gDQ", title: "How to Hit a Low Driven Pass", channel: "MAJK Training" }
    }
  ],

  /* Unlocked by level. Each adds a bonus drill to the daily quest (bonus XP, beyond 500). */
  mbappeMoves: [
    {
      id: "mb-stepover", name: "Mbappé Step-Over", unlockLevel: 2, reps: 20, setSize: 10, secs: 40,
      how: "Run at a cone. Step your foot around the front of the ball without touching it, then push off the other way with the outside of the other foot.",
      cues: ["Around the ball, not over the top", "Dip your shoulder", "Explode after"],
      video: { id: "xnOHJv0Knjw", title: "Mbappé Step Over Tutorial", channel: "Pelota Academy" }
    },
    {
      id: "mb-feint", name: "Mbappé Body Feint", unlockLevel: 3, reps: 20, setSize: 10, secs: 40,
      how: "Drop your shoulder and lean one way without touching the ball, then take it the other way with the outside of your foot.",
      cues: ["Sell it with your shoulders", "Keep the ball close", "Big first step away"],
      video: { id: "ytUFnXlFslo", title: "Mastering the Mbappé Body Feint", channel: "Fulturefc" }
    },
    {
      id: "mb-speed", name: "Change of Pace", unlockLevel: 4, reps: 20, setSize: 10, secs: 45,
      how: "Dribble slowly toward a cone, then explode with one big touch past it. Slow, slow, BOOM.",
      cues: ["Slow to lure the defender", "One big touch into space", "Sprint for 5 yards"],
      video: { id: "r9whrAfs4k0", title: "Mbappé's Speed Secret", channel: "Unisport" }
    },
    {
      id: "mb-signature", name: "3 Signature Moves", unlockLevel: 5, reps: 20, setSize: 10, secs: 45,
      how: "Practice Mbappé's three signature moves from the video, alternating each set.",
      cues: ["Master one before speeding up", "Do every move with both feet", "Finish with a shot"],
      video: { id: "kAov7egxhXg", title: "Learn 3 Kylian Mbappé Signature Moves", channel: "Johimar Osorio" }
    },
    {
      id: "mb-dribble", name: "Dribble Like Mbappé", unlockLevel: 6, reps: 20, setSize: 10, secs: 50,
      how: "Chain two moves together (for example, step-over then change of pace) and finish against the wall.",
      cues: ["Move, then accelerate", "Head up after the move", "Finish low and hard"],
      video: { id: "-T8eLWhva3Q", title: "5 Easy Dribbling Moves Used by Mbappé", channel: "7mlc" }
    }
  ],

  /* XP needed to reach each level. Roughly: Club in 3 days, Academy in about 1 week, All-Star in about 4 months of daily quests. */
  levels: [
    { name: "Rec League", xp: 0 },
    { name: "Club", xp: 1500 },
    { name: "Academy", xp: 5000 },
    { name: "MLS NEXT", xp: 12000 },
    { name: "Homegrown", xp: 25000 },
    { name: "MLS Debut", xp: 45000 },
    { name: "All-Star", xp: 75000 },
    { name: "Mbappé Mode", xp: 110000 }
  ],

  /* Timed challenges for personal bests. */
  challenges: [
    { id: "toe30", name: "Toe Taps in 30 sec", seconds: 30, unit: "taps" },
    { id: "wall60", name: "Wall Passes in 60 sec", seconds: 60, unit: "passes" },
    { id: "juggle", name: "Juggling Record", seconds: 0, unit: "in a row" }
  ],

  badges: [
    { id: "first", name: "First Quest", desc: "Hit 500 for the first time" },
    { id: "streak3", name: "Hat Trick", desc: "3-day streak" },
    { id: "streak7", name: "Full Week", desc: "7-day streak" },
    { id: "streak14", name: "Unstoppable", desc: "14-day streak" },
    { id: "streak30", name: "Pro Habits", desc: "30-day streak" },
    { id: "right1k", name: "Right Foot Rising", desc: "1,000 right-foot reps" },
    { id: "right5k", name: "Two-Footed", desc: "5,000 right-foot reps" },
    { id: "reps10k", name: "10K Club", desc: "10,000 total reps" },
    { id: "reps50k", name: "50K Club", desc: "50,000 total reps" },
    { id: "juggle25", name: "Juggler", desc: "25 juggles in a row" },
    { id: "juggle50", name: "Air Control", desc: "50 juggles in a row" },
    { id: "pb", name: "Record Breaker", desc: "Beat a personal best" },
    { id: "mbappe", name: "Mbappé Unlocked", desc: "Unlock the first Mbappé move" },
    { id: "dad", name: "Coach's Pick", desc: "Awarded by Dad after a video review" }
  ]
};
