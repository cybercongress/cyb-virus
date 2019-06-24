/*
 * Copyright ©️ 2018 Galt•Space Society Construction and Terraforming Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka),
 * [Dima Starodubcev](https://github.com/xhipster),
 * [Valery Litvin](https://github.com/litvintech) by
 * [Basic Agreement](http://cyb.ai/QmSAWEG5u5aSsUyMNYuX2A2Eaz4kEuoYWUkVBRdmu9qmct:ipfs)).
 * ​
 * Copyright ©️ 2018 Galt•Core Blockchain Company
 * (Founded by [Nikolai Popeka](https://github.com/npopeka) and
 * Galt•Space Society Construction and Terraforming Company by
 * [Basic Agreement](http://cyb.ai/QmaCiXUmSrP16Gz8Jdzq6AJESY1EAANmmwha15uR3c1bsS:ipfs)).
 */
import Helper from '@galtproject/frontend-core/services/helper';
import { Settings } from './types';

export {};

// require('indexeddbshim');

// global['window'] = global; // We'll allow ourselves to use `window.indexedDB` or `indexedDB` as a global
// setGlobalVars(); // See signature below

const Dexie = require('dexie');
let db;

const databaseService = {
  init() {
    db = new Dexie.default('CybExtensionDatabase');

    db.version(1).stores({
      content:
        '++id,contentHash,manifestHash,description,keywords,size,mimeType,previewHash,previewMimeType,iconHash,iconMimeType,view,extension,previewExtension,fullText,createdAt,updatedAt',
      settings: 'name,value',
    });
  },
  async saveContent(contentObj) {
    const existingContent = await this.getContentByHash(contentObj.contentHash);

    contentObj.fullText = (contentObj.description || (existingContent || {}).description || '').split(/[ ,.]+/);
    contentObj.fullText = contentObj.fullText.concat(contentObj.keywords || (existingContent || {}).keywords || []);
    contentObj.fullText = contentObj.fullText.filter(item => !item.match(/^[ ,.\-_/\\\(\)"'?]$/) && item != '');

    if (existingContent) {
      console.log('updateContentByHash', contentObj.contentHash, contentObj);
      return this.updateContentByHash(contentObj.contentHash, contentObj).then(() => this.getContentByHash(contentObj.contentHash));
    }
    contentObj.createdAt = Helper.now();
    contentObj.updatedAt = Helper.now();
    try {
      return this.getContentById(await db.content.add(contentObj));
    } catch (e) {
      console.error(e);
    }
  },
  async updateContentByHash(contentHash, updateData) {
    const content = await databaseService.getContentByHash(contentHash);
    if (!content || !content.id) {
      return;
    }
    updateData.updatedAt = Helper.now();
    return await db.content.update(content.id, updateData);
  },
  async getContentByHash(contentHash) {
    return db.content.where({ contentHash }).first();
  },
  async getContentById(id) {
    return db.content.get(id);
  },
  async getContentList(searchString) {
    let query;
    if (searchString) {
      query = db.content.where('description').startsWithIgnoreCase(searchString);
    } else {
      query = db.content;
    }
    return query
      .reverse()
      .limit(25)
      .distinct()
      .toArray();
  },

  async setSetting(settingName, value) {
    // try {
    if (await db.settings.get(settingName)) {
      return await db.settings.update(settingName, { value });
    } else {
      return await db.settings.add({ name: settingName, value });
    }
    // } catch(e) {
    //     console.error(e);
    // }
  },

  async getSetting(settingName) {
    const item = await db.settings.get(settingName);
    return item ? item.value : defaultSettingsValues[settingName];
  },
};

const defaultSettingsValues = {
  [Settings.StorageNodeAddress]: '/ip4/127.0.0.1/tcp/5001',
  [Settings.StorageNodeType]: 'ipfs',
};

module.exports = databaseService;
