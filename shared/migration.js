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
