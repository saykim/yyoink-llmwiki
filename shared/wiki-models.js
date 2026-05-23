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
