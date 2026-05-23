(function attachAIService(root) {
  root.YyoinkWiki = root.YyoinkWiki || {};

  function chromeGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  function extractResponseText(responseJson) {
    if (responseJson.output_text) return responseJson.output_text;
    const parts = [];
    (responseJson.output || []).forEach((item) => {
      (item.content || []).forEach((content) => {
        if (content.text) parts.push(content.text);
      });
    });
    return parts.join("");
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

    return extractResponseText(await response.json());
  }

  async function runAIAction({ action, topicId, question }) {
    const settings = await chromeGet(["aiApiKey", "aiModel"]);
    if (!settings.aiApiKey) {
      const draft = YyoinkWiki.aiContract.createFailedDraft({
        topicId,
        action,
        errorMessage: "Missing OpenAI API key",
      });
      await YyoinkWiki.repository.put("aiDrafts", draft);
      return { draft, error: "Missing OpenAI API key" };
    }

    const [topic, sources, wikiPages] = await Promise.all([
      YyoinkWiki.repository.getById("topics", topicId),
      YyoinkWiki.repository.getAllByIndex("sources", "topicId", topicId),
      YyoinkWiki.repository.getAllByIndex("wikiPages", "topicId", topicId),
    ]);

    if (!topic) {
      throw new Error("Topic not found");
    }

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
        model: settings.aiModel || "gpt-5-mini",
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
