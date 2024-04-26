const MENU_ID_PREFIX = 'search_elements_text_';
const TITLE = browser.i18n.getMessage("extensionName");

browser.menus.create({
  id: MENU_ID_PREFIX,
  title: TITLE,
  documentUrlPatterns: ['https://*/*', 'http://*/*'],
  contexts: ['all'],
});

let defaultEngine = '';
let targetText = '';

const updateMenu = async (info, tab) => {
  const newMenus = [MENU_ID_PREFIX];
  targetText = await getText(info, tab);
  if (targetText) {
    // default
    await browser.menus.update(MENU_ID_PREFIX, {
      visible: true,
      title: `${TITLE}: "${trunc(targetText, 10)}"`
    });
  } else if (targetText === null) {
    // no host permission
    await browser.menus.update(MENU_ID_PREFIX, {
      visible: true,
      title: TITLE
    });
  } else {
    // no text content
    await browser.menus.update(MENU_ID_PREFIX, {
      visible: false,
      title: TITLE
    });
    return newMenus;
  }

  // get search engines
  const ignores = (await browser.storage.local.get()).ignores || [];
  const allEngines = await browser.search.get();
  const targetEngines = allEngines.filter(e => !ignores.includes(e.name));
  defaultEngine = allEngines.find(e => e.isDefault)?.name || '';

  // create submenus
  if (2 <= targetEngines.length)  {
    if (targetText === null) {
      await browser.menus.update(MENU_ID_PREFIX, { visible: false, });
    }
    for (const engine of targetEngines) {
      const id = MENU_ID_PREFIX + engine.name;
      newMenus.push(id);
      if (info.menuIds.includes(id)) continue;
      await browser.menus.create({
        id: id,
        title: engine.name,
        icons: { 32: engine.favIconUrl },
        documentUrlPatterns: ['https://*/*', 'http://*/*'],
        contexts: ['all'],
      });
    }
  }
  return newMenus;
};

const cleanupSubmenus = (info, newMenus) => {
  for (const id of info.menuIds.filter(a => !newMenus.includes(a))) {
    browser.menus.remove(id);
  }
};

// -------------------
// search!
browser.menus.onClicked.addListener(async (info, tab) => {
  if (!info.menuItemId.startsWith(MENU_ID_PREFIX)) return;
  const text = targetText || await getText(info, tab);
  if (!text) return;
  const engine = info.menuItemId.replace(MENU_ID_PREFIX, '');
  browser.search.search({ query: text, engine: engine || defaultEngine });
});

// -------------------
// get the target text
const getText = async (info, tab) => {
  if (!info.targetElementId) return null;
  const result = await browser.scripting.executeScript({
    target: { tabId: tab.id, },
    args: [info.targetElementId],
    func: (id) => {
      const e = browser.menus.getTargetElement(id);
      let text = '';
      switch (e.tagName) {
      case 'TEXTAREA':
      case 'INPUT':
        text = e.value || e.getAttribute('placeholder');
        break;
      case 'SELECT':
        text = e.options[e.selectedIndex].text;
        break;
      default:
        text = e.textContent || e.getAttribute('title') || e.getAttribute('alt');
      }
      return text;
    }
  });
  const text = result[0].result || '';
  const trimmed = text.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
  return trimmed;
};

const trunc = (str, n) => (n < str.length) ? str.slice(0, n - 3) + '...' : str;

// -------------------
// show menu
let lastMenuInstanceId = 0;
let nextMenuInstanceId = 1;

browser.menus.onShown.addListener(async (info, tab) => {
  let menuInstanceId = nextMenuInstanceId++;
  lastMenuInstanceId = menuInstanceId;
  const newMenus = await updateMenu(info, tab);
  cleanupSubmenus(info, newMenus);
  // must now perform the check
  if (menuInstanceId === lastMenuInstanceId) {
    browser.menus.refresh();
  }
});

browser.menus.onHidden.addListener(() => {
  lastMenuInstanceId = 0;
});

