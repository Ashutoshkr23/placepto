"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const ROUND_SECONDS = 5.4;
const PASS_THROUGH_SECONDS = 0.8;
const TARGET_SCORE = 8;
const STAR_POINTS = [
  [8,12,2,.2],[18,28,1,1.4],[29,9,2,.8],[40,22,1,2.1],[52,8,1,1.1],[63,25,2,.4],[76,13,1,1.8],[89,31,2,.9],
  [12,44,1,2.5],[24,61,2,.6],[36,39,1,1.6],[49,53,2,2.2],[61,43,1,.3],[73,59,2,1.3],[86,48,1,2.7],[95,67,2,.7],
  [5,76,1,1.9],[17,88,2,.1],[31,73,1,1.2],[45,91,2,2.4],[58,79,1,.5],[70,92,2,1.5],[83,76,1,2],[93,89,1,.9],
] as const;

const LEVELS = [
  { divisor:2, rule:"The final digit is 0, 2, 4, 6, or 8.", tip:"Only check the final digit.", examples:[12,28,46] },
  { divisor:3, rule:"Add the digits. Their sum must be divisible by 3.", tip:"For 123: 1 + 2 + 3 = 6.", examples:[21,42,123] },
  { divisor:4, rule:"The number formed by the final two digits must be divisible by 4.", tip:"For 316, check 16.", examples:[24,52,316] },
  { divisor:5, rule:"The final digit must be 0 or 5.", tip:"Look only at the final digit.", examples:[25,70,135] },
  { divisor:6, rule:"The number must be divisible by both 2 and 3.", tip:"It must be even, and its digits must add to a multiple of 3.", examples:[18,42,126] },
  { divisor:8, rule:"The number formed by the final three digits must be divisible by 8.", tip:"For a three-digit number, check the whole number.", examples:[104,216,328] },
  { divisor:9, rule:"Add the digits. Their sum must be divisible by 9.", tip:"For 243: 2 + 4 + 3 = 9.", examples:[108,243,369] },
  { divisor:10, rule:"The final digit must be 0.", tip:"Every multiple of 10 ends in zero.", examples:[20,70,130] },
  { divisor:11, rule:"The alternating sum of the digits must be 0 or a multiple of 11.", tip:"For 121: 1 − 2 + 1 = 0.", examples:[121,242,363] },
] as const;

type Round = { id: number; lanes: number[]; answerLane: number };
type GameStatus = "intro" | "playing" | "crashed" | "complete" | "rule";
type Feedback = "clear" | null;

let nextRoundId = 0;
function randomBetween(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function createRound(divisor: number): Round {
  const usesThreeDigits = divisor === 8 || divisor === 9 || divisor === 11;
  const min = usesThreeDigits ? 100 : 10;
  const max = usesThreeDigits ? 399 : 99;
  const answerLane = Math.floor(Math.random() * 3);
  const minFactor = Math.ceil(min / divisor);
  const maxFactor = Math.floor(max / divisor);
  const answer = randomBetween(minFactor, maxFactor) * divisor;
  const wrong = new Set<number>();
  while (wrong.size < 2) {
    const candidate = randomBetween(min, max);
    if (candidate % divisor !== 0) wrong.add(candidate);
  }
  const lanes = [...wrong];
  lanes.splice(answerLane, 0, answer);
  return { id: ++nextRoundId, lanes, answerLane };
}

function RaceCar({ crashed = false }: { crashed?: boolean }) {
  return <div className="relative mx-auto h-28 w-24 drop-shadow-[0_14px_10px_rgba(0,0,0,.55)]">
    <div className="absolute bottom-0 left-1/2 h-8 w-16 -translate-x-1/2 rounded-full bg-[#54eaff]/35 blur-md" />
    <div className="absolute bottom-2 left-1/2 h-10 w-4 -translate-x-1/2 bg-gradient-to-b from-[#fff] via-[#61efff] to-transparent [clip-path:polygon(30%_0,70%_0,100%_100%,0_100%)]" />
    <div className={`absolute left-1/2 top-1 h-23 w-13 -translate-x-1/2 border border-white/40 shadow-[inset_0_0_14px_rgba(255,255,255,.28),0_0_18px_rgba(83,228,255,.55)] [clip-path:polygon(50%_0,83%_25%,76%_78%,50%_100%,24%_78%,17%_25%)] ${crashed ? "bg-gradient-to-b from-[#ff9c9c] to-[#d42d55]" : "bg-gradient-to-b from-[#af91ff] via-[#704cff] to-[#342168]"}`} />
    <div className="absolute left-1/2 top-5 h-10 w-8 -translate-x-1/2 rounded-[55%_55%_35%_35%] border border-[#c8f8ff]/80 bg-gradient-to-b from-[#d7fbff] to-[#4bc8e8]/70 shadow-[inset_0_0_10px_white,0_0_10px_#63eaff]" />
    <div className="absolute left-0 top-11 h-8 w-10 bg-gradient-to-r from-[#312061] to-[#825cff] [clip-path:polygon(100%_0,100%_100%,0_82%)]" />
    <div className="absolute right-0 top-11 h-8 w-10 bg-gradient-to-l from-[#312061] to-[#825cff] [clip-path:polygon(0_0,100%_82%,0_100%)]" />
    <div className="absolute left-2 top-16 h-2 w-5 rotate-12 rounded-full bg-[#65f5ff] shadow-[0_0_9px_#65f5ff]" /><div className="absolute right-2 top-16 h-2 w-5 -rotate-12 rounded-full bg-[#65f5ff] shadow-[0_0_9px_#65f5ff]" />
  </div>;
}

function SpaceWorld() {
  return <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_50%_28%,#26275d_0%,#101128_42%,#070713_100%)]">
    <div className="space-nebula absolute -left-28 top-12 h-72 w-72 rounded-full bg-[#713dff]/20 blur-[75px]" />
    <div className="space-nebula absolute -right-20 top-28 h-56 w-56 rounded-full bg-[#00d9ff]/15 blur-[65px] [animation-delay:-3s]" />
    {STAR_POINTS.map(([left,top,size,delay],index)=><span key={index} className="space-star absolute rounded-full bg-white" style={{left:`${left}%`,top:`${top}%`,width:size,height:size,animationDelay:`-${delay}s`}} />)}
    <div className="shooting-star absolute left-[12%] top-[18%] h-px w-24 -rotate-[28deg] bg-gradient-to-r from-transparent via-[#a9f4ff] to-white" />
    <div className="space-planet absolute right-[8%] top-[9%] h-16 w-16 rounded-full bg-gradient-to-br from-[#d8f7ff] to-[#7b71ff] shadow-[0_0_35px_#8cecff80] sm:h-24 sm:w-24"><div className="absolute inset-x-[-18%] top-1/2 h-2 -rotate-12 rounded-full border border-[#c8bcff]/70" /></div>
    <div className="horizon-glow absolute left-1/2 top-[31%] h-px w-40 -translate-x-1/2 bg-[#80efff] shadow-[0_0_18px_5px_#41dbff]" />
  </div>;
}

export function DivisibilityGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [status, setStatus] = useState<GameStatus>("intro");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [round, setRound] = useState<Round>(() => createRound(LEVELS[0].divisor));
  const [vehicleLane, setVehicleLane] = useState(1);
  const [time, setTime] = useState(ROUND_SECONDS);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const level = LEVELS[levelIndex];

  const resetRound = useCallback(() => {
    setRound(createRound(level.divisor)); setTime(ROUND_SECONDS); setFeedback(null);
  }, [level.divisor]);
  const start = useCallback(() => {
    setScore(0); setRound(createRound(level.divisor)); setVehicleLane(1); setTime(ROUND_SECONDS); setFeedback(null); setStatus("playing");
  }, [level.divisor]);
  const advanceLevel = useCallback(() => {
    const nextIndex = Math.min(levelIndex + 1, LEVELS.length - 1);
    setLevelIndex(nextIndex); setScore(0); setBest(0); setRound(createRound(LEVELS[nextIndex].divisor)); setVehicleLane(1); setTime(ROUND_SECONDS); setFeedback(null); setStatus("intro");
  }, [levelIndex]);

  const finishRound = useCallback(() => {
    if (vehicleLane !== round.answerLane) {
      setBest((current) => Math.max(current, score)); setStatus("crashed"); return;
    }
    const nextScore = score + 1;
    setScore(nextScore); setBest((current) => Math.max(current, nextScore)); setFeedback("clear");
    if (nextScore >= TARGET_SCORE) window.setTimeout(() => setStatus("complete"), PASS_THROUGH_SECONDS * 1000);
    else window.setTimeout(resetRound, PASS_THROUGH_SECONDS * 1000);
  }, [resetRound, round.answerLane, score, vehicleLane]);

  useEffect(() => {
    if (status !== "playing" || feedback) return;
    const timer = window.setTimeout(() => {
      if (time <= 0.1) { setTime(0); finishRound(); }
      else setTime((current) => Number((current - 0.1).toFixed(1)));
    }, 100);
    return () => window.clearTimeout(timer);
  }, [feedback, finishRound, status, time]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (status !== "playing" || feedback) return;
      if (event.key === "ArrowLeft") setVehicleLane((lane) => Math.max(0, lane - 1));
      if (event.key === "ArrowRight") setVehicleLane((lane) => Math.min(2, lane + 1));
      if (["1","2","3"].includes(event.key)) setVehicleLane(Number(event.key) - 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [feedback, status]);

  const timePercent = useMemo(() => `${Math.max(0, time / ROUND_SECONDS) * 100}%`, [time]);
  const isOverlayOpen = status !== "playing";

  return <main className="h-[100dvh] overflow-hidden bg-[#17142b] pt-[env(safe-area-inset-top)] text-white sm:px-5 sm:py-5">
    <div className="mx-auto flex h-full max-w-4xl flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between px-3 sm:h-auto sm:px-1"><Link href="/" className="text-xs font-black text-[#d8cdff] transition hover:text-white sm:text-sm">← Placepto</Link><div className="flex gap-1.5 sm:gap-2"><span className="rounded-full bg-[#292442] px-2.5 py-1 text-[10px] font-black sm:px-3 sm:py-1.5 sm:text-xs">BEST {best}</span><span className="rounded-full bg-[#6d4aff] px-2.5 py-1 text-[10px] font-black sm:px-3 sm:py-1.5 sm:text-xs">LEVEL {levelIndex+1}/{LEVELS.length} · ÷{level.divisor}</span></div></header>
      <div className="grid min-h-0 flex-1 gap-4 sm:mt-3 lg:grid-cols-[1fr_230px]">
        <section className="flex min-h-0 flex-col overflow-hidden bg-[#423c65] sm:rounded-[1.8rem] sm:border-[3px] sm:border-[#0f0d1f] sm:shadow-[0_10px_0_#0f0d1f,0_20px_35px_rgba(0,0,0,.28)]">
          <div className="flex shrink-0 items-center justify-between bg-[#f7f3ff] px-4 py-2.5 text-[#17142b] sm:px-6 sm:py-3"><div><p className="text-[9px] font-black tracking-[.18em] text-[#6d4aff] sm:text-[10px]">DIVISIBILITY DASH</p><h1 className="display text-xl font-black sm:text-3xl">Find a multiple of {level.divisor}</h1></div><div className="flex h-11 w-11 flex-col items-center justify-center rounded-xl border-2 border-[#17142b] bg-[#ffd85c] shadow-[0_3px_0_#17142b] sm:h-13 sm:w-13 sm:rounded-2xl"><b className="text-base leading-none sm:text-lg">{score}</b><span className="text-[7px] font-black sm:text-[8px]">SCORE</span></div></div>
          <div className="relative min-h-0 flex-1 overflow-hidden lg:h-[600px] lg:flex-none">
            <SpaceWorld />
            <div className="absolute bottom-0 left-1/2 h-[70%] w-[118%] -translate-x-1/2 bg-gradient-to-b from-[#111329cc] to-[#191a34] [clip-path:polygon(42%_0,58%_0,100%_100%,0_100%)] shadow-[inset_0_0_80px_#050510]">
              <div className="track-flow absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(118,231,255,.18)_1px,transparent_1px)] [background-size:100%_42px]" />
              <div className="track-edge absolute inset-0 bg-[#76e7ff] [clip-path:polygon(41.6%_0,42.1%_0,.7%_100%,0_100%,0_98.5%)] drop-shadow-[0_0_7px_#76e7ff]" />
              <div className="track-edge absolute inset-0 bg-[#76e7ff] [clip-path:polygon(57.9%_0,58.4%_0,100%_98.5%,100%_100%,99.3%_100%)] drop-shadow-[0_0_7px_#76e7ff] [animation-delay:-1.1s]" />
              <div className="lane-energy absolute inset-0 bg-[#8f7cff] [clip-path:polygon(47.25%_0,47.65%_0,34%_100%,33%_100%)] drop-shadow-[0_0_6px_#8f7cff]" />
              <div className="lane-energy absolute inset-0 bg-[#8f7cff] [clip-path:polygon(52.35%_0,52.75%_0,67%_100%,66%_100%)] drop-shadow-[0_0_6px_#8f7cff] [animation-delay:-.8s]" />
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#050510]/80 to-transparent" />
            </div>
            <div className="absolute inset-x-0 top-4 z-10 mx-auto w-fit rounded-full border border-white/20 bg-[#17142bd9] px-4 py-2 text-center text-xs font-black tracking-wide shadow-lg backdrop-blur">MULTIPLE OF {level.divisor} = SAFE LANE</div>

            {status==="playing"&&<div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">{[8,19,31,69,82,93].map((left,index)=><span key={left} className="speed-streak absolute top-[24%] h-12 w-px bg-gradient-to-b from-transparent via-[#8cecff]/80 to-transparent" style={{left:`${left}%`,animationDelay:`-${index*.22}s`,animationDuration:`${1.15+(index%3)*.18}s`}}/>)}</div>}

            {status === "playing" && <motion.div key={round.id} initial={{ top:"30%", scale:.28 }} animate={{ top:["30%","73%","106%"], scale:[.28,1.12,1.48] }} transition={{ duration:ROUND_SECONDS+PASS_THROUGH_SECONDS, times:[0,ROUND_SECONDS/(ROUND_SECONDS+PASS_THROUGH_SECONDS),1], ease:"linear" }} className="absolute left-[7%] z-20 grid w-[86%] grid-cols-3 gap-3 sm:gap-7">
              {round.lanes.map((number,index)=><div key={`${number}-${index}`} className="relative flex flex-col items-center"><div className={`relative grid aspect-[1.18/1] w-full max-w-25 place-items-center overflow-hidden rounded-2xl border text-2xl font-black text-white backdrop-blur-md sm:text-3xl ${feedback && index===round.answerLane ? "border-[#8fffc4] bg-[#2cda82]/35 shadow-[0_0_26px_#4bff9f]" : "border-[#bcefff]/70 bg-white/10 shadow-[inset_0_0_18px_rgba(255,255,255,.14),0_0_24px_rgba(81,218,255,.35)]"}`}><span className="absolute inset-x-3 top-2 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"/><span className="relative drop-shadow-[0_0_9px_#8cecff]">{number}</span><span className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-[#8cecff] shadow-[0_0_8px_#8cecff]"/></div><div className="h-9 w-px bg-gradient-to-b from-[#8cecff] to-transparent shadow-[0_0_8px_#8cecff]"/></div>)}
            </motion.div>}

            <motion.div animate={{ left:`${vehicleLane * 33.333 + 16.666}%` }} transition={{ type:"spring", stiffness:300, damping:25 }} className="absolute bottom-23 z-30 -translate-x-1/2 lg:bottom-5"><motion.div animate={status==="crashed"?{rotate:[0,-15,22,-12,0],x:[0,-8,7,-4,0]}:feedback?{y:[0,-8,0]}:{}}><RaceCar crashed={status==="crashed"}/></motion.div></motion.div>
            <AnimatePresence>{feedback && <motion.div initial={{opacity:0,y:8,scale:.75}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8}} className="pointer-events-none absolute inset-x-0 top-[19%] z-40 text-center"><span className="inline-block -rotate-2 rounded-2xl border-2 border-[#bff5d0]/80 bg-[#bff5d0]/70 px-5 py-2 text-xl font-black text-[#17142b] shadow-[0_4px_18px_rgba(111,255,177,.28)] backdrop-blur-sm">CLEAR! +1</span></motion.div>}</AnimatePresence>

            <div className="absolute inset-x-0 bottom-0 z-40 h-1.5 bg-[#302c52] lg:hidden"><motion.div className="h-full bg-[#ffd85c]" animate={{width:status==="playing"?timePercent:"100%"}} transition={{duration:.08}}/></div>
            <div className="pointer-events-none absolute inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex items-end justify-between px-4 lg:hidden">
              <button aria-label="Move left" disabled={status!=="playing"||Boolean(feedback)||vehicleLane===0} onClick={()=>setVehicleLane((lane)=>Math.max(0,lane-1))} className="pointer-events-auto grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-[#111329]/75 text-3xl font-black shadow-[0_8px_24px_rgba(0,0,0,.4),inset_0_0_18px_rgba(255,255,255,.08)] backdrop-blur-md active:scale-90 disabled:opacity-25">←</button>
              <div className="mb-2 flex gap-1.5">{[0,1,2].map((lane)=><span key={lane} className={`h-1.5 w-4 rounded-full ${vehicleLane===lane?"bg-[#ffd85c] shadow-[0_0_8px_#ffd85c]":"bg-white/25"}`}/>)}</div>
              <button aria-label="Move right" disabled={status!=="playing"||Boolean(feedback)||vehicleLane===2} onClick={()=>setVehicleLane((lane)=>Math.min(2,lane+1))} className="pointer-events-auto grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-[#6d4aff]/75 text-3xl font-black shadow-[0_8px_24px_rgba(0,0,0,.4),inset_0_0_18px_rgba(255,255,255,.1)] backdrop-blur-md active:scale-90 disabled:opacity-25">→</button>
            </div>

            <AnimatePresence>{isOverlayOpen && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute inset-0 z-50 grid place-items-center bg-[#17142be8] p-6 text-center backdrop-blur-[3px]"><motion.div initial={{y:18,scale:.96}} animate={{y:0,scale:1}} className="max-w-sm">
              {status==="intro" && <><div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border-2 border-white/20 bg-[#6d4aff] text-3xl font-black shadow-[0_7px_0_#4930bc]">÷{level.divisor}</div><p className="mt-6 text-xs font-black tracking-[.18em] text-[#ffd85c]">LEVEL {levelIndex+1} · RULE OF {level.divisor}</p><h2 className="display mt-2 text-4xl font-black sm:text-5xl">Ready to race?</h2><p className="mt-3 font-bold leading-6 text-[#d8cdff]">Move to a number divisible by {level.divisor} before the gates reach you. Clear {TARGET_SCORE} gates to win.</p><button onClick={start} className="mt-7 rounded-full bg-[#ffd85c] px-7 py-3.5 font-black text-[#17142b] shadow-[0_5px_0_#b68e18] transition active:translate-y-1 active:shadow-none">Start level {levelIndex+1} →</button></>}
              {status==="crashed" && <><div className="text-6xl">💥</div><p className="mt-4 text-xs font-black tracking-[.18em] text-[#ff9ba3]">ROUND OVER</p><h2 className="display mt-2 text-4xl font-black">Not divisible by {level.divisor}</h2><p className="mt-3 font-bold text-[#d8cdff]">You cleared {score} {score===1?"gate":"gates"}. Review the rule and race again.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick={start} className="rounded-full bg-[#ffd85c] px-6 py-3 font-black text-[#17142b]">Try again</button><button onClick={()=>setStatus("rule")} className="rounded-full border-2 border-white px-6 py-3 font-black">Check the rule</button></div></>}
              {status==="complete" && <><div className="text-6xl">🏆</div><p className="mt-4 text-xs font-black tracking-[.18em] text-[#bff5d0]">LEVEL {levelIndex+1} COMPLETE</p><h2 className="display mt-2 text-4xl font-black">Track cleared!</h2><p className="mt-3 font-bold text-[#d8cdff]">You spotted all {TARGET_SCORE} multiples of {level.divisor}. That was fast thinking.</p><div className="mt-7 flex flex-wrap justify-center gap-3">{levelIndex<LEVELS.length-1&&<button onClick={advanceLevel} className="rounded-full bg-[#ffd85c] px-6 py-3 font-black text-[#17142b]">Next: rule of {LEVELS[levelIndex+1].divisor} →</button>}<button onClick={start} className="rounded-full border-2 border-white px-6 py-3 font-black">Race again</button></div>{levelIndex===LEVELS.length-1&&<p className="mt-5 font-black text-[#ffd85c]">All nine divisibility tracks cleared!</p>}</>}
              {status==="rule" && <><div className="text-6xl">💡</div><h2 className="display mt-3 text-4xl font-black">The rule of {level.divisor}</h2><p className="mt-3 font-bold leading-6 text-[#d8cdff]">{level.rule}</p><p className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-[#ffd85c]">{level.tip}</p><div className="mx-auto mt-5 flex max-w-xs justify-center gap-2">{level.examples.map(n=><b key={n} className="grid min-w-13 place-items-center rounded-xl bg-white px-3 py-2 text-[#17142b]">{n}</b>)}</div><button onClick={start} className="mt-7 rounded-full bg-[#ffd85c] px-6 py-3 font-black text-[#17142b]">Got it — race again</button></>}
            </motion.div></motion.div>}</AnimatePresence>
          </div>
        </section>

        <aside className="hidden flex-col gap-4 lg:flex"><div className="rounded-3xl bg-[#292442] p-5"><div className="flex items-center justify-between text-xs font-black"><span>GATE {Math.min(score+1,TARGET_SCORE)} / {TARGET_SCORE}</span><span>{Math.ceil(time)}s</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#423c65]"><motion.div className="h-full bg-[#ffd85c]" animate={{width:status==="playing"?timePercent:"100%"}} transition={{duration:.08}}/></div></div>
          <div className="rounded-3xl bg-[#f7f3ff] p-4 text-[#17142b]"><p className="text-center text-xs font-black tracking-wider text-[#6d4aff]">STEER</p><div className="mt-3 grid grid-cols-2 gap-3"><button aria-label="Move left" disabled={status!=="playing"||Boolean(feedback)||vehicleLane===0} onClick={()=>setVehicleLane((lane)=>Math.max(0,lane-1))} className="group rounded-2xl border-2 border-[#17142b] bg-white px-3 py-4 text-xl font-black shadow-[0_4px_0_#17142b] transition hover:bg-[#ece7ff] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-35"><span className="inline-block transition group-active:-translate-x-1">←</span><span className="ml-2 text-xs">LEFT</span></button><button aria-label="Move right" disabled={status!=="playing"||Boolean(feedback)||vehicleLane===2} onClick={()=>setVehicleLane((lane)=>Math.min(2,lane+1))} className="group rounded-2xl border-2 border-[#17142b] bg-[#ffd85c] px-3 py-4 text-xl font-black shadow-[0_4px_0_#17142b] transition hover:bg-[#ffe68d] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-35"><span className="mr-2 text-xs">RIGHT</span><span className="inline-block transition group-active:translate-x-1">→</span></button></div><div className="mt-4 flex items-center justify-center gap-2"><span className={`h-2 w-2 rounded-full ${vehicleLane===0?"bg-[#6d4aff]":"bg-[#d3cee1]"}`}/><span className={`h-2 w-2 rounded-full ${vehicleLane===1?"bg-[#6d4aff]":"bg-[#d3cee1]"}`}/><span className={`h-2 w-2 rounded-full ${vehicleLane===2?"bg-[#6d4aff]":"bg-[#d3cee1]"}`}/></div><p className="mt-3 text-center text-[11px] font-bold text-[#68647d]">Tap to move one lane · Keyboard ← →</p></div>
          <div className="hidden rounded-3xl border border-white/10 bg-[#292442] p-5 text-sm font-bold leading-6 text-[#c9c4df] lg:block"><span className="text-[#ffd85c]">Quick tip:</span><br/>{level.tip}</div>
        </aside>
      </div>
    </div>
  </main>;
}
