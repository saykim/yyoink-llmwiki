# Personal LLM Wiki Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the current yyoink Chrome extension from a project-based snippet collector into a topic-based, source-grounded personal LLM wiki MVP.

**Architecture:** Keep the Chrome extension as the product surface. Add focused shared modules for domain models, IndexedDB persistence, migration, AI response contracts, and AI provider calls, then wire the existing side panel and background worker through those modules. Preserve current source collection behavior while adding topic wiki generation, draft review, and topic-grounded Q&A.

**Tech Stack:** Chrome Extension Manifest V3, vanilla JavaScript, classic scripts plus UMD-style shared modules, IndexedDB, `chrome.storage.local` for settings and migration state, Node built-in `node:test` for pure-unit tests, OpenAI Responses API-compatible AI client.

---

## Current Constraints And Reference Notes

- The current workspace is not a Git repository. Do not add commit steps inside this plan. If the project is later moved into a repository, commit after each completed task using the workspace Lore commit protocol.
- The existing extension uses classic scripts, not ES modules. Shared modules in this plan expose APIs through `globalThis.YyoinkWiki` and `module.exports` so the same logic can run in Chrome and Node tests.
- The official Chrome storage documentation currently states `storage.local` has a 10 MB quota unless `unlimitedStorage` is requested. The existing PRDs mention 5 MB, so implementation should rely on IndexedDB for knowledge data and treat `chrome.storage.local` as settings/migration storage.
- The Chrome Side Panel API requires MV3 and Chrome 114+. The current code already uses `chrome.sidePanel.open`; keep side panel behavior compatible with the existing extension.
- IndexedDB is available in workers and uses explicit database version upgrades, object stores, indexes, and transactions.
- AI provider code should be isolated behind one client function so the MVP can start with one provider without spreading provider assumptions through UI code.

Reference pages checked while writing this plan:

- Chrome Storage API: `https://developer.chrome.com/docs/extensions/reference/api/storage`
- Chrome Side Panel API: `https://developer.chrome.com/docs/extensions/reference/api/sidePanel`
- Chrome extension service worker lifecycle: `https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle`
- IndexedDB API: `https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API`
- OpenAI Responses API: `https://platform.openai.com/docs/api-reference/responses`

## File Structure

Create focused modules and keep the existing large files as integration shells at first.

```text
package.json
tests/
  wiki-models.test.js
  ai-contract.test.js
shared/
  wiki-models.js
  ai-contract.js
  idb-repository.js
  migration.js
background/
  ai-service.js
sidepanel/
  index.html
  main.js
  styles.css
```

Responsibilities:

- `shared/wiki-models.js`: Pure data normalization, ID generation, topic/source/wiki/draft factories, topic status derivation, source filtering, export shaping.
- `shared/ai-contract.js`: Pure prompt input shaping, AI JSON parsing, validation, and draft normalization.
- `shared/idb-repository.js`: IndexedDB open/upgrade logic and CRUD repository for topics, sources, wiki pages, and AI drafts.
- `shared/migration.js`: Reads legacy `projects[]` and `snippets[]`, writes normalized IndexedDB records, stores `migrationVersion`.
- `background/ai-service.js`: Owns AI provider request handling and returns normalized draft payloads through Chrome runtime messages.
- `sidepanel/main.js`: Existing UI orchestration; integrate repository methods, tabs, draft review, and topic Q&A without turning new modules into UI files.

## Task 1: Add Test Harness And Domain Model

**Files:**
- Create: `package.json`
- Create: `tests/wiki-models.test.js`
- Create: `shared/wiki-models.js`

- [ ] **Step 1: Add Node test script**

Create `package.json`:

```json
{
  "scripts": {
    "test": "node --test tests/*.test.js"
  }
}
```

- [ ] **Step 2: Write failing domain model tests**

Create `tests/wiki-models.test.js`:

```javascript
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createId,
  normalizeProjectToTopic,
  normalizeSnippetToSource,
  createWikiPageFromDraft,
  deriveTopicStatus,
  filterSources,
  buildExportPayload,
} = require("../shared/wiki-models.js");

test("createId returns stable prefix plus random suffix", () => {
  const id = createId("topic", 1779500000000, () => 0.123456789);
  assert.match(id, /^topic-mf/);
  assert.ok(id.includes("-4fzzzx"));
});

test("normalizeProjectToTopic preserves project identity", () => {
  const topic = normalizeProjectToTopic({
    id: "default",
    name: "Default",
    color: "#6366f1",
    createdAt: "2026-01-01T00:00:00.000Z",
  });

  assert.deepEqual(topic, {
    id: "default",
    title: "Default",
    description: "",
    color: "#6366f1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
});

test("normalizeSnippetToSource converts legacy snippet into raw source", () => {
  const source = normalizeSnippetToSource({
    id: "s1",
    text: "Collected text",
    sourceUrl: "https://example.com/a",
    pageTitle: "Example",
    domain: "example.com",
    projectId: "p1",
    createdAt: "2026-01-02T00:00:00.000Z",
  });

  assert.equal(source.id, "s1");
  assert.equal(source.topicId, "p1");
  assert.equal(source.type, "selection");
  assert.equal(source.aiStatus, "raw");
  assert.equal(source.text, "Collected text");
});

test("normalizeSnippetToSource classifies memo and clipboard sources", () => {
  assert.equal(
    normalizeSnippetToSource({
      id: "m1",
      text: "memo",
      sourceUrl: "memo://local",
      pageTitle: "Quick Memo",
      domain: "Memo",
      projectId: "default",
      createdAt: "2026-01-03T00:00:00.000Z",
    }).type,
    "memo",
  );

  assert.equal(
    normalizeSnippetToSource({
      id: "c1",
      text: "clip",
      sourceUrl: "clipboard://paste",
      pageTitle: "Pasted from Clipboard",
      domain: "Clipboard",
      projectId: "default",
      createdAt: "2026-01-03T00:00:00.000Z",
    }).type,
    "clipboard",
  );
});

test("createWikiPageFromDraft requires approved generate or update draft", () => {
  const now = "2026-05-23T00:00:00.000Z";
  const page = createWikiPageFromDraft({
    draft: {
      id: "d1",
      topicId: "t1",
      type: "generateWiki",
      status: "approved",
      proposedWikiMarkdown: "# Topic\n\nBody",
      generatedSummary: "Short summary",
      followUpQuestions: ["What next?"],
      sourceCitations: [{ sourceId: "s1", note: "supports summary" }],
    },
    existingPage: null,
    title: "Topic",
    now,
  });

  assert.equal(page.topicId, "t1");
  assert.equal(page.title, "Topic");
  assert.equal(page.bodyMarkdown, "# Topic\n\nBody");
  assert.deepEqual(page.sourceIds, ["s1"]);
  assert.equal(page.createdAt, now);
  assert.equal(page.updatedAt, now);

  assert.throws(() =>
    createWikiPageFromDraft({
      draft: { type: "askTopic", status: "approved" },
      existingPage: null,
      title: "Topic",
      now,
    }),
  );
});

test("deriveTopicStatus reports wiki lifecycle states", () => {
  assert.equal(
    deriveTopicStatus({ wikiPage: null, sources: [], drafts: [], isGenerating: false }),
    "No wiki yet",
  );
  assert.equal(
    deriveTopicStatus({ wikiPage: null, sources: [{ id: "s1", aiStatus: "raw" }], drafts: [], isGenerating: false }),
    "Ready to generate",
  );
  assert.equal(
    deriveTopicStatus({ wikiPage: null, sources: [], drafts: [], isGenerating: true }),
    "Generating",
  );
  assert.equal(
    deriveTopicStatus({
      wikiPage: { id: "w1" },
      sources: [{ id: "s1", aiStatus: "raw" }],
      drafts: [],
      isGenerating: false,
    }),
    "New sources available",
  );
  assert.equal(
    deriveTopicStatus({
      wikiPage: { id: "w1" },
      sources: [{ id: "s1", aiStatus: "processed" }],
      drafts: [{ id: "d1", status: "ready" }],
      isGenerating: false,
    }),
    "Draft ready",
  );
});

test("filterSources filters by topic and search term", () => {
  const sources = [
    { topicId: "a", text: "Alpha text", pageTitle: "One", domain: "alpha.com" },
    { topicId: "b", text: "Beta text", pageTitle: "Two", domain: "beta.com" },
  ];

  assert.equal(filterSources(sources, { topicId: "a", searchTerm: "" }).length, 1);
  assert.equal(filterSources(sources, { topicId: "all", searchTerm: "beta" }).length, 1);
  assert.equal(filterSources(sources, { topicId: "all", searchTerm: "missing" }).length, 0);
});

test("buildExportPayload includes topics sources wiki pages and drafts", () => {
  const payload = buildExportPayload({
    topics: [{ id: "t1" }],
    sources: [{ id: "s1", topicId: "t1" }],
    wikiPages: [{ id: "w1", topicId: "t1" }],
    aiDrafts: [{ id: "d1", topicId: "t1" }],
    topicId: "t1",
  });

  assert.deepEqual(payload.topics.map((x) => x.id), ["t1"]);
  assert.deepEqual(payload.sources.map((x) => x.id), ["s1"]);
  assert.deepEqual(payload.wikiPages.map((x) => x.id), ["w1"]);
  assert.deepEqual(payload.aiDrafts.map((x) => x.id), ["d1"]);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`

Expected: FAIL with `Cannot find module '../shared/wiki-models.js'`.

- [ ] **Step 4: Implement domain model module**

Create `shared/wiki-models.js`:

```javascript
(function attachWikiModels(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.YyoinkWiki = root.YyoinkWiki || {};
  root.YyoinkWiki.models = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createWikiModels() {
  const DEFAULT_COLOR = "#6366f1";

  function createId(prefix = "id", now = Date.now(), random = Math.random) {
    return `${prefix}-${now.toString(36)}-${random().toString(36).slice(2, 8)}`;
  }

  function isoNow() {
    return new Date().toISOString();
  }

  function normalizeProjectToTopic(project, now = isoNow()) {
    const createdAt = project.createdAt || now;
    return {
      id: project.id || createId("topic"),
      title: project.name || project.title || "Untitled Topic",
      description: project.description || "",
      color: project.color || DEFAULT_COLOR,
      createdAt,
      updatedAt: project.updatedAt || createdAt,
    };
  }

  function inferSourceType(snippet) {
    if (snippet.sourceUrl === "memo://local") return "memo";
    if (snippet.sourceUrl === "clipboard://paste") return "clipboard";
    if (snippet.sourceUrl === "Imported") return "import";
    if (snippet.pageTitle === "Page Capture") return "page";
    return "selection";
  }

  function normalizeSnippetToSource(snippet, now = isoNow()) {
    const createdAt = snippet.createdAt || now;
    return {
      id: snippet.id || createId("source"),
      topicId: snippet.projectId || snippet.topicId || "default",
      type: snippet.type || inferSourceType(snippet),
      text: snippet.text || "",
      sourceUrl: snippet.sourceUrl || "",
      pageTitle: snippet.pageTitle || "",
      domain: snippet.domain || "",
      createdAt,
      updatedAt: snippet.updatedAt || createdAt,
      aiStatus: snippet.aiStatus || "raw",
    };
  }

  function createSource(input, now = isoNow()) {
    return {
      id: input.id || createId("source"),
      topicId: input.topicId || "default",
      type: input.type || "selection",
      text: input.text || "",
      sourceUrl: input.sourceUrl || "",
      pageTitle: input.pageTitle || "",
      domain: input.domain || "",
      createdAt: input.createdAt || now,
      updatedAt: input.updatedAt || now,
      aiStatus: input.aiStatus || "raw",
    };
  }

  function sourceIdsFromCitations(citations) {
    return Array.from(
      new Set((citations || []).map((citation) => citation.sourceId).filter(Boolean)),
    );
  }

  function createWikiPageFromDraft({ draft, existingPage, title, now = isoNow() }) {
    if (!draft || draft.status !== "approved") {
      throw new Error("Only approved drafts can create wiki pages");
    }
    if (draft.type !== "generateWiki" && draft.type !== "updateWiki") {
      throw new Error("Only wiki drafts can update WikiPage");
    }

    return {
      id: existingPage?.id || createId("wiki"),
      topicId: draft.topicId,
      title: title || existingPage?.title || "Untitled Wiki",
      bodyMarkdown: draft.proposedWikiMarkdown || "",
      summary: draft.generatedSummary || "",
      keyQuestions: draft.followUpQuestions || [],
      sourceIds: sourceIdsFromCitations(draft.sourceCitations),
      createdAt: existingPage?.createdAt || now,
      updatedAt: now,
    };
  }

  function deriveTopicStatus({ wikiPage, sources, drafts, isGenerating }) {
    if (isGenerating) return "Generating";
    if ((drafts || []).some((draft) => draft.status === "ready")) return "Draft ready";
    if ((drafts || []).some((draft) => draft.status === "failed")) return "AI failed";
    if (!wikiPage && (!sources || sources.length === 0)) return "No wiki yet";
    if (!wikiPage) return "Ready to generate";
    if ((sources || []).some((source) => source.aiStatus === "raw" || source.aiStatus === "stale")) {
      return "New sources available";
    }
    return "Wiki up to date";
  }

  function filterSources(sources, { topicId, searchTerm }) {
    const term = (searchTerm || "").toLowerCase();
    return (sources || []).filter((source) => {
      const topicMatches = topicId === "all" || source.topicId === topicId;
      const searchMatches =
        !term ||
        (source.text || "").toLowerCase().includes(term) ||
        (source.pageTitle || "").toLowerCase().includes(term) ||
        (source.domain || "").toLowerCase().includes(term);
      return topicMatches && searchMatches;
    });
  }

  function buildExportPayload({ topics, sources, wikiPages, aiDrafts, topicId = "all" }) {
    const topicFilter = (record) => topicId === "all" || record.topicId === topicId || record.id === topicId;
    return {
      version: 2,
      exportedAt: isoNow(),
      topics: (topics || []).filter(topicFilter),
      sources: (sources || []).filter(topicFilter),
      wikiPages: (wikiPages || []).filter(topicFilter),
      aiDrafts: (aiDrafts || []).filter(topicFilter),
    };
  }

  return {
    createId,
    normalizeProjectToTopic,
    normalizeSnippetToSource,
    createSource,
    createWikiPageFromDraft,
    deriveTopicStatus,
    filterSources,
    buildExportPayload,
  };
});
```

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: PASS for `tests/wiki-models.test.js`.

## Task 2: Add AI Contract Tests And Parser

**Files:**
- Create: `tests/ai-contract.test.js`
- Create: `shared/ai-contract.js`

- [ ] **Step 1: Write failing AI contract tests**

Create `tests/ai-contract.test.js`:

```javascript
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildWikiPromptPayload,
  parseAIJsonResponse,
  normalizeDraftFromAI,
} = require("../shared/ai-contract.js");

test("buildWikiPromptPayload includes topic and source boundaries", () => {
  const payload = buildWikiPromptPayload({
    action: "generateWiki",
    topic: { id: "t1", title: "LLM Wiki" },
    sources: [
      { id: "s1", text: "First source", sourceUrl: "https://a.com", pageTitle: "A" },
      { id: "s2", text: "Second source", sourceUrl: "https://b.com", pageTitle: "B" },
    ],
    wikiPage: null,
    question: "",
  });

  assert.equal(payload.action, "generateWiki");
  assert.equal(payload.topic.title, "LLM Wiki");
  assert.equal(payload.sources.length, 2);
  assert.equal(payload.sources[0].id, "s1");
});

test("parseAIJsonResponse extracts JSON from plain JSON response", () => {
  const parsed = parseAIJsonResponse('{"summary":"S","proposedWikiMarkdown":"# S","keyConcepts":[],"citations":[],"weakClaims":[],"followUpQuestions":[]}');
  assert.equal(parsed.summary, "S");
});

test("parseAIJsonResponse extracts JSON from fenced response", () => {
  const parsed = parseAIJsonResponse('```json\n{"summary":"S","proposedWikiMarkdown":"# S","keyConcepts":[],"citations":[],"weakClaims":[],"followUpQuestions":[]}\n```');
  assert.equal(parsed.proposedWikiMarkdown, "# S");
});

test("normalizeDraftFromAI validates citations and keeps weak claims", () => {
  const draft = normalizeDraftFromAI({
    topicId: "t1",
    action: "generateWiki",
    aiPayload: {
      summary: "Summary",
      proposedWikiMarkdown: "# Summary",
      keyConcepts: ["Concept"],
      citations: [{ sourceId: "s1", note: "Evidence" }],
      weakClaims: ["Needs more evidence"],
      followUpQuestions: ["What is missing?"],
    },
    rawResponse: "{}",
    now: "2026-05-23T00:00:00.000Z",
  });

  assert.equal(draft.topicId, "t1");
  assert.equal(draft.status, "ready");
  assert.deepEqual(draft.extractedConcepts, ["Concept"]);
  assert.deepEqual(draft.sourceCitations, [{ sourceId: "s1", note: "Evidence" }]);
  assert.deepEqual(draft.weakClaims, ["Needs more evidence"]);
});

test("normalizeDraftFromAI rejects missing required arrays", () => {
  assert.throws(() =>
    normalizeDraftFromAI({
      topicId: "t1",
      action: "generateWiki",
      aiPayload: { summary: "Summary", proposedWikiMarkdown: "# Summary" },
      rawResponse: "{}",
    }),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`

Expected: FAIL with `Cannot find module '../shared/ai-contract.js'`.

- [ ] **Step 3: Implement AI contract module**

Create `shared/ai-contract.js`:

```javascript
(function attachAIContract(root, factory) {
  const api = factory(root.YyoinkWiki?.models);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.YyoinkWiki = root.YyoinkWiki || {};
  root.YyoinkWiki.aiContract = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createAIContract(models) {
  function createId(prefix = "draft") {
    const idFactory = models?.createId;
    return idFactory ? idFactory(prefix) : `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function buildWikiPromptPayload({ action, topic, sources, wikiPage, question }) {
    return {
      action,
      topic: {
        id: topic.id,
        title: topic.title,
        description: topic.description || "",
      },
      wikiPage: wikiPage
        ? {
            id: wikiPage.id,
            title: wikiPage.title,
            summary: wikiPage.summary,
            bodyMarkdown: wikiPage.bodyMarkdown,
            sourceIds: wikiPage.sourceIds || [],
          }
        : null,
      question: question || "",
      sources: (sources || []).map((source) => ({
        id: source.id,
        type: source.type,
        title: source.pageTitle || source.domain || "Untitled Source",
        sourceUrl: source.sourceUrl,
        text: source.text,
      })),
      outputContract: {
        summary: "string",
        proposedWikiMarkdown: "string",
        keyConcepts: "string[]",
        citations: "{ sourceId: string, quote?: string, note: string }[]",
        weakClaims: "string[]",
        followUpQuestions: "string[]",
      },
    };
  }

  function stripJsonFence(text) {
    const trimmed = String(text || "").trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return fenced ? fenced[1].trim() : trimmed;
  }

  function parseAIJsonResponse(rawResponse) {
    const stripped = stripJsonFence(rawResponse);
    return JSON.parse(stripped);
  }

  function assertArray(value, name) {
    if (!Array.isArray(value)) {
      throw new Error(`AI response field ${name} must be an array`);
    }
  }

  function normalizeCitations(citations) {
    return citations.map((citation) => {
      if (!citation.sourceId || !citation.note) {
        throw new Error("AI citation must include sourceId and note");
      }
      return {
        sourceId: String(citation.sourceId),
        quote: citation.quote ? String(citation.quote) : undefined,
        note: String(citation.note),
      };
    });
  }

  function normalizeDraftFromAI({ topicId, action, aiPayload, rawResponse, now = new Date().toISOString() }) {
    assertArray(aiPayload.keyConcepts, "keyConcepts");
    assertArray(aiPayload.citations, "citations");
    assertArray(aiPayload.weakClaims, "weakClaims");
    assertArray(aiPayload.followUpQuestions, "followUpQuestions");

    return {
      id: createId("draft"),
      topicId,
      type: action,
      status: "ready",
      proposedWikiMarkdown: aiPayload.proposedWikiMarkdown || "",
      generatedSummary: aiPayload.summary || "",
      extractedConcepts: aiPayload.keyConcepts.map(String),
      sourceCitations: normalizeCitations(aiPayload.citations),
      weakClaims: aiPayload.weakClaims.map(String),
      followUpQuestions: aiPayload.followUpQuestions.map(String),
      rawResponse: rawResponse || "",
      createdAt: now,
      updatedAt: now,
    };
  }

  function createFailedDraft({ topicId, action, errorMessage, rawResponse = "", now = new Date().toISOString() }) {
    return {
      id: createId("draft"),
      topicId,
      type: action,
      status: "failed",
      proposedWikiMarkdown: "",
      generatedSummary: "",
      extractedConcepts: [],
      sourceCitations: [],
      weakClaims: [errorMessage],
      followUpQuestions: [],
      rawResponse,
      createdAt: now,
      updatedAt: now,
    };
  }

  return {
    buildWikiPromptPayload,
    parseAIJsonResponse,
    normalizeDraftFromAI,
    createFailedDraft,
  };
});
```

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: PASS for `wiki-models.test.js` and `ai-contract.test.js`.

## Task 3: Add IndexedDB Repository And Legacy Migration

**Files:**
- Create: `shared/idb-repository.js`
- Create: `shared/migration.js`
- Modify: `sidepanel/index.html`
- Modify: `background.js`

- [ ] **Step 1: Add shared scripts to side panel HTML**

Modify `sidepanel/index.html`. Insert these script tags before the existing `<script src="main.js"></script>` near the end of the file:

```html
    <script src="../shared/wiki-models.js"></script>
    <script src="../shared/ai-contract.js"></script>
    <script src="../shared/idb-repository.js"></script>
    <script src="../shared/migration.js"></script>
```

Expected result: side panel has `globalThis.YyoinkWiki.models`, `globalThis.YyoinkWiki.aiContract`, `globalThis.YyoinkWiki.repository`, and `globalThis.YyoinkWiki.migration` before `main.js` runs.

- [ ] **Step 2: Import shared scripts in background worker**

Modify the top of `background.js`, after the license block and before runtime state:

```javascript
importScripts(
  "shared/wiki-models.js",
  "shared/ai-contract.js",
  "shared/idb-repository.js",
  "shared/migration.js",
  "background/ai-service.js",
);
```

Expected result: background worker can save sources and process AI requests through shared modules.

- [ ] **Step 3: Implement IndexedDB repository**

Create `shared/idb-repository.js`:

```javascript
(function attachRepository(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.YyoinkWiki = root.YyoinkWiki || {};
  root.YyoinkWiki.repository = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createRepositoryModule() {
  const DB_NAME = "yyoink-wiki";
  const DB_VERSION = 1;
  const STORES = ["topics", "sources", "wikiPages", "aiDrafts"];

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("topics")) {
          db.createObjectStore("topics", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("sources")) {
          const store = db.createObjectStore("sources", { keyPath: "id" });
          store.createIndex("topicId", "topicId", { unique: false });
          store.createIndex("aiStatus", "aiStatus", { unique: false });
        }
        if (!db.objectStoreNames.contains("wikiPages")) {
          const store = db.createObjectStore("wikiPages", { keyPath: "id" });
          store.createIndex("topicId", "topicId", { unique: false });
        }
        if (!db.objectStoreNames.contains("aiDrafts")) {
          const store = db.createObjectStore("aiDrafts", { keyPath: "id" });
          store.createIndex("topicId", "topicId", { unique: false });
          store.createIndex("status", "status", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(storeName, mode, callback) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = callback(store);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }).finally(() => db.close());
  }

  async function withStores(storeNames, mode, callback) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, mode);
      const stores = Object.fromEntries(storeNames.map((name) => [name, tx.objectStore(name)]));
      const result = callback(stores);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    }).finally(() => db.close());
  }

  async function getAll(storeName) {
    return withStore(storeName, "readonly", (store) => requestToPromise(store.getAll()));
  }

  async function getById(storeName, id) {
    return withStore(storeName, "readonly", (store) => requestToPromise(store.get(id)));
  }

  async function put(storeName, record) {
    await withStore(storeName, "readwrite", (store) => store.put(record));
    return record;
  }

  async function remove(storeName, id) {
    await withStore(storeName, "readwrite", (store) => store.delete(id));
    return id;
  }

  async function getAllByIndex(storeName, indexName, value) {
    return withStore(storeName, "readonly", (store) => requestToPromise(store.index(indexName).getAll(value)));
  }

  async function replaceAll({ topics, sources, wikiPages, aiDrafts }) {
    await withStores(STORES, "readwrite", (stores) => {
      STORES.forEach((storeName) => stores[storeName].clear());
      (topics || []).forEach((record) => stores.topics.put(record));
      (sources || []).forEach((record) => stores.sources.put(record));
      (wikiPages || []).forEach((record) => stores.wikiPages.put(record));
      (aiDrafts || []).forEach((record) => stores.aiDrafts.put(record));
    });
  }

  async function markTopicSourcesProcessed(topicId, sourceIds) {
    const sources = await getAllByIndex("sources", "topicId", topicId);
    const sourceSet = new Set(sourceIds);
    await withStore("sources", "readwrite", (store) => {
      sources.forEach((source) => {
        if (sourceSet.has(source.id)) {
          store.put({ ...source, aiStatus: "processed", updatedAt: new Date().toISOString() });
        }
      });
    });
  }

  return {
    openDatabase,
    getAll,
    getById,
    put,
    remove,
    getAllByIndex,
    replaceAll,
    markTopicSourcesProcessed,
  };
});
```

- [ ] **Step 4: Implement migration module**

Create `shared/migration.js`:

```javascript
(function attachMigration(root, factory) {
  const api = factory(root.YyoinkWiki?.models, root.YyoinkWiki?.repository);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.YyoinkWiki = root.YyoinkWiki || {};
  root.YyoinkWiki.migration = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createMigration(models, repository) {
  const MIGRATION_VERSION = 1;

  function chromeGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  function chromeSet(value) {
    return new Promise((resolve) => chrome.storage.local.set(value, resolve));
  }

  async function migrateLegacyDataIfNeeded() {
    const state = await chromeGet(["migrationVersion", "projects", "snippets"]);
    if (state.migrationVersion >= MIGRATION_VERSION) {
      return { migrated: false, reason: "already-migrated" };
    }

    const topics = (state.projects || []).map((project) => models.normalizeProjectToTopic(project));
    if (topics.length === 0) {
      topics.push(
        models.normalizeProjectToTopic({
          id: "default",
          name: "Default",
          color: "#6366f1",
          createdAt: new Date().toISOString(),
        }),
      );
    }

    const topicIds = new Set(topics.map((topic) => topic.id));
    const sources = (state.snippets || []).map((snippet) => {
      const source = models.normalizeSnippetToSource(snippet);
      return topicIds.has(source.topicId) ? source : { ...source, topicId: "default" };
    });

    await repository.replaceAll({
      topics,
      sources,
      wikiPages: [],
      aiDrafts: [],
    });
    await chromeSet({ migrationVersion: MIGRATION_VERSION });

    return { migrated: true, topics: topics.length, sources: sources.length };
  }

  return {
    MIGRATION_VERSION,
    migrateLegacyDataIfNeeded,
  };
});
```

- [ ] **Step 5: Run unit tests**

Run: `npm test`

Expected: PASS. These tests do not exercise IndexedDB directly; browser verification covers repository upgrade and migration.

- [ ] **Step 6: Manual browser migration check**

Load the unpacked extension from `/Users/kimsy/DataScience/01_Projects/Web_Applications/context_pilot` in Chrome.

Expected:

- Extension loads without Manifest V3 script errors.
- Side panel opens.
- Existing project/snippet data still appears after migration wiring is added in Task 4.

## Task 4: Wire Side Panel State To Topics And Sources

**Files:**
- Modify: `sidepanel/main.js`

- [ ] **Step 1: Replace top-level collection state names**

In `sidepanel/main.js`, keep backwards-compatible aliases during migration. Replace the current state block:

```javascript
let snippets = [];
let projects = [];
let selectedProjectId = "all";
```

with:

```javascript
let topics = [];
let sources = [];
let wikiPages = [];
let aiDrafts = [];
let snippets = sources;
let projects = topics;
let selectedTopicId = "all";
let selectedProjectId = selectedTopicId;
```

Expected: existing code can still refer to `snippets`, `projects`, and `selectedProjectId` while subsequent steps move functions to topic/source terminology.

- [ ] **Step 2: Replace `loadData()` with repository-backed loading**

Replace `loadData()` with:

```javascript
async function loadData() {
  await YyoinkWiki.migration.migrateLegacyDataIfNeeded();
  topics = await YyoinkWiki.repository.getAll("topics");
  sources = await YyoinkWiki.repository.getAll("sources");
  wikiPages = await YyoinkWiki.repository.getAll("wikiPages");
  aiDrafts = await YyoinkWiki.repository.getAll("aiDrafts");
  projects = topics;
  snippets = sources;

  if (topics.length === 0) {
    const fallbackTopic = YyoinkWiki.models.normalizeProjectToTopic({
      id: "default",
      name: "Default",
      color: "#6366f1",
      createdAt: new Date().toISOString(),
    });
    await YyoinkWiki.repository.put("topics", fallbackTopic);
    topics = [fallbackTopic];
    projects = topics;
  }
}
```

- [ ] **Step 3: Replace `saveData()` with repository writes**

Replace `saveData()` with:

```javascript
async function saveData() {
  await YyoinkWiki.repository.replaceAll({
    topics,
    sources,
    wikiPages,
    aiDrafts,
  });
  snippets = sources;
  projects = topics;
  checkStorageUsage();
}
```

Expected: existing callers still call `saveData()`, but persistence is now IndexedDB.

- [ ] **Step 4: Update rendering references through compatibility aliases**

Keep existing function names for this task. At the start of `renderProjectDropdown()` and `renderSnippets()`, add:

```javascript
selectedTopicId = selectedProjectId;
topics = projects;
sources = snippets;
```

Expected: project dropdown and list still render while later tasks rename UI labels and behavior.

- [ ] **Step 5: Run tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 6: Manual side panel check**

Load the extension and open the side panel.

Expected:

- The panel opens without console errors.
- Existing projects appear in the dropdown.
- Existing snippets appear in the list.
- Search still filters source cards.

## Task 5: Convert Collection Actions To Source Records

**Files:**
- Modify: `background.js`
- Modify: `sidepanel/main.js`

- [ ] **Step 1: Update background initialization to migrate and refresh menus**

Replace `initializeStorage()` in `background.js` with:

```javascript
async function initializeStorage() {
  try {
    await YyoinkWiki.migration.migrateLegacyDataIfNeeded();
  } catch (error) {
    console.error("Migration failed:", error);
  }
}
```

- [ ] **Step 2: Update background menu building to read topics**

Replace the `chrome.storage.local.get(["projects"], ...)` block inside `updateContextMenus()` with:

```javascript
    YyoinkWiki.repository.getAll("topics").then((topics) => {
      const projects = topics.length
        ? topics.map((topic) => ({ id: topic.id, name: topic.title }))
        : [{ id: "default", name: "Default" }];

      projects.forEach((project) => {
        chrome.contextMenus.create({
          id: `save_project_${project.id}`,
          parentId: "saveToContextPilotRoot",
          title: project.name,
          contexts: ["selection"],
        });
      });

      chrome.contextMenus.create({
        id: "separator1",
        parentId: "saveToContextPilotRoot",
        type: "separator",
        contexts: ["selection"],
      });

      chrome.contextMenus.create({
        id: "saveToActiveProject",
        parentId: "saveToContextPilotRoot",
        title: "Save to Active Topic",
        contexts: ["selection"],
      });

      chrome.contextMenus.create({
        id: "createNewProject",
        parentId: "saveToContextPilotRoot",
        title: "+ Create New Topic...",
        contexts: ["selection"],
      });
    });
```

- [ ] **Step 3: Update background `saveSnippet()` to write Source**

Replace `saveSnippet(text, tab, projectId)` with:

```javascript
async function saveSnippet(text, tab, projectId) {
  const source = YyoinkWiki.models.createSource({
    text,
    sourceUrl: tab.url,
    pageTitle: tab.title,
    domain: new URL(tab.url).hostname,
    topicId: projectId,
    type: "selection",
  });

  await YyoinkWiki.repository.put("sources", source);

  chrome.runtime.sendMessage({ type: "SOURCE_ADDED", source }, () => {
    if (chrome.runtime.lastError) {
      console.log("Sidepanel not open:", chrome.runtime.lastError.message);
    }
  });
}
```

- [ ] **Step 4: Update active topic lookup in background**

Replace `chrome.storage.local.get(["activeProjectId"], ...)` in the `saveToActiveProject` branch with:

```javascript
    chrome.storage.local.get(["activeTopicId", "activeProjectId"], (result) => {
      saveSnippet(info.selectionText, tab, result.activeTopicId || result.activeProjectId || "default");
    });
```

- [ ] **Step 5: Update side panel message handling**

In `init()`, replace the `SNIPPET_ADDED` listener block with:

```javascript
    if (message.type === "SOURCE_ADDED" || message.type === "SNIPPET_ADDED") {
      const source = message.source || YyoinkWiki.models.normalizeSnippetToSource(message.snippet);
      sources.unshift(source);
      snippets = sources;
      renderSnippets();
      renderProjectDropdown();
      showToast("Source saved!");
    }
```

- [ ] **Step 6: Update side panel source creation points**

In `forceSelectAndSave()`, `capturePage()`, `saveMemo()`, `pasteFromClipboard()`, and `saveNewProject()`, replace object literals pushed into `snippets` with `YyoinkWiki.models.createSource(...)` and push into `sources`.

Use this pattern for page capture:

```javascript
const source = YyoinkWiki.models.createSource({
  text: response.text.substring(0, 10000),
  sourceUrl: response.url,
  pageTitle: response.title,
  domain: response.domain,
  topicId: selectedProjectId !== "all" ? selectedProjectId : "default",
  type: "page",
});

sources.unshift(source);
snippets = sources;
await saveData();
```

Expected: every new saved item has `topicId`, `type`, and `aiStatus`.

- [ ] **Step 7: Run tests and manual collection check**

Run: `npm test`

Expected: PASS.

Manual check:

- Save selected text from a web page using the context menu.
- Capture a page from the side panel.
- Save a memo.
- Paste clipboard text.

Expected:

- Each item appears in Sources.
- Each item has source metadata.
- New items have `aiStatus: "raw"` in IndexedDB.

## Task 6: Add Topic Workspace Tabs And Source Status UI

**Files:**
- Modify: `sidepanel/index.html`
- Modify: `sidepanel/styles.css`
- Modify: `sidepanel/main.js`

- [ ] **Step 1: Add tab controls to side panel HTML**

In `sidepanel/index.html`, after the project selector block and before quick actions, add:

```html
      <nav class="workspace-tabs" aria-label="Topic workspace">
        <button class="workspace-tab active" data-tab="sources" id="sourcesTab">Sources</button>
        <button class="workspace-tab" data-tab="wiki" id="wikiTab">Wiki</button>
        <button class="workspace-tab" data-tab="ask" id="askTab">Ask</button>
      </nav>
```

Wrap the existing quick actions, search bar, snippets container, and footer in:

```html
      <section class="workspace-panel active" id="sourcesPanel">
        ...existing source collection UI...
      </section>
```

After `sourcesPanel`, add:

```html
      <section class="workspace-panel" id="wikiPanel">
        <div class="wiki-toolbar">
          <div>
            <p class="wiki-status" id="wikiStatus">No wiki yet</p>
            <h2 class="wiki-title" id="wikiTitle">Topic Wiki</h2>
          </div>
          <div class="wiki-actions">
            <button class="btn btn-primary" id="generateWikiBtn">Generate Wiki</button>
            <button class="btn btn-secondary" id="updateWikiBtn">Update Wiki</button>
            <button class="btn btn-secondary" id="reviewDraftBtn">Review Draft</button>
          </div>
        </div>
        <article class="wiki-content" id="wikiContent"></article>
      </section>

      <section class="workspace-panel" id="askPanel">
        <div class="ask-thread" id="askThread"></div>
        <div class="ask-input-row">
          <textarea id="askInput" class="textarea" rows="3" placeholder="Ask this topic..."></textarea>
          <button class="btn btn-primary" id="askTopicBtn">Ask</button>
        </div>
      </section>
```

- [ ] **Step 2: Add tab and wiki styles**

Append to `sidepanel/styles.css`:

```css
.workspace-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.workspace-tab {
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.workspace-tab.active {
  background: var(--accent-primary);
  color: white;
  border-color: var(--accent-primary);
}

.workspace-panel {
  display: none;
  min-height: 0;
}

.workspace-panel.active {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.wiki-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.wiki-status {
  margin: 0 0 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.wiki-title {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
}

.wiki-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.wiki-content,
.ask-thread {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  padding: 12px;
  color: var(--text-primary);
  line-height: 1.55;
}

.source-status {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.ask-input-row {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}
```

- [ ] **Step 3: Add tab event setup**

In `setupEventListeners()`, add:

```javascript
  document.querySelectorAll(".workspace-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchWorkspaceTab(tab.dataset.tab));
  });
```

Add this function near rendering helpers:

```javascript
function switchWorkspaceTab(tabName) {
  document.querySelectorAll(".workspace-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });
  document.querySelectorAll(".workspace-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `${tabName}Panel`);
  });
  if (tabName === "wiki") renderWikiPanel();
}
```

- [ ] **Step 4: Add source status to cards**

In `createSnippetCard(snippet)`, add this status in the footer before date:

```javascript
        <span class="source-status">${escapeHtml(snippet.aiStatus || "raw")}</span>
```

- [ ] **Step 5: Add basic wiki render**

Add:

```javascript
function getSelectedTopic() {
  return selectedProjectId === "all" ? topics[0] : topics.find((topic) => topic.id === selectedProjectId);
}

function getSelectedTopicSources() {
  const topic = getSelectedTopic();
  return topic ? sources.filter((source) => source.topicId === topic.id) : [];
}

function getSelectedWikiPage() {
  const topic = getSelectedTopic();
  return topic ? wikiPages.find((page) => page.topicId === topic.id) : null;
}

function getSelectedDrafts() {
  const topic = getSelectedTopic();
  return topic ? aiDrafts.filter((draft) => draft.topicId === topic.id) : [];
}

function markdownToSafeHtml(markdown) {
  return escapeHtml(markdown || "")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

function renderWikiPanel() {
  const topic = getSelectedTopic();
  const wikiPage = getSelectedWikiPage();
  const topicSources = getSelectedTopicSources();
  const drafts = getSelectedDrafts();
  const status = YyoinkWiki.models.deriveTopicStatus({
    wikiPage,
    sources: topicSources,
    drafts,
    isGenerating: false,
  });

  document.getElementById("wikiStatus").textContent = status;
  document.getElementById("wikiTitle").textContent = topic?.title || "Topic Wiki";
  document.getElementById("wikiContent").innerHTML = wikiPage
    ? `<p>${markdownToSafeHtml(wikiPage.bodyMarkdown)}</p>`
    : `<p>No approved wiki page yet.</p>`;
}
```

- [ ] **Step 6: Run manual UI check**

Load extension and inspect side panel.

Expected:

- Sources, Wiki, and Ask tabs appear.
- Existing source list appears under Sources.
- Wiki tab shows current topic status.
- No source list controls overlap or disappear on narrow side panel width.

## Task 7: Add AI Service, Draft Generation, And Draft Approval

**Files:**
- Create: `background/ai-service.js`
- Modify: `background.js`
- Modify: `sidepanel/main.js`
- Modify: `sidepanel/index.html`
- Modify: `sidepanel/styles.css`

- [ ] **Step 1: Add AI settings fields**

In the existing settings modal in `sidepanel/index.html`, add:

```html
          <div class="settings-section">
            <h3>AI Provider</h3>
            <label class="input-label" for="aiApiKeyInput">OpenAI API Key</label>
            <input id="aiApiKeyInput" class="input" type="password" placeholder="sk-..." autocomplete="off" />
            <label class="input-label" for="aiModelInput">Model</label>
            <input id="aiModelInput" class="input" type="text" value="gpt-4.1-mini" />
            <button class="btn btn-secondary" id="saveAISettingsBtn">Save AI Settings</button>
          </div>
```

If `gpt-4.1-mini` is not available in the user's OpenAI account at implementation time, use the account's available small reasoning-capable model and update the setting default in this file and `background/ai-service.js` together.

- [ ] **Step 2: Add draft review modal**

In `sidepanel/index.html`, add a modal:

```html
      <div class="modal" id="draftReviewModal">
        <div class="modal-header">
          <h2>Review AI Draft</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <textarea id="draftMarkdownText" class="textarea" rows="14"></textarea>
          <div class="draft-meta" id="draftMeta"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="rejectDraftBtn">Reject</button>
          <button class="btn btn-primary" id="approveDraftBtn">Approve</button>
        </div>
      </div>
```

- [ ] **Step 3: Implement AI service**

Create `background/ai-service.js`:

```javascript
(function attachAIService(root) {
  root.YyoinkWiki = root.YyoinkWiki || {};

  function chromeGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  async function callOpenAI({ apiKey, model, promptPayload }) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              "You are a source-grounded personal wiki assistant. Use only the supplied topic, wiki page, and sources. Return valid JSON only. Do not invent citations.",
          },
          {
            role: "user",
            content: JSON.stringify(promptPayload),
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`AI request failed ${response.status}: ${body.slice(0, 300)}`);
    }

    const json = await response.json();
    return json.output_text || json.output?.flatMap((item) => item.content || []).map((part) => part.text || "").join("") || "";
  }

  async function runAIAction({ action, topicId, question }) {
    const settings = await chromeGet(["aiApiKey", "aiModel"]);
    if (!settings.aiApiKey) {
      throw new Error("Missing OpenAI API key");
    }

    const [topic, sources, wikiPages] = await Promise.all([
      YyoinkWiki.repository.getById("topics", topicId),
      YyoinkWiki.repository.getAllByIndex("sources", "topicId", topicId),
      YyoinkWiki.repository.getAllByIndex("wikiPages", "topicId", topicId),
    ]);

    const wikiPage = wikiPages[0] || null;
    const promptPayload = YyoinkWiki.aiContract.buildWikiPromptPayload({
      action,
      topic,
      sources,
      wikiPage,
      question,
    });

    try {
      const rawResponse = await callOpenAI({
        apiKey: settings.aiApiKey,
        model: settings.aiModel || "gpt-4.1-mini",
        promptPayload,
      });
      const aiPayload = YyoinkWiki.aiContract.parseAIJsonResponse(rawResponse);
      const draft = YyoinkWiki.aiContract.normalizeDraftFromAI({
        topicId,
        action,
        aiPayload,
        rawResponse,
      });
      await YyoinkWiki.repository.put("aiDrafts", draft);
      return { draft };
    } catch (error) {
      const draft = YyoinkWiki.aiContract.createFailedDraft({
        topicId,
        action,
        errorMessage: error.message,
      });
      await YyoinkWiki.repository.put("aiDrafts", draft);
      return { draft, error: error.message };
    }
  }

  root.YyoinkWiki.aiService = {
    runAIAction,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
```

- [ ] **Step 4: Add runtime message handler for AI actions**

In `background.js` inside `chrome.runtime.onMessage.addListener`, add before `return true`:

```javascript
  if (message.type === "RUN_AI_ACTION") {
    YyoinkWiki.aiService
      .runAIAction({
        action: message.action,
        topicId: message.topicId,
        question: message.question || "",
      })
      .then(sendResponse)
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  }
```

- [ ] **Step 5: Wire side panel AI buttons**

In `setupEventListeners()`, add:

```javascript
  document.getElementById("saveAISettingsBtn")?.addEventListener("click", saveAISettings);
  document.getElementById("generateWikiBtn")?.addEventListener("click", () => runWikiAIAction("generateWiki"));
  document.getElementById("updateWikiBtn")?.addEventListener("click", () => runWikiAIAction("updateWiki"));
  document.getElementById("reviewDraftBtn")?.addEventListener("click", openLatestDraft);
  document.getElementById("approveDraftBtn")?.addEventListener("click", approveCurrentDraft);
  document.getElementById("rejectDraftBtn")?.addEventListener("click", rejectCurrentDraft);
```

Add:

```javascript
let reviewingDraftId = null;

function saveAISettings() {
  const aiApiKey = document.getElementById("aiApiKeyInput").value.trim();
  const aiModel = document.getElementById("aiModelInput").value.trim() || "gpt-4.1-mini";
  chrome.storage.local.set({ aiApiKey, aiModel }, () => showToast("AI settings saved"));
}

async function runWikiAIAction(action) {
  const topic = getSelectedTopic();
  if (!topic) {
    showToast("Select a topic first");
    return;
  }

  showToast(action === "generateWiki" ? "Generating wiki..." : "Updating wiki...");
  const result = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "RUN_AI_ACTION", action, topicId: topic.id }, resolve);
  });

  if (result?.draft) {
    aiDrafts.unshift(result.draft);
    await saveData();
    renderWikiPanel();
    if (result.draft.status === "ready") {
      openDraft(result.draft);
    } else {
      showToast(result.error || "AI failed");
    }
  } else {
    showToast(result?.error || "AI failed");
  }
}

function openLatestDraft() {
  const draft = getSelectedDrafts().find((item) => item.status === "ready");
  if (!draft) {
    showToast("No draft ready");
    return;
  }
  openDraft(draft);
}

function openDraft(draft) {
  reviewingDraftId = draft.id;
  document.getElementById("draftMarkdownText").value = draft.proposedWikiMarkdown || draft.generatedSummary || "";
  document.getElementById("draftMeta").textContent = `${draft.sourceCitations.length} citations, ${draft.weakClaims.length} weak claims`;
  openModal("draftReviewModal");
}

async function approveCurrentDraft() {
  const draft = aiDrafts.find((item) => item.id === reviewingDraftId);
  const topic = getSelectedTopic();
  if (!draft || !topic) return;

  draft.status = "approved";
  draft.proposedWikiMarkdown = document.getElementById("draftMarkdownText").value;
  draft.updatedAt = new Date().toISOString();

  if (draft.type === "generateWiki" || draft.type === "updateWiki") {
    const existingPage = getSelectedWikiPage();
    const page = YyoinkWiki.models.createWikiPageFromDraft({
      draft,
      existingPage,
      title: topic.title,
    });
    wikiPages = wikiPages.filter((item) => item.id !== page.id);
    wikiPages.unshift(page);
    await YyoinkWiki.repository.markTopicSourcesProcessed(topic.id, page.sourceIds);
    sources = await YyoinkWiki.repository.getAll("sources");
    snippets = sources;
  }

  await saveData();
  closeAllModals();
  renderWikiPanel();
  renderSnippets();
  showToast("Draft approved");
}

async function rejectCurrentDraft() {
  const draft = aiDrafts.find((item) => item.id === reviewingDraftId);
  if (!draft) return;
  draft.status = "rejected";
  draft.updatedAt = new Date().toISOString();
  await saveData();
  closeAllModals();
  renderWikiPanel();
  showToast("Draft rejected");
}
```

- [ ] **Step 6: Run tests and manual draft check**

Run: `npm test`

Expected: PASS.

Manual check:

- Save AI settings.
- Select a topic with at least one source.
- Click `Generate Wiki`.

Expected:

- If API key is valid, a draft review modal opens.
- Approving creates a WikiPage.
- Rejecting leaves the WikiPage unchanged.
- If API key is missing, a failed draft is stored and the UI shows an error.

## Task 8: Add Ask This Topic Flow

**Files:**
- Modify: `sidepanel/main.js`
- Modify: `sidepanel/styles.css`

- [ ] **Step 1: Wire Ask button**

In `setupEventListeners()`, add:

```javascript
  document.getElementById("askTopicBtn")?.addEventListener("click", askCurrentTopic);
```

- [ ] **Step 2: Implement topic Q&A**

Add:

```javascript
async function askCurrentTopic() {
  const topic = getSelectedTopic();
  const question = document.getElementById("askInput").value.trim();
  if (!topic) {
    showToast("Select a topic first");
    return;
  }
  if (!question) {
    showToast("Write a question first");
    return;
  }

  appendAskMessage("user", question);
  document.getElementById("askInput").value = "";

  const result = await new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "RUN_AI_ACTION", action: "askTopic", topicId: topic.id, question },
      resolve,
    );
  });

  if (result?.draft?.status === "ready") {
    aiDrafts.unshift(result.draft);
    await saveData();
    appendAskMessage("assistant", result.draft.generatedSummary || result.draft.proposedWikiMarkdown);
  } else {
    appendAskMessage("assistant", result?.error || result?.draft?.weakClaims?.[0] || "AI failed");
  }
}

function appendAskMessage(role, text) {
  const thread = document.getElementById("askThread");
  const div = document.createElement("div");
  div.className = `ask-message ask-message-${role}`;
  div.textContent = text;
  thread.appendChild(div);
  thread.scrollTop = thread.scrollHeight;
}
```

- [ ] **Step 3: Add message styles**

Append:

```css
.ask-message {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
  white-space: pre-wrap;
}

.ask-message-user {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.ask-message-assistant {
  background: var(--bg-elevated);
  color: var(--text-primary);
}
```

- [ ] **Step 4: Manual Ask check**

Ask: `이 주제의 핵심 쟁점 3개를 출처 기반으로 정리해줘`

Expected:

- User message appears.
- Assistant answer appears.
- `aiDrafts` contains a `type: "askTopic"` draft.
- No WikiPage changes occur.

## Task 9: Update Export And Import For Wiki Data

**Files:**
- Modify: `sidepanel/main.js`

- [ ] **Step 1: Update JSON export**

In `handleExport("json")`, replace the JSON payload with:

```javascript
content = JSON.stringify(
  YyoinkWiki.models.buildExportPayload({
    topics,
    sources,
    wikiPages,
    aiDrafts,
    topicId: selectedProjectId,
  }),
  null,
  2,
);
filename = "yyoink-wiki-export.json";
mimeType = "application/json";
```

- [ ] **Step 2: Update Markdown export**

Replace `exportAsMd(snippetList, projectsList)` with:

```javascript
function exportAsMd(sourceList, topicList) {
  let output = "# yyoink Wiki Export\n\n";
  topicList.forEach((topic) => {
    const topicSources = sourceList.filter((source) => source.topicId === topic.id);
    const wikiPage = wikiPages.find((page) => page.topicId === topic.id);
    if (topicSources.length === 0 && !wikiPage) return;

    output += `## ${topic.title || topic.name}\n\n`;

    if (wikiPage) {
      output += `${wikiPage.bodyMarkdown}\n\n`;
      output += "### Sources Used By Wiki\n\n";
      (wikiPage.sourceIds || []).forEach((sourceId) => {
        const source = sources.find((item) => item.id === sourceId);
        if (source) output += `- [${source.pageTitle || source.domain}](${source.sourceUrl})\n`;
      });
      output += "\n";
    }

    output += "### Source Library\n\n";
    topicSources.forEach((source, i) => {
      output += `#### Source ${i + 1}: ${source.pageTitle || source.domain || "Untitled"}\n\n`;
      output += `> ${source.text.split("\n").join("\n> ")}\n\n`;
      output += `Source: ${source.sourceUrl}\n\n`;
    });
  });
  return output.trim();
}
```

- [ ] **Step 3: Update import JSON branch**

In `handleImport(e)`, when `ext === "json"`, support both old and new payloads:

```javascript
if (ext === "json") {
  const data = JSON.parse(text);
  if (data.version === 2) {
    topics = data.topics || [];
    sources = data.sources || [];
    wikiPages = data.wikiPages || [];
    aiDrafts = data.aiDrafts || [];
    projects = topics;
    snippets = sources;
    await saveData();
    renderProjectDropdown();
    renderSnippets();
    renderWikiPanel();
    showToast(`Imported ${sources.length} sources!`);
    e.target.value = "";
    return;
  }
  importedSnippets = data.snippets || [];
  importedProjects = data.projects || [];
}
```

- [ ] **Step 4: Run manual export/import check**

Manual check:

- Export JSON after creating one WikiPage.
- Inspect the downloaded file.
- Import the JSON into a fresh extension profile or after clearing IndexedDB in DevTools.

Expected:

- Export contains `version: 2`, `topics`, `sources`, `wikiPages`, and `aiDrafts`.
- Import restores source list and wiki page.

## Task 10: Final Verification

**Files:**
- Modify: `PRD_v3.md`
- Modify: `PrivacyGuide.md`

- [ ] **Step 1: Update PRD with MVP transition note**

Add a short section near the end of `PRD_v3.md`:

```markdown
## Personal LLM Wiki MVP Direction

yyoink is evolving from a project-based snippet collector into a topic-based personal LLM wiki. Existing projects become topics, existing snippets become sources, and approved AI drafts become source-grounded wiki pages. The MVP keeps collection local-first, stores knowledge data in IndexedDB, and requires user approval before AI output updates a wiki page.
```

- [ ] **Step 2: Update privacy guide with AI/API key note**

Add:

```markdown
## AI Features

If you enable AI features, yyoink sends the selected topic's source text and wiki context to the AI provider configured in settings. Your API key is stored locally in the browser extension settings. Source collection still happens locally first, and AI failures do not delete local sources.
```

- [ ] **Step 3: Run unit tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 4: Run browser smoke test**

In Chrome:

1. Load unpacked extension from `/Users/kimsy/DataScience/01_Projects/Web_Applications/context_pilot`.
2. Open any normal web page.
3. Open yyoink side panel.
4. Create or select a topic.
5. Save selected text with context menu.
6. Capture page.
7. Save a memo.
8. Switch to Wiki tab.
9. Generate wiki.
10. Approve draft.
11. Add another source.
12. Confirm status changes to `New sources available`.
13. Update wiki.
14. Ask a topic question.
15. Export JSON and Markdown.

Expected:

- No extension console errors during the flow.
- Sources persist after side panel reload.
- WikiPage persists after side panel reload.
- Missing or invalid AI key fails without deleting sources or approved wiki content.
- JSON export can restore the created topic, sources, wiki page, and drafts.

- [ ] **Step 5: Record remaining risks**

After verification, record any gaps in `CHANGELOG.md` under a new dated entry:

```markdown
## 2026-05-23

- Added personal LLM wiki MVP architecture: topic sources, wiki drafts, draft approval, and topic Q&A.
- Verification: `npm test`, Chrome unpacked extension smoke test.
- Known risks: API key is stored in local extension storage; AI provider behavior depends on user account/model availability.
```

