/**
 * yyoink - Background Service Worker
 * 
 * @author SYK (ooak.studio.101)
 * @copyright © 2026 ooak.studio.101. All rights reserved.
 * @license Proprietary
 */

importScripts(
  "shared/wiki-models.js",
  "shared/ai-contract.js",
  "shared/idb-repository.js",
  "shared/migration.js",
);

// Track side panel open state per window
const sidePanelOpenState = new Set();

async function openSidePanelForWindow(windowId) {
  // Guard: windowId must be an integer
  if (!Number.isInteger(windowId)) {
    console.error("Invalid windowId:", windowId);
    return;
  }

  try {
    // Open side panel using windowId (recommended in Chrome 114+)
    await chrome.sidePanel.open({ windowId });
    sidePanelOpenState.add(windowId);
    console.log("✅ Side panel opened for window:", windowId);
  } catch (error) {
    console.error("❌ Failed to open side panel:", error?.message || error);
  }
}

async function closeSidePanelForWindow(windowId) {
  // Guard: windowId must be an integer
  if (!Number.isInteger(windowId)) {
    console.error("Invalid windowId:", windowId);
    return;
  }

  try {
    // Chrome 116+ support chrome.sidePanel.close()
    await chrome.sidePanel.close({ windowId });
    sidePanelOpenState.delete(windowId);
    console.log("✅ Side panel closed for window:", windowId);
  } catch (error) {
    // Older Chrome versions may not support close()
    console.error("❌ Failed to close side panel:", error?.message || error);
    sidePanelOpenState.delete(windowId);
  }
}

async function toggleSidePanelForTab(tab) {
  const windowId = tab.windowId;

  if (sidePanelOpenState.has(windowId)) {
    await closeSidePanelForWindow(windowId);
  } else {
    await openSidePanelForWindow(windowId);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  initializeStorage();
  updateContextMenus();
});

async function initializeStorage() {
  try {
    await YyoinkWiki.migration.migrateLegacyDataIfNeeded();
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

function updateContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "saveToContextPilotRoot",
      title: "Save to yyoink",
      contexts: ["selection"],
    });

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
    }).catch((error) => {
      console.error("Failed to build context menus:", error);
    });
  });
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.projects) {
    updateContextMenus();
  }
});

// Note: chrome.sidePanel events (onOpened, onClosed) are not available in all Chrome versions
// We rely on manual state tracking via toggleSidePanelForTab instead

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText) return;

  if (info.menuItemId === "createNewProject") {
    openSidePanelForWindow(tab.windowId);
    setTimeout(() => {
      chrome.runtime.sendMessage(
        {
          type: "OPEN_CREATE_PROJECT",
          text: info.selectionText,
          tabInfo: {
            url: tab.url,
            title: tab.title,
            domain: new URL(tab.url).hostname,
          },
        },
        (response) => {
          // Check for errors but don't throw
          if (chrome.runtime.lastError) {
            console.log("Sidepanel not ready yet:", chrome.runtime.lastError.message);
          }
        }
      );
    }, 500);
    return;
  }

  if (info.menuItemId === "saveToActiveProject") {
    chrome.storage.local.get(["activeTopicId", "activeProjectId"], (result) => {
      saveSnippet(info.selectionText, tab, result.activeTopicId || result.activeProjectId || "default");
    });
    return;
  }

  if (info.menuItemId.startsWith("save_project_")) {
    saveSnippet(
      info.selectionText,
      tab,
      info.menuItemId.replace("save_project_", ""),
    );
  }
});

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

chrome.action.onClicked.addListener(async (tab) => {
  await toggleSidePanelForTab(tab);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_TEXT") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "EXTRACT_PAGE_TEXT" },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Content script error:", chrome.runtime.lastError.message);
              sendResponse({ error: chrome.runtime.lastError.message });
            } else {
              sendResponse(response);
            }
          }
        );
      } else {
        sendResponse({ error: "No active tab found" });
      }
    });
    return true;
  }

  if (message.type === "GET_PAGE_INFO") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({
          url: tabs[0].url,
          title: tabs[0].title,
          domain: new URL(tabs[0].url).hostname,
        });
      } else {
        sendResponse({ error: "No active tab found" });
      }
    });
    return true;
  }

  if (message.type === "REFRESH_MENUS") {
    updateContextMenus();
    sendResponse({ success: true });
  }
  
  return true;
});
