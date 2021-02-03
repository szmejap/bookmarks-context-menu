const TICKDICT_PARENT_MENU_ID = "tickdict-menu";
const EXTENSION_NAME = "Context Bookmarks";
const DEFAULT_MAIN_BOOKMARK_FOLDER_NAME = "Context Bookmarks";
const DEFAULT_REGEX = "%s";

var urlSubstitutionRegexp = new RegExp(DEFAULT_REGEX, "g");
var mainFolderName = DEFAULT_MAIN_BOOKMARK_FOLDER_NAME;
var registeredMenuListeners = [];

refreshMenuItems();

function onCreated(menuItemId) {
  if (browser.runtime.lastError) {
    console.log(
      `Error when creating menu item ${menuItemId}: ${browser.runtime.lastError}`
    );
  }
  // else {
  //   console.log(`Menu item ${menuItemId} created successfully`);
  // }
}

function onRemoved() {
  // console.log("Item removed successfully");
}

function onError(error) {
  console.log(`Error: ${error}`);
}

function createMenuItemsFromBookmarks() {
  browser.menus.create(
    {
      id: TICKDICT_PARENT_MENU_ID,
      // title: "Search" + " '%s'",
      title: browser.i18n.getMessage("Search") + ' "%s"',
      contexts: ["selection"],
    },
    () => onCreated(TICKDICT_PARENT_MENU_ID)
  );

  let bookmarkResultsPromise = browser.bookmarks.search({
    title: mainFolderName,
  });
  bookmarkResultsPromise.then(onFoundMainBookmarkFolder, onError);
}

function onFoundMainBookmarkFolder(bookmarkItems) {
  if (bookmarkItems.length > 0) {
    bi = bookmarkItems[0]; // Use only the first found matching folder
    if (bi.type === "folder") {
      browser.bookmarks
        .getSubTree(bi.id)
        .then(
          (subtree) => onFolderSubtree(subtree, TICKDICT_PARENT_MENU_ID),
          onError
        );
    }
  } else {
    let listener = function (info, tab) {
      if (info.menuItemId === TICKDICT_PARENT_MENU_ID) {
        // window.alert("No folder");
        browser.notifications.create(
          (options = {
            type: "basic",
            title: browser.i18n.getMessage("folderNotFoundTitle", EXTENSION_NAME),
            iconUrl: "icon96.png",
            message: browser.i18n.getMessage("folderNotFoundMessage", mainFolderName),
          })
        );
      }
    };
    browser.menus.onClicked.addListener(listener);
    registeredMenuListeners.push(listener);
  }
}

function onFolderSubtree(subTree, parentId) {
  if (subTree.length > 0) {
    // This API is weird and always returns an array with at most 1 item.
    actualTree = subTree[0];
    let i = 0;
    if (actualTree.children.length === 0) {
      let listener = function (info, tab) {
        if (info.menuItemId === TICKDICT_PARENT_MENU_ID) {
          browser.notifications.create(
            (options = {
              type: "basic",
              title: `${EXTENSION_NAME} ERROR!`,
              title: browser.i18n.getMessage("childrenNotFoundTitle", EXTENSION_NAME),
              iconUrl: "icon96.png",
              message: browser.i18n.getMessage("childrenNotFoundMessage", mainFolderName),
            })
          );
        }
      };
      browser.menus.onClicked.addListener(listener);
      registeredMenuListeners.push(listener);
    }
    for (child of actualTree.children) {
      // Create new id from the id of the parent
      i++;
      let newMenuItemId = `${parentId}-${i}`;
      browser.menus.create(
        {
          id: newMenuItemId,
          title: child.title,
          parentId: parentId,
          contexts: ["selection"],
        },
        () => onCreated(newMenuItemId)
      );

      if (child.type === "bookmark") {
        // Call an URL link on clicking the menu item
        let url = child.url;
        let listener = function (info, tab) {
          if (info.menuItemId === newMenuItemId) {
            let newUrl = url.replace(urlSubstitutionRegexp, info.selectionText);
            // browser.tabs.create({ url: newUrl });

            // Create a new tab at the index of current tab + 1
            function newTabNext(tabs) {
              let newTab = { url: newUrl };
              if (tabs.length > 0) {
                newTab.index = tabs[0].index + 1;
              }
              browser.tabs.create(newTab);
            }

            browser.tabs.query({ active: true }).then(newTabNext, onError);
          }
        };
        browser.menus.onClicked.addListener(listener);
        registeredMenuListeners.push(listener);
      } else if (child.type === "folder") {
        // Create a new menu item group
        browser.bookmarks
          .getSubTree(child.id)
          .then((subtree) => onFolderSubtree(subtree, newMenuItemId), onError);
      }
    }
  }
}

async function recreateAllDefaultSettingsFromStorage() {
  let folderNameObj = await recreateDefaultSettingFromStorage(
    "folderName",
    DEFAULT_MAIN_BOOKMARK_FOLDER_NAME
  );
  let regexObj = await recreateDefaultSettingFromStorage(
    "regex",
    DEFAULT_REGEX
  );
  let settings = Object.assign(folderNameObj, regexObj);
  urlSubstitutionRegexp = new RegExp(settings.regex, "g");
  mainFolderName = settings.folderName;
  return settings;
}

async function recreateDefaultSettingFromStorage(storageKey, defaultValue) {
  let storageValue = defaultValue;
  try {
    storageValue = await browser.storage.sync.get(storageKey);
  } catch (e) {
    browser.storage.sync.set({ storageKey: defaultValue });
  }
  return storageValue;
}

// Remove and create all menu items again
async function refreshMenuItems() {
  let settings = await recreateAllDefaultSettingsFromStorage();
  // remove all registered menu listeners
  for (listener of registeredMenuListeners) {
    browser.menus.onClicked.removeListener(listener);
  }
  registeredMenuListeners = [];
  browser.menus.removeAll().then(createMenuItemsFromBookmarks);
}

// Recreate menu items if settings changed in the storage
function onStorageChange(changes, area) {
  if (area === "sync") {
    refreshMenuItems();
  }
}

browser.storage.onChanged.addListener(onStorageChange);

// Recreate menu items on any change in bookmarks
function handleBookmarksChange(id, info) {
  refreshMenuItems();
}
browser.bookmarks.onCreated.addListener(handleBookmarksChange);
browser.bookmarks.onRemoved.addListener(handleBookmarksChange);
browser.bookmarks.onChanged.addListener(handleBookmarksChange);
browser.bookmarks.onMoved.addListener(handleBookmarksChange);

// browser.bookmarks.onChildrenReordered.addListener(handleBookmarksChange); // Is this from an old API? It does not seem to work now

// browser.bookmarks.onImportEnded.addListener(refreshMenuItems); // onCreated events are fired anyway when importing, so this is not needed
