const BASE = import.meta.env.VITE_API_BASE as string;

// ── Types ────────────────────────────────────────────────────────────────────

export interface AppError { message: string; detail: string }

export interface GlossResponse { lang: string; text: string }
export interface KanjiResponse { text: string; info: string }
export interface ReadingResponse { text: string; info: string[] }
export interface SenseResponse { gloss: GlossResponse[]; pos: string[] }
export interface WordResponse {
  id: string;
  jlpt: number;
  is_common: boolean;
  kanji: KanjiResponse[];
  readings: ReadingResponse[];
  sense: SenseResponse[];
}

export interface GrammarExample { japanese: string; reading: string; translation: string }
export interface GrammarResponse {
  id: string;
  jlpt: number;
  pattern: string;
  meaning: string;
  formation: string;
  notes: string;
  example: GrammarExample[];
}

export interface SRSCardResponse {
  id: string;
  word_id: string;
  due_date: string;
  ease_factor: number;
  interval: number;
  repetition: number;
}

export interface QuestionResponse {
  id: string;
  prompt: string;
  type: string;
  choices: string[];
}

export interface QuestionWithAnswerResponse extends QuestionResponse {
  correct_index: number;
  explanation: string;
}

export interface TestPartResponse { section: string; questions: QuestionResponse[] }
export interface TestResponse {
  id: string;
  jlpt: number;
  time_limit: number;
  sections: TestPartResponse[];
}

export interface SubmitTestResponse { score: number; total: number }

export interface ActivityLogResponse {
  action: string;
  date: string;
  detail: string;
}

export interface ProgressResponse {
  cards_studied: number;
  jlpt_level: number;
  last_study_at: string;
  streak: number;
  longest_streak: number;
  quizzes_taken: number;
  accuracy: number;
  weekly_minutes: number[];
  recent_activity: ActivityLogResponse[];
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  picture_url: string;
  created_at: string;
  study_progress: ProgressResponse;
}

export interface ParagraphResponse {
  id: string;
  title: string;
  content: string;
  jlpt: number;
  tags: string[];
  questions: QuestionResponse[];
}

export interface PaginatedWords { items: WordResponse[]; total: number; limit: number; offset: number }
export interface PaginatedGrammars { items: GrammarResponse[]; total: number; limit: number; offset: number }
export interface PaginatedQuestions { items: QuestionWithAnswerResponse[]; total: number; limit: number; offset: number }
export interface PaginatedParagraphs { items: ParagraphResponse[]; total: number; limit: number; offset: number }

// ── Core fetch ───────────────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const err: AppError & { status: number } = {
      ...(await res.json().catch(() => ({ message: res.statusText, detail: "" }))),
      status: res.status,
    };
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Words ────────────────────────────────────────────────────────────────────

export const words = {
  search: (q: string, limit = 20) =>
    request<WordResponse[]>(`/words/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  byLevel: (level: number, limit = 50, offset = 0) =>
    request<PaginatedWords>(`/words/jlpt/${level}?limit=${limit}&offset=${offset}`),

  get: (id: string) =>
    request<WordResponse>(`/words/${id}`),
};

// ── Grammar ──────────────────────────────────────────────────────────────────

export const grammar = {
  list: (jlpt = 5, limit = 50) =>
    request<GrammarResponse[]>(`/grammar?jlpt=${jlpt}&limit=${limit}`),

  get: (id: string) =>
    request<GrammarResponse>(`/grammar/${id}`),
};

// ── SRS ──────────────────────────────────────────────────────────────────────

export const srs = {
  due: (limit = 20) =>
    request<SRSCardResponse[]>(`/srs/due?limit=${limit}`),

  dueCount: () =>
    request<{ count: number }>("/srs/due/count"),

  addToDeck: (word_id: string) =>
    request<SRSCardResponse>("/srs/deck", { method: "POST", body: JSON.stringify({ word_id }) }),

  review: (id: string, quality: number) =>
    request<SRSCardResponse>(`/srs/review/${id}`, { method: "POST", body: JSON.stringify({ quality }) }),
};

// ── Tests ────────────────────────────────────────────────────────────────────

export const tests = {
  generate: (level: number) =>
    request<TestResponse>(`/tests/generate/${level}`, { method: "POST" }),

  submit: (id: string, answers: Record<string, number>) =>
    request<SubmitTestResponse>(`/tests/${id}/submit`, { method: "POST", body: JSON.stringify({ answers }) }),
};

// ── Users ────────────────────────────────────────────────────────────────────

export const users = {
  me: () => request<UserResponse>("/users/me"),
};

// ── Admin ────────────────────────────────────────────────────────────────────

export interface CreateWordRequest {
  jlpt?: number;
  kanji: { text: string; info?: string }[];
  readings: { text: string }[];
  senses: { gloss: { lang: string; text: string }[]; pos?: string[] }[];
}

export interface CreateGrammarRequest {
  jlpt: number;
  pattern: string;
  meaning: string;
  formation: string;
  notes?: string;
  examples?: GrammarExample[];
}

export interface CreateQuestionRequest {
  jlpt: number;
  section: "vocabulary" | "grammar" | "reading";
  type: "multiple_choice" | "fill_in_blank" | "reorder";
  prompt: string;
  choices: string[];
  correct_index: number;
  explanation?: string;
  tags: string[];
}

export interface CreateParagraphRequest {
  jlpt: number;
  title: string;
  content: string;
  tags: string[];
  questions: {
    jlpt: number;
    type: "multiple_choice" | "fill_in_blank";
    prompt: string;
    choices: string[];
    correct_index: number;
    explanation?: string;
  }[];
}

export const admin = {
  listWords: (limit = 50, offset = 0) =>
    request<PaginatedWords>(`/admin/words?limit=${limit}&offset=${offset}`),

  createWord: (body: CreateWordRequest) =>
    request<WordResponse>("/admin/words", { method: "POST", body: JSON.stringify(body) }),

  updateWord: (id: string, body: Partial<CreateWordRequest>) =>
    request<WordResponse>(`/admin/words/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  deleteWord: (id: string) =>
    request<{ deleted: boolean }>(`/admin/words/${id}`, { method: "DELETE" }),

  listGrammars: (limit = 50, offset = 0) =>
    request<PaginatedGrammars>(`/admin/grammars?limit=${limit}&offset=${offset}`),

  createGrammar: (body: CreateGrammarRequest) =>
    request<GrammarResponse>("/admin/grammars", { method: "POST", body: JSON.stringify(body) }),

  updateGrammar: (id: string, body: Partial<CreateGrammarRequest>) =>
    request<GrammarResponse>(`/admin/grammars/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  deleteGrammar: (id: string) =>
    request<{ deleted: boolean }>(`/admin/grammars/${id}`, { method: "DELETE" }),

  listQuestions: (limit = 50, offset = 0) =>
    request<PaginatedQuestions>(`/admin/questions?limit=${limit}&offset=${offset}`),

  createQuestion: (body: CreateQuestionRequest) =>
    request<QuestionWithAnswerResponse>("/admin/questions", { method: "POST", body: JSON.stringify(body) }),

  updateQuestion: (id: string, body: Partial<CreateQuestionRequest>) =>
    request<QuestionWithAnswerResponse>(`/admin/questions/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  deleteQuestion: (id: string) =>
    request<{ deleted: boolean }>(`/admin/questions/${id}`, { method: "DELETE" }),

  listParagraphs: (limit = 50, offset = 0) =>
    request<PaginatedParagraphs>(`/admin/paragraphs?limit=${limit}&offset=${offset}`),

  createParagraph: (body: CreateParagraphRequest) =>
    request<ParagraphResponse>("/admin/paragraphs", { method: "POST", body: JSON.stringify(body) }),

  updateParagraph: (id: string, body: Partial<CreateParagraphRequest>) =>
    request<ParagraphResponse>(`/admin/paragraphs/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  deleteParagraph: (id: string) =>
    request<{ deleted: boolean }>(`/admin/paragraphs/${id}`, { method: "DELETE" }),
};
