const MENU_ID_PREFIX = 'search_elements_text_';

let defaultEngine = '';

const createMenu = async () => {
  // get target engines
  const ignores = (await browser.storage.local.get()).ignores || [];
  const engines = await browser.search.get();
  let count = 0;
  defaultEngine = '';
  for (const engine of engines) {
    if (!ignores.includes(engine.name)) {
      defaultEngine =  engine.name;
      count ++;
    }
  }

  // only one engine
  browser.menus.removeAll();
  if (count <= 1)  {
    browser.menus.create({
      id: MENU_ID_PREFIX,
      title: browser.i18n.getMessage("extensionName"),
      documentUrlPatterns: ['https://*/*', 'http://*/*'],
      contexts: ['all'],
    });
  }

  // show all engines in submenu
  for (const engine of engines) {
    if (ignores.includes(engine.name)) continue;
    browser.menus.create({
      id: MENU_ID_PREFIX + engine.name,
      title: engine.name,
      icons: {
        32: engine.favIconUrl
      },
      documentUrlPatterns: ['https://*/*', 'http://*/*'],
      contexts: ['all'],
    });
  }
};

browser.menus.onClicked.addListener(async (info, tab) => {
  if (!info.menuItemId.startsWith(MENU_ID_PREFIX)) return;
  const engine = info.menuItemId.replace(MENU_ID_PREFIX, '');
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
  if (!trimmed) return;
  browser.search.search({ query: trimmed, engine: engine || defaultEngine });
});

browser.menus.onShown.addListener(async () => {
  await createMenu();
  browser.menus.refresh();
});

