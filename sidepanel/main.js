/**
 * yyoink - Side Panel Main Script (Optimized)
 * 
 * @author SYK (ooak.studio.101)
 * @copyright © 2026 ooak.studio.101. All rights reserved.
 * @license Proprietary
 */

// State
let topics = [];
let sources = [];
let wikiPages = [];
let aiDrafts = [];
let snippets = sources;
let projects = topics;
let selectedTopicId = "all";
let selectedProjectId = selectedTopicId;
let editingSnippetId = null;
let selectedColor = "#6366f1";
let deleteProjectId = null;
let reviewingDraftId = null;
let copyBypassEnabled = false;
let hardcoreModeEnabled = false;

let virtualScroller = null;

class VirtualScroller {
  constructor(options) {
    this.container = options.container;
    this.itemHeight = options.itemHeight || 120;
    this.bufferSize = options.bufferSize || 5;
    this.renderItem = options.renderItem;
    this.onItemClick = options.onItemClick;
    this.items = [];
    this.filteredItems = [];
    
    this.topSpacer = null;
    this.bottomSpacer = null;
    this.contentWrapper = null;
    
    this.visibleStartIndex = 0;
    this.visibleEndIndex = 0;
    this.scrollTop = 0;
    this.containerHeight = 0;
    
    this.scrollHandler = this.throttle(this.onScroll.bind(this), 16);
    
    this.init();
  }
  
  init() {
    this.container.innerHTML = '';
    
    this.topSpacer = document.createElement('div');
    this.topSpacer.className = 'virtual-scroll-spacer-top';
    this.topSpacer.style.cssText = 'flex-shrink: 0; height: 0px;';
    
    this.contentWrapper = document.createElement('div');
    this.contentWrapper.className = 'virtual-scroll-content';
    this.contentWrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';
    
    this.bottomSpacer = document.createElement('div');
    this.bottomSpacer.className = 'virtual-scroll-spacer-bottom';
    this.bottomSpacer.style.cssText = 'flex-shrink: 0; height: 0px;';
    
    this.container.appendChild(this.topSpacer);
    this.container.appendChild(this.contentWrapper);
    this.container.appendChild(this.bottomSpacer);
    
    this.container.addEventListener('scroll', this.scrollHandler, { passive: true });
    
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.containerHeight = this.container.clientHeight;
        this.render();
      });
      this.resizeObserver.observe(this.container);
    }
    
    this.containerHeight = this.container.clientHeight;
  }
  
  setItems(items) {
    this.items = items;
    this.filteredItems = items;
    this.scrollTop = 0;
    this.container.scrollTop = 0;
    this.render();
  }
  
  setFilteredItems(filteredItems) {
    this.filteredItems = filteredItems;
    this.scrollTop = 0;
    this.container.scrollTop = 0;
    this.render();
  }
  
  onScroll() {
    this.scrollTop = this.container.scrollTop;
    this.render();
  }
  
  render() {
    const totalItems = this.filteredItems.length;
    
    if (totalItems === 0) {
      this.topSpacer.style.height = '0px';
      this.bottomSpacer.style.height = '0px';
      this.contentWrapper.innerHTML = '';
      return;
    }
    
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.bufferSize);
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight) + (this.bufferSize * 2);
    const endIndex = Math.min(totalItems, startIndex + visibleCount);
    
    if (startIndex === this.visibleStartIndex && endIndex === this.visibleEndIndex) {
      return;
    }
    
    this.visibleStartIndex = startIndex;
    this.visibleEndIndex = endIndex;
    
    const topHeight = startIndex * this.itemHeight;
    const bottomHeight = Math.max(0, (totalItems - endIndex) * this.itemHeight);
    
    this.topSpacer.style.height = `${topHeight}px`;
    this.bottomSpacer.style.height = `${bottomHeight}px`;
    
    const visibleItems = this.filteredItems.slice(startIndex, endIndex);
    this.contentWrapper.innerHTML = visibleItems.map(item => this.renderItem(item)).join('');
    
    this.attachEventListeners();
  }
  
  attachEventListeners() {
    this.contentWrapper.querySelectorAll('.snippet-card').forEach(card => {
      const id = card.dataset.id;
      
      // 애니메이션 완료 후 will-change 제거
      if (card.dataset.animated === 'false') {
        const handleAnimationEnd = () => {
          card.dataset.animated = 'true';
          card.style.willChange = 'auto';
          card.removeEventListener('animationend', handleAnimationEnd);
        };
        card.addEventListener('animationend', handleAnimationEnd, { once: true });
      }
      
      card.querySelector('.btn-copy')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onItemClick?.('copy', id);
      });
      
      card.querySelector('.btn-edit')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onItemClick?.('edit', id);
      });
      
      card.querySelector('.btn-delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const actionGroup = card.querySelector('.action-buttons-group');
        const confirmGroup = card.querySelector('.delete-confirm-group');
        if (actionGroup && confirmGroup) {
          actionGroup.style.display = 'none';
          confirmGroup.style.display = 'flex';
        }
      });
      
      card.querySelector('.confirm-yes-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onItemClick?.('delete', id);
      });
      
      card.querySelector('.confirm-no-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const actionGroup = card.querySelector('.action-buttons-group');
        const confirmGroup = card.querySelector('.delete-confirm-group');
        if (actionGroup && confirmGroup) {
          actionGroup.style.display = 'flex';
          confirmGroup.style.display = 'none';
        }
      });
      
      card.addEventListener('click', (e) => {
        if (
          e.target.closest('.btn-icon') ||
          e.target.closest('.confirm-yes-btn') ||
          e.target.closest('.confirm-no-btn')
        ) return;
        card.classList.toggle('expanded');
      });
    });
  }
  
  scrollToItem(index) {
    this.container.scrollTop = index * this.itemHeight;
  }
  
  scrollToTop() {
    this.container.scrollTop = 0;
  }
  
  getTotalHeight() {
    return this.filteredItems.length * this.itemHeight;
  }
  
  destroy() {
    this.container.removeEventListener('scroll', this.scrollHandler);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
  
  throttle(fn, wait) {
    let lastTime = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastTime >= wait) {
        lastTime = now;
        fn.apply(this, args);
      }
    };
  }
}

// DOM Elements Cache
const elements = {
  projectSelector: null,
  projectTrigger: null,
  projectDropdown: null,
  projectDropdownList: null,
  selectedProjectName: null,
  selectedProjectColor: null,
  selectedProjectCount: null,
  capturePageBtn: null,
  copyAllBtn: null,
  searchInput: null,
  snippetsContainer: null,
  emptyState: null,
  snippetCount: null,
  modalOverlay: null,
  toast: null,
};

// Initialize
document.addEventListener("DOMContentLoaded", init);

async function init() {
  cacheElements();
  await loadData();
  initVirtualScroller();
  renderProjectDropdown();
  renderSnippets();
  renderWikiPanel();
  setupEventListeners();
  loadTheme();

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "SOURCE_ADDED" || message.type === "SNIPPET_ADDED") {
      const source = message.source || YyoinkWiki.models.normalizeSnippetToSource(message.snippet);
      sources.unshift(source);
      syncLegacyAliases();
      renderSnippets();
      renderProjectDropdown();
      showToast("Source saved!");
    }

    if (message.type === "OPEN_CREATE_PROJECT") {
      window.pendingSnippetData = {
        text: message.text,
        tabInfo: message.tabInfo,
      };
      openModal("addProjectModal");
    }
  });
}

function initVirtualScroller() {
  virtualScroller = new VirtualScroller({
    container: elements.snippetsContainer,
    itemHeight: 130,
    bufferSize: 5,
    renderItem: createSnippetCard,
    onItemClick: handleSnippetAction,
  });
}

function handleSnippetAction(action, snippetId) {
  switch (action) {
    case 'copy':
      copySnippet(snippetId);
      break;
    case 'edit':
      editSnippet(snippetId);
      break;
    case 'delete':
      deleteSnippet(snippetId);
      break;
  }
}

function cacheElements() {
  elements.projectSelector = document.getElementById("projectSelector");
  elements.projectTrigger = document.getElementById("projectTrigger");
  elements.projectDropdown = document.getElementById("projectDropdown");
  elements.projectDropdownList = document.getElementById("projectDropdownList");
  elements.selectedProjectName = document.getElementById("selectedProjectName");
  elements.selectedProjectColor = document.getElementById(
    "selectedProjectColor",
  );
  elements.selectedProjectCount = document.getElementById(
    "selectedProjectCount",
  );
  elements.capturePageBtn = document.getElementById("capturePageBtn");
  elements.copyAllBtn = document.getElementById("copyAllBtn");
  elements.searchInput = document.getElementById("searchInput");
  elements.snippetsContainer = document.getElementById("snippetsContainer");
  elements.emptyState = document.getElementById("emptyState");
  elements.snippetCount = document.getElementById("snippetCount");
  elements.modalOverlay = document.getElementById("modalOverlay");
  elements.toast = document.getElementById("toast");
}

async function loadData() {
  await YyoinkWiki.migration.migrateLegacyDataIfNeeded();
  topics = await YyoinkWiki.repository.getAll("topics");
  sources = await YyoinkWiki.repository.getAll("sources");
  wikiPages = await YyoinkWiki.repository.getAll("wikiPages");
  aiDrafts = await YyoinkWiki.repository.getAll("aiDrafts");
  syncLegacyAliases();

  if (topics.length === 0) {
    const fallbackTopic = YyoinkWiki.models.normalizeProjectToTopic({
      id: "default",
      name: "Default",
      color: "#6366f1",
      createdAt: new Date().toISOString(),
    });
    await YyoinkWiki.repository.put("topics", fallbackTopic);
    topics = [fallbackTopic];
    syncLegacyAliases();
  }
}

async function saveData() {
  syncLegacyAliases();
  await YyoinkWiki.repository.replaceAll({
    topics,
    sources,
    wikiPages,
    aiDrafts,
  });
  syncLegacyAliases();
  checkStorageUsage();
}

function syncLegacyAliases() {
  selectedTopicId = selectedProjectId;
  topics.forEach((topic) => {
    if (!topic.title && topic.name) topic.title = topic.name;
    if (!topic.name && topic.title) topic.name = topic.title;
  });
  sources.forEach((source) => {
    if (!source.topicId && source.projectId) source.topicId = source.projectId;
    if (!source.projectId && source.topicId) source.projectId = source.topicId;
  });
  projects = topics;
  snippets = sources;
}

function checkStorageUsage() {
  if (chrome.runtime.lastError) return;
  
  chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
    const LIMIT = 5242880; // 5MB
    const usagePercent = (bytesInUse / LIMIT) * 100;
    
    if (usagePercent >= 80) {
      const type = usagePercent >= 90 ? "danger" : "warning";
      const msg = `Storage ${usagePercent.toFixed(0)}% full`;
      
      showToast(msg);
      
      console.warn(`yyoink: Storage usage at ${usagePercent.toFixed(2)}%`);
    }
  });
}

// Event Listeners
function setupEventListeners() {
  document.querySelectorAll(".workspace-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchWorkspaceTab(tab.dataset.tab));
  });

  // Project dropdown
  elements.projectTrigger.addEventListener("click", toggleProjectDropdown);

  document.addEventListener("click", (e) => {
    if (!elements.projectSelector.contains(e.target)) {
      closeProjectDropdown();
    }
  });

  // Add project buttons
  document
    .getElementById("addProjectBtnDropdown")
    .addEventListener("click", (e) => {
      e.stopPropagation();
      closeProjectDropdown();
      openModal("addProjectModal");
    });

  document
    .getElementById("addProjectBtnManage")
    ?.addEventListener("click", () => {
      closeAllModals();
      openModal("addProjectModal");
    });

  // Manage projects
  document
    .getElementById("manageProjectsBtn")
    .addEventListener("click", (e) => {
      e.stopPropagation();
      closeProjectDropdown();
      renderManageProjectsList();
      openModal("manageProjectsModal");
    });

  // Main action buttons
  elements.capturePageBtn.addEventListener("click", capturePage);
  elements.copyAllBtn.addEventListener("click", copyAllSnippets);
  elements.searchInput.addEventListener("input", debounce(renderSnippets, 200));

  // Export/Import
  document
    .getElementById("exportBtn")
    .addEventListener("click", () => openModal("exportModal"));
  document
    .getElementById("importBtn")
    .addEventListener("click", () =>
      document.getElementById("importFileInput").click(),
    );
  document
    .getElementById("importFileInput")
    .addEventListener("change", handleImport);

  // Memo & Paste
  document.getElementById("memoBtn").addEventListener("click", openMemoModal);
  document.getElementById("saveMemoBtn").addEventListener("click", saveMemo);
  document
    .getElementById("pasteBtn")
    .addEventListener("click", pasteFromClipboard);

  // Copy Bypass & Force Select
  const bypassBtn = document.getElementById("bypassBtn");
  if (bypassBtn) {
    let pressTimer = null;
    let isLongPress = false;

    bypassBtn.addEventListener("mousedown", () => {
      isLongPress = false;
      pressTimer = setTimeout(async () => {
        isLongPress = true;
        await enableHardcoreBypass();
      }, 500);
    });

    bypassBtn.addEventListener("mouseup", () => {
      clearTimeout(pressTimer);
      if (!isLongPress) {
        toggleCopyBypass();
      }
    });

    bypassBtn.addEventListener("mouseleave", () => {
      clearTimeout(pressTimer);
    });
  }
  document
    .getElementById("forceSelectBtn")
    ?.addEventListener("click", forceSelectAndSave);

  // Modal controls
  elements.modalOverlay.addEventListener("click", (e) => {
    if (e.target === elements.modalOverlay) closeAllModals();
  });

  document.querySelectorAll(".modal-close, .modal-cancel").forEach((btn) => {
    btn.addEventListener("click", closeAllModals);
  });

  // Save project
  document
    .getElementById("saveProjectBtn")
    .addEventListener("click", saveNewProject);

  // Color options
  document.querySelectorAll(".color-option").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".color-option")
        .forEach((b) => b.classList.remove("selected"));
      e.target.classList.add("selected");
      selectedColor = e.target.dataset.color;
    });
  });

  // Format buttons
  document.querySelectorAll(".format-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleExport(btn.dataset.format));
  });

  // Save snippet edit
  document
    .getElementById("saveSnippetBtn")
    .addEventListener("click", saveSnippetEdit);

  // Coffee & Settings
  document.getElementById("coffeeButton")?.addEventListener("click", () => {
    window.open("https://www.buymeacoffee.com/ooak", "_blank");
  });

  document.getElementById("settingsBtn").addEventListener("click", () => {
    loadAISettings();
    openModal("settingsModal");
  });

  document
    .getElementById("saveAISettingsBtn")
    ?.addEventListener("click", saveAISettings);
  document
    .getElementById("generateWikiBtn")
    ?.addEventListener("click", () => runWikiAIAction("generateWiki"));
  document
    .getElementById("updateWikiBtn")
    ?.addEventListener("click", () => runWikiAIAction("updateWiki"));
  document
    .getElementById("reviewDraftBtn")
    ?.addEventListener("click", openLatestDraft);
  document
    .getElementById("approveDraftBtn")
    ?.addEventListener("click", approveCurrentDraft);
  document
    .getElementById("rejectDraftBtn")
    ?.addEventListener("click", rejectCurrentDraft);
  document
    .getElementById("askTopicBtn")
    ?.addEventListener("click", askCurrentTopic);

  // Theme options
  document.querySelectorAll(".theme-option").forEach((btn) => {
    btn.addEventListener("click", (e) =>
      applyTheme(e.currentTarget.dataset.theme),
    );
  });

  // Delete project
  document
    .getElementById("confirmDeleteProjectBtn")
    ?.addEventListener("click", confirmDeleteProject);

  document.querySelectorAll('input[name="snippetAction"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const moveSelect = document.getElementById("moveToProject");
      if (e.target.value === "move") {
        moveSelect.style.display = "block";
        populateMoveToProjectSelect();
      } else {
        moveSelect.style.display = "none";
      }
    });
  });
}

// Copy Bypass Functions
async function enableHardcoreBypass() {
  const btn = document.getElementById("bypassBtn");

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const url = new URL(tab.url);
    const primaryPattern = `${url.protocol}//${url.hostname}/*`;

    if (hardcoreModeEnabled) {
      await chrome.contentSettings.javascript.set({
        primaryPattern: primaryPattern,
        setting: "allow",
      });
      hardcoreModeEnabled = false;
      copyBypassEnabled = false;
      btn.classList.remove("active", "hardcore");
      showToast("강력 모드 해제 - 페이지 새로고침");
      chrome.tabs.reload(tab.id);
    } else {
      await chrome.contentSettings.javascript.set({
        primaryPattern: primaryPattern,
        setting: "block",
      });
      hardcoreModeEnabled = true;
      copyBypassEnabled = true;
      btn.classList.add("active", "hardcore");
      showToast("강력 모드 활성화 - JS 비활성화됨");
      chrome.tabs.reload(tab.id);
    }
  } catch (error) {
    showToast("이 페이지에서는 사용할 수 없습니다");
  }
}

async function toggleCopyBypass() {
  const btn = document.getElementById("bypassBtn");

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const message = copyBypassEnabled
      ? { type: "DISABLE_COPY_BYPASS" }
      : { type: "ENABLE_COPY_BYPASS" };

    await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });

    if (copyBypassEnabled) {
      copyBypassEnabled = false;
      hardcoreModeEnabled = false;
      btn.classList.remove("active", "hardcore");
      showToast("복사 잠금 해제 비활성화");
    } else {
      copyBypassEnabled = true;
      btn.classList.add("active");
      showToast("복사 잠금 해제 활성화 (길게 누르면 강력 모드)");
    }
  } catch (error) {
    console.error("toggleCopyBypass error:", error);
    showToast("페이지를 새로고침한 후 다시 시도하세요");
  }
}

async function forceSelectAndSave() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Check if this is a restricted page
    if (
      !tab.url ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("about:")
    ) {
      showToast("Cannot access this page");
      return;
    }

    // Use Promise with proper error handling
    const response = await new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_SELECTION_TEXT" },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    });

    if (response && response.text && response.text.trim()) {
      const source = YyoinkWiki.models.createSource({
        text: response.text.trim(),
        sourceUrl: tab.url,
        pageTitle: tab.title,
        domain: new URL(tab.url).hostname,
        topicId: selectedProjectId !== "all" ? selectedProjectId : "default",
        type: "selection",
      });

      sources.unshift(source);
      await saveData();
      renderProjectDropdown();
      renderSnippets();
      showToast("Selection saved!");
    } else {
      showToast("No text selected");
    }
  } catch (error) {
    console.error("forceSelectAndSave error:", error);
    // Content script not loaded or connection failed
    if (
      error.message?.includes("Receiving end does not exist") ||
      error.message?.includes("Could not establish connection")
    ) {
      showToast("Please refresh the page and try again");
    } else {
      showToast("Please select text first");
    }
  }
}

// Project Dropdown Functions
function toggleProjectDropdown() {
  if (elements.projectDropdown.classList.contains("open")) {
    closeProjectDropdown();
  } else {
    openProjectDropdown();
  }
}

function openProjectDropdown() {
  elements.projectDropdown.classList.add("open");
  elements.projectTrigger.classList.add("open");
}

function closeProjectDropdown() {
  elements.projectDropdown.classList.remove("open");
  elements.projectTrigger.classList.remove("open");
}

function renderProjectDropdown() {
  syncLegacyAliases();

  if (selectedProjectId === "all") {
    elements.selectedProjectName.textContent = "All Projects";
    elements.selectedProjectColor.classList.add("all");
    elements.selectedProjectColor.style.background = "";
    elements.selectedProjectCount.textContent = snippets.length;
  } else {
    const project = projects.find((p) => p.id === selectedProjectId);
    if (project) {
      elements.selectedProjectName.textContent = project.name;
      elements.selectedProjectColor.classList.remove("all");
      elements.selectedProjectColor.style.background = project.color;
      elements.selectedProjectCount.textContent = snippets.filter(
        (s) => s.projectId === selectedProjectId,
      ).length;
    }
  }

  elements.projectDropdownList.innerHTML = `
    <div class="project-option ${
      selectedProjectId === "all" ? "active" : ""
    }" data-id="all">
      <span class="project-indicator all"></span>
      <div class="project-info">
        <span class="project-name">All Projects</span>
        <span class="project-meta">${snippets.length} snippets</span>
      </div>
      ${selectedProjectId === "all" ? '<span class="check-icon">✓</span>' : ""}
    </div>
  `;

  projects.forEach((project) => {
    const count = snippets.filter((s) => s.projectId === project.id).length;
    const isActive = selectedProjectId === project.id;

    elements.projectDropdownList.innerHTML += `
      <div class="project-option ${isActive ? "active" : ""}" data-id="${
        project.id
      }">
        <span class="project-indicator" style="background: ${
          project.color
        }"></span>
        <div class="project-info">
          <span class="project-name">${escapeHtml(project.name)}</span>
          <span class="project-meta">${count} snippets</span>
        </div>
        ${isActive ? '<span class="check-icon">✓</span>' : ""}
      </div>
    `;
  });

  elements.projectDropdownList
    .querySelectorAll(".project-option")
    .forEach((option) => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        selectedProjectId = option.dataset.id;

        if (selectedProjectId !== "all") {
          chrome.storage.local.set({
            activeProjectId: selectedProjectId,
            activeTopicId: selectedProjectId,
          });
        }

        renderProjectDropdown();
        renderSnippets();
        renderWikiPanel();
        closeProjectDropdown();
      });
    });

  // Update edit modal select
  const editProjectSelect = document.getElementById("editSnippetProject");
  if (editProjectSelect) {
    editProjectSelect.innerHTML = projects
      .map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`)
      .join("");
  }
}

function renderSnippets() {
  syncLegacyAliases();

  const searchTerm = elements.searchInput.value.toLowerCase();
  let filteredSnippets = snippets;

  if (selectedProjectId !== "all") {
    filteredSnippets = filteredSnippets.filter(
      (s) => s.projectId === selectedProjectId,
    );
  }

  if (searchTerm) {
    filteredSnippets = filteredSnippets.filter(
      (s) =>
        s.text.toLowerCase().includes(searchTerm) ||
        s.pageTitle?.toLowerCase().includes(searchTerm) ||
        s.domain?.toLowerCase().includes(searchTerm),
    );
  }

  elements.snippetCount.textContent = `${filteredSnippets.length} snippet${
    filteredSnippets.length !== 1 ? "s" : ""
  }`;

  if (filteredSnippets.length === 0) {
    if (virtualScroller) {
      virtualScroller.setFilteredItems([]);
    }
    elements.emptyState.style.display = "flex";
    if (!elements.snippetsContainer.contains(elements.emptyState)) {
      elements.snippetsContainer.appendChild(elements.emptyState);
    }
    return;
  }

  elements.emptyState.style.display = "none";
  if (elements.snippetsContainer.contains(elements.emptyState)) {
    elements.emptyState.remove();
  }
  
  if (virtualScroller) {
    virtualScroller.setFilteredItems(filteredSnippets);
  }
}

function createSnippetCard(snippet) {
  const project =
    projects.find((p) => p.id === snippet.projectId) || projects[0];
  const date = formatDate(snippet.createdAt);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${snippet.domain}&sz=32`;

  return `
    <div class="snippet-card" data-id="${snippet.id}" data-animated="false" style="--snippet-color: ${
      project.color
    }">
      <div class="snippet-header">
        <div class="snippet-source">
          <img class="snippet-favicon" src="${faviconUrl}" alt="" onerror="this.style.display='none'">
          <span class="snippet-domain" title="${escapeHtml(
            snippet.sourceUrl,
          )}">${escapeHtml(snippet.domain)}</span>
        </div>
        <div class="snippet-actions">
          <div class="action-buttons-group">
            <button class="btn-icon btn-copy" title="Copy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button class="btn-icon btn-edit" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-icon btn-delete" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
          <div class="delete-confirm-group" style="display: none;">
            <span class="delete-confirm-text">Delete?</span>
            <button class="confirm-yes-btn">Yes</button>
            <button class="confirm-no-btn">No</button>
          </div>
        </div>
      </div>
      <div class="snippet-text">${escapeHtml(snippet.text)}</div>
      <div class="snippet-footer">
        <span class="snippet-project">
          <span class="project-dot" style="background: ${project.color}"></span>
          ${escapeHtml(project.name)}
        </span>
        ${
          snippet.sourceUrl?.startsWith("http")
            ? `<a href="${escapeHtml(
                snippet.sourceUrl,
              )}" target="_blank" class="snippet-url-link">URL</a>`
            : ""
        }
        <span class="source-status">${escapeHtml(snippet.aiStatus || "raw")}</span>
        <span class="snippet-date">${date}</span>
      </div>
    </div>
  `;
}

function switchWorkspaceTab(tabName) {
  document.querySelectorAll(".workspace-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });
  document.querySelectorAll(".workspace-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `${tabName}Panel`);
  });
  if (tabName === "wiki") renderWikiPanel();
}

function getSelectedTopic() {
  return selectedProjectId === "all"
    ? topics[0]
    : topics.find((topic) => topic.id === selectedProjectId);
}

function getSelectedTopicSources() {
  const topic = getSelectedTopic();
  return topic ? sources.filter((source) => source.topicId === topic.id) : [];
}

function getSelectedWikiPage() {
  const topic = getSelectedTopic();
  return topic ? wikiPages.find((page) => page.topicId === topic.id) : null;
}

function getSelectedDrafts() {
  const topic = getSelectedTopic();
  return topic ? aiDrafts.filter((draft) => draft.topicId === topic.id) : [];
}

function markdownToSafeHtml(markdown) {
  return escapeHtml(markdown || "")
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

function renderWikiPanel() {
  const topic = getSelectedTopic();
  const wikiPage = getSelectedWikiPage();
  const topicSources = getSelectedTopicSources();
  const drafts = getSelectedDrafts();
  const status = YyoinkWiki.models.deriveTopicStatus({
    wikiPage,
    sources: topicSources,
    drafts,
    isGenerating: false,
  });

  const statusEl = document.getElementById("wikiStatus");
  const titleEl = document.getElementById("wikiTitle");
  const contentEl = document.getElementById("wikiContent");
  if (!statusEl || !titleEl || !contentEl) return;

  statusEl.textContent = status;
  titleEl.textContent = topic?.title || topic?.name || "Topic Wiki";
  contentEl.innerHTML = wikiPage
    ? `<p>${markdownToSafeHtml(wikiPage.bodyMarkdown)}</p>`
    : `<p>No approved wiki page yet.</p>`;
}

function loadAISettings() {
  chrome.storage.local.get(["aiApiKey", "aiModel"], (result) => {
    const keyInput = document.getElementById("aiApiKeyInput");
    const modelInput = document.getElementById("aiModelInput");
    if (keyInput) keyInput.value = result.aiApiKey || "";
    if (modelInput) modelInput.value = result.aiModel || "gpt-5-mini";
  });
}

function saveAISettings() {
  const aiApiKey = document.getElementById("aiApiKeyInput").value.trim();
  const aiModel = document.getElementById("aiModelInput").value.trim() || "gpt-5-mini";
  chrome.storage.local.set({ aiApiKey, aiModel }, () => showToast("AI settings saved"));
}

async function runWikiAIAction(action) {
  const topic = getSelectedTopic();
  if (!topic) {
    showToast("Select a topic first");
    return;
  }

  showToast(action === "generateWiki" ? "Generating wiki..." : "Updating wiki...");
  const result = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "RUN_AI_ACTION", action, topicId: topic.id }, resolve);
  });

  if (result?.draft) {
    aiDrafts.unshift(result.draft);
    await saveData();
    renderWikiPanel();
    if (result.draft.status === "ready") {
      openDraft(result.draft);
    } else {
      showToast(result.error || "AI failed");
    }
  } else {
    showToast(result?.error || "AI failed");
  }
}

function openLatestDraft() {
  const draft = getSelectedDrafts().find((item) => item.status === "ready");
  if (!draft) {
    showToast("No draft ready");
    return;
  }
  openDraft(draft);
}

function openDraft(draft) {
  reviewingDraftId = draft.id;
  document.getElementById("draftMarkdownText").value =
    draft.proposedWikiMarkdown || draft.generatedSummary || "";
  document.getElementById("draftMeta").textContent =
    `${draft.sourceCitations.length} citations, ${draft.weakClaims.length} weak claims`;
  openModal("draftReviewModal");
}

async function approveCurrentDraft() {
  const draft = aiDrafts.find((item) => item.id === reviewingDraftId);
  const topic = getSelectedTopic();
  if (!draft || !topic) return;

  draft.status = "approved";
  draft.proposedWikiMarkdown = document.getElementById("draftMarkdownText").value;
  draft.updatedAt = new Date().toISOString();

  if (draft.type === "generateWiki" || draft.type === "updateWiki") {
    const existingPage = getSelectedWikiPage();
    const page = YyoinkWiki.models.createWikiPageFromDraft({
      draft,
      existingPage,
      title: topic.title || topic.name,
    });
    wikiPages = wikiPages.filter((item) => item.id !== page.id);
    wikiPages.unshift(page);
    await YyoinkWiki.repository.markTopicSourcesProcessed(topic.id, page.sourceIds);
    sources = await YyoinkWiki.repository.getAll("sources");
    syncLegacyAliases();
  }

  await saveData();
  closeAllModals();
  renderWikiPanel();
  renderSnippets();
  showToast("Draft approved");
}

async function rejectCurrentDraft() {
  const draft = aiDrafts.find((item) => item.id === reviewingDraftId);
  if (!draft) return;
  draft.status = "rejected";
  draft.updatedAt = new Date().toISOString();
  await saveData();
  closeAllModals();
  renderWikiPanel();
  showToast("Draft rejected");
}

async function askCurrentTopic() {
  const topic = getSelectedTopic();
  const question = document.getElementById("askInput").value.trim();
  if (!topic) {
    showToast("Select a topic first");
    return;
  }
  if (!question) {
    showToast("Write a question first");
    return;
  }

  appendAskMessage("user", question);
  document.getElementById("askInput").value = "";

  const result = await new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "RUN_AI_ACTION", action: "askTopic", topicId: topic.id, question },
      resolve,
    );
  });

  if (result?.draft) {
    aiDrafts.unshift(result.draft);
    await saveData();
  }

  if (result?.draft?.status === "ready") {
    appendAskMessage(
      "assistant",
      result.draft.generatedSummary || result.draft.proposedWikiMarkdown,
    );
  } else {
    appendAskMessage(
      "assistant",
      result?.error || result?.draft?.weakClaims?.[0] || "AI failed",
    );
  }
}

function appendAskMessage(role, text) {
  const thread = document.getElementById("askThread");
  const div = document.createElement("div");
  div.className = `ask-message ask-message-${role}`;
  div.textContent = text;
  thread.appendChild(div);
  thread.scrollTop = thread.scrollHeight;
}

// Manage Projects
function renderManageProjectsList() {
  const list = document.getElementById("manageProjectsList");
  if (!list) return;

  list.innerHTML = projects
    .map((project) => {
      const count = snippets.filter((s) => s.projectId === project.id).length;
      const isDefault = project.id === "default";

      return `
      <div class="project-item" data-id="${project.id}">
        <span class="project-indicator" style="background: ${
          project.color
        }"></span>
        <div class="project-info">
          <span class="project-name">${escapeHtml(project.name)}</span>
          <span class="project-meta">${count} snippets</span>
        </div>
        <div class="project-item-actions">
          ${
            !isDefault
              ? `
            <button class="btn-icon btn-delete-project" title="Delete Project">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          `
              : ""
          }
        </div>
      </div>
    `;
    })
    .join("");

  list.querySelectorAll(".btn-delete-project").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const projectItem = e.target.closest(".project-item");
      const projectId = projectItem.dataset.id;
      const project = projects.find((p) => p.id === projectId);

      if (project) {
        deleteProjectId = projectId;
        document.getElementById("deleteProjectName").textContent =
          `Delete "${project.name}"?`;
        closeAllModals();
        openModal("deleteProjectModal");
      }
    });
  });
}

function populateMoveToProjectSelect() {
  const select = document.getElementById("moveToProject");
  select.innerHTML = projects
    .filter((p) => p.id !== deleteProjectId)
    .map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`)
    .join("");
}

function confirmDeleteProject() {
  const action = document.querySelector(
    'input[name="snippetAction"]:checked',
  ).value;

  if (action === "delete") {
    sources = sources.filter((s) => s.projectId !== deleteProjectId);
  } else {
    const moveToId = document.getElementById("moveToProject").value;
    sources = sources.map((s) =>
      s.projectId === deleteProjectId
        ? { ...s, projectId: moveToId, topicId: moveToId, aiStatus: "stale" }
        : s,
    );
  }

  topics = topics.filter((p) => p.id !== deleteProjectId);
  syncLegacyAliases();

  if (selectedProjectId === deleteProjectId) {
    selectedProjectId = "all";
  }

  saveData();
  chrome.runtime.sendMessage({ type: "REFRESH_MENUS" }, () => {
    if (chrome.runtime.lastError) {
      console.log("Could not refresh context menus:", chrome.runtime.lastError.message);
    }
  });
  renderProjectDropdown();
  renderSnippets();
  closeAllModals();
  showToast("Project deleted");
  deleteProjectId = null;
}

// Capture Page
async function capturePage() {
  const btn = elements.capturePageBtn;
  const originalContent = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<svg class="loading-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"></path></svg> Capturing...`;

  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: "GET_PAGE_TEXT" },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    });

    if (response?.error) {
      showToast("Please refresh the page and try again");
    } else if (response?.text) {
      const source = YyoinkWiki.models.createSource({
        text: response.text.substring(0, 10000),
        sourceUrl: response.url,
        pageTitle: response.title,
        domain: response.domain,
        topicId: selectedProjectId !== "all" ? selectedProjectId : "default",
        type: "page",
      });

      sources.unshift(source);
      await saveData();
      renderProjectDropdown();
      renderSnippets();
      showToast("Page captured!");
    } else {
      showToast("Could not capture page content");
    }
  } catch (error) {
    console.error("capturePage error:", error);
    showToast("Please refresh the page and try again");
  }

  btn.disabled = false;
  btn.innerHTML = originalContent;
}

// Copy Functions
function copySnippet(id) {
  const snippet = snippets.find((s) => s.id === id);
  if (snippet) {
    navigator.clipboard
      .writeText(formatSnippetForCopy(snippet))
      .then(() => showToast("Copied!"));
  }
}

function copyAllSnippets() {
  let filtered =
    selectedProjectId === "all"
      ? snippets
      : snippets.filter((s) => s.projectId === selectedProjectId);

  if (filtered.length === 0) {
    showToast("No snippets to copy");
    return;
  }

  const text = filtered.map(formatSnippetForCopy).join("\n\n---\n\n");
  navigator.clipboard
    .writeText(text)
    .then(() => showToast(`Copied ${filtered.length} snippets!`));
}

function formatSnippetForCopy(snippet) {
  return `${snippet.text}\n\nSource: ${snippet.sourceUrl}`;
}

// Edit Functions
function editSnippet(id) {
  const snippet = snippets.find((s) => s.id === id);
  if (snippet) {
    editingSnippetId = id;
    document.getElementById("editSnippetText").value = snippet.text;
    document.getElementById("editSnippetProject").value = snippet.projectId;
    openModal("editSnippetModal");
  }
}

function saveSnippetEdit() {
  const text = document.getElementById("editSnippetText").value.trim();
  const projectId = document.getElementById("editSnippetProject").value;

  if (!text) {
    showToast("Snippet text cannot be empty");
    return;
  }

  const snippet = snippets.find((s) => s.id === editingSnippetId);
  if (snippet) {
    snippet.text = text;
    snippet.projectId = projectId;
    snippet.topicId = projectId;
    snippet.aiStatus = "stale";
    saveData();
    renderProjectDropdown();
    renderSnippets();
    closeAllModals();
    showToast("Snippet updated!");
  }
}

// Memo Functions
function openMemoModal() {
  const memoProjectSelect = document.getElementById("memoProject");
  memoProjectSelect.innerHTML = projects
    .map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`)
    .join("");

  if (selectedProjectId !== "all") {
    memoProjectSelect.value = selectedProjectId;
  }

  document.getElementById("memoText").value = "";
  openModal("memoModal");
}

function saveMemo() {
  const text = document.getElementById("memoText").value.trim();
  const projectId = document.getElementById("memoProject").value;

  if (!text) {
    showToast("Please write something");
    return;
  }

  const source = YyoinkWiki.models.createSource({
    text,
    sourceUrl: "memo://local",
    pageTitle: "Quick Memo",
    domain: "Memo",
    topicId: projectId || projects[0]?.id,
    type: "memo",
  });

  sources.unshift(source);
  saveData();
  renderProjectDropdown();
  renderSnippets();
  closeAllModals();
  showToast("Memo saved!");
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();

    if (!text?.trim()) {
      showToast("Clipboard is empty");
      return;
    }

    const source = YyoinkWiki.models.createSource({
      text: text.trim().substring(0, 10000),
      sourceUrl: "clipboard://paste",
      pageTitle: "Pasted from Clipboard",
      domain: "Clipboard",
      topicId:
        selectedProjectId !== "all" ? selectedProjectId : projects[0]?.id,
      type: "clipboard",
    });

    sources.unshift(source);
    saveData();
    renderProjectDropdown();
    renderSnippets();
    showToast("Pasted from clipboard!");
  } catch {
    showToast("Cannot read clipboard. Please allow permission.");
  }
}

function deleteSnippet(id) {
  sources = sources.filter((s) => s.id !== id);
  syncLegacyAliases();
  saveData();
  renderProjectDropdown();
  renderSnippets();
  showToast("Snippet deleted");
}

// Project Functions
function saveNewProject() {
  const name = document.getElementById("projectNameInput").value.trim();

  if (!name) {
    showToast("Please enter a project name");
    return;
  }

  const project = {
    id: generateId(),
    name,
    title: name,
    description: "",
    color: selectedColor,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  projects.push(project);

  if (window.pendingSnippetData) {
    const { text, tabInfo } = window.pendingSnippetData;
    const source = YyoinkWiki.models.createSource({
      text,
      sourceUrl: tabInfo.url,
      pageTitle: tabInfo.title,
      domain: tabInfo.domain,
      topicId: project.id,
      type: "selection",
    });
    sources.unshift(source);
    window.pendingSnippetData = null;
    showToast("Project created & snippet saved!");
  } else {
    showToast("Project created!");
  }

  saveData();
  chrome.runtime.sendMessage({ type: "REFRESH_MENUS" }, () => {
    if (chrome.runtime.lastError) {
      console.log("Could not refresh context menus:", chrome.runtime.lastError.message);
    }
  });
  renderProjectDropdown();
  renderSnippets();
  closeAllModals();
  document.getElementById("projectNameInput").value = "";
}

// Export Functions
function handleExport(format) {
  let filteredSnippets =
    selectedProjectId === "all"
      ? snippets
      : snippets.filter((s) => s.projectId === selectedProjectId);

  let filteredProjects =
    selectedProjectId === "all"
      ? projects
      : projects.filter((p) => p.id === selectedProjectId);

  if (filteredSnippets.length === 0) {
    showToast("No snippets to export");
    return;
  }

  let content, filename, mimeType;

  switch (format) {
    case "json":
      content = JSON.stringify(
        { projects: filteredProjects, snippets: filteredSnippets },
        null,
        2,
      );
      filename = "yyoink-export.json";
      mimeType = "application/json";
      break;
    case "txt":
      content = exportAsTxt(filteredSnippets, filteredProjects);
      filename = "yyoink-export.txt";
      mimeType = "text/plain";
      break;
    case "md":
      content = exportAsMd(filteredSnippets, filteredProjects);
      filename = "yyoink-export.md";
      mimeType = "text/markdown";
      break;
  }

  downloadFile(content, filename, mimeType);
  closeAllModals();
  showToast(`Exported as ${format.toUpperCase()}!`);
}

function exportAsTxt(snippetList, projectsList) {
  return projectsList
    .map((project) => {
      const projectSnippets = snippetList.filter(
        (s) => s.projectId === project.id,
      );
      if (projectSnippets.length === 0) return "";
      return `[${project.name}]\n---\n\n${projectSnippets
        .map((s) => `${s.text}\nSource: ${s.sourceUrl}\n`)
        .join("\n")}\n`;
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function exportAsMd(snippetList, projectsList) {
  let output = "# yyoink Export\n\n";
  projectsList.forEach((project) => {
    const projectSnippets = snippetList.filter(
      (s) => s.projectId === project.id,
    );
    if (projectSnippets.length === 0) return;
    output += `## ${project.name}\n\n`;
    projectSnippets.forEach((s, i) => {
      output += `### Snippet ${i + 1}\n\n> ${s.text
        .split("\n")
        .join("\n> ")}\n\n*Source: [${s.pageTitle || s.domain}](${
        s.sourceUrl
      })*\n\n`;
    });
    output += "---\n\n";
  });
  return output.trim();
}

// Import Functions
async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase();
  const text = await file.text();

  try {
    let importedSnippets = [];
    let importedProjects = [];

    if (ext === "json") {
      const data = JSON.parse(text);
      importedSnippets = data.snippets || [];
      importedProjects = data.projects || [];
    } else {
      const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
      blocks.forEach((block) => {
        if (block.trim() && !block.startsWith("#") && !block.startsWith("[")) {
          importedSnippets.push({
            id: generateId(),
            text: block.trim(),
            sourceUrl: "Imported",
            pageTitle: "Imported",
            domain: "imported",
            projectId: "default",
            createdAt: new Date().toISOString(),
          });
        }
      });
    }

    const existingIds = new Set(projects.map((p) => p.id));
    importedProjects.forEach((p) => {
      if (!existingIds.has(p.id)) projects.push(p);
    });

    importedSnippets.forEach((s) => {
      const exists = projects.find((p) => p.id === s.projectId);
      snippets.unshift({
        ...s,
        id: generateId(),
        projectId: exists ? s.projectId : "default",
      });
    });

    saveData();
    renderProjectDropdown();
    renderSnippets();
    showToast(`Imported ${importedSnippets.length} snippets!`);
  } catch {
    showToast("Error importing file");
  }

  e.target.value = "";
}

// Modal Functions
function openModal(modalId) {
  elements.modalOverlay.classList.add("active");
  document.getElementById(modalId).classList.add("active");
}

function closeAllModals() {
  elements.modalOverlay.classList.remove("active");
  document
    .querySelectorAll(".modal")
    .forEach((m) => m.classList.remove("active"));
  editingSnippetId = null;
  reviewingDraftId = null;

  const deleteRadio = document.querySelector(
    'input[name="snippetAction"][value="delete"]',
  );
  if (deleteRadio) deleteRadio.checked = true;

  const moveSelect = document.getElementById("moveToProject");
  if (moveSelect) moveSelect.style.display = "none";
}

// Theme Functions
function loadTheme() {
  chrome.storage.local.get(["theme"], (result) => {
    applyTheme(result.theme || "auto", false);
  });
}

function applyTheme(theme, save = true) {
  document.body.classList.remove("theme-light", "theme-dark");

  if (theme === "light") document.body.classList.add("theme-light");
  else if (theme === "dark") document.body.classList.add("theme-dark");

  document.querySelectorAll(".theme-option").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });

  if (save) {
    chrome.storage.local.set({ theme });
    showToast(`Theme set to ${theme}`);
  }
}

// Utility Functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(isoString) {
  const date = new Date(isoString);
  const diffMs = Date.now() - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function showToast(message) {
  document.getElementById("toastMessage").textContent = message;
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 2500);
}
