const MAIN_BOOKMARK_FOLDER_HTML_ID = "#main-bookmarks-folder-name";
const REGEX_ID = "#substitute-regex";

// Storage API changed, so this is the easiest fix to preserve defaults
// WARNING: the defaults are also in the other file
const DEFAULT_MAIN_BOOKMARK_FOLDER_NAME = "Context Bookmarks";
const DEFAULT_REGEX = "%s";

function saveOptions(e) {
    e.preventDefault();
    browser.storage.sync.set({
      folderName: document.querySelector(MAIN_BOOKMARK_FOLDER_HTML_ID).value,
      regex:  document.querySelector(REGEX_ID).value
    });
  }
  
  function restoreOptions() {
  
    function setCurrentFolderName(result) {
      document.querySelector(MAIN_BOOKMARK_FOLDER_HTML_ID).value = result.folderName || DEFAULT_MAIN_BOOKMARK_FOLDER_NAME;
    }
  
    function setCurrentRegex(result){
      document.querySelector(REGEX_ID).value = result.regex || DEFAULT_REGEX;
    }

    function onError(error) {
      console.log(`Error: ${error}`);
    }
  
    browser.storage.sync.get("folderName").then(setCurrentFolderName, onError);
    browser.storage.sync.get("regex").then(setCurrentRegex, onError);
  }
  
  document.addEventListener("DOMContentLoaded", restoreOptions);
  document.querySelector("#settings-form").addEventListener("submit", saveOptions);
  