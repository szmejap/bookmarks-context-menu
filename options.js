const MAIN_BOOKMARK_FOLDER_HTML_ID = "#main-bookmarks-folder-name";
const REGEX_ID = "#substitute-regex";

function saveOptions(e) {
    e.preventDefault();
    browser.storage.sync.set({
      folderName: document.querySelector(MAIN_BOOKMARK_FOLDER_HTML_ID).value,
      regex:  document.querySelector(REGEX_ID).value
    });
    // console.log(`Setting options: ${document.querySelector(MAIN_BOOKMARK_FOLDER_HTML_ID).value}`)
  }
  
  function restoreOptions() {
  
    function setCurrentFolderName(result) {
      // document.querySelector(MAIN_BOOKMARK_FOLDER_HTML_ID).value = result.folderName || DEFAULT_MAIN_BOOKMARK_FOLDER_TITLE;
      document.querySelector(MAIN_BOOKMARK_FOLDER_HTML_ID).value = result.folderName;
    }
  
    function setCurrentRegex(result){
      // document.querySelector(REGEX_ID).value = result.folderName || DEFAULT_REGEX;
      document.querySelector(REGEX_ID).value = result.regex;
    }

    function onError(error) {
      console.log(`Error: ${error}`);
    }
  
    browser.storage.sync.get("folderName").then(setCurrentFolderName, onError);
    browser.storage.sync.get("regex").then(setCurrentRegex, onError);
  }
  
  document.addEventListener("DOMContentLoaded", restoreOptions);
  document.querySelector("#settings-form").addEventListener("submit", saveOptions);
  