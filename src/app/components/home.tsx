import { useEffect, useState } from "react";
import { words as wordsApi, grammar as grammarApi } from "../api";
import type { WordResponse, GrammarResponse } from "../api";
import { useAuth } from "../auth";
import { mockAnalytics } from "./mock-data";
import { Paper, Divider, Tag, Button } from "./paper";

export function HomePage({ onGoLearn, onGoTest }: { onGoLearn: () => void; onGoTest: () => void }) {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"words" | "grammar">("words");
  const [wordResults, setWordResults] = useState<WordResponse[]>([]);
  const [grammarResults, setGrammarResults] = useState<GrammarResponse[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setWordResults([]);
      setGrammarResults([]);
      return;
    }
    const id = setTimeout(async () => {
      setSearching(true);
      try {
        const [ws, gs] = await Promise.all([
          wordsApi.search(q),
          grammarApi.list(5, 100).then((all) => {
            const lower = q.toLowerCase();
            return all.filter((g) => g.pattern.includes(q) || g.meaning.toLowerCase().includes(lower));
          }),
        ]);
        setWordResults(ws);
        setGrammarResults(gs);
      } catch {
        // silently ignore search errors
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [q]);

  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="mt-2" style={{ fontSize: "3rem", lineHeight: 1.1 }}>
          Welcome back, {firstName}
        </h1>
      </header>

      <Paper className="p-2 mb-10">
        <div className="flex items-center px-3">
          <span className="italic text-[#a89770] mr-3">辞書</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a word, kana, kanji, or English meaning…"
            className="flex-1 bg-transparent outline-none py-3 italic placeholder-[#a89770]"
            style={{ fontSize: "1.1rem" }}
          />
          {searching && <span className="italic text-[#a89770] px-2" style={{ fontSize: "0.85rem" }}>…</span>}
          {q && !searching && (
            <button onClick={() => setQ("")} className="italic text-[#7a6a45] px-2">clear</button>
          )}
        </div>
      </Paper>

      {q ? (
        <SearchResults
          tab={tab}
          setTab={setTab}
          wordResults={wordResults}
          grammarResults={grammarResults}
          q={q}
        />
      ) : (
        <>
          <Analytics />
          <Divider className="my-12" />
          <QuickActions onGoLearn={onGoLearn} onGoTest={onGoTest} />
        </>
      )}
    </div>
  );
}

function Analytics() {
  const { user } = useAuth();
  const a = mockAnalytics;
  const max = Math.max(...a.weeklyMinutes);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const level = user?.study_progress.jlpt_level ?? a.streak;
  const cardsStudied = user?.study_progress.cards_studied ?? a.cardsLearned;

  return (
    <section>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Current streak" value={`${a.streak} days`} sub={`longest · ${a.longestStreak}`} />
        <Stat label="Cards learned" value={String(cardsStudied)} sub={`${a.cardsDueToday} due today`} />
        <Stat label="Quizzes taken" value={String(a.quizzesTaken)} sub={`${Math.round(a.accuracy * 100)}% accuracy`} />
        <Stat label="Level" value={`N${level}`} sub="current focus" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Paper className="p-6">
          <p className="italic text-[#7a6a45]">Weekly study (minutes)</p>
          <div className="flex items-end gap-3 h-32 mt-4">
            {a.weeklyMinutes.map((m, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-[#1f1a14]" style={{ height: `${(m / max) * 100}%` }} />
                <span className="italic text-[#7a6a45]" style={{ fontSize: "0.8rem" }}>{days[idx]}</span>
              </div>
            ))}
          </div>
        </Paper>

        <Paper className="p-6">
          <p className="italic text-[#7a6a45]">Recent activity</p>
          <ul className="mt-4 space-y-3">
            {a.recent.map((r, idx) => (
              <li key={idx} className="flex justify-between items-baseline border-b border-[#e5dabc] pb-2 last:border-b-0">
                <div>
                  <p>{r.action}</p>
                  <p className="italic text-[#7a6a45]" style={{ fontSize: "0.85rem" }}>{r.detail}</p>
                </div>
                <span className="italic text-[#a89770]" style={{ fontSize: "0.85rem" }}>{r.date}</span>
              </li>
            ))}
          </ul>
        </Paper>
      </div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Paper className="p-5">
      <p className="italic text-[#7a6a45]" style={{ fontSize: "0.85rem" }}>{label}</p>
      <p style={{ fontSize: "1.8rem", lineHeight: 1.1 }} className="mt-1">{value}</p>
      <p className="italic text-[#a89770] mt-1" style={{ fontSize: "0.8rem" }}>{sub}</p>
    </Paper>
  );
}

function QuickActions({ onGoLearn, onGoTest }: { onGoLearn: () => void; onGoTest: () => void }) {
  return (
    <section>
      <p className="text-[#7a6a45] italic mb-3">Continue</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Paper className="p-6">
          <h3 className="italic">Review</h3>
          <p className="text-[#5e5132] mt-1">{mockAnalytics.cardsDueToday} cards due.</p>
          <div className="mt-4">
            <Button onClick={onGoLearn}>Start</Button>
          </div>
        </Paper>
        <Paper className="p-6">
          <h3 className="italic">Mock test</h3>
          <p className="text-[#5e5132] mt-1">Vocabulary, grammar, and reading.</p>
          <div className="mt-4">
            <Button variant="outline" onClick={onGoTest}>Start</Button>
          </div>
        </Paper>
      </div>
    </section>
  );
}

function SearchResults({
  tab, setTab, wordResults, grammarResults, q,
}: {
  tab: "words" | "grammar";
  setTab: (t: "words" | "grammar") => void;
  wordResults: WordResponse[];
  grammarResults: GrammarResponse[];
  q: string;
}) {
  return (
    <section>
      <div className="flex gap-6 border-b border-[#cdbf9d]">
        {(["words", "grammar"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-1 italic ${tab === t ? "border-b-2 border-[#1f1a14] text-[#1f1a14]" : "text-[#7a6a45]"}`}
          >
            {t === "words" ? `Words (${wordResults.length})` : `Grammar (${grammarResults.length})`}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {tab === "words" && wordResults.map((w) => (
          <Paper key={w.id} className="p-6 flex gap-6">
            <div>
              <p style={{ fontSize: "2rem", lineHeight: 1 }}>{w.kanji[0]?.text}</p>
              <p className="italic text-[#5e5132] mt-1">{w.readings[0]?.text}</p>
            </div>
            <Divider className="w-px h-auto self-stretch" />
            <div className="flex-1">
              <div className="flex gap-2 mb-1">
                <Tag>JLPT N{w.jlpt}</Tag>
                {w.is_common && <Tag>common</Tag>}
              </div>
              <p>{w.sense[0]?.gloss[0]?.text}</p>
              <p className="italic text-[#7a6a45]" style={{ fontSize: "0.85rem" }}>
                {w.sense[0]?.pos.join(", ")}
              </p>
            </div>
          </Paper>
        ))}

        {tab === "grammar" && grammarResults.map((g) => (
          <Paper key={g.id} className="p-6">
            <div className="flex justify-between items-baseline mb-2">
              <p style={{ fontSize: "1.4rem" }}>{g.pattern}</p>
              <Tag>JLPT N{g.jlpt}</Tag>
            </div>
            <p>{g.meaning}</p>
            <p className="italic text-[#7a6a45] mt-1">{g.formation}</p>
            {g.example[0] && (
              <div className="mt-3 pl-4 border-l-2 border-[#cdbf9d] italic text-[#5e5132]">
                {g.example[0].japanese} — {g.example[0].translation}
              </div>
            )}
          </Paper>
        ))}

        {((tab === "words" && wordResults.length === 0) ||
          (tab === "grammar" && grammarResults.length === 0)) && (
            <p className="text-center italic text-[#7a6a45] py-12">No entries found for "{q}".</p>
          )}
      </div>
    </section>
  );
}
