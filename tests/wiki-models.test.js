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
