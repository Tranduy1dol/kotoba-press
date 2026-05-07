import { useEffect, useState } from "react";
import { admin as adminApi } from "../api";
import type { WordResponse, GrammarResponse, QuestionWithAnswerResponse, ParagraphResponse } from "../api";
import { Paper, Button, Tag } from "./paper";

const PAGE_SIZE = 1000;

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
            {t === "words" ? "Từ vựng" : t === "grammar" ? "Ngữ pháp" : t === "questions" ? "Câu hỏi" : "Đoạn văn"}
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
      <span>{offset + 1}–{Math.min(offset + limit, total)} / {total}</span>
      <div className="flex gap-2">
        <button disabled={page === 0} onClick={() => onChange(Math.max(0, offset - limit))}
          className="px-3 py-1 border border-[#d9cfb8] disabled:opacity-40 hover:bg-[#efe6cf]">← trước</button>
        <span className="px-3 py-1">{page + 1} / {pages}</span>
        <button disabled={page >= pages - 1} onClick={() => onChange(offset + limit)}
          className="px-3 py-1 border border-[#d9cfb8] disabled:opacity-40 hover:bg-[#efe6cf]">tiếp →</button>
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
          <Button variant="ghost" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>
  );
}

// ── Words ─────────────────────────────────────────────────────────────────────

type KanjiEntry = { text: string; info: string };
type SenseEntry = { gloss: string; pos: string };

const emptyKanji = (): KanjiEntry => ({ text: "", info: "" });
const emptySense = (): SenseEntry => ({ gloss: "", pos: "noun" });

function JlptSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-4">
      <label className="block italic text-[#7a6a45] mb-1">Cấp độ JLPT</label>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
        <option value={0}>-- select --</option>
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>N{n}</option>)}
      </select>
    </div>
  );
}

function WordsAdmin() {
  const [items, setItems] = useState<WordResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WordResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [editKanjis, setEditKanjis] = useState<KanjiEntry[]>([emptyKanji()]);
  const [editReadings, setEditReadings] = useState<string[]>([""]);
  const [editSenses, setEditSenses] = useState<SenseEntry[]>([emptySense()]);
  const [editJlpt, setEditJlpt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [kanjis, setKanjis] = useState<KanjiEntry[]>([emptyKanji()]);
  const [readings, setReadings] = useState<string[]>([""]);
  const [senses, setSenses] = useState<SenseEntry[]>([emptySense()]);
  const [jlpt, setJlpt] = useState(0);
  const [error, setError] = useState("");

  const load = (o: number) => {
    setLoading(true);
    adminApi.listWords(PAGE_SIZE, o)
      .then((res) => { setItems(res.items ?? []); setTotal(res.total); setOffset(o); })
      .catch(() => setError("Không thể tải từ vựng."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0); }, []);

  const openEdit = (w: WordResponse) => {
    setEditKanjis(w.kanji.length > 0 ? w.kanji.map((k) => ({ text: k.text, info: k.info ?? "" })) : [emptyKanji()]);
    setEditReadings(w.readings.length > 0 ? w.readings.map((r) => r.text) : [""]);
    setEditSenses(w.sense.length > 0 ? w.sense.map((s) => ({ gloss: s.gloss[0]?.text ?? "", pos: s.pos[0] ?? "noun" })) : [emptySense()]);
    setEditJlpt(w.jlpt);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setError("");
    try {
      const updated = await adminApi.updateWord(selected.id, {
        ...(editJlpt > 0 ? { jlpt: editJlpt } : {}),
        kanji: editKanjis.filter((k) => k.text).map((k) => ({ text: k.text, info: k.info })),
        readings: editReadings.filter(Boolean).map((t) => ({ text: t })),
        senses: editSenses.filter((s) => s.gloss).map((s) => ({
          gloss: [{ lang: "en", text: s.gloss }],
          pos: [s.pos],
        })),
      });
      setItems((prev) => prev.map((w) => w.id === updated.id ? updated : w));
      setSelected(updated);
      setEditing(false);
    } catch { setError("Không thể lưu thay đổi."); }
    finally { setSaving(false); }
  };

  const create = async () => {
    if (!kanjis[0]?.text || !readings[0]) return;
    setSaving(true); setError("");
    try {
      const w = await adminApi.createWord({
        ...(jlpt > 0 ? { jlpt } : {}),
        kanji: kanjis.filter((k) => k.text).map((k) => ({ text: k.text, info: k.info })),
        readings: readings.filter(Boolean).map((t) => ({ text: t })),
        senses: senses.filter((s) => s.gloss).map((s) => ({
          gloss: [{ lang: "en", text: s.gloss }],
          pos: [s.pos],
        })),
      });
      setItems((prev) => [w, ...prev]);
      setKanjis([emptyKanji()]); setReadings([""]); setSenses([emptySense()]); setJlpt(0);
    } catch { setError("Không thể tạo từ vựng."); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      await adminApi.deleteWord(id);
      setItems((prev) => prev.filter((w) => w.id !== id));
      setSelected(null);
    } catch { setError("Không thể xóa từ vựng."); }
  };

  return (
    <div className="h-full flex flex-col">
      {selected && (
        <Modal onClose={() => { setSelected(null); setEditing(false); }}>
          <p className="italic text-[#7a6a45] mb-1" style={{ fontSize: "0.85rem" }}>Chi tiết từ vựng</p>
          {editing ? (
            <div className="mt-2 space-y-4">
              <KanjiFields values={editKanjis} onChange={setEditKanjis} />
              <MultiField label="Phát âm" values={editReadings} onChange={setEditReadings} />
              <SenseFields values={editSenses} onChange={setEditSenses} />
              <JlptSelect value={editJlpt} onChange={setEditJlpt} />
              {error && <p className="italic text-[#8a4438]" style={{ fontSize: "0.85rem" }}>{error}</p>}
              <div className="flex gap-3">
                <Button onClick={saveEdit} disabled={saving}>{saving ? "Đang lưu…" : "Lưu"}</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Hủy</Button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: "2.5rem", lineHeight: 1.1 }}>{selected.kanji[0]?.text}</p>
              <p className="italic text-[#5e5132] mt-1">{selected.readings[0]?.text}</p>
              <div className="flex gap-2 mt-3">
                <Tag>N{selected.jlpt}</Tag>
                {selected.is_common && <Tag>phổ biến</Tag>}
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
                <Button onClick={() => openEdit(selected)}>Chỉnh sửa</Button>
              </div>
            </>
          )}
        </Modal>
      )}

      <div className="flex gap-6 h-full">
        <div className="w-72 shrink-0">
          <Paper className="p-6">
            <h3 className="italic mb-4">Thêm mới</h3>
            <KanjiFields values={kanjis} onChange={setKanjis} />
            <MultiField label="Cách đọc" values={readings} onChange={setReadings} />
            <SenseFields values={senses} onChange={setSenses} />
            <JlptSelect value={jlpt} onChange={setJlpt} />
            {error && <p className="italic text-[#8a4438] mb-3" style={{ fontSize: "0.85rem" }}>{error}</p>}
            <Button onClick={create} className="w-full" disabled={saving || !kanjis[0]?.text || !readings[0]}>
              {saving ? "Đang lưu…" : "Thêm vào từ điển"}
            </Button>
          </Paper>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <p className="italic text-[#7a6a45]">Đang tải…</p>}
          <div className="space-y-3">
            {items.map((w) => (
              <button key={w.id} onClick={() => { setSelected(w); setEditing(false); }} className="w-full text-left">
                <Paper className="p-4 flex items-center justify-between hover:bg-[#efe6cf] transition-colors">
                  <div>
                    <p style={{ fontSize: "1.4rem" }}>{w.kanji[0]?.text} <span className="italic text-[#7a6a45]" style={{ fontSize: "1rem" }}>· {w.readings[0]?.text}</span></p>
                    <p className="text-[#5e5132]">{w.sense[0]?.gloss[0]?.text}</p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" onClick={() => remove(w.id)}>Xóa</Button>
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
  const [editMeanings, setEditMeanings] = useState<string[]>([""]);
  const [editFormation, setEditFormation] = useState("");
  const [editExamples, setEditExamples] = useState<{ japanese: string; reading: string; translation: string }[]>([]);
  const [editJlpt, setEditJlpt] = useState(5);
  const [saving, setSaving] = useState(false);
  const [pattern, setPattern] = useState("");
  const [meanings, setMeanings] = useState<string[]>([""]);
  const [formation, setFormation] = useState("");
  const [examples, setExamples] = useState<{ japanese: string; reading: string; translation: string }[]>([]);
  const [jlpt, setJlpt] = useState(5);
  const [error, setError] = useState("");

  const load = (o: number) => {
    setLoading(true);
    adminApi.listGrammars(PAGE_SIZE, o)
      .then((res) => { setItems(res.items ?? []); setTotal(res.total); setOffset(o); })
      .catch(() => setError("Không thể tải ngữ pháp."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0); }, []);

  const openEdit = (g: GrammarResponse) => {
    setEditPattern(g.pattern);
    setEditMeanings(g.meaning ? g.meaning.split("\n").filter(Boolean) : [""]);
    setEditFormation(g.formation);
    setEditExamples(g.example.length > 0 ? [...g.example] : []);
    setEditJlpt(g.jlpt);
    setEditing(true);
  };

  const updateExample = (
    list: { japanese: string; reading: string; translation: string }[],
    setList: (v: { japanese: string; reading: string; translation: string }[]) => void,
    i: number,
    field: "japanese" | "reading" | "translation",
    val: string,
  ) => setList(list.map((ex, idx) => idx === i ? { ...ex, [field]: val } : ex));

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true); setError("");
    try {
      const updated = await adminApi.updateGrammar(selected.id, {
        jlpt: editJlpt,
        pattern: editPattern,
        meaning: editMeanings.filter(Boolean).join("\n"),
        formation: editFormation,
        examples: editExamples.filter((e) => e.japanese),
      });
      setItems((prev) => prev.map((g) => g.id === updated.id ? updated : g));
      setSelected(updated); setEditing(false);
    } catch { setError("Không thể lưu thay đổi."); }
    finally { setSaving(false); }
  };

  const create = async () => {
    if (!pattern) return;
    setSaving(true); setError("");
    try {
      const g = await adminApi.createGrammar({
        jlpt, pattern,
        meaning: meanings.filter(Boolean).join("\n"),
        formation,
        examples: examples.filter((e) => e.japanese),
      });
      setItems((prev) => [g, ...prev]);
      setPattern(""); setMeanings([""]); setFormation(""); setExamples([]);
    } catch { setError("Không thể tạo mục ngữ pháp."); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      await adminApi.deleteGrammar(id);
      setItems((prev) => prev.filter((g) => g.id !== id));
      setSelected(null);
    } catch { setError("Không thể xóa mục ngữ pháp."); }
  };

  const ExampleFields = ({
    exList,
    setExList,
  }: {
    exList: { japanese: string; reading: string; translation: string }[];
    setExList: (v: { japanese: string; reading: string; translation: string }[]) => void;
  }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <label className="italic text-[#7a6a45]">Ví dụ</label>
        <button onClick={() => setExList([...exList, { japanese: "", reading: "", translation: "" }])}
          className="text-[#7a6a45] hover:text-[#1f1a14] px-1" style={{ fontSize: "1.1rem" }}>+</button>
      </div>
      <div className="space-y-3">
        {exList.map((ex, i) => (
          <div key={i} className="border border-[#d9cfb8] p-3 space-y-1">
            <div className="flex justify-between items-center mb-1">
              <span className="italic text-[#a89770]" style={{ fontSize: "0.8rem" }}>Ví dụ {i + 1}</span>
              <button onClick={() => setExList(exList.filter((_, idx) => idx !== i))}
                className="text-[#a89770] hover:text-[#8a4438]">×</button>
            </div>
            {(["japanese", "reading", "translation"] as const).map((field) => (
              <input key={field} value={ex[field]}
                placeholder={field === "japanese" ? "tiếng Nhật" : field === "reading" ? "cách đọc" : "bản dịch"}
                onChange={(e) => updateExample(exList, setExList, i, field, e.target.value)}
                className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-2 py-1 outline-none focus:border-[#1f1a14]"
                style={{ fontSize: "0.9rem" }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {selected && (
        <Modal onClose={() => { setSelected(null); setEditing(false); }}>
          <p className="italic text-[#7a6a45] mb-1" style={{ fontSize: "0.85rem" }}>Chi tiết ngữ pháp</p>
          {editing ? (
            <div className="mt-2 space-y-3">
              <Field label="Mẫu câu" value={editPattern} onChange={setEditPattern} />
              <MultiField label="Nghĩa" values={editMeanings} onChange={setEditMeanings} />
              <Field label="Cấu trúc" value={editFormation} onChange={setEditFormation} />
              <ExampleFields exList={editExamples} setExList={setEditExamples} />
              <div>
                <label className="block italic text-[#7a6a45] mb-1">JLPT</label>
                <select value={editJlpt} onChange={(e) => setEditJlpt(Number(e.target.value))}
                  className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>N{n}</option>)}
                </select>
              </div>
              {error && <p className="italic text-[#8a4438]" style={{ fontSize: "0.85rem" }}>{error}</p>}
              <div className="flex gap-3 mt-4">
                <Button onClick={saveEdit} disabled={saving}>{saving ? "Đang lưu…" : "Lưu"}</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Hủy</Button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: "1.8rem" }}>{selected.pattern}</p>
              <Tag>N{selected.jlpt}</Tag>
              <div className="mt-3 space-y-1">
                {selected.meaning.split("\n").filter(Boolean).map((m, i) => (
                  <p key={i}>{m}</p>
                ))}
              </div>
              <p className="italic text-[#7a6a45] mt-2">{selected.formation}</p>
              {selected.notes && <p className="mt-2 text-[#5e5132]">{selected.notes}</p>}
              {selected.example.length > 0 && (
                <div className="mt-4 space-y-3">
                  {selected.example.map((ex, i) => (
                    <div key={i} className="pl-4 border-l-2 border-[#cdbf9d] italic text-[#5e5132]">
                      <p>{highlightPattern(ex.japanese, selected.pattern)}</p>
                      {ex.reading && <p className="text-[#a89770]" style={{ fontSize: "0.85rem" }}>{highlightPattern(ex.reading, selected.pattern)}</p>}
                      <p className="text-[#7a6a45]">{ex.translation}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 border-t border-[#e5dabc] pt-4 flex gap-3">
                <Button onClick={() => openEdit(selected)}>Chỉnh sửa</Button>
              </div>
            </>
          )}
        </Modal>
      )}

      <div className="flex gap-6 h-full">
        <div className="w-72 shrink-0 overflow-y-auto">
          <Paper className="p-6">
            <h3 className="italic mb-4">Thêm ngữ pháp mới</h3>
            <Field label="Mẫu câu" value={pattern} onChange={setPattern} />
            <MultiField label="Nghĩa" values={meanings} onChange={setMeanings} />
            <Field label="Cấu trúc" value={formation} onChange={setFormation} />
            <ExampleFields exList={examples} setExList={setExamples} />
            <div className="mb-4">
              <label className="block italic text-[#7a6a45] mb-1">JLPT</label>
              <select value={jlpt} onChange={(e) => setJlpt(Number(e.target.value))}
                className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>N{n}</option>)}
              </select>
            </div>
            {error && <p className="italic text-[#8a4438] mb-3" style={{ fontSize: "0.85rem" }}>{error}</p>}
            <Button onClick={create} className="w-full" disabled={saving || !pattern}>
              {saving ? "Đang lưu…" : "Thêm ngữ pháp"}
            </Button>
          </Paper>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <p className="italic text-[#7a6a45]">Đang tải…</p>}
          <div className="space-y-3">
            {items.map((g) => (
              <button key={g.id} onClick={() => { setSelected(g); setEditing(false); }} className="w-full text-left">
                <Paper className="p-4 hover:bg-[#efe6cf] transition-colors">
                  <div className="flex justify-between items-center">
                    <p style={{ fontSize: "1.2rem" }}>{g.pattern}</p>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" onClick={() => remove(g.id)}>Xóa</Button>
                    </div>
                  </div>
                  <p className="text-[#5e5132]">{g.meaning.split("\n")[0]}</p>
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
      .catch(() => setError("Không thể tải câu hỏi."))
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
    } catch { setError("Không thể lưu thay đổi."); }
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
    } catch { setError("Không thể tạo câu hỏi."); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      await adminApi.deleteQuestion(id);
      setItems((prev) => prev.filter((q) => q.id !== id));
      setSelected(null);
    } catch { setError("Không thể xóa câu hỏi."); }
  };

  return (
    <div className="h-full flex flex-col">
      {selected && (
        <Modal onClose={() => { setSelected(null); setEditing(false); }}>
          <p className="italic text-[#7a6a45] mb-1" style={{ fontSize: "0.85rem" }}>Chi tiết câu hỏi</p>
          {editing ? (
            <div className="mt-2 space-y-3">
              <Field label="Câu hỏi" value={editPrompt} onChange={setEditPrompt} />
              {editChoices.map((c, i) => (
                <div key={i}>
                  <label className="block italic text-[#7a6a45] mb-1">
                    Lựa chọn {String.fromCharCode(65 + i)} {i === editCorrectIndex && "✓"}
                  </label>
                  <input value={c}
                    onChange={(e) => setEditChoices((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                    className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2 outline-none focus:border-[#1f1a14]" />
                </div>
              ))}
              <div>
                <label className="block italic text-[#7a6a45] mb-1">Đáp án đúng</label>
                <select value={editCorrectIndex} onChange={(e) => setEditCorrectIndex(Number(e.target.value))}
                  className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
                  {editChoices.map((_, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>)}
                </select>
              </div>
              {error && <p className="italic text-[#8a4438]" style={{ fontSize: "0.85rem" }}>{error}</p>}
              <div className="flex gap-3 mt-4">
                <Button onClick={saveEdit} disabled={saving}>{saving ? "Đang lưu…" : "Lưu"}</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Hủy</Button>
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
                <Button onClick={() => openEdit(selected)}>Chỉnh sửa</Button>
              </div>
            </>
          )}
        </Modal>
      )}

      <div className="flex gap-6 h-full">
        <div className="w-72 shrink-0">
          <Paper className="p-6">
            <h3 className="italic mb-4">Thêm câu hỏi mới</h3>
            <Field label="Câu hỏi" value={prompt} onChange={setPrompt} />
            {choices.map((c, i) => (
              <div key={i} className="mb-3">
                <label className="block italic text-[#7a6a45] mb-1">
                  Lựa chọn {String.fromCharCode(65 + i)} {i === correctIndex && "✓"}
                </label>
                <input value={c}
                  onChange={(e) => setChoices((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                  className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2 outline-none focus:border-[#1f1a14]" />
              </div>
            ))}
            <div className="mb-3">
              <label className="block italic text-[#7a6a45] mb-1">Đáp án đúng</label>
              <select value={correctIndex} onChange={(e) => setCorrectIndex(Number(e.target.value))}
                className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
                {choices.map((_, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block italic text-[#7a6a45] mb-1">Phần</label>
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
              {saving ? "Đang lưu…" : "Thêm câu hỏi"}
            </Button>
          </Paper>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <p className="italic text-[#7a6a45]">Đang tải…</p>}
          <div className="space-y-3">
            {items.map((q) => (
              <button key={q.id} onClick={() => { setSelected(q); setEditing(false); }} className="w-full text-left">
                <Paper className="p-4 hover:bg-[#efe6cf] transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-2">{q.prompt}</p>
                      <p className="italic text-[#7a6a45] mt-1" style={{ fontSize: "0.85rem" }}>
                        Đáp án: {q.choices[q.correct_index]}
                      </p>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" onClick={() => remove(q.id)}>Xóa</Button>
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
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editJlpt, setEditJlpt] = useState(5);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [jlpt, setJlpt] = useState(5);
  const [error, setError] = useState("");
  const [qPrompt, setQPrompt] = useState("");
  const [qChoices, setQChoices] = useState(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState(0);

  const load = (o: number) => {
    setLoading(true);
    adminApi.listParagraphs(PAGE_SIZE, o)
      .then((res) => { setItems(res.items ?? []); setTotal(res.total); setOffset(o); })
      .catch(() => setError("Không thể tải đoạn văn."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(0); }, []);

  const openEdit = (p: ParagraphResponse) => {
    setEditTitle(p.title); setEditContent(p.content); setEditJlpt(p.jlpt);
    setEditing(true); setAddingQuestion(false);
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
    } catch { setError("Không thể lưu thay đổi."); }
    finally { setSaving(false); }
  };

  const addQuestion = async () => {
    if (!selected || !qPrompt || qChoices.some((c) => !c)) return;
    setSaving(true); setError("");
    try {
      const updated = await adminApi.updateParagraph(selected.id, {
        title: selected.title,
        content: selected.content,
        jlpt: selected.jlpt,
        questions: [
          ...selected.questions.map((q) => ({
            jlpt: selected.jlpt,
            type: "multiple_choice" as const,
            prompt: q.prompt,
            choices: q.choices,
            correct_index: (q as { correct_index?: number }).correct_index ?? 0,
          })),
          { jlpt: selected.jlpt, type: "multiple_choice" as const, prompt: qPrompt, choices: qChoices, correct_index: qCorrect },
        ],
      });
      setItems((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      setSelected(updated);
      setQPrompt(""); setQChoices(["", "", "", ""]); setQCorrect(0);
      setAddingQuestion(false);
    } catch { setError("Không thể thêm câu hỏi."); }
    finally { setSaving(false); }
  };

  const create = async () => {
    if (!title || content.length < 10) return;
    setSaving(true); setError("");
    try {
      const p = await adminApi.createParagraph({ jlpt, title, content, tags: [], questions: [] });
      setItems((prev) => [p, ...prev]);
      setTitle(""); setContent("");
    } catch { setError("Không thể tạo đoạn văn."); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    try {
      await adminApi.deleteParagraph(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
      setSelected(null);
    } catch { setError("Không thể xóa đoạn văn."); }
  };

  return (
    <div className="h-full flex flex-col">
      {selected && (
        <Modal onClose={() => { setSelected(null); setEditing(false); setAddingQuestion(false); }}>
          <p className="italic text-[#7a6a45] mb-1" style={{ fontSize: "0.85rem" }}>Chi tiết đoạn văn</p>
          {editing ? (
            <div className="mt-2 space-y-3">
              <Field label="Tiêu đề" value={editTitle} onChange={setEditTitle} />
              <div>
                <label className="block italic text-[#7a6a45] mb-1">Nội dung</label>
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
                <Button onClick={saveEdit} disabled={saving}>{saving ? "Đang lưu…" : "Lưu"}</Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Hủy</Button>
              </div>
            </div>
          ) : addingQuestion ? (
            <div className="mt-2 space-y-3">
              <p className="italic text-[#7a6a45]" style={{ fontSize: "0.85rem" }}>Câu hỏi mới cho "{selected.title}"</p>
              <Field label="Câu hỏi" value={qPrompt} onChange={setQPrompt} />
              {qChoices.map((c, i) => (
                <div key={i}>
                  <label className="block italic text-[#7a6a45] mb-1">
                    Lựa chọn {String.fromCharCode(65 + i)} {i === qCorrect && "✓"}
                  </label>
                  <input value={c}
                    onChange={(e) => setQChoices((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
                    className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2 outline-none focus:border-[#1f1a14]" />
                </div>
              ))}
              <div>
                <label className="block italic text-[#7a6a45] mb-1">Đáp án đúng</label>
                <select value={qCorrect} onChange={(e) => setQCorrect(Number(e.target.value))}
                  className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2">
                  {qChoices.map((_, i) => <option key={i} value={i}>{String.fromCharCode(65 + i)}</option>)}
                </select>
              </div>
              {error && <p className="italic text-[#8a4438]" style={{ fontSize: "0.85rem" }}>{error}</p>}
              <div className="flex gap-3 mt-4">
                <Button onClick={addQuestion} disabled={saving || !qPrompt || qChoices.some((c) => !c)}>
                  {saving ? "Đang lưu…" : "Thêm câu hỏi"}
                </Button>
                <Button variant="outline" onClick={() => setAddingQuestion(false)}>Hủy</Button>
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
                  <p className="italic text-[#7a6a45] mb-2" style={{ fontSize: "0.85rem" }}>{selected.questions.length} câu hỏi</p>
                  {selected.questions.map((q, i) => (
                    <p key={i} className="text-[#5e5132] mb-1" style={{ fontSize: "0.9rem" }}>{i + 1}. {q.prompt}</p>
                  ))}
                </div>
              )}
              <div className="mt-6 border-t border-[#e5dabc] pt-4 flex gap-3">
                <Button onClick={() => openEdit(selected)}>Chỉnh sửa</Button>
                <Button variant="outline" onClick={() => setAddingQuestion(true)}>+ Câu hỏi</Button>
              </div>
            </>
          )}
        </Modal>
      )}

      <div className="flex gap-6 h-full">
        <div className="w-72 shrink-0">
          <Paper className="p-6">
            <h3 className="italic mb-4">Thêm đoạn văn mới</h3>
            <Field label="Tiêu đề" value={title} onChange={setTitle} />
            <div className="mb-4">
              <label className="block italic text-[#7a6a45] mb-1">Nội dung</label>
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
              {saving ? "Đang lưu…" : "Tạo đoạn văn"}
            </Button>
          </Paper>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <p className="italic text-[#7a6a45]">Đang tải…</p>}
          <div className="space-y-3">
            {items.map((p) => (
              <button key={p.id} onClick={() => { setSelected(p); setEditing(false); setAddingQuestion(false); }} className="w-full text-left">
                <Paper className="p-4 hover:bg-[#efe6cf] transition-colors">
                  <div className="flex justify-between items-center">
                    <p style={{ fontSize: "1.1rem" }}>{p.title}</p>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" onClick={() => remove(p.id)}>Xóa</Button>
                    </div>
                  </div>
                  <p className="text-[#5e5132] mt-1 line-clamp-2" style={{ fontSize: "0.9rem" }}>{p.content}</p>
                  {p.questions.length > 0 && (
                    <p className="italic text-[#a89770] mt-1" style={{ fontSize: "0.8rem" }}>{p.questions.length} câu hỏi</p>
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

function highlightPattern(text: string, pattern: string): React.ReactNode {
  if (!pattern) return text;
  // Strip 〜 prefix common in grammar patterns before matching
  const core = pattern.replace(/^[〜～]/, "").trim();
  if (!core) return text;
  const escaped = core.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "g"));
  if (parts.length === 1) return text;
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1
          ? <mark key={i} style={{ background: "#e8efd8", color: "#3a4a1a", padding: "0 2px" }}>{p}</mark>
          : p
      )}
    </>
  );
}

function MultiField({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  const update = (i: number, val: string) => onChange(values.map((v, idx) => idx === i ? val : v));
  const add = () => onChange([...values, ""]);
  const remove = (i: number) => onChange(values.length > 1 ? values.filter((_, idx) => idx !== i) : [""]);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <label className="italic text-[#7a6a45]">{label}</label>
        <button onClick={add} className="text-[#7a6a45] hover:text-[#1f1a14] px-1" style={{ fontSize: "1.1rem" }}>+</button>
      </div>
      <div className="space-y-1">
        {values.map((v, i) => (
          <div key={i} className="flex gap-1">
            <input value={v} onChange={(e) => update(i, e.target.value)}
              className="flex-1 bg-[#fbf8f1] border border-[#d9cfb8] px-3 py-2 outline-none focus:border-[#1f1a14]" />
            {values.length > 1 && (
              <button onClick={() => remove(i)} className="px-2 text-[#a89770] hover:text-[#8a4438]">×</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const POS_OPTIONS = ["danh từ", "động từ nhóm 1", "động từ nhóm 2/3", "tính từ đuôi い", "tính từ đuôi な", "phó từ", "giới từ", "liên từ", "cụm từ", "khác"];

function KanjiFields({ values, onChange }: { values: KanjiEntry[]; onChange: (v: KanjiEntry[]) => void }) {
  const update = (i: number, field: keyof KanjiEntry, val: string) =>
    onChange(values.map((k, idx) => idx === i ? { ...k, [field]: val } : k));
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <label className="italic text-[#7a6a45]">Kanji</label>
        <button onClick={() => onChange([...values, emptyKanji()])}
          className="text-[#7a6a45] hover:text-[#1f1a14] px-1" style={{ fontSize: "1.1rem" }}>+</button>
      </div>
      <div className="space-y-2">
        {values.map((k, i) => (
          <div key={i} className="border border-[#d9cfb8] p-2 space-y-1">
            <div className="flex gap-1">
              <input value={k.text} placeholder="kanji" onChange={(e) => update(i, "text", e.target.value)}
                className="flex-1 bg-[#fbf8f1] border border-[#d9cfb8] px-2 py-1 outline-none focus:border-[#1f1a14]" />
              {values.length > 1 && (
                <button onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                  className="px-2 text-[#a89770] hover:text-[#8a4438]">×</button>
              )}
            </div>
            <input value={k.info} placeholder="thông tin (tuỳ chọn)" onChange={(e) => update(i, "info", e.target.value)}
              className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-2 py-1 outline-none focus:border-[#1f1a14]"
              style={{ fontSize: "0.85rem" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SenseFields({ values, onChange }: { values: SenseEntry[]; onChange: (v: SenseEntry[]) => void }) {
  const update = (i: number, field: keyof SenseEntry, val: string) =>
    onChange(values.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <label className="italic text-[#7a6a45]">Nghĩa</label>
        <button onClick={() => onChange([...values, emptySense()])}
          className="text-[#7a6a45] hover:text-[#1f1a14] px-1" style={{ fontSize: "1.1rem" }}>+</button>
      </div>
      <div className="space-y-2">
        {values.map((s, i) => (
          <div key={i} className="border border-[#d9cfb8] p-2 space-y-1">
            <div className="flex gap-1">
              <input value={s.gloss} placeholder="nghĩa (tiếng Anh)" onChange={(e) => update(i, "gloss", e.target.value)}
                className="flex-1 bg-[#fbf8f1] border border-[#d9cfb8] px-2 py-1 outline-none focus:border-[#1f1a14]" />
              {values.length > 1 && (
                <button onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                  className="px-2 text-[#a89770] hover:text-[#8a4438]">×</button>
              )}
            </div>
            <select value={s.pos} onChange={(e) => update(i, "pos", e.target.value)}
              className="w-full bg-[#fbf8f1] border border-[#d9cfb8] px-2 py-1" style={{ fontSize: "0.85rem" }}>
              {POS_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
