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

  function summarizeMarkdown(markdown) {
    return String(markdown || "")
      .replace(/^#+\s+/gm, "")
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .find(Boolean) || "";
  }

  function createManualWikiPage({ topic, existingPage, bodyMarkdown, sourceIds = [], now = isoNow() }) {
    if (!topic) {
      throw new Error("Topic is required");
    }
    return {
      id: existingPage?.id || createId("wiki"),
      topicId: topic.id,
      title: topic.title || topic.name || existingPage?.title || "Untitled Wiki",
      bodyMarkdown: bodyMarkdown || "",
      summary: summarizeMarkdown(bodyMarkdown),
      keyQuestions: existingPage?.keyQuestions || [],
      sourceIds: Array.from(new Set(sourceIds)),
      createdAt: existingPage?.createdAt || now,
      updatedAt: now,
    };
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
    if ((drafts || []).some((draft) => draft.status === "ready")) return "Cloud draft ready";
    if ((drafts || []).some((draft) => draft.status === "failed")) return "Cloud AI failed";
    if (!wikiPage && (!sources || sources.length === 0)) return "No wiki yet";
    if (!wikiPage) return "Ready to write";
    if ((sources || []).some((source) => source.aiStatus === "raw" || source.aiStatus === "stale")) {
      return "Sources updated";
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

  function tokenizeSearch(text) {
    return Array.from(
      new Set(
        String(text || "")
          .toLowerCase()
          .split(/[^\p{L}\p{N}]+/u)
          .map((term) => term.trim())
          .filter((term) => term.length >= 2),
      ),
    );
  }

  function createExcerpt(text, terms, maxLength = 260) {
    const sourceText = String(text || "").replace(/\s+/g, " ").trim();
    if (sourceText.length <= maxLength) return sourceText;

    const lower = sourceText.toLowerCase();
    const firstMatch = terms
      .map((term) => lower.indexOf(term.toLowerCase()))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0];
    const center = firstMatch >= 0 ? firstMatch : 0;
    const start = Math.max(0, center - Math.floor(maxLength / 3));
    const end = Math.min(sourceText.length, start + maxLength);
    const prefix = start > 0 ? "..." : "";
    const suffix = end < sourceText.length ? "..." : "";
    return `${prefix}${sourceText.slice(start, end).trim()}${suffix}`;
  }

  function scoreEvidenceRecord(record, terms, fullQuery) {
    const title = String(record.title || "").toLowerCase();
    const domain = String(record.domain || "").toLowerCase();
    const text = String(record.text || "").toLowerCase();
    const query = String(fullQuery || "").toLowerCase().trim();
    let score = 0;

    if (query && text.includes(query)) score += 30;
    if (query && title.includes(query)) score += 20;

    terms.forEach((term) => {
      if (title.includes(term)) score += 8;
      if (domain.includes(term)) score += 5;
      if (text.includes(term)) score += 3;
    });

    if (record.type === "wiki") score += 2;
    return score;
  }

  function searchTopicEvidence({ question, wikiPage, sources, limit = 8 }) {
    const terms = tokenizeSearch(question);
    if (terms.length === 0) return [];

    const records = [];
    if (wikiPage?.bodyMarkdown) {
      records.push({
        id: wikiPage.id,
        type: "wiki",
        title: `${wikiPage.title || "Topic"} Wiki`,
        text: wikiPage.bodyMarkdown,
        sourceUrl: "",
        domain: "Wiki",
        createdAt: wikiPage.updatedAt || wikiPage.createdAt,
      });
    }

    (sources || []).forEach((source, index) => {
      records.push({
        id: source.id,
        type: source.type || "source",
        title: source.pageTitle || source.domain || `Source ${index + 1}`,
        text: source.text || "",
        sourceUrl: source.sourceUrl || "",
        domain: source.domain || "",
        createdAt: source.createdAt,
      });
    });

    return records
      .map((record) => ({
        ...record,
        score: scoreEvidenceRecord(record, terms, question),
        excerpt: createExcerpt(record.text, terms),
      }))
      .filter((record) => record.score > 0)
      .sort((a, b) => b.score - a.score || String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, limit);
  }

  function truncateForPrompt(text, maxLength = 1800) {
    const value = String(text || "").trim();
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength).trim()}\n...[truncated]`;
  }

  function buildPromptPack({ topic, wikiPage, sources, question = "" }) {
    const sourceBlocks = (sources || [])
      .map((source, index) => {
        const sourceId = source.id || `source-${index + 1}`;
        return [
          `### [${sourceId}] ${source.pageTitle || source.domain || `Source ${index + 1}`}`,
          `Type: ${source.type || "source"}`,
          `URL: ${source.sourceUrl || "local"}`,
          `Captured: ${source.createdAt || "unknown"}`,
          "",
          truncateForPrompt(source.text),
        ].join("\n");
      })
      .join("\n\n");

    return [
      "# yyoink-wiki Prompt Pack",
      "",
      "You are helping build a source-grounded personal wiki. Use only the Topic Wiki and Source Library below. Cite source IDs like [source-id] when making claims. If evidence is missing, say what is missing instead of guessing.",
      "",
      "## Task",
      question
        ? `Answer this question using the supplied evidence: ${question}`
        : "Improve the Topic Wiki, identify key takeaways, gaps, contradictions, and useful follow-up questions.",
      "",
      "## Topic",
      `Title: ${topic?.title || topic?.name || "Untitled Topic"}`,
      `Description: ${topic?.description || ""}`,
      "",
      "## Current Topic Wiki",
      wikiPage?.bodyMarkdown ? truncateForPrompt(wikiPage.bodyMarkdown, 2600) : "No local wiki yet.",
      "",
      "## Source Library",
      sourceBlocks || "No sources collected yet.",
    ].join("\n");
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
    createManualWikiPage,
    createWikiPageFromDraft,
    deriveTopicStatus,
    filterSources,
    searchTopicEvidence,
    buildPromptPack,
    buildExportPayload,
  };
});
