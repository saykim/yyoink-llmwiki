/**
 * yyoink - Content Script
 * 
 * @author SYK (ooak.studio.101)
 * @copyright © 2026 ooak.studio.101. All rights reserved.
 * @license Proprietary
 */

let bypassEnabled = false;
let protectionInterval = null;

const SELECTORS_TO_REMOVE = [
  "script", "style", "noscript", "iframe", "svg", "nav", "footer", "header", "aside",
  '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
  ".sidebar", ".menu", ".nav", ".footer", ".header",
  ".advertisement", ".ad", ".ads", ".social-share"
];

const observer = new MutationObserver((mutations) => {
  if (!bypassEnabled) return;
  
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          applyBypassToElement(node);
        }
      });
    }
    
    if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
      if (mutation.attributeName === 'style' || mutation.attributeName === 'class') {
        applyBypassToElement(mutation.target);
      }
    }
  });
});

function applyBypassToElement(el) {
  if (!el.style) return;
  
  el.style.setProperty('user-select', 'auto', 'important');
  el.style.setProperty('-webkit-user-select', 'auto', 'important');
  el.style.setProperty('pointer-events', 'auto', 'important');
  
  el.onselectstart = null;
  el.oncopy = null;
  el.oncontextmenu = null;
  el.ondragstart = null;
  el.onmousedown = null;
  el.onmouseup = null;
}

function allowTextCopy() {
  if (!document.body) return;
  
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null, false);
  while (walker.nextNode()) {
    const el = walker.currentNode;
    if (el.innerText && el.innerText.trim().length > 0) {
      applyBypassToElement(el);
    }
  }
}

function disableJSHandlers() {
  if (!document.body) return;
  
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null, false);
  while (walker.nextNode()) {
    const el = walker.currentNode;
    el.onclick = null;
    el.onmousedown = null;
    el.onmouseup = null;
    el.oncontextmenu = null;
    el.ondblclick = null;
    el.onkeydown = null;
    el.onkeyup = null;
  }
}

function removeOverlayElements() {
  const allElements = document.querySelectorAll('*');
  allElements.forEach((el) => {
    try {
      const computedStyle = window.getComputedStyle(el);
      const isFixed = computedStyle.position === 'fixed' || computedStyle.position === 'absolute';
      const hasHighZIndex = parseInt(computedStyle.zIndex) > 1000;
      const isEmpty = el.textContent.trim() === '' && el.children.length === 0;
      const pointerEventsNone = computedStyle.pointerEvents === 'none';
      
      if (isFixed && hasHighZIndex && (isEmpty || pointerEventsNone)) {
        el.remove();
      }
    } catch (e) {}
  });
}

function fixBlurredImages() {
  if (!location.hostname.includes("blog.naver.com")) return;
  
  const images = document.querySelectorAll("img");
  images.forEach((img) => {
    const src = img.src || img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
    
    if (src) {
      try {
        const url = new URL(src, location.href);
        const type = url.searchParams.get("type");
        
        if (type && type.includes("_blur")) {
          url.searchParams.set("type", type.replace("_blur", ""));
          img.src = url.toString();
        }
      } catch (e) {}
    }
    
    if (img.classList && !img.classList.contains("egjs-visible")) {
      img.classList.add("egjs-visible");
    }
  });
}

function enableCopyBypass() {
  if (bypassEnabled) return;
  bypassEnabled = true;
  
  const style = document.createElement("style");
  style.id = "yyoink-bypass";
  style.textContent = `
    * {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
      pointer-events: auto !important;
      touch-action: auto !important;
    }
    [oncopy], [oncut], [oncontextmenu], [onselectstart], [ondragstart], [onmousedown] {
      -webkit-user-select: text !important;
      user-select: text !important;
    }
    ::selection {
      background: rgba(99, 102, 241, 0.3) !important;
      color: inherit !important;
    }
  `;
  document.head.appendChild(style);
  
  allowTextCopy();
  disableJSHandlers();
  
  setTimeout(removeOverlayElements, 100);
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
  
  if (protectionInterval) {
    clearInterval(protectionInterval);
  }
  protectionInterval = setInterval(() => {
    if (bypassEnabled) {
      allowTextCopy();
      disableJSHandlers();
      fixBlurredImages();
    }
  }, 1000);
}

function disableCopyBypass() {
  bypassEnabled = false;
  
  if (protectionInterval) {
    clearInterval(protectionInterval);
    protectionInterval = null;
  }
  
  const style = document.getElementById("yyoink-bypass");
  if (style) {
    style.remove();
  }
  
  observer.disconnect();
}

function forceExtractSelection() {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const fragment = range.cloneContents();
    const div = document.createElement("div");
    div.appendChild(fragment);
    return div.textContent || div.innerText || "";
  }
  return "";
}

function extractPageText() {
  let text = "";
  
  try {
    const clone = document.body.cloneNode(true);
    
    SELECTORS_TO_REMOVE.forEach((selector) => {
      clone.querySelectorAll(selector).forEach((el) => el.remove());
    });
    
    const mainContent = clone.querySelector('main, article, [role="main"], .content, .post, .article');
    const targetElement = mainContent || clone;
    
    text = targetElement.innerText || targetElement.textContent || "";
    
    text = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");
    
    return text.trim();
  } catch (error) {
    console.error("extractPageText error:", error);
    
    try {
      const mainContent = document.querySelector('main, article, [role="main"], .content, .post, .article');
      const targetElement = mainContent || document.body;
      
      text = targetElement.innerText || targetElement.textContent || "";
      
      return text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0).join("\n").replace(/\n{3,}/g, "\n\n").trim();
    } catch (fallbackError) {
      console.error("Fallback extraction failed:", fallbackError);
      return "";
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACT_PAGE_TEXT") {
    const pageText = extractPageText();
    sendResponse({
      text: pageText,
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
    });
    return true;
  }
  
  if (message.type === "ENABLE_COPY_BYPASS") {
    enableCopyBypass();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === "DISABLE_COPY_BYPASS") {
    disableCopyBypass();
    sendResponse({ success: true });
    return true;
  }
  
  if (message.type === "FORCE_GET_SELECTION") {
    const text = forceExtractSelection();
    sendResponse({ text });
    return true;
  }
  
  if (message.type === "GET_SELECTION_TEXT") {
    let text = window.getSelection()?.toString() || "";
    if (!text) {
      text = forceExtractSelection();
    }
    sendResponse({ text });
    return true;
  }
  
  return true;
});
