import { useEffect, useState } from "react";
import { admin as adminApi, words as wordsApi, grammar as grammarApi } from "../api";
import type { WordResponse, GrammarResponse, QuestionWithAnswerResponse } from "../api";
import { Paper, Button, Divider, Tag } from "./paper";

type Tab = "words" | "grammar" | "questions" | "paragraphs";

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("words");

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="mt-2" style={{ fontSize: "3rem", lineHeight: 1.1 }}>
          Admin
        </h1>
      </header>

      <div className="flex gap-6 border-b border-[#cdbf9d] mb-6">
        {(["words", "grammar", "questions", "paragraphs"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-1 italic capitalize ${tab === t ? "border-b-2 border-[#1f1a14] text-[#1f1a14]" : "text-[#7a6a45]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "words" && <WordsAdmin />}
      {tab === "grammar" && <GrammarAdmin />}
      {tab === "questions" && <QuestionsAdmin />}
      {tab === "paragraphs" && <ParagraphsAdmin />}
    </div>
  );
}

function WordsAdmin() {
  const [items, setItems] = useState<WordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [kanji, setKanji] = useState("");
  const [reading, setReading] = useState("");
  const [meaning, setMeaning] = useState("");
  const [jlpt, setJlpt] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    wordsApi.byLevel(5, 50)
      .then((res) => setItems(res.data ?? []))
      .catch(() => setError("Could not load words."))
      .finally(() => setLoading(false));
  }, []);

  const create = async () => {
    if (!kanji || !reading) return;
    setSaving(true);
    setError("");
    try {
      const w = await adminApi.createWord({
        jlpt,
        kanji: [{ text: kanji }],
        readings: [{ text: reading }],
        senses: [{ gloss: [{ lang: "en", text: meaning }], pos: ["n"] }],
      });
      setItems((prev) => [w, ...prev]);
      setKanji(""); setReading(""); setMeaning("");
    } catch {
      setError("Failed to create word.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await adminApi.deleteWord(id);
      setItems((prev) => prev.filter((w) => w.id !== id));
    } catch {
      setError("Failed to delete word.");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Paper className="p-6 md:col-span-1">
        <h3 className="italic mb-4">New Word</h3>
        <Field label="Kanji" value={kanji} onChange={setKanji} />
        <Field label="Reading" value={reading} onChange={setReading} />
        <Field label="Meaning (en)" value={meaning} onChange={setMeaning} />
        <div className="mb-4">
          <label className="block italic text-[#7a6a45] mb-1">JLPT</label>
          <select value={jlpt} onChange={(e) => setJlpt(Number(e.target.value))} className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>N{n}</option>)}
          </select>
        </div>
        {error && <p className="italic text-[#8a4438] mb-3" style={{ fontSize: "0.85rem" }}>{error}</p>}
        <Button onClick={create} className="w-full" disabled={saving || !kanji || !reading}>
          {saving ? "Saving…" : "Add to corpus"}
        </Button>
      </Paper>

      <div className="md:col-span-2 space-y-3">
        {loading && <p className="italic text-[#7a6a45]">Loading…</p>}
        {items.map((w) => (
          <Paper key={w.id} className="p-4 flex items-center justify-between">
            <div>
              <p style={{ fontSize: "1.4rem" }}>{w.kanji[0]?.text} <span className="italic text-[#7a6a45]" style={{ fontSize: "1rem" }}>· {w.readings[0]?.text}</span></p>
              <p className="text-[#5e5132]">{w.sense[0]?.gloss[0]?.text}</p>
            </div>
            <div className="flex items-center gap-3">
              <Tag>N{w.jlpt}</Tag>
              <Button variant="outline" onClick={() => remove(w.id)}>Delete</Button>
            </div>
          </Paper>
        ))}
      </div>
    </div>
  );
}

function GrammarAdmin() {
  const [items, setItems] = useState<GrammarResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [pattern, setPattern] = useState("");
  const [meaning, setMeaning] = useState("");
  const [formation, setFormation] = useState("");
  const [jlpt, setJlpt] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    grammarApi.list(5, 50)
      .then(setItems)
      .catch(() => setError("Could not load grammar."))
      .finally(() => setLoading(false));
  }, []);

  const create = async () => {
    if (!pattern) return;
    setSaving(true);
    setError("");
    try {
      const g = await adminApi.createGrammar({ jlpt, pattern, meaning, formation });
      setItems((prev) => [g, ...prev]);
      setPattern(""); setMeaning(""); setFormation("");
    } catch {
      setError("Failed to create grammar entry.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await adminApi.deleteGrammar(id);
      setItems((prev) => prev.filter((g) => g.id !== id));
    } catch {
      setError("Failed to delete grammar entry.");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Paper className="p-6 md:col-span-1">
        <h3 className="italic mb-4">New Grammar</h3>
        <Field label="Pattern" value={pattern} onChange={setPattern} />
        <Field label="Meaning" value={meaning} onChange={setMeaning} />
        <Field label="Formation" value={formation} onChange={setFormation} />
        <div className="mb-4">
          <label className="block italic text-[#7a6a45] mb-1">JLPT</label>
          <select value={jlpt} onChange={(e) => setJlpt(Number(e.target.value))} className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>N{n}</option>)}
          </select>
        </div>
        {error && <p className="italic text-[#8a4438] mb-3" style={{ fontSize: "0.85rem" }}>{error}</p>}
        <Button onClick={create} className="w-full" disabled={saving || !pattern}>
          {saving ? "Saving…" : "Add grammar"}
        </Button>
      </Paper>

      <div className="md:col-span-2 space-y-3">
        {loading && <p className="italic text-[#7a6a45]">Loading…</p>}
        {items.map((g) => (
          <Paper key={g.id} className="p-4">
            <div className="flex justify-between">
              <p style={{ fontSize: "1.2rem" }}>{g.pattern}</p>
              <div className="flex gap-2 items-center">
                <Tag>N{g.jlpt}</Tag>
                <Button variant="outline" onClick={() => remove(g.id)}>Delete</Button>
              </div>
            </div>
            <p className="text-[#5e5132]">{g.meaning}</p>
            <p className="italic text-[#7a6a45]">{g.formation}</p>
          </Paper>
        ))}
      </div>
    </div>
  );
}

function QuestionsAdmin() {
  const [items, setItems] = useState<QuestionWithAnswerResponse[]>([]);
  const [prompt, setPrompt] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [section, setSection] = useState<"vocabulary" | "grammar" | "reading">("vocabulary");
  const [jlpt, setJlpt] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    if (!prompt || choices.some((c) => !c)) return;
    setSaving(true);
    setError("");
    try {
      const q = await adminApi.createQuestion({
        jlpt, section, type: "multiple_choice", prompt,
        choices, correct_index: correctIndex, tags: [],
      });
      setItems((prev) => [q, ...prev]);
      setPrompt(""); setChoices(["", "", "", ""]); setCorrectIndex(0);
    } catch {
      setError("Failed to create question.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await adminApi.deleteQuestion(id);
      setItems((prev) => prev.filter((q) => q.id !== id));
    } catch {
      setError("Failed to delete question.");
    }
  };

  return (
    <div className="space-y-6">
      <Paper className="p-6">
        <h3 className="italic mb-4">New Question</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Field label="Prompt" value={prompt} onChange={setPrompt} />
          </div>
          {choices.map((c, i) => (
            <div key={i}>
              <label className="block italic text-[#7a6a45] mb-1">
                Choice {String.fromCharCode(65 + i)} {i === correctIndex && "✓"}
              </label>
              <input
                value={c}
                onChange={(e) => setChoices((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2 outline-none focus:border-[#1f1a14]"
              />
            </div>
          ))}
          <div>
            <label className="block italic text-[#7a6a45] mb-1">Correct answer</label>
            <select value={correctIndex} onChange={(e) => setCorrectIndex(Number(e.target.value))} className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
              {choices.map((_, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>)}
            </select>
          </div>
          <div>
            <label className="block italic text-[#7a6a45] mb-1">Section</label>
            <select value={section} onChange={(e) => setSection(e.target.value as typeof section)} className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
              {["vocabulary", "grammar", "reading"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block italic text-[#7a6a45] mb-1">JLPT</label>
            <select value={jlpt} onChange={(e) => setJlpt(Number(e.target.value))} className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>N{n}</option>)}
            </select>
          </div>
        </div>
        {error && <p className="italic text-[#8a4438] mt-3" style={{ fontSize: "0.85rem" }}>{error}</p>}
        <div className="mt-4">
          <Button onClick={create} disabled={saving || !prompt || choices.some((c) => !c)}>
            {saving ? "Saving…" : "Add question"}
          </Button>
        </div>
      </Paper>

      <div className="space-y-3">
        {items.map((q) => (
          <Paper key={q.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex gap-2 mb-1">
                  <Tag>{section}</Tag>
                </div>
                <p>{q.prompt}</p>
                <p className="italic text-[#7a6a45]">Answer: {q.choices[q.correct_index]}</p>
              </div>
              <Button variant="outline" onClick={() => remove(q.id)}>Delete</Button>
            </div>
          </Paper>
        ))}
      </div>
    </div>
  );
}

function ParagraphsAdmin() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [jlpt, setJlpt] = useState(5);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const create = async () => {
    if (!title || content.length < 10) return;
    setSaving(true);
    setError(""); setSuccess("");
    try {
      await adminApi.createParagraph({
        jlpt, title, content, tags: [],
        questions: [],
      });
      setTitle(""); setContent("");
      setSuccess("Paragraph created.");
    } catch {
      setError("Failed to create paragraph.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper className="p-6 max-w-2xl">
      <h3 className="italic mb-4">New Paragraph</h3>
      <Field label="Title" value={title} onChange={setTitle} />
      <div className="mb-4">
        <label className="block italic text-[#7a6a45] mb-1">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2 outline-none focus:border-[#1f1a14] resize-none"
        />
      </div>
      <div className="mb-4">
        <label className="block italic text-[#7a6a45] mb-1">JLPT</label>
        <select value={jlpt} onChange={(e) => setJlpt(Number(e.target.value))} className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>N{n}</option>)}
        </select>
      </div>
      {error && <p className="italic text-[#8a4438] mb-3" style={{ fontSize: "0.85rem" }}>{error}</p>}
      {success && <p className="italic text-[#5a6e34] mb-3" style={{ fontSize: "0.85rem" }}>{success}</p>}
      <Button onClick={create} disabled={saving || !title || content.length < 10}>
        {saving ? "Saving…" : "Create paragraph"}
      </Button>
    </Paper>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-4">
      <label className="block italic text-[#7a6a45] mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2 outline-none focus:border-[#1f1a14]"
      />
    </div>
  );
}
