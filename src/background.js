browser.menus.create({
  id: 'search_elements_text',
  title: browser.i18n.getMessage("Search Element's text"),
  documentUrlPatterns: ['https://*/*', 'http://*/*'],
  contexts: ['all'],
});

browser.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'search_elements_text') return;
  const result = await browser.tabs.executeScript(tab.id, {
    code: `
      (() => {
        const e = browser.menus.getTargetElement(${info.targetElementId});
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
      })();
    `
  });
  const text = result[0];
  if (!text) return;
  const trimmed = text.replace(/^\s+|\s$/g, '').reaplce(/\s+/g, ' ');
  if (!trimmed) return;
  browser.search.search({ query: trimmed });
});

