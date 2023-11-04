const MENU_ID_PREFIX = 'search_elements_text_';

for (const e of document.getElementsByClassName('i18n')) {
  e.textContent = browser.i18n.getMessage(e.textContent);
}

const form = document.forms.config;

const saveOptions = () => {
  const ignores = [];
  const engineList = document.getElementById('engineList');
  for (const item of engineList.getElementsByTagName('INPUT')) {
    if (!item.checked) {
      ignores.push(item.value);
    }
  }
  browser.storage.local.set({
    ignores: ignores,
  });
};

const setupSettingsPage = async () => {
  const settings = await browser.storage.local.get() || { ignores: [] };
  const engineList = document.getElementById('engineList');
  const template = document.getElementsByClassName('engine')[0];
  const engines = await browser.search.get();
  for (const engine of engines) {
    const item = template.cloneNode(true);
    const chk = item.getElementsByTagName('INPUT')[0];
    chk.value = engine.name;
    if (!settings.ignores || !settings.ignores.includes(engine.name)) {
      chk.checked = true;
    }
    item.getElementsByTagName('IMG')[0].src = engine.favIconUrl;
    item.getElementsByTagName('SPAN')[0].textContent = engine.name;
    engineList.appendChild(item);
  }

  for (const i of document.getElementsByTagName('INPUT')) {
    i.addEventListener('input', saveOptions);
  }
}

document.addEventListener('DOMContentLoaded', setupSettingsPage);

