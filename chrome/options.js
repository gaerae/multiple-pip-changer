// Copyright 2020 gaerae.com
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Saves options to chrome.storage
function save_options() {
  let delayTime = document.getElementById('delayTime').value;
  let pipNotMultiple = document.getElementById('pipNotMultiple').checked;
  chrome.storage.sync.set({
    delayTime: delayTime,
    pipNotMultiple: pipNotMultiple
  }, () => {
    // Update status to let user know options were saved.
    let status = document.getElementById('optSaveStatus');
    status.textContent = chrome.i18n.getMessage('optSaveStatus');
    setTimeout(() => {
      status.textContent = '';
    }, 750);
  })
}

// Restores select box and checkbox state using the preferences stored in chrome.storage.
function restore_options() {
  // Use default value.
  chrome.storage.sync.get({
    delayTime: 5,
    pipNotMultiple: false
  }, items => {
    document.getElementById('delayTime').value = items.delayTime;
    document.getElementById('pipNotMultiple').checked = items.pipNotMultiple;
  });
}

// Retrieves locale values from locale file.
document.getElementById('optDelayTimeDesc').innerText = chrome.i18n.getMessage('optDelayTimeDesc');
document.getElementById('optPipNotMultipleDesc').innerText = chrome.i18n.getMessage('optPipNotMultipleDesc');
document.getElementById('optSave').innerText = chrome.i18n.getMessage('optSave');

// DOM Events
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('optSave').addEventListener('click', save_options);
