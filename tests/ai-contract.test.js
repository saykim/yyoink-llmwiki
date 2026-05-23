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
  const parsed = parseAIJsonResponse(
    '{"summary":"S","proposedWikiMarkdown":"# S","keyConcepts":[],"citations":[],"weakClaims":[],"followUpQuestions":[]}',
  );
  assert.equal(parsed.summary, "S");
});

test("parseAIJsonResponse extracts JSON from fenced response", () => {
  const parsed = parseAIJsonResponse(
    '```json\n{"summary":"S","proposedWikiMarkdown":"# S","keyConcepts":[],"citations":[],"weakClaims":[],"followUpQuestions":[]}\n```',
  );
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
