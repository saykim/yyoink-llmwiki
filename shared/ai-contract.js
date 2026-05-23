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
    return idFactory
      ? idFactory(prefix)
      : `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
      const normalized = {
        sourceId: String(citation.sourceId),
        note: String(citation.note),
      };
      if (citation.quote) {
        normalized.quote = String(citation.quote);
      }
      return normalized;
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
