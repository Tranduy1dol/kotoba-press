import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { srs as srsApi, words as wordsApi } from "../api";
import type { SRSCardResponse, WordResponse } from "../api";
import { Paper, Button, Divider, Tag } from "./paper";

type Mode = "select" | "srs" | "quiz" | "typing" | "listening";

const VALID_MODES: Mode[] = ["srs", "quiz", "typing", "listening"];

export function LearnPage() {
  const { mode: modeParam } = useParams<{ mode?: string }>();
  const navigate = useNavigate();
  const [level, setLevel] = useState(5);

  const mode: Mode = VALID_MODES.includes(modeParam as Mode) ? (modeParam as Mode) : "select";
  const setMode = (m: Mode) => m === "select" ? navigate("/learn", { replace: true }) : navigate(`/learn/${m}`);

  if (mode === "select") return <ModeSelect level={level} setLevel={setLevel} onPick={setMode} />;
  if (mode === "srs") return <SRSMode onExit={() => setMode("select")} />;
  if (mode === "quiz") return <QuizMode level={level} onExit={() => setMode("select")} />;
  if (mode === "typing") return <TypingMode level={level} onExit={() => setMode("select")} />;
  if (mode === "listening") return <ListeningMode level={level} onExit={() => setMode("select")} />;
  return null;
}

const MODES: { id: Mode; title: string; jp: string; desc: string }[] = [
  { id: "srs", title: "Flashcards", jp: "復習", desc: "Spaced repetition. Reveal, judge, repeat." },
  { id: "quiz", title: "Multiple Choice", jp: "選択", desc: "Pick the correct answer from four options." },
  { id: "typing", title: "Typing Practice", jp: "入力", desc: "Type the reading from memory." },
  { id: "listening", title: "Listening", jp: "聴解", desc: "Hear a word, recall its meaning." },
];

function ModeSelect({ level, setLevel, onPick }: { level: number; setLevel: (l: number) => void; onPick: (m: Mode) => void }) {
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="italic mt-2" style={{ fontSize: "3rem", lineHeight: 1.1 }}>
          Learn
        </h1>
      </header>

      <Paper className="p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="italic text-[#7a6a45]">Level</p>
            <p>JLPT N{level}</p>
          </div>
          <div className="flex gap-2">
            {[5, 4, 3, 2, 1].map((lv) => (
              <button
                key={lv}
                onClick={() => setLevel(lv)}
                className={`px-4 py-2 border italic ${level === lv ? "bg-[#1f1a14] text-[#fbf8f1] border-[#1f1a14]" : "border-[#d9cfb8] hover:bg-[#efe6cf]"}`}
              >
                N{lv}
              </button>
            ))}
          </div>
        </div>
      </Paper>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onPick(m.id)}
            className="text-left bg-[#fbf8f1] border border-[#d9cfb8] p-6 hover:bg-[#efe6cf] transition-colors"
          >
            <div className="flex justify-between items-baseline">
              <p className="italic" style={{ fontSize: "1.4rem" }}>{m.title}</p>
              <span className="text-[#a89770]">{m.jp}</span>
            </div>
            <Divider className="my-3" />
            <p className="text-[#5e5132]">{m.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// SRS mode — uses /srs/due + /srs/review/{id}
function SRSMode({ onExit }: { onExit: () => void }) {
  const [cards, setCards] = useState<SRSCardResponse[]>([]);
  const [wordMap, setWordMap] = useState<Record<string, WordResponse>>({});
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ again: 0, good: 0, easy: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    srsApi.due(20)
      .then(async (due) => {
        setCards(due);
        const entries = await Promise.all(
          due.map((c) => wordsApi.get(c.word_id).then((w) => [c.word_id, w] as const))
        );
        setWordMap(Object.fromEntries(entries));
      })
      .catch(() => setError("Could not load your deck. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState title="Flashcards" onExit={onExit} />;
  if (error) return <ErrorState msg={error} onExit={onExit} />;
  if (cards.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <ModeHeader title="Flashcards" sub="All caught up" onExit={onExit} />
        <Paper className="p-12 text-center italic text-[#7a6a45]">
          No cards due for review. Come back tomorrow.
        </Paper>
      </div>
    );
  }

  const card = cards[index % cards.length];
  const word = wordMap[card.word_id];

  const grade = async (quality: number, key: "again" | "good" | "easy") => {
    try {
      await srsApi.review(card.id, quality);
    } catch { /* best-effort */ }
    setStats((s) => ({ ...s, [key]: s[key] + 1 }));
    setRevealed(false);
    setIndex((i) => i + 1);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <ModeHeader title="Flashcards" sub={`Card ${(index % cards.length) + 1} of ${cards.length}`} onExit={onExit} />

      <Paper className="p-12 text-center">
        {word && (
          <>
            <div className="mb-2 flex justify-center gap-2">
              <Tag>JLPT N{word.jlpt}</Tag>
              {word.is_common && <Tag>common</Tag>}
            </div>
            <p style={{ fontSize: "4rem", lineHeight: 1.1 }}>{word.kanji[0]?.text}</p>
            {revealed ? (
              <div className="mt-6">
                <p className="italic text-[#5e5132]" style={{ fontSize: "1.4rem" }}>{word.readings[0]?.text}</p>
                <Divider className="my-6 mx-auto w-24" />
                <p>{word.sense[0]?.gloss[0]?.text}</p>
                <p className="text-[#7a6a45] italic mt-1" style={{ fontSize: "0.9rem" }}>{word.sense[0]?.pos.join(", ")}</p>
              </div>
            ) : (
              <div className="mt-10">
                <Button variant="outline" onClick={() => setRevealed(true)}>Reveal reading & meaning</Button>
              </div>
            )}
          </>
        )}
      </Paper>

      {revealed && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Button variant="outline" onClick={() => grade(1, "again")}>Again</Button>
          <Button variant="outline" onClick={() => grade(3, "good")}>Good</Button>
          <Button onClick={() => grade(5, "easy")}>Easy</Button>
        </div>
      )}

      <div className="mt-8 flex justify-between text-[#5e5132]">
        <span>Again · {stats.again}</span>
        <span>Good · {stats.good}</span>
        <span>Easy · {stats.easy}</span>
      </div>
    </div>
  );
}

// Word-based modes share a loader hook
function useWordDeck(level: number) {
  const [deck, setDeck] = useState<WordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    wordsApi.byLevel(level, 50)
      .then((res) => setDeck(res.data ?? (res as unknown as WordResponse[])))
      .catch(() => setError("Could not load words. Please try again."))
      .finally(() => setLoading(false));
  }, [level]);

  return { deck, loading, error };
}

function QuizMode({ level, onExit }: { level: number; onExit: () => void }) {
  const { deck, loading, error } = useWordDeck(level);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (loading) return <LoadingState title="Multiple Choice" onExit={onExit} />;
  if (error || deck.length === 0) return <ErrorState msg={error || "No words found for this level."} onExit={onExit} />;

  // Build a simple quiz: show kanji, pick correct reading from 4 options
  const card = deck[i % deck.length];
  const correctReading = card.readings[0]?.text ?? "";
  const distractors = deck
    .filter((_, idx) => idx !== i % deck.length)
    .slice(0, 3)
    .map((w) => w.readings[0]?.text ?? "");
  const choices = shuffle([correctReading, ...distractors]);
  const correctIndex = choices.indexOf(correctReading);

  const next = () => {
    if (picked === correctIndex) setScore((s) => s + 1);
    if (i + 1 >= deck.length) setDone(true);
    else { setI(i + 1); setPicked(null); }
  };

  if (done) {
    return (
      <div className="max-w-2xl mx-auto">
        <ModeHeader title="Multiple Choice" sub="Result" onExit={onExit} />
        <Paper className="p-10 text-center">
          <p style={{ fontSize: "3rem" }}>{score} / {deck.length}</p>
          <p className="italic text-[#5e5132] mt-2">{score} / {deck.length}</p>
          <div className="mt-6">
            <Button onClick={() => { setI(0); setPicked(null); setScore(0); setDone(false); }}>Try again</Button>
          </div>
        </Paper>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <ModeHeader title="Multiple Choice" sub={`Question ${i + 1} of ${deck.length}`} onExit={onExit} />
      <Paper className="p-8">
        <div className="flex gap-2 mb-4">
          <Tag>JLPT N{card.jlpt}</Tag>
          <Tag>vocabulary</Tag>
        </div>
        <p style={{ fontSize: "1.6rem" }}>What is the reading of「{card.kanji[0]?.text}」?</p>
        <div className="mt-6 flex flex-col gap-2">
          {choices.map((c, idx) => {
            const correct = picked !== null && idx === correctIndex;
            const wrong = picked === idx && idx !== correctIndex;
            return (
              <button
                key={idx}
                disabled={picked !== null}
                onClick={() => setPicked(idx)}
                className={`text-left px-4 py-3 border transition-colors ${correct ? "bg-[#e8efd8] border-[#7a8950]"
                  : wrong ? "bg-[#f0d8d3] border-[#a06a5e]"
                    : picked === idx ? "bg-[#efe6cf] border-[#1f1a14]"
                      : "bg-[#fbf8f1] border-[#d9cfb8] hover:bg-[#efe6cf]"
                  }`}
              >
                <span className="italic mr-3 text-[#7a6a45]">{String.fromCharCode(97 + idx)}.</span>
                {c}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className="mt-5 italic text-[#5e5132] border-t border-[#cdbf9d] pt-4">
            {picked === correctIndex ? "Correct." : `Not quite — answer: ${correctReading}`}
            {" · "}{card.sense[0]?.gloss[0]?.text}
          </div>
        )}
      </Paper>
      <div className="mt-6 flex justify-between items-center">
        <span className="text-[#5e5132]">Score · {score}</span>
        <Button onClick={next} disabled={picked === null}>
          {i + 1 >= deck.length ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}

function TypingMode({ level, onExit }: { level: number; onExit: () => void }) {
  const { deck, loading, error } = useWordDeck(level);
  const [i, setI] = useState(0);
  const [input, setInput] = useState("");
  const [judged, setJudged] = useState<null | boolean>(null);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });

  if (loading) return <LoadingState title="Typing Practice" onExit={onExit} />;
  if (error || deck.length === 0) return <ErrorState msg={error || "No words found for this level."} onExit={onExit} />;

  const card = deck[i % deck.length];
  const submit = () => {
    const ok = input.trim() === card.readings[0]?.text;
    setJudged(ok);
    setStats((s) => ok ? { ...s, correct: s.correct + 1 } : { ...s, wrong: s.wrong + 1 });
  };
  const next = () => { setI(i + 1); setInput(""); setJudged(null); };

  return (
    <div className="max-w-2xl mx-auto">
      <ModeHeader title="Typing Practice" sub={`${stats.correct} correct · ${stats.wrong} wrong`} onExit={onExit} />
      <Paper className="p-10 text-center">
        <Tag>JLPT N{card.jlpt}</Tag>
        <p className="mt-3" style={{ fontSize: "3.5rem" }}>{card.kanji[0]?.text}</p>
        <p className="italic text-[#7a6a45] mt-2">Type the reading in hiragana</p>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (judged === null ? submit() : next())}
          disabled={judged !== null}
          className="mt-6 w-full text-center bg-transparent border-b-2 border-[#cdbf9d] focus:border-[#1f1a14] outline-none py-2 italic"
          style={{ fontSize: "1.8rem" }}
          placeholder="…"
        />
        {judged !== null && (
          <div className="mt-6">
            <p className={judged ? "text-[#5a6e34]" : "text-[#8a4438]"}>
              {judged ? "Correct." : `Not quite — answer: ${card.readings[0]?.text}`}
            </p>
            <p className="italic text-[#5e5132] mt-1">{card.sense[0]?.gloss[0]?.text}</p>
          </div>
        )}
      </Paper>
      <div className="mt-6 flex justify-end">
        {judged === null
          ? <Button onClick={submit} disabled={!input.trim()}>Check</Button>
          : <Button onClick={next}>Next word</Button>}
      </div>
    </div>
  );
}

function ListeningMode({ level, onExit }: { level: number; onExit: () => void }) {
  const { deck, loading, error } = useWordDeck(level);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (loading) return <LoadingState title="Listening" onExit={onExit} />;
  if (error || deck.length === 0) return <ErrorState msg={error || "No words found for this level."} onExit={onExit} />;

  const card = deck[i % deck.length];
  const speak = () => {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(card.readings[0]?.text || card.kanji[0]?.text);
    u.lang = "ja-JP";
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <ModeHeader title="Listening" sub={`Word ${(i % deck.length) + 1} of ${deck.length}`} onExit={onExit} />
      <Paper className="p-12 text-center">
        <Tag>JLPT N{card.jlpt}</Tag>
        <button onClick={speak} className="mt-6 mx-auto w-24 h-24 rounded-full border-2 border-[#1f1a14] flex items-center justify-center hover:bg-[#1f1a14] hover:text-[#fbf8f1] transition-colors">
          <span style={{ fontSize: "2rem" }}>♪</span>
        </button>
        {revealed ? (
          <div className="mt-8">
            <p style={{ fontSize: "2.5rem" }}>{card.kanji[0]?.text}</p>
            <p className="italic text-[#5e5132]">{card.readings[0]?.text}</p>
            <Divider className="my-4 mx-auto w-24" />
            <p>{card.sense[0]?.gloss[0]?.text}</p>
          </div>
        ) : (
          <div className="mt-8">
            <Button variant="outline" onClick={() => setRevealed(true)}>Reveal answer</Button>
          </div>
        )}
      </Paper>
      <div className="mt-6 flex justify-end">
        <Button onClick={() => { setI(i + 1); setRevealed(false); }}>Next</Button>
      </div>
    </div>
  );
}

function ModeHeader({ title, sub, onExit }: { title: string; sub: string; onExit: () => void }) {
  return (
    <header className="mb-6 flex justify-between items-end">
      <div>
        <p className="tracking-[0.25em] text-[#7a6a45]">LEARN</p>        <h2 className="italic">{title}</h2>
        <p className="text-[#5e5132]">{sub}</p>
      </div>
      <Button variant="ghost" onClick={onExit}>← Back</Button>
    </header>
  );
}

function LoadingState({ title, onExit }: { title: string; onExit: () => void }) {
  return (
    <div className="max-w-3xl mx-auto">
      <ModeHeader title={title} sub="Loading…" onExit={onExit} />
      <Paper className="p-12 text-center italic text-[#7a6a45]">Loading…</Paper>
    </div>
  );
}

function ErrorState({ msg, onExit }: { msg: string; onExit: () => void }) {
  return (
    <div className="max-w-3xl mx-auto">
      <ModeHeader title="Error" sub="" onExit={onExit} />
      <Paper className="p-12 text-center italic text-[#8a4438]">{msg}</Paper>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
