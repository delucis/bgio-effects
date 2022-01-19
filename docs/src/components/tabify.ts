// Script to enhance tabbed content based on Heydon Pickering’s Inclusive Components:
// https://inclusive-components.design/tabbed-interfaces/

const storageKey = 'preferredTab';

const getPreferredTab = () => {
  const preferredTab = localStorage.getItem(storageKey);
  return preferredTab ? parseInt(preferredTab, 10) : 0;
};

const storePreferredTab = (index: number) => {
  localStorage.setItem(storageKey, index.toString(10));
};

let count = 0;

const TabStore = [new Set<HTMLElement>(), new Set<HTMLElement>()] as const;
const PanelStore = [new Set<HTMLElement>(), new Set<HTMLElement>()] as const;

function tabify(tabbed: Element) {
  // Get relevant elements and collections
  const panels: NodeListOf<HTMLElement> =
    tabbed.querySelectorAll('[id^="section"]');
  const tablist = tabbed.querySelector('ul');
  const tabs = tablist.querySelectorAll('a');

  // The tab switching function
  const switchTab = (newTab: HTMLElement, index: number) => {
    const oldIndex = 1 - index;

    TabStore[oldIndex].forEach((oldTab) => {
      oldTab.removeAttribute('aria-selected');
      oldTab.setAttribute('tabindex', '-1');
    });
    TabStore[index].forEach((newTab) => {
      // Make the active tab focusable by the user (Tab key)
      newTab.removeAttribute('tabindex');
      // Set the selected state
      newTab.setAttribute('aria-selected', 'true');
    });

    PanelStore[oldIndex].forEach((oldPanel) => {
      oldPanel.hidden = true;
    });
    PanelStore[index].forEach((newPanel) => {
      newPanel.hidden = false;
    });

    newTab.focus();

    storePreferredTab(index);
  };

  // Add the tablist role to the first <ul> in the .tabbed container
  tablist.setAttribute('role', 'tablist');

  // Add semantics are remove user focusability for each tab
  Array.prototype.forEach.call(tabs, (tab: HTMLElement, i: number) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('id', 'tab' + count++);
    tab.setAttribute('tabindex', '-1');
    tab.parentNode.setAttribute('role', 'presentation');
    TabStore[i].add(tab);

    // Handle clicking of tabs for mouse users
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const currentTab: HTMLElement = tablist.querySelector('[aria-selected]');
      if (e.currentTarget !== currentTab) {
        switchTab(e.currentTarget, i);
      }
    });

    // Handle keydown events for keyboard users
    tab.addEventListener('keydown', (e) => {
      // Get the index of the current tab in the tabs node list
      const index: number = Array.prototype.indexOf.call(tabs, e.currentTarget);
      // Work out which key the user is pressing and
      // Calculate the new tab's index where appropriate
      const dir =
        e.key === 'ArrowLeft'
          ? index - 1
          : e.key === 'ArrowRight'
          ? index + 1
          : e.key === 'ArrowDown'
          ? 'down'
          : null;
      if (dir !== null) {
        e.preventDefault();
        // If the down key is pressed, move focus to the open panel,
        // otherwise switch to the adjacent tab
        dir === 'down'
          ? panels[i].focus()
          : tabs[dir]
          ? switchTab(tabs[dir], dir)
          : void 0;
      }
    });
  });

  // Add tab panel semantics and hide them all
  Array.prototype.forEach.call(panels, (panel: HTMLElement, i: number) => {
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('tabindex', '-1');
    panel.setAttribute('aria-labelledby', tabs[i].id);
    panel.hidden = true;
    PanelStore[i].add(panel);
  });

  // Initially activate the user’s preferred tab and reveal the preferred tab panel
  const idx = getPreferredTab();
  tabs[idx].removeAttribute('tabindex');
  tabs[idx].setAttribute('aria-selected', 'true');
  panels[idx].hidden = false;
}

const onLoad = () => {
  Array.prototype.forEach.call(document.querySelectorAll('.tabbed'), tabify);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onLoad);
} else {
  onLoad();
}
