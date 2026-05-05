import { useState } from "react";
import { tests as testsApi } from "../api";
import type { TestResponse, QuestionResponse } from "../api";
import { Paper, Button, Divider, Tag } from "./paper";

export function TestPage() {
  const [level, setLevel] = useState<number | null>(null);
  const [test, setTest] = useState<TestResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const startTest = async () => {
    if (!level) return;
    setGenerating(true);
    setError("");
    try {
      const t = await testsApi.generate(level);
      setTest(t);
      setAnswers({});
    } catch {
      setError("Could not generate a test. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const submitTest = async () => {
    if (!test) return;
    setSubmitting(true);
    try {
      const res = await testsApi.submit(test.id, answers);
      setResult(res);
    } catch {
      setError("Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!test) {
    return (
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="mt-2" style={{ fontSize: "3rem", lineHeight: 1.1 }}>
            Test
          </h1>
        </header>
        <Paper className="p-8">
          <p className="text-[#3a2f22]">Select a level. Sections include vocabulary, grammar, and reading.</p>
          <div className="mt-6 grid grid-cols-5 gap-3">
            {[5, 4, 3, 2, 1].map((lv) => (
              <button
                key={lv}
                onClick={() => setLevel(lv)}
                className={`py-6 border italic ${level === lv ? "bg-[#1f1a14] text-[#fbf8f1] border-[#1f1a14]" : "bg-[#fbf8f1] border-[#d9cfb8] hover:bg-[#efe6cf]"}`}
              >
                <div style={{ fontSize: "1.4rem" }}>N{lv}</div>
              </button>
            ))}
          </div>
          {error && <p className="mt-4 italic text-[#8a4438]">{error}</p>}
          <Divider className="my-8" />
          <div className="flex justify-between items-center">
            <span className="text-[#5e5132] italic">{level ? `JLPT N${level} selected` : "No level selected"}</span>
            <Button disabled={level === null || generating} onClick={startTest}>
              {generating ? "Generating…" : "Begin Test"}
            </Button>
          </div>
        </Paper>
      </div>
    );
  }

  if (result) {
    const allQuestions = test.sections.flatMap((s) => s.questions);
    return (
      <div className="max-w-3xl mx-auto">
        <Paper className="p-10">
          <div className="text-center">
            <h2 className="italic">N{test.jlpt} result</h2>
            <p style={{ fontSize: "3rem" }} className="mt-2">{result.score} / {result.total}</p>
          </div>
          <Divider className="my-8" />
          <ol className="space-y-4">
            {allQuestions.map((q, idx) => (
              <li key={q.id}>
                <p className="italic text-[#7a6a45]">Q{idx + 1}</p>
                <p>{q.prompt}</p>
                <p className="text-[#5e5132]">Your answer: {q.choices[answers[q.id]] ?? "—"}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <Button onClick={() => { setTest(null); setResult(null); setAnswers({}); setLevel(null); }}>
              Return to start
            </Button>
          </div>
        </Paper>
      </div>
    );
  }

  const allQuestions: (QuestionResponse & { section: string })[] = test.sections.flatMap((s) =>
    s.questions.map((q) => ({ ...q, section: s.section }))
  );
  const minutes = Math.floor(test.time_limit / 60);
  const seconds = test.time_limit % 60;

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="italic">N{test.jlpt}</h2>
        </div>
        <div className="text-right">
          <p className="italic text-[#5e5132]">Time limit</p>
          <p style={{ fontSize: "1.6rem" }}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
        </div>
      </header>

      <div className="space-y-4">
        {allQuestions.map((q, idx) => (
          <Paper key={q.id} className="p-6">
            <div className="flex gap-2 mb-2">
              <Tag>{q.section}</Tag>
            </div>
            <p className="italic text-[#7a6a45]">Question {idx + 1}</p>
            <p style={{ fontSize: "1.3rem" }}>{q.prompt}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {q.choices.map((c, i) => (
                <label
                  key={i}
                  className={`px-4 py-2 border cursor-pointer ${answers[q.id] === i ? "bg-[#1f1a14] text-[#fbf8f1] border-[#1f1a14]" : "border-[#d9cfb8] hover:bg-[#efe6cf]"
                    }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    className="hidden"
                    checked={answers[q.id] === i}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                  />
                  <span className="italic mr-2 opacity-70">{String.fromCharCode(97 + i)}.</span>
                  {c}
                </label>
              ))}
            </div>
          </Paper>
        ))}
      </div>

      {error && <p className="mt-4 italic text-[#8a4438]">{error}</p>}
      <div className="mt-6 flex justify-end">
        <Button onClick={submitTest} disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Test"}
        </Button>
      </div>
    </div>
  );
}
