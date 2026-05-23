const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createId,
  normalizeProjectToTopic,
  normalizeSnippetToSource,
  createManualWikiPage,
  createWikiPageFromDraft,
  deriveTopicStatus,
  filterSources,
  searchTopicEvidence,
  buildPromptPack,
  buildExportPayload,
} = require("../shared/wiki-models.js");

test("createId returns stable prefix plus random suffix", () => {
  const id = createId("topic", 1779500000000, () => 0.123456789);
  assert.match(id, /^topic-mphocrnk/);
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

test("createManualWikiPage creates and updates local wiki pages", () => {
  const topic = { id: "t1", title: "Local AI" };
  const now = "2026-05-23T00:00:00.000Z";
  const page = createManualWikiPage({
    topic,
    existingPage: null,
    bodyMarkdown: "# Local AI\n\nEvidence notes",
    sourceIds: ["s1", "s1", "s2"],
    now,
  });

  assert.equal(page.topicId, "t1");
  assert.equal(page.title, "Local AI");
  assert.equal(page.summary, "Local AI");
  assert.deepEqual(page.sourceIds, ["s1", "s2"]);
  assert.equal(page.createdAt, now);

  const updated = createManualWikiPage({
    topic,
    existingPage: page,
    bodyMarkdown: "Updated notes",
    sourceIds: ["s3"],
    now: "2026-05-24T00:00:00.000Z",
  });
  assert.equal(updated.id, page.id);
  assert.equal(updated.createdAt, now);
  assert.equal(updated.updatedAt, "2026-05-24T00:00:00.000Z");
});

test("deriveTopicStatus reports wiki lifecycle states", () => {
  assert.equal(
    deriveTopicStatus({ wikiPage: null, sources: [], drafts: [], isGenerating: false }),
    "No wiki yet",
  );
  assert.equal(
    deriveTopicStatus({
      wikiPage: null,
      sources: [{ id: "s1", aiStatus: "raw" }],
      drafts: [],
      isGenerating: false,
    }),
    "Ready to write",
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
    "Sources updated",
  );
  assert.equal(
    deriveTopicStatus({
      wikiPage: { id: "w1" },
      sources: [{ id: "s1", aiStatus: "processed" }],
      drafts: [{ id: "d1", status: "ready" }],
      isGenerating: false,
    }),
    "Cloud draft ready",
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

test("searchTopicEvidence finds local wiki and source matches", () => {
  const results = searchTopicEvidence({
    question: "retrieval citations",
    wikiPage: {
      id: "w1",
      title: "RAG",
      bodyMarkdown: "Retrieval needs citations from local evidence.",
      updatedAt: "2026-05-23T00:00:00.000Z",
    },
    sources: [
      {
        id: "s1",
        pageTitle: "Citation Guide",
        domain: "example.com",
        text: "Always attach citations to generated answers.",
        sourceUrl: "https://example.com",
      },
      {
        id: "s2",
        pageTitle: "Unrelated",
        text: "Nothing here",
      },
    ],
  });

  assert.deepEqual(results.map((result) => result.id), ["w1", "s1"]);
  assert.match(results[0].excerpt, /Retrieval/i);
});

test("buildPromptPack formats topic wiki and source library for subscription AI", () => {
  const prompt = buildPromptPack({
    topic: { id: "t1", title: "RAG" },
    wikiPage: { bodyMarkdown: "# RAG\n\nUse local sources." },
    sources: [
      {
        id: "s1",
        type: "selection",
        pageTitle: "Guide",
        sourceUrl: "https://example.com",
        createdAt: "2026-05-23T00:00:00.000Z",
        text: "Citation evidence",
      },
    ],
    question: "What matters?",
  });

  assert.match(prompt, /yyoink-wiki Prompt Pack/);
  assert.match(prompt, /What matters\?/);
  assert.match(prompt, /\[s1\] Guide/);
  assert.match(prompt, /Citation evidence/);
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
