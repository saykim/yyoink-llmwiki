# Personal LLM Wiki Design

Date: 2026-05-23
Status: Review draft
Scope: Evolve the current yyoink Chrome extension from a web snippet collector into a personal, source-grounded LLM wiki.

## Current Extension Summary

The current extension, `yyoink`, is a Chrome Manifest V3 extension for collecting web text and organizing it by project.

Current behavior from the codebase:

- `manifest.json` registers a side panel, context menu support, storage, clipboard, active tab, all-URL content script access, and copy-bypass related permissions.
- `background.js` initializes `snippets` and `projects`, creates the right-click "Save to yyoink" menu, saves selected text with URL/title/domain metadata, and routes messages between the side panel and content scripts.
- `content.js` extracts page text, extracts selected text, enables/disables copy-bypass CSS and event-handler overrides, removes some overlay elements, and applies a Naver Blog image blur workaround.
- `sidepanel/main.js` manages the user interface for projects, snippet list rendering, virtual scrolling, search, capture page, copy all, edit/delete snippets, quick memo, paste from clipboard, import/export, theme, and project deletion.
- Current data is stored in `chrome.storage.local` as `projects[]` and `snippets[]`.

The product today is best described as:

> A local-first web research collector that captures text snippets, full-page text, clipboard text, and quick notes, then organizes them by project with source metadata.

It is not yet a wiki. It has the most important foundation for a wiki: fast source collection with source URLs.

## Product Direction

The target product is a personal LLM wiki:

> A browser-based personal knowledge workspace where a user collects source material by topic, connects related knowledge, and uses AI to generate, update, question, and improve source-grounded wiki pages over time.

The existing project concept should become the center of the wiki model:

```text
Topic / Project
  -> Sources
  -> AI Drafts
  -> Wiki Page
  -> Later: Knowledge Items and Links
```

The first version should not try to become a full knowledge graph system. It should prove the core loop:

```text
Collect sources
-> Generate a topic wiki draft
-> Review and approve
-> Add new sources
-> Update the wiki
-> Ask questions grounded in that topic
```

## Recommended Approach

Use the existing extension as the product surface and evolve it in place.

Rejected alternatives:

- Separate local wiki app: stronger long-term architecture, but it splits the current collection workflow too early.
- Markdown/Obsidian-only workflow: durable and user-owned, but it weakens the in-extension "living wiki" experience.

Recommended path:

```text
Chrome Extension
  Side Panel: collection, topic browsing, wiki review, topic Q&A
  Content Script: page/selection extraction
  Background Worker: message routing and AI provider requests
  IndexedDB: source/wiki data
  chrome.storage.local: settings and migration state
```

## MVP Scope

MVP features:

- Treat existing `Project` records as `Topic` records.
- Treat existing `Snippet` records as `Source` records.
- Keep the current source collection tools: selection save, page capture, memo, paste, import.
- Add a `Wiki` tab per topic.
- Generate a wiki draft from a topic's sources.
- Update an existing wiki page when new sources are added.
- Store AI output as a draft before changing the approved wiki page.
- Let the user approve, edit, or reject AI drafts.
- Add an `Ask` tab that answers using the current topic's sources and wiki page.
- Include topics, sources, wiki pages, and drafts in JSON export; include wiki pages in Markdown export.

Out of scope for MVP:

- Automatic cross-topic knowledge graph.
- Vector search and embeddings.
- Automatic related-topic recommendations.
- Collaboration and cloud sync.
- PDF/image storage.
- Full citation editor.
- Multi-provider AI abstraction beyond the first chosen provider.

## Data Model

The MVP model should preserve compatibility with existing data while introducing wiki-specific records.

```typescript
interface Topic {
  id: string;
  title: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface Source {
  id: string;
  topicId: string;
  type: "selection" | "page" | "memo" | "clipboard" | "import";
  text: string;
  sourceUrl: string;
  pageTitle: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
  aiStatus: "raw" | "processed" | "stale";
}

interface WikiPage {
  id: string;
  topicId: string;
  title: string;
  bodyMarkdown: string;
  summary: string;
  keyQuestions: string[];
  sourceIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface AIDraft {
  id: string;
  topicId: string;
  type: "generateWiki" | "updateWiki" | "askTopic";
  status: "ready" | "approved" | "rejected" | "failed";
  proposedWikiMarkdown?: string;
  generatedSummary?: string;
  extractedConcepts: string[];
  sourceCitations: Array<{
    sourceId: string;
    quote?: string;
    note: string;
  }>;
  weakClaims: string[];
  followUpQuestions: string[];
  rawResponse?: string;
  createdAt: string;
  updatedAt: string;
}
```

For `askTopic`, `AIDraft` stores the answer review artifact only. It does not update `WikiPage` unless the user explicitly promotes the answer into a later wiki edit.

Future model additions:

```text
KnowledgeItem
  concept | claim | fact | question | insight

Link
  supports | expands | contradicts | related | cites

SourceChunk
  internal chunks for long documents and future retrieval
```

## Storage Architecture

Move knowledge data to IndexedDB.

Use `chrome.storage.local` only for lightweight settings:

```text
theme
activeTopicId
aiProviderSettings
migrationVersion
```

Use IndexedDB for durable knowledge data:

```text
topics
sources
wikiPages
aiDrafts
future stores: knowledgeItems, links, sourceChunks, embeddings
```

Reasoning:

- `chrome.storage.local` has practical size and performance constraints for a growing personal wiki.
- IndexedDB is available inside the extension and avoids splitting the product into a separate backend for MVP.
- The current extension can keep its local-first privacy posture.

## AI Workflow

AI should act as a source-grounded wiki assistant, not a general chatbot.

Core actions:

```text
Generate Wiki
  Input: topic metadata + selected topic sources
  Output: AIDraft with proposed wiki Markdown, summary, citations, weak claims, follow-up questions

Update Wiki
  Input: current WikiPage + new/stale sources
  Output: AIDraft explaining proposed additions, changes, weak claims, and source citations

Ask This Topic
  Input: user question + topic sources + current WikiPage
  Output: answer grounded in topic sources, with cited source references where possible
```

AI output must be stored as `AIDraft` first.

```text
AI response
-> AIDraft
-> user review
-> approve/edit/reject
-> WikiPage update only after approval
```

The prompt contract should require structured JSON output:

```json
{
  "summary": "",
  "proposedWikiMarkdown": "",
  "keyConcepts": [],
  "citations": [],
  "weakClaims": [],
  "followUpQuestions": []
}
```

If parsing fails, the request should be marked failed and the raw response should be retained for debugging.

## UI Design

The side panel should become a topic workspace with three main tabs:

```text
Sources
Wiki
Ask
```

Sources tab:

- Reuses the existing snippet list behavior.
- Shows source type, domain, page title, created time, and AI status.
- Keeps search, edit, delete, copy, page capture, memo, paste, import, and export.

Wiki tab:

- Shows the current approved wiki page for the active topic.
- Shows source count, last updated time, and whether new sources are available.
- Provides `Generate Wiki`, `Update Wiki`, and `Review Draft` actions.
- Lets the user approve, edit, or reject the latest AI draft.

Ask tab:

- Lets the user ask questions about the current topic.
- Answers must be grounded in the topic's sources and approved wiki page.
- Answers should show source references where possible.

Topic state should be visible:

```text
No wiki yet
Ready to generate
Generating
Draft ready
Wiki up to date
New sources available
AI failed
```

## Reliability Rules

Primary rule:

```text
AI-generated knowledge cannot become approved wiki content without source grounding.
```

Reliability requirements:

- User-collected source data must be saved before AI work begins.
- AI failure must not lose source data.
- Draft approval must be explicit.
- Existing approved wiki content must not be overwritten by a failed AI request.
- Weak or uncited claims must be visible in the draft review UI.
- Long sources should be chunked internally before AI processing once the MVP reaches token limits.
- Topic Q&A should clarify when the answer is not supported by the current topic sources.

## Migration Plan

On first launch after the change:

```text
Read chrome.storage.local.projects
-> create topics in IndexedDB

Read chrome.storage.local.snippets
-> create sources in IndexedDB

Set migrationVersion
```

Migration safety:

- Do not delete the old `projects` and `snippets` during MVP migration.
- If migration fails, keep using old data and surface a retryable error.
- Export should work after migration.

## Test And Verification Plan

Minimum verification:

- Existing project/snippet data migrates to topic/source records.
- Existing collection actions still save source records.
- Topic filtering still works.
- Source search still works.
- Generate Wiki creates an AIDraft, not a WikiPage.
- Approving a draft creates or updates the WikiPage.
- Rejecting a draft leaves the WikiPage unchanged.
- Adding a new source after wiki approval marks the topic as having new sources.
- Ask This Topic uses only the current topic context.
- Export includes sources and wiki pages.
- Import can restore exported sources and wiki pages.
- AI request failure leaves sources and approved wiki content intact.

## Implementation Boundary

This document is a design draft, not an implementation plan.

Before implementation:

1. Review and approve this design direction.
2. Convert this design into an implementation plan.
3. Split work into storage migration, source compatibility, wiki UI, AI integration, draft review, and export/import updates.
