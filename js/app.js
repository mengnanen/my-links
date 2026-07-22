const CATEGORY_PASSWORD = "971008";
const DEFAULT_ICON = "img/favicon.png";
const CATEGORY_TAB_ORDER = [
  "自建",
  "常用",
  "学习",
  "U卡",
  "实用",
  "影视",
  "论坛",
  "美化",
  "开源",
  "机器人",
  "服务器",
  "加密",
];

const state = {
  currentCategory: "all",
  encryptedUnlocked: false,
};

const elements = {
  greetingText: document.getElementById("greeting-text"),
  localTime: document.getElementById("local-time"),
  clockDigits: [...document.querySelectorAll("[data-clock-index]")],
  tabs: document.getElementById("category-tabs"),
  sections: document.getElementById("sections"),
  searchInput: document.getElementById("search-input"),
  themeButton: document.getElementById("theme-button"),
  themeIcon: document.getElementById("theme-icon"),
  scrollTopButton: document.getElementById("scroll-top-button"),
  passwordModal: document.getElementById("password-modal"),
  passwordInput: document.getElementById("category-password"),
  cancelPasswordButton: document.getElementById("cancel-password-button"),
  submitPasswordButton: document.getElementById("submit-password-button"),
};

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function getGreeting(hour) {
  if (hour < 6) return "夜深了";
  if (hour < 9) return "早上好";
  if (hour < 12) return "上午好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  if (hour < 22) return "晚上好";
  return "夜深了";
}

function updateClockDigit(element, value) {
  if (element.dataset.value === value) return;

  const current = element.querySelector(".clock-digit-value:not(.is-leaving)");
  if (!element.dataset.value) {
    current.textContent = value;
    element.dataset.value = value;
    return;
  }

  const next = createElement("span", "clock-digit-value is-entering", value);
  element.appendChild(next);
  current.classList.add("is-leaving");
  void next.offsetHeight;
  next.classList.remove("is-entering");
  element.dataset.value = value;
  window.setTimeout(() => current.remove(), 420);
}

function updateLocalTime() {
  const now = new Date();
  const digits = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((value) => String(value).padStart(2, "0"))
    .join("");

  elements.greetingText.textContent = getGreeting(now.getHours());
  elements.localTime.dateTime = now.toISOString();
  elements.localTime.setAttribute(
    "aria-label",
    `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4, 6)}`,
  );
  elements.clockDigits.forEach((element, index) => updateClockDigit(element, digits[index]));
}

function createTab(category, label, active = false) {
  const button = createElement("button", `tab${active ? " active" : ""}`, label);
  button.type = "button";
  button.dataset.category = category;
  button.addEventListener("click", () => selectCategory(button));
  return button;
}

function createCard(link) {
  const card = createElement("a", "card");
  card.href = link.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.dataset.search = `${link.name} ${link.description} ${link.url}`.toLowerCase();

  const iconContainer = createElement("div", "card-icon");
  const icon = document.createElement("img");
  icon.src = link.icon || DEFAULT_ICON;
  icon.alt = link.name;
  icon.addEventListener("error", function handleIconError() {
    const fallback = link.fallback || DEFAULT_ICON;
    if (icon.getAttribute("src") !== fallback) {
      icon.src = fallback;
      return;
    }
    icon.removeEventListener("error", handleIconError);
  });
  iconContainer.appendChild(icon);

  const info = createElement("div", "card-info");
  info.append(
    createElement("div", "card-title", link.name),
    createElement("div", "card-desc", link.description),
  );

  card.append(iconContainer, info);
  return card;
}

function createSection(category) {
  const section = createElement("section", "section");
  section.dataset.category = category.category;

  const title = createElement("div", "section-title");
  const categoryIcon = createElement("img", "category-icon");
  categoryIcon.src = "svg/biaoqian.svg";
  categoryIcon.alt = "";
  categoryIcon.width = 20;
  categoryIcon.height = 20;
  title.append(categoryIcon, document.createTextNode(category.title));

  const action = createElement("button", "section-action");
  action.type = "button";

  if (category.locked) {
    action.id = "lock-button";
    action.setAttribute("aria-label", "解锁加密内容");
    const lockIcon = createElement("img", "lock-icon");
    lockIcon.id = "lock-icon";
    lockIcon.src = "svg/jiami.svg";
    lockIcon.alt = "";
    lockIcon.dataset.state = "locked";
    action.appendChild(lockIcon);
    action.addEventListener("click", toggleLock);
  } else {
    action.setAttribute("aria-label", `收起${category.title}`);
    const toggleIcon = createElement("img", "toggle-icon");
    toggleIcon.src = "svg/shouqi.svg";
    toggleIcon.alt = "";
    toggleIcon.dataset.state = "expanded";
    action.appendChild(toggleIcon);
    action.addEventListener("click", () => toggleSection(action));
  }

  title.appendChild(action);

  const cardContainer = createElement("div", "card-container");
  if (category.locked) {
    cardContainer.id = "locked-category";
    cardContainer.hidden = true;
  }

  const grid = createElement("div", "card-grid");
  category.links.forEach((link) => grid.appendChild(createCard(link)));
  cardContainer.appendChild(grid);
  section.append(title, cardContainer);
  return section;
}

function renderNavigation() {
  elements.tabs.appendChild(createTab("all", "全部", true));
  CATEGORY_TAB_ORDER.forEach((category) => {
    elements.tabs.appendChild(createTab(category, category));
  });
  window.SITE_CATEGORIES.forEach((category) => {
    elements.sections.appendChild(createSection(category));
  });

  requestAnimationFrame(() => moveIndicator(elements.tabs.querySelector(".tab.active")));
}

function scrollTabHorizontally(button, behavior = "smooth", center = false) {
  if (!button) return;

  const tabLeft = button.offsetLeft;
  const tabRight = tabLeft + button.offsetWidth;
  const visibleLeft = elements.tabs.scrollLeft;
  const visibleRight = visibleLeft + elements.tabs.clientWidth;
  let targetLeft = visibleLeft;

  if (center) {
    targetLeft = tabLeft - (elements.tabs.clientWidth - button.offsetWidth) / 2;
  } else if (tabLeft < visibleLeft) {
    targetLeft = tabLeft - 5;
  } else if (tabRight > visibleRight) {
    targetLeft = tabRight - elements.tabs.clientWidth + 5;
  } else {
    return;
  }

  elements.tabs.scrollTo({ left: Math.max(0, targetLeft), behavior });
}

function selectCategory(button) {
  elements.tabs.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  button.classList.add("active");
  state.currentCategory = button.dataset.category;
  scrollTabHorizontally(button, "smooth", true);
  moveIndicator(button);
  filterCards();
}

function moveIndicator(activeButton) {
  if (!activeButton) return;

  const containerRect = elements.tabs.getBoundingClientRect();
  const buttonRect = activeButton.getBoundingClientRect();
  elements.tabs.style.setProperty(
    "--indicator-left",
    `${buttonRect.left - containerRect.left + elements.tabs.scrollLeft}px`,
  );
  elements.tabs.style.setProperty("--indicator-width", `${buttonRect.width}px`);
  elements.tabs.style.setProperty("--indicator-height", `${buttonRect.height}px`);
  elements.tabs.style.setProperty("--indicator-top", `${buttonRect.top - containerRect.top}px`);
}

function filterCards() {
  const keyword = elements.searchInput.value.trim().toLowerCase();

  elements.sections.querySelectorAll(".section").forEach((section) => {
    const matchesCategory =
      state.currentCategory === "all" || section.dataset.category === state.currentCategory;
    let matchingCards = 0;

    section.querySelectorAll(".card").forEach((card) => {
      const matchesKeyword = !keyword || card.dataset.search.includes(keyword);
      card.hidden = !matchesKeyword;
      if (matchesKeyword) matchingCards += 1;
    });

    section.hidden = !matchesCategory || (Boolean(keyword) && matchingCards === 0);
  });
}

function toggleSection(button) {
  const container = button.closest(".section").querySelector(".card-container");
  const icon = button.querySelector(".toggle-icon");
  const isExpanded = icon.dataset.state === "expanded";

  container.classList.toggle("collapsed", isExpanded);
  icon.src = isExpanded ? "svg/zhankai.svg" : "svg/shouqi.svg";
  icon.dataset.state = isExpanded ? "collapsed" : "expanded";
  button.setAttribute("aria-label", `${isExpanded ? "展开" : "收起"}${button.closest(".section").dataset.category}`);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  elements.themeIcon.src = theme === "dark" ? "svg/anhei.svg" : "svg/mingliang.svg";
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
}

function toggleLock() {
  if (!state.encryptedUnlocked) {
    showPasswordModal();
    return;
  }

  state.encryptedUnlocked = false;
  updateLockDisplay();
}

function updateLockDisplay() {
  const container = document.getElementById("locked-category");
  const icon = document.getElementById("lock-icon");
  const button = document.getElementById("lock-button");
  container.hidden = !state.encryptedUnlocked;
  icon.src = state.encryptedUnlocked ? "svg/jiemi.svg" : "svg/jiami.svg";
  icon.dataset.state = state.encryptedUnlocked ? "unlocked" : "locked";
  button.setAttribute("aria-label", state.encryptedUnlocked ? "锁定加密内容" : "解锁加密内容");
}

function showPasswordModal() {
  elements.passwordModal.style.display = "flex";
  elements.passwordInput.focus();
}

function hidePasswordModal() {
  elements.passwordModal.style.display = "none";
  elements.passwordInput.value = "";
}

function submitPassword() {
  if (elements.passwordInput.value !== CATEGORY_PASSWORD) {
    alert("密码不正确");
    elements.passwordInput.select();
    return;
  }

  state.encryptedUnlocked = true;
  updateLockDisplay();
  hidePasswordModal();
}

function bindTabDragging() {
  let pointerId = null;
  let startX = 0;
  let startScrollLeft = 0;
  let dragged = false;

  elements.tabs.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startScrollLeft = elements.tabs.scrollLeft;
    dragged = false;
  });

  elements.tabs.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId) return;
    const distance = event.clientX - startX;
    if (Math.abs(distance) < 4 && !dragged) return;

    dragged = true;
    elements.tabs.classList.add("is-dragging");
    elements.tabs.setPointerCapture(pointerId);
    elements.tabs.scrollLeft = startScrollLeft - distance;
  });

  const stopDragging = (event) => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    elements.tabs.classList.remove("is-dragging");
  };

  elements.tabs.addEventListener("pointerup", stopDragging);
  elements.tabs.addEventListener("pointercancel", stopDragging);
  elements.tabs.addEventListener(
    "click",
    (event) => {
      if (!dragged) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      dragged = false;
    },
    true,
  );
}

function bindEvents() {
  let layoutWidth = window.innerWidth;

  elements.searchInput.addEventListener("input", filterCards);
  elements.scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  elements.themeButton.addEventListener("click", toggleTheme);
  elements.cancelPasswordButton.addEventListener("click", hidePasswordModal);
  elements.submitPasswordButton.addEventListener("click", submitPassword);
  elements.passwordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") submitPassword();
  });
  elements.passwordModal.addEventListener("click", (event) => {
    if (event.target === elements.passwordModal) hidePasswordModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hidePasswordModal();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth === layoutWidth) return;
    layoutWidth = window.innerWidth;
    const activeTab = elements.tabs.querySelector(".tab.active");
    scrollTabHorizontally(activeTab, "auto");
    moveIndicator(activeTab);
  });
  bindTabDragging();
}

function initialize() {
  if (!Array.isArray(window.SITE_CATEGORIES)) {
    throw new Error("网站数据加载失败");
  }

  const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  applyTheme(preferredTheme);
  updateLocalTime();
  window.setInterval(updateLocalTime, 1000);
  renderNavigation();
  bindEvents();
}

initialize();
