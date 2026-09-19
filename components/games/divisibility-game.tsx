"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const evenNumbers = [12,14,16,18,22,24,26,28,32,34,36,38,42,46,48,52,54,58,62,64,68,72,74,78,82,84,86,88,92,94,96,98];
const oddNumbers = [11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,49,51,53,55,57,59,61,63,65,67,69,71,73,75,77,79,81,83,85,87,89,91,93,95,97,99];
const ROUND_SECONDS = 5.4;
const PASS_THROUGH_SECONDS = 0.8;
const TARGET_SCORE = 8;

type Round = { lanes: number[]; answerLane: number };
type GameStatus = "intro" | "playing" | "crashed" | "complete" | "rule";
type Feedback = "clear" | null;

function sample<T>(items: T[]) { return items[Math.floor(Math.random() * items.length)]; }
function createRound(): Round {
  const answerLane = Math.floor(Math.random() * 3);
  const wrong = [...oddNumbers].sort(() => Math.random() - 0.5).slice(0, 2);
  const lanes = [...wrong];
  lanes.splice(answerLane, 0, sample(evenNumbers));
  return { lanes, answerLane };
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
    <div className="absolute inset-0 opacity-80 [background-image:radial-gradient(circle,#fff_0_1px,transparent_1.5px),radial-gradient(circle,#8cecff_0_1px,transparent_1.5px)] [background-position:0_0,25px_35px] [background-size:68px_68px,94px_94px]" />
    <div className="absolute -left-28 top-12 h-72 w-72 rounded-full bg-[#713dff]/20 blur-[75px]" />
    <div className="absolute -right-20 top-28 h-56 w-56 rounded-full bg-[#00d9ff]/15 blur-[65px]" />
    <div className="absolute right-[8%] top-[9%] h-16 w-16 rounded-full bg-gradient-to-br from-[#d8f7ff] to-[#7b71ff] shadow-[0_0_35px_#8cecff80] sm:h-24 sm:w-24"><div className="absolute inset-x-[-18%] top-1/2 h-2 -rotate-12 rounded-full border border-[#c8bcff]/70" /></div>
    <div className="absolute left-1/2 top-[31%] h-px w-40 -translate-x-1/2 bg-[#80efff] shadow-[0_0_18px_5px_#41dbff]" />
  </div>;
}

export function DivisibilityGame() {
  const [status, setStatus] = useState<GameStatus>("intro");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [round, setRound] = useState<Round>(() => createRound());
  const [vehicleLane, setVehicleLane] = useState(1);
  const [time, setTime] = useState(ROUND_SECONDS);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const resetRound = useCallback(() => {
    setRound(createRound()); setTime(ROUND_SECONDS); setFeedback(null);
  }, []);
  const start = useCallback(() => {
    setScore(0); setRound(createRound()); setVehicleLane(1); setTime(ROUND_SECONDS); setFeedback(null); setStatus("playing");
  }, []);

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

  return <main className="min-h-screen overflow-hidden bg-[#17142b] px-3 py-4 text-white sm:px-6 sm:py-6">
    <div className="mx-auto max-w-4xl">
      <header className="flex items-center justify-between px-1"><Link href="/" className="text-sm font-black text-[#d8cdff] transition hover:text-white">← Back to Placepto</Link><div className="flex gap-2"><span className="rounded-full bg-[#292442] px-3 py-1.5 text-xs font-black">BEST {best}</span><span className="rounded-full bg-[#6d4aff] px-3 py-1.5 text-xs font-black">RULE OF 2</span></div></header>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_230px]">
        <section className="overflow-hidden rounded-[1.8rem] border-[3px] border-[#0f0d1f] bg-[#423c65] shadow-[0_10px_0_#0f0d1f,0_20px_35px_rgba(0,0,0,.28)]">
          <div className="flex items-center justify-between bg-[#f7f3ff] px-4 py-3 text-[#17142b] sm:px-6"><div><p className="text-[10px] font-black tracking-[.18em] text-[#6d4aff]">DIVISIBILITY DASH</p><h1 className="display text-2xl font-black sm:text-3xl">Find a multiple of 2</h1></div><div className="flex h-13 w-13 flex-col items-center justify-center rounded-2xl border-2 border-[#17142b] bg-[#ffd85c] shadow-[0_3px_0_#17142b]"><b className="text-lg leading-none">{score}</b><span className="text-[8px] font-black">SCORE</span></div></div>
          <div className="relative h-[440px] overflow-hidden sm:h-[500px] lg:h-[600px]">
            <SpaceWorld />
            <div className="absolute bottom-0 left-1/2 h-[70%] w-[118%] -translate-x-1/2 bg-gradient-to-b from-[#111329cc] to-[#191a34] [clip-path:polygon(42%_0,58%_0,100%_100%,0_100%)] shadow-[inset_0_0_80px_#050510]">
              <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(118,231,255,.15)_1px,transparent_1px)] [background-size:100%_42px]" />
              <div className="absolute inset-0 bg-[#76e7ff] [clip-path:polygon(41.6%_0,42.1%_0,.7%_100%,0_100%,0_98.5%)] drop-shadow-[0_0_7px_#76e7ff]" />
              <div className="absolute inset-0 bg-[#76e7ff] [clip-path:polygon(57.9%_0,58.4%_0,100%_98.5%,100%_100%,99.3%_100%)] drop-shadow-[0_0_7px_#76e7ff]" />
              <div className="absolute inset-0 bg-[#8f7cff] opacity-85 [clip-path:polygon(47.25%_0,47.65%_0,34%_100%,33%_100%)] drop-shadow-[0_0_6px_#8f7cff]" />
              <div className="absolute inset-0 bg-[#8f7cff] opacity-85 [clip-path:polygon(52.35%_0,52.75%_0,67%_100%,66%_100%)] drop-shadow-[0_0_6px_#8f7cff]" />
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#050510]/80 to-transparent" />
            </div>
            <div className="absolute inset-x-0 top-4 z-10 mx-auto w-fit rounded-full border border-white/20 bg-[#17142bd9] px-4 py-2 text-center text-xs font-black tracking-wide shadow-lg backdrop-blur">EVEN NUMBER = SAFE LANE</div>

            {status === "playing" && <motion.div key={`${round.lanes.join("-")}-${score}`} initial={{ top:"30%", scale:.28 }} animate={{ top:["30%","73%","106%"], scale:[.28,1.12,1.48] }} transition={{ duration:ROUND_SECONDS+PASS_THROUGH_SECONDS, times:[0,ROUND_SECONDS/(ROUND_SECONDS+PASS_THROUGH_SECONDS),1], ease:"linear" }} className="absolute left-[7%] z-20 grid w-[86%] grid-cols-3 gap-3 sm:gap-7">
              {round.lanes.map((number,index)=><div key={`${number}-${index}`} className="relative flex flex-col items-center"><div className={`relative grid aspect-[1.18/1] w-full max-w-25 place-items-center overflow-hidden rounded-2xl border text-2xl font-black text-white backdrop-blur-md sm:text-3xl ${feedback && index===round.answerLane ? "border-[#8fffc4] bg-[#2cda82]/35 shadow-[0_0_26px_#4bff9f]" : "border-[#bcefff]/70 bg-white/10 shadow-[inset_0_0_18px_rgba(255,255,255,.14),0_0_24px_rgba(81,218,255,.35)]"}`}><span className="absolute inset-x-3 top-2 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"/><span className="relative drop-shadow-[0_0_9px_#8cecff]">{number}</span><span className="absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full bg-[#8cecff] shadow-[0_0_8px_#8cecff]"/></div><div className="h-9 w-px bg-gradient-to-b from-[#8cecff] to-transparent shadow-[0_0_8px_#8cecff]"/></div>)}
            </motion.div>}

            <motion.div animate={{ left:`${vehicleLane * 33.333 + 16.666}%` }} transition={{ type:"spring", stiffness:300, damping:25 }} className="absolute bottom-5 z-30 -translate-x-1/2"><motion.div animate={status==="crashed"?{rotate:[0,-15,22,-12,0],x:[0,-8,7,-4,0]}:feedback?{y:[0,-8,0]}:{}}><RaceCar crashed={status==="crashed"}/></motion.div></motion.div>
            <AnimatePresence>{feedback && <motion.div initial={{opacity:0,y:8,scale:.75}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8}} className="pointer-events-none absolute inset-x-0 top-[19%] z-40 text-center"><span className="inline-block -rotate-2 rounded-2xl border-2 border-[#bff5d0]/80 bg-[#bff5d0]/70 px-5 py-2 text-xl font-black text-[#17142b] shadow-[0_4px_18px_rgba(111,255,177,.28)] backdrop-blur-sm">CLEAR! +1</span></motion.div>}</AnimatePresence>

            <AnimatePresence>{isOverlayOpen && <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute inset-0 z-50 grid place-items-center bg-[#17142be8] p-6 text-center backdrop-blur-[3px]"><motion.div initial={{y:18,scale:.96}} animate={{y:0,scale:1}} className="max-w-sm">
              {status==="intro" && <><div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border-2 border-white/20 bg-[#6d4aff] text-4xl shadow-[0_7px_0_#4930bc]">🏁</div><p className="mt-6 text-xs font-black tracking-[.18em] text-[#ffd85c]">DAY 01 · RULE OF 2</p><h2 className="display mt-2 text-4xl font-black sm:text-5xl">Ready to race?</h2><p className="mt-3 font-bold leading-6 text-[#d8cdff]">Move your car to the even number before the signs reach you. Clear 8 gates to win.</p><button onClick={start} className="mt-7 rounded-full bg-[#ffd85c] px-7 py-3.5 font-black text-[#17142b] shadow-[0_5px_0_#b68e18] transition active:translate-y-1 active:shadow-none">Start the engine →</button></>}
              {status==="crashed" && <><div className="text-6xl">💥</div><p className="mt-4 text-xs font-black tracking-[.18em] text-[#ff9ba3]">ROUND OVER</p><h2 className="display mt-2 text-4xl font-black">That lane was odd!</h2><p className="mt-3 font-bold text-[#d8cdff]">You cleared {score} {score===1?"gate":"gates"}. Check the last digit and go again.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick={start} className="rounded-full bg-[#ffd85c] px-6 py-3 font-black text-[#17142b]">Try again</button><button onClick={()=>setStatus("rule")} className="rounded-full border-2 border-white px-6 py-3 font-black">Check the rule</button></div></>}
              {status==="complete" && <><div className="text-6xl">🏆</div><p className="mt-4 text-xs font-black tracking-[.18em] text-[#bff5d0]">CHALLENGE COMPLETE</p><h2 className="display mt-2 text-4xl font-black">Road cleared!</h2><p className="mt-3 font-bold text-[#d8cdff]">You spotted all 8 multiples of 2. That was fast thinking.</p><button onClick={start} className="mt-7 rounded-full bg-[#ffd85c] px-6 py-3 font-black text-[#17142b]">Race again</button></>}
              {status==="rule" && <><div className="text-6xl">💡</div><h2 className="display mt-3 text-4xl font-black">The rule of 2</h2><p className="mt-3 font-bold leading-6 text-[#d8cdff]">Look at the final digit. If it is <span className="text-[#ffd85c]">0, 2, 4, 6, or 8</span>, the number is divisible by 2.</p><div className="mx-auto mt-5 flex max-w-xs justify-center gap-2">{[0,2,4,6,8].map(n=><b key={n} className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#17142b]">{n}</b>)}</div><button onClick={start} className="mt-7 rounded-full bg-[#ffd85c] px-6 py-3 font-black text-[#17142b]">Got it — race again</button></>}
            </motion.div></motion.div>}</AnimatePresence>
          </div>
        </section>

        <aside className="flex flex-col gap-4"><div className="rounded-3xl bg-[#292442] p-5"><div className="flex items-center justify-between text-xs font-black"><span>GATE {Math.min(score+1,TARGET_SCORE)} / {TARGET_SCORE}</span><span>{Math.ceil(time)}s</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#423c65]"><motion.div className="h-full bg-[#ffd85c]" animate={{width:status==="playing"?timePercent:"100%"}} transition={{duration:.08}}/></div></div>
          <div className="rounded-3xl bg-[#f7f3ff] p-4 text-[#17142b]"><p className="text-center text-xs font-black tracking-wider text-[#6d4aff]">STEER</p><div className="mt-3 grid grid-cols-2 gap-3"><button aria-label="Move left" disabled={status!=="playing"||Boolean(feedback)||vehicleLane===0} onClick={()=>setVehicleLane((lane)=>Math.max(0,lane-1))} className="group rounded-2xl border-2 border-[#17142b] bg-white px-3 py-4 text-xl font-black shadow-[0_4px_0_#17142b] transition hover:bg-[#ece7ff] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-35"><span className="inline-block transition group-active:-translate-x-1">←</span><span className="ml-2 text-xs">LEFT</span></button><button aria-label="Move right" disabled={status!=="playing"||Boolean(feedback)||vehicleLane===2} onClick={()=>setVehicleLane((lane)=>Math.min(2,lane+1))} className="group rounded-2xl border-2 border-[#17142b] bg-[#ffd85c] px-3 py-4 text-xl font-black shadow-[0_4px_0_#17142b] transition hover:bg-[#ffe68d] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-35"><span className="mr-2 text-xs">RIGHT</span><span className="inline-block transition group-active:translate-x-1">→</span></button></div><div className="mt-4 flex items-center justify-center gap-2"><span className={`h-2 w-2 rounded-full ${vehicleLane===0?"bg-[#6d4aff]":"bg-[#d3cee1]"}`}/><span className={`h-2 w-2 rounded-full ${vehicleLane===1?"bg-[#6d4aff]":"bg-[#d3cee1]"}`}/><span className={`h-2 w-2 rounded-full ${vehicleLane===2?"bg-[#6d4aff]":"bg-[#d3cee1]"}`}/></div><p className="mt-3 text-center text-[11px] font-bold text-[#68647d]">Tap to move one lane · Keyboard ← →</p></div>
          <div className="hidden rounded-3xl border border-white/10 bg-[#292442] p-5 text-sm font-bold leading-6 text-[#c9c4df] lg:block"><span className="text-[#ffd85c]">Quick tip:</span><br/>Don’t calculate the whole number. Only check its last digit.</div>
        </aside>
      </div>
    </div>
  </main>;
}
