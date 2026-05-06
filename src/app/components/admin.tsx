import { useEffect, useState } from "react";
import { admin as adminApi } from "../api";
import type { WordResponse, GrammarResponse, QuestionWithAnswerResponse, ParagraphResponse } from "../api";
import { Paper, Button, Tag } from "./paper";

const PAGE_SIZE = 50;

type Tab = "words" | "grammar" | "questions" | "paragraphs";

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("words");

  return (
    <div className="max-w-5xl mx-auto flex flex-col" style={{ height: "calc(100vh - 96px)" }}>
      <header className="mb-6 text-center shrink-0">
        <h1 className="italic mt-2" style={{ fontSize: "3rem", lineHeight: 1.1 }}>Admin</h1>
      </header>

      <div className="flex gap-6 border-b border-[#cdbf9d] mb-6 shrink-0">
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

      <div className="flex-1 min-h-0">
        {tab === "words" && <WordsAdmin />}
        {tab === "grammar" && <GrammarAdmin />}
        {tab === "questions" && <QuestionsAdmin />}
        {tab === "paragraphs" && <ParagraphsAdmin />}
      </div>
    </div>
  );
}

// ── Pagination bar ────────────────────────────────────────────────────────────

function Pagination({ offset, total, limit, onChange }: {
  offset: number; total: number; limit: number; onChange: (o: number) => void;
}) {
  const page = Math.floor(offset / limit);
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 italic text-[#7a6a45]" style={{ fontSize: "0.9rem" }}>
      <span>{offset + 1}–{Math.min(offset + limit, total)} of {total}</span>
      <div className="flex gap-2">
        <button disabled={page === 0} onClick={() => onChange(Math.max(0, offset - limit))}
          className="px-3 py-1 border border-[#d9cfb8] disabled:opacity-40 hover:bg-[#efe6cf]">← prev</button>
        <span className="px-3 py-1">{page + 1} / {pages}</span>
        <button disabled={page >= pages - 1} onClick={() => onChange(offset + limit)}
          className="px-3 py-1 border border-[#d9cfb8] disabled:opacity-40 hover:bg-[#efe6cf]">next →</button>
      </div>
    </div>
  );
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(31,26,20,0.4)" }} onClick={onClose}>
      <div className="bg-[#fbf8f1] border border-[#cdbf9d] p-8 max-w-lg w-full mx-4 overflow-y-auto"
        style={{ maxHeight: "80vh" }} onClick={(e) => e.stopPropagation()}>
        {children}
        <div className="mt-6 flex justify-end">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

// ── Words ─────────────────────────────────────────────────────────────────────

function WordsAdmin() {
  const [items, setItems] = useState<WordResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WordResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [editKanji, setEditKanji] = useState("");
  const [editReading, setEditReading] = useState("");
  const [editMeaning, setEditMeaning] = useState("");
  const [editJlpt, setEditJlpt] = useState(5);
  const [saving, setSaving] = useState(false);
  const [kanji, setKanji] = useState("");
  const [reading, setReading] = useState("");
  const [meaning, setMeaning] = useState("");
  const [jlpt, setJlpt] = useState(5);
  const [error, setError] = useState("");

  const load = (o: number) => {
    setLoading(true);
    adminApi.listWords(PAGE_SIZE, o)
      .then((res) => { setItems(res.items ?? []); setTotal(res.total); setOffset(o); })
      .catch(() => setError("Could not load words."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0); }, []);

  const openEdit = (w: WordResponse) => {
    setEditKanji(w.kanji[0]?.text ?? "");
    setEditReading(w.readings[0]?.text ?? "");
    setEditMeaning(w.sense[0]?.gloss[0]?.text ?? "");
    setEditJlpt(w.jlpt);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setError("");
    try {
      const updated = await adminApi.updateWord(selected.id, {
        jlpt: editJlpt,
        kanji: [{ text: editKanji }],
        readings: [{ text: editReading }],
        senses: [{ gloss: [{ lang: "en", text: editMeaning }], pos: selected.sense[0]?.pos ?? ["n"] }],
      });
      setItems((prev) => prev.map((w) => w.id === updated.id ? updated : w));
      setSelected(updated);
      setEditing(false);
    } catch { setError("Failed to save changes."); }
    finally { setSaving(false); }
  };

  const create = async () => {
    if (!kanji || !reading) return;
    setSaving(true); setError("");
    try {
      const w = await adminApi.createWord({
        jlpt, kanji: [{ text: kanji }], readings: [{ text: reading }],
        senses: [{ gloss: [{ lang: "en", text: meaning }], pos: ["n"] }],
      });
      setItems((prev) => [w, ...prev]);
      setKanji(""); setReading(""); setMeaning("");
    } catch { setError("Failed to create word."); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      await adminApi.deleteWord(id);
      setItems((prev) => prev.filter((w) => w.id !== id));
      setSelected(null);
    } catch { setError("Failed to delete word."); }
  };

  return (
    <div className="h-full flex flex-col">
      {selected && (
        <Modal onClose={() => { setSelected(null); setEditing(false); }}>
          <p className="italic text-[#7a6a45] mb-1" style={{ fontSize: "0.85rem" }}>Word detail</p>
          {editing ? (
            <div className="mt-2 space-y-3">
              <Field label="Kanji" value={editKanji} onChange={setEditKanji} />
              <Field label="Reading" value={editReading} onChange={setEditReading} />
              <Field label="Meaning (en)" value={editMeaning} onChange={setEditMeaning} />
              <div>
                <label className="block italic text-[#7a6a45] mb-1">JLPT</label>
                <select value={editJlpt} onChange={(e) => setEditJlpt(Number(e.target.value))}
                  className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>N{n}</option>)}
                </select>
              </div>
              {error && <p className="italic text-[#8a4438]" style={{ fontSize: "0.85rem" }}>{error}</p>}
              <div className="flex gap-3 mt-4">
                <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: "2.5rem", lineHeight: 1.1 }}>{selected.kanji[0]?.text}</p>
              <p className="italic text-[#5e5132] mt-1">{selected.readings[0]?.text}</p>
              <div className="flex gap-2 mt-3">
                <Tag>N{selected.jlpt}</Tag>
                {selected.is_common && <Tag>common</Tag>}
              </div>
              <div className="mt-4 space-y-2">
                {selected.sense.map((s, i) => (
                  <div key={i} className="border-t border-[#e5dabc] pt-2">
                    <p>{s.gloss.map((g) => g.text).join("; ")}</p>
                    <p className="italic text-[#7a6a45]" style={{ fontSize: "0.85rem" }}>{s.pos.join(", ")}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-[#e5dabc] pt-4 flex gap-3">
                <Button onClick={() => openEdit(selected)}>Edit</Button>
              </div>
            </>
          )}
        </Modal>
      )}

      <div className="flex gap-6 h-full">
        <div className="w-72 shrink-0">
          <Paper className="p-6">
            <h3 className="italic mb-4">New Word</h3>
            <Field label="Kanji" value={kanji} onChange={setKanji} />
            <Field label="Reading" value={reading} onChange={setReading} />
            <Field label="Meaning (en)" value={meaning} onChange={setMeaning} />
            <div className="mb-4">
              <label className="block italic text-[#7a6a45] mb-1">JLPT</label>
              <select value={jlpt} onChange={(e) => setJlpt(Number(e.target.value))}
                className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>N{n}</option>)}
              </select>
            </div>
            {error && <p className="italic text-[#8a4438] mb-3" style={{ fontSize: "0.85rem" }}>{error}</p>}
            <Button onClick={create} className="w-full" disabled={saving || !kanji || !reading}>
              {saving ? "Saving…" : "Add to corpus"}
            </Button>
          </Paper>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <p className="italic text-[#7a6a45]">Loading…</p>}
          <div className="space-y-3">
            {items.map((w) => (
              <button key={w.id} onClick={() => { setSelected(w); setEditing(false); }} className="w-full text-left">
                <Paper className="p-4 flex items-center justify-between hover:bg-[#efe6cf] transition-colors">
                  <div>
                    <p style={{ fontSize: "1.4rem" }}>{w.kanji[0]?.text} <span className="italic text-[#7a6a45]" style={{ fontSize: "1rem" }}>· {w.readings[0]?.text}</span></p>
                    <p className="text-[#5e5132]">{w.sense[0]?.gloss[0]?.text}</p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" onClick={() => remove(w.id)}>Delete</Button>
                  </div>
                </Paper>
              </button>
            ))}
          </div>
          <Pagination offset={offset} total={total} limit={PAGE_SIZE} onChange={load} />
        </div>
      </div>
    </div>
  );
}

// ── Grammar ───────────────────────────────────────────────────────────────────

function GrammarAdmin() {
  const [items, setItems] = useState<GrammarResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GrammarResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [editPattern, setEditPattern] = useState("");
  const [editMeaning, setEditMeaning] = useState("");
  const [editFormation, setEditFormation] = useState("");
  const [editJlpt, setEditJlpt] = useState(5);
  const [saving, setSaving] = useState(false);
  const [pattern, setPattern] = useState("");
  const [meaning, setMeaning] = useState("");
  const [formation, setFormation] = useState("");
  const [jlpt, setJlpt] = useState(5);
  const [error, setError] = useState("");

  const load = (o: number) => {
    setLoading(true);
    adminApi.listGrammars(PAGE_SIZE, o)
      .then((res) => { setItems(res.items ?? []); setTotal(res.total); setOffset(o); })
      .catch(() => setError("Could not load grammar."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0); }, []);

  const openEdit = (g: GrammarResponse) => {
    setEditPattern(g.pattern); setEditMeaning(g.meaning);
    setEditFormation(g.formation); setEditJlpt(g.jlpt);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setError("");
    try {
      const updated = await adminApi.updateGrammar(selected.id, {
        jlpt: editJlpt, pattern: editPattern, meaning: editMeaning, formation: editFormation,
      });
      setItems((prev) => prev.map((g) => g.id === updated.id ? updated : g));
      setSelected(updated); setEditing(false);
    } catch { setError("Failed to save changes."); }
    finally { setSaving(false); }
  };

  const create = async () => {
    if (!pattern) return;
    setSaving(true); setError("");
    try {
      const g = await adminApi.createGrammar({ jlpt, pattern, meaning, formation });
      setItems((prev) => [g, ...prev]);
      setPattern(""); setMeaning(""); setFormation("");
    } catch { setError("Failed to create grammar entry."); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      await adminApi.deleteGrammar(id);
      setItems((prev) => prev.filter((g) => g.id !== id));
      setSelected(null);
    } catch { setError("Failed to delete grammar entry."); }
  };

  return (
    <div className="h-full flex flex-col">
      {selected && (
        <Modal onClose={() => { setSelected(null); setEditing(false); }}>
          <p className="italic text-[#7a6a45] mb-1" style={{ fontSize: "0.85rem" }}>Grammar detail</p>
          {editing ? (
            <div className="mt-2 space-y-3">
              <Field label="Pattern" value={editPattern} onChange={setEditPattern} />
              <Field label="Meaning" value={editMeaning} onChange={setEditMeaning} />
              <Field label="Formation" value={editFormation} onChange={setEditFormation} />
              <div>
                <label className="block italic text-[#7a6a45] mb-1">JLPT</label>
                <select value={editJlpt} onChange={(e) => setEditJlpt(Number(e.target.value))}
                  className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>N{n}</option>)}
                </select>
              </div>
              {error && <p className="italic text-[#8a4438]" style={{ fontSize: "0.85rem" }}>{error}</p>}
              <div className="flex gap-3 mt-4">
                <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: "1.8rem" }}>{selected.pattern}</p>
              <Tag>N{selected.jlpt}</Tag>
              <p className="mt-3">{selected.meaning}</p>
              <p className="italic text-[#7a6a45] mt-1">{selected.formation}</p>
              {selected.notes && <p className="mt-2 text-[#5e5132]">{selected.notes}</p>}
              {selected.example[0] && (
                <div className="mt-4 pl-4 border-l-2 border-[#cdbf9d] italic text-[#5e5132]">
                  <p>{selected.example[0].japanese}</p>
                  <p className="text-[#7a6a45]">{selected.example[0].translation}</p>
                </div>
              )}
              <div className="mt-6 border-t border-[#e5dabc] pt-4 flex gap-3">
                <Button onClick={() => openEdit(selected)}>Edit</Button>
              </div>
            </>
          )}
        </Modal>
      )}

      <div className="flex gap-6 h-full">
        <div className="w-72 shrink-0">
          <Paper className="p-6">
            <h3 className="italic mb-4">New Grammar</h3>
            <Field label="Pattern" value={pattern} onChange={setPattern} />
            <Field label="Meaning" value={meaning} onChange={setMeaning} />
            <Field label="Formation" value={formation} onChange={setFormation} />
            <div className="mb-4">
              <label className="block italic text-[#7a6a45] mb-1">JLPT</label>
              <select value={jlpt} onChange={(e) => setJlpt(Number(e.target.value))}
                className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>N{n}</option>)}
              </select>
            </div>
            {error && <p className="italic text-[#8a4438] mb-3" style={{ fontSize: "0.85rem" }}>{error}</p>}
            <Button onClick={create} className="w-full" disabled={saving || !pattern}>
              {saving ? "Saving…" : "Add grammar"}
            </Button>
          </Paper>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <p className="italic text-[#7a6a45]">Loading…</p>}
          <div className="space-y-3">
            {items.map((g) => (
              <button key={g.id} onClick={() => { setSelected(g); setEditing(false); }} className="w-full text-left">
                <Paper className="p-4 hover:bg-[#efe6cf] transition-colors">
                  <div className="flex justify-between items-center">
                    <p style={{ fontSize: "1.2rem" }}>{g.pattern}</p>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" onClick={() => remove(g.id)}>Delete</Button>
                    </div>
                  </div>
                  <p className="text-[#5e5132]">{g.meaning}</p>
                  <p className="italic text-[#7a6a45]" style={{ fontSize: "0.85rem" }}>{g.formation}</p>
                </Paper>
              </button>
            ))}
          </div>
          <Pagination offset={offset} total={total} limit={PAGE_SIZE} onChange={load} />
        </div>
      </div>
    </div>
  );
}

// ── Questions ─────────────────────────────────────────────────────────────────

function QuestionsAdmin() {
  const [items, setItems] = useState<QuestionWithAnswerResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QuestionWithAnswerResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [editChoices, setEditChoices] = useState(["", "", "", ""]);
  const [editCorrectIndex, setEditCorrectIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [choices, setChoices] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [section, setSection] = useState<"vocabulary" | "grammar" | "reading">("vocabulary");
  const [jlpt, setJlpt] = useState(5);
  const [error, setError] = useState("");

  const load = (o: number) => {
    setLoading(true);
    adminApi.listQuestions(PAGE_SIZE, o)
      .then((res) => { setItems(res.items ?? []); setTotal(res.total); setOffset(o); })
      .catch(() => setError("Could not load questions."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0); }, []);

  const openEdit = (q: QuestionWithAnswerResponse) => {
    setEditPrompt(q.prompt);
    setEditChoices(q.choices.length === 4 ? [...q.choices] : [...q.choices, "", "", "", ""].slice(0, 4));
    setEditCorrectIndex(q.correct_index);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setError("");
    try {
      const updated = await adminApi.updateQuestion(selected.id, {
        prompt: editPrompt, choices: editChoices, correct_index: editCorrectIndex,
      });
      setItems((prev) => prev.map((q) => q.id === updated.id ? updated : q));
      setSelected(updated); setEditing(false);
    } catch { setError("Failed to save changes."); }
    finally { setSaving(false); }
  };

  const create = async () => {
    if (!prompt || choices.some((c) => !c)) return;
    setSaving(true); setError("");
    try {
      const q = await adminApi.createQuestion({
        jlpt, section, type: "multiple_choice", prompt,
        choices, correct_index: correctIndex, tags: [],
      });
      setItems((prev) => [q, ...prev]);
      setPrompt(""); setChoices(["", "", "", ""]); setCorrectIndex(0);
    } catch { setError("Failed to create question."); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      await adminApi.deleteQuestion(id);
      setItems((prev) => prev.filter((q) => q.id !== id));
      setSelected(null);
    } catch { setError("Failed to delete question."); }
  };

  return (
    <div className="h-full flex flex-col">
      {selected && (
        <Modal onClose={() => { setSelected(null); setEditing(false); }}>
          <p className="italic text-[#7a6a45] mb-1" style={{ fontSize: "0.85rem" }}>Question detail</p>
          {editing ? (
            <div className="mt-2 space-y-3">
              <Field label="Prompt" value={editPrompt} onChange={setEditPrompt} />
              {editChoices.map((c, i) => (
                <div key={i}>
                  <label className="block italic text-[#7a6a45] mb-1">
                    Choice {String.fromCharCode(65 + i)} {i === editCorrectIndex && "✓"}
                  </label>
                  <input value={c}
                    onChange={(e) => setEditChoices((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                    className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2 outline-none focus:border-[#1f1a14]" />
                </div>
              ))}
              <div>
                <label className="block italic text-[#7a6a45] mb-1">Correct answer</label>
                <select value={editCorrectIndex} onChange={(e) => setEditCorrectIndex(Number(e.target.value))}
                  className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
                  {editChoices.map((_, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>)}
                </select>
              </div>
              {error && <p className="italic text-[#8a4438]" style={{ fontSize: "0.85rem" }}>{error}</p>}
              <div className="flex gap-3 mt-4">
                <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-2">{selected.prompt}</p>
              <ul className="mt-4 space-y-2">
                {selected.choices.map((c, i) => (
                  <li key={i} className={`px-3 py-2 border ${i === selected.correct_index ? "border-[#7a8950] bg-[#e8efd8]" : "border-[#d9cfb8]"}`}>
                    <span className="italic text-[#7a6a45] mr-2">{String.fromCharCode(97 + i)}.</span>{c}
                  </li>
                ))}
              </ul>
              {selected.explanation && <p className="mt-4 italic text-[#5e5132]">{selected.explanation}</p>}
              <div className="mt-6 border-t border-[#e5dabc] pt-4 flex gap-3">
                <Button onClick={() => openEdit(selected)}>Edit</Button>
              </div>
            </>
          )}
        </Modal>
      )}

      <div className="flex gap-6 h-full">
        <div className="w-72 shrink-0">
          <Paper className="p-6">
            <h3 className="italic mb-4">New Question</h3>
            <Field label="Prompt" value={prompt} onChange={setPrompt} />
            {choices.map((c, i) => (
              <div key={i} className="mb-3">
                <label className="block italic text-[#7a6a45] mb-1">
                  Choice {String.fromCharCode(65 + i)} {i === correctIndex && "✓"}
                </label>
                <input value={c}
                  onChange={(e) => setChoices((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                  className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2 outline-none focus:border-[#1f1a14]" />
              </div>
            ))}
            <div className="mb-3">
              <label className="block italic text-[#7a6a45] mb-1">Correct answer</label>
              <select value={correctIndex} onChange={(e) => setCorrectIndex(Number(e.target.value))}
                className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
                {choices.map((_, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block italic text-[#7a6a45] mb-1">Section</label>
              <select value={section} onChange={(e) => setSection(e.target.value as typeof section)}
                className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
                {["vocabulary", "grammar", "reading"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block italic text-[#7a6a45] mb-1">JLPT</label>
              <select value={jlpt} onChange={(e) => setJlpt(Number(e.target.value))}
                className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>N{n}</option>)}
              </select>
            </div>
            {error && <p className="italic text-[#8a4438] mb-3" style={{ fontSize: "0.85rem" }}>{error}</p>}
            <Button onClick={create} disabled={saving || !prompt || choices.some((c) => !c)}>
              {saving ? "Saving…" : "Add question"}
            </Button>
          </Paper>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <p className="italic text-[#7a6a45]">Loading…</p>}
          <div className="space-y-3">
            {items.map((q) => (
              <button key={q.id} onClick={() => { setSelected(q); setEditing(false); }} className="w-full text-left">
                <Paper className="p-4 hover:bg-[#efe6cf] transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-2">{q.prompt}</p>
                      <p className="italic text-[#7a6a45] mt-1" style={{ fontSize: "0.85rem" }}>
                        Answer: {q.choices[q.correct_index]}
                      </p>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" onClick={() => remove(q.id)}>Delete</Button>
                    </div>
                  </div>
                </Paper>
              </button>
            ))}
          </div>
          <Pagination offset={offset} total={total} limit={PAGE_SIZE} onChange={load} />
        </div>
      </div>
    </div>
  );
}

// ── Paragraphs ────────────────────────────────────────────────────────────────

function ParagraphsAdmin() {
  const [items, setItems] = useState<ParagraphResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ParagraphResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editJlpt, setEditJlpt] = useState(5);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [jlpt, setJlpt] = useState(5);
  const [error, setError] = useState("");

  const load = (o: number) => {
    setLoading(true);
    adminApi.listParagraphs(PAGE_SIZE, o)
      .then((res) => { setItems(res.items ?? []); setTotal(res.total); setOffset(o); })
      .catch(() => setError("Could not load paragraphs."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0); }, []);

  const openEdit = (p: ParagraphResponse) => {
    setEditTitle(p.title); setEditContent(p.content); setEditJlpt(p.jlpt);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setError("");
    try {
      const updated = await adminApi.updateParagraph(selected.id, {
        title: editTitle, content: editContent, jlpt: editJlpt,
      });
      setItems((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      setSelected(updated); setEditing(false);
    } catch { setError("Failed to save changes."); }
    finally { setSaving(false); }
  };

  const create = async () => {
    if (!title || content.length < 10) return;
    setSaving(true); setError("");
    try {
      const p = await adminApi.createParagraph({ jlpt, title, content, tags: [], questions: [] });
      setItems((prev) => [p, ...prev]);
      setTitle(""); setContent("");
    } catch { setError("Failed to create paragraph."); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      await adminApi.deleteParagraph(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
      setSelected(null);
    } catch { setError("Failed to delete paragraph."); }
  };

  return (
    <div className="h-full flex flex-col">
      {selected && (
        <Modal onClose={() => { setSelected(null); setEditing(false); }}>
          <p className="italic text-[#7a6a45] mb-1" style={{ fontSize: "0.85rem" }}>Paragraph detail</p>
          {editing ? (
            <div className="mt-2 space-y-3">
              <Field label="Title" value={editTitle} onChange={setEditTitle} />
              <div>
                <label className="block italic text-[#7a6a45] mb-1">Content</label>
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={6}
                  className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2 outline-none focus:border-[#1f1a14] resize-none" />
              </div>
              <div>
                <label className="block italic text-[#7a6a45] mb-1">JLPT</label>
                <select value={editJlpt} onChange={(e) => setEditJlpt(Number(e.target.value))}
                  className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>N{n}</option>)}
                </select>
              </div>
              {error && <p className="italic text-[#8a4438]" style={{ fontSize: "0.85rem" }}>{error}</p>}
              <div className="flex gap-3 mt-4">
                <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-3 mt-1">
                <p style={{ fontSize: "1.3rem" }}>{selected.title}</p>
                <Tag>N{selected.jlpt}</Tag>
              </div>
              {selected.tags.length > 0 && (
                <div className="flex gap-2 mt-2">{selected.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>
              )}
              <p className="mt-4 text-[#3a2f22] leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>{selected.content}</p>
              {selected.questions.length > 0 && (
                <div className="mt-4 border-t border-[#e5dabc] pt-4">
                  <p className="italic text-[#7a6a45] mb-2" style={{ fontSize: "0.85rem" }}>{selected.questions.length} question(s)</p>
                  {selected.questions.map((q, i) => (
                    <p key={i} className="text-[#5e5132] mb-1" style={{ fontSize: "0.9rem" }}>{i + 1}. {q.prompt}</p>
                  ))}
                </div>
              )}
              <div className="mt-6 border-t border-[#e5dabc] pt-4 flex gap-3">
                <Button onClick={() => openEdit(selected)}>Edit</Button>
              </div>
            </>
          )}
        </Modal>
      )}

      <div className="flex gap-6 h-full">
        <div className="w-72 shrink-0">
          <Paper className="p-6">
            <h3 className="italic mb-4">New Paragraph</h3>
            <Field label="Title" value={title} onChange={setTitle} />
            <div className="mb-4">
              <label className="block italic text-[#7a6a45] mb-1">Content</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5}
                className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2 outline-none focus:border-[#1f1a14] resize-none" />
            </div>
            <div className="mb-4">
              <label className="block italic text-[#7a6a45] mb-1">JLPT</label>
              <select value={jlpt} onChange={(e) => setJlpt(Number(e.target.value))}
                className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>N{n}</option>)}
              </select>
            </div>
            {error && <p className="italic text-[#8a4438] mb-3" style={{ fontSize: "0.85rem" }}>{error}</p>}
            <Button onClick={create} disabled={saving || !title || content.length < 10}>
              {saving ? "Saving…" : "Create paragraph"}
            </Button>
          </Paper>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <p className="italic text-[#7a6a45]">Loading…</p>}
          <div className="space-y-3">
            {items.map((p) => (
              <button key={p.id} onClick={() => { setSelected(p); setEditing(false); }} className="w-full text-left">
                <Paper className="p-4 hover:bg-[#efe6cf] transition-colors">
                  <div className="flex justify-between items-center">
                    <p style={{ fontSize: "1.1rem" }}>{p.title}</p>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" onClick={() => remove(p.id)}>Delete</Button>
                    </div>
                  </div>
                  <p className="text-[#5e5132] mt-1 line-clamp-2" style={{ fontSize: "0.9rem" }}>{p.content}</p>
                  {p.questions.length > 0 && (
                    <p className="italic text-[#a89770] mt-1" style={{ fontSize: "0.8rem" }}>{p.questions.length} question(s)</p>
                  )}
                </Paper>
              </button>
            ))}
          </div>
          <Pagination offset={offset} total={total} limit={PAGE_SIZE} onChange={load} />
        </div>
      </div>
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-4">
      <label className="block italic text-[#7a6a45] mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2 outline-none focus:border-[#1f1a14]" />
    </div>
  );
}
