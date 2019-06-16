/*
 * Copyright 2010-2019 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 *
 * This file is part of SingleFile.
 *
 *   The code in this file is free software: you can redistribute it and/or
 *   modify it under the terms of the GNU Affero General Public License
 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
 *   of the License, or (at your option) any later version.
 *
 *   The code in this file is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
 *   General Public License for more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you may
 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU
 *   AGPL normally required by section 4, provided you include this license
 *   notice and a URL through which recipients can access the Corresponding
 *   Source.
 */

/* global browser, singlefile, fetch, TextDecoder */

singlefile.extension.core.bg.business = (() => {
  let contentScript, frameScript, modulesScript;

  const contentScriptFiles = [
    '/singlefile/index.js',
    '/singlefile/content-hooks.js',
    '/singlefile/chrome-browser-polyfill.js',
    '/singlefile/css-tree.js',
    '/singlefile/html-srcset-parser.js',
    '/singlefile/single-file-util.js',
    '/singlefile/single-file-helper.js',
    '/singlefile/content-fetch-resources.js',
    '/singlefile/single-file-core.js',
    '/singlefile/single-file.js',
    '/singlefile/content-ui-main.js',
    '/singlefile/content-main.js',
  ];

  const frameScriptFiles = [
    '/singlefile/index.js',
    '/singlefile/content-hooks-frames.js',
    '/singlefile/chrome-browser-polyfill.js',
    '/singlefile/single-file-helper.js',
    '/singlefile/content-fetch-resources.js',
    '/singlefile/content-frame-tree.js',
  ];

  const modulesScriptFiles = [
    '/singlefile/html-minifier.js',
    '/singlefile/html-serializer.js',
    '/singlefile/css-minifier.js',
    '/singlefile/content-lazy-loader.js',
    '/singlefile/html-images-alt-minifier.js',
    '/singlefile/css-font-property-parser.js',
    '/singlefile/css-fonts-minifier.js',
    '/singlefile/css-fonts-alt-minifier.js',
    '/singlefile/css-matched-rules.js',
    '/singlefile/css-rules-minifier.js',
    '/singlefile/css-media-query-parser.js',
    '/singlefile/css-medias-alt-minifier.js',
  ];

  initScripts();

  const ERROR_CONNECTION_ERROR_CHROMIUM = 'Could not establish connection. Receiving end does not exist.';
  const ERROR_CONNECTION_LOST_CHROMIUM = 'The message port closed before a response was received.';
  const ERROR_CONNECTION_LOST_GECKO = 'Message manager disconnected';
  const INJECT_SCRIPTS_STEP = 1;
  const EXECUTE_SCRIPTS_STEP = 2;

  const pendingSaves = new Map();
  const currentSaves = new Map();
  let maxParallelWorkers;

  return { saveTab };

  async function saveTab(tab, options = {}) {
    console.log('saveTab', tab, options);
    const config = singlefile.extension.core.bg.config;
    const autosave = singlefile.extension.core.bg.autosave;
    const tabs = singlefile.extension.core.bg.tabs;
    const ui = singlefile.extension.ui.bg.main;
    maxParallelWorkers = (await config.get()).maxParallelWorkers;
    await initScripts();
    const tabId = tab.id;
    options.tabId = tabId;
    options.tabIndex = tab.index;
    try {
      if (options.autoSave) {
        const tabOptions = await config.getOptions(tab.url, true);
        if (autosave.isEnabled(tab)) {
          await requestSaveTab(tabId, 'content.autosave', tabOptions);
        }
      } else {
        ui.onStart(tabId, INJECT_SCRIPTS_STEP);
        const tabOptions = await config.getOptions(tab.url);
        Object.keys(options).forEach(key => (tabOptions[key] = options[key]));
        let scriptsInjected;
        if (!tabOptions.removeFrames) {
          try {
            await tabs.executeScript(tabId, { code: frameScript, allFrames: true, matchAboutBlank: true, runAt: 'document_start' });
          } catch (error) {
            // ignored
          }
        }
        try {
          await initScripts();
          await tabs.executeScript(tabId, { code: modulesScript + '\n' + contentScript, allFrames: false, runAt: 'document_idle' });
          scriptsInjected = true;
        } catch (error) {
          // ignored
        }
        if (scriptsInjected) {
          ui.onStart(tabId, EXECUTE_SCRIPTS_STEP);
          if (tabOptions.frameId) {
            await tabs.executeScript(tabId, {
              code: 'document.documentElement.dataset.requestedFrameId = true',
              frameId: tabOptions.frameId,
              matchAboutBlank: true,
              runAt: 'document_start',
            });
          }
          await requestSaveTab(tabId, 'content.save', tabOptions);
        } else {
          ui.onForbiddenDomain(tab);
        }
      }
    } catch (error) {
      if (
        error &&
        (!error.message || (error.message != ERROR_CONNECTION_LOST_CHROMIUM && error.message != ERROR_CONNECTION_ERROR_CHROMIUM && error.message != ERROR_CONNECTION_LOST_GECKO))
      ) {
        console.log(error); // eslint-disable-line no-console
        ui.onError(tabId);
      }
    }
  }

  function requestSaveTab(tabId, method, options) {
    return new Promise((resolve, reject) => requestSaveTab(tabId, method, options, resolve, reject));

    async function requestSaveTab(tabId, method, options, resolve, reject) {
      if (currentSaves.size < maxParallelWorkers) {
        currentSaves.set(tabId, { options, resolve, reject });
        try {
          await singlefile.extension.core.bg.tabs.sendMessage(tabId, { method, options });
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          currentSaves.delete(tabId);
          next();
        }
      } else {
        pendingSaves.set(tabId, { options, resolve, reject });
      }
    }

    function next() {
      if (pendingSaves.size) {
        const [tabId, { resolve, reject, options }] = Array.from(pendingSaves)[0];
        pendingSaves.delete(tabId);
        requestSaveTab(tabId, method, options, resolve, reject);
      }
    }
  }

  async function initScripts() {
    if (!contentScript && !frameScript && !modulesScript) {
      [contentScript, frameScript, modulesScript] = await Promise.all([getScript(contentScriptFiles), getScript(frameScriptFiles), getScript(modulesScriptFiles)]);
    }
  }

  async function getScript(scriptFiles) {
    const scriptsPromises = scriptFiles.map(async scriptFile => {
      if (typeof scriptFile == 'function') {
        return '(' + scriptFile.toString() + ')();';
      } else {
        const scriptResource = await fetch(browser.runtime.getURL(scriptFile));
        return new TextDecoder().decode(await scriptResource.arrayBuffer());
      }
    });
    let content = '';
    for (const scriptPromise of scriptsPromises) {
      content += await scriptPromise;
    }
    return content;
  }
})();
