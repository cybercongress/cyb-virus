export enum Network {
  Geesome = 'geesome',
  CyberD = 'cyberd',
}

export class PermanentStorage {
  static pseudoStorage = {};

  static async setValue(name, value) {
    return new Promise((resolve, reject) => {
      if (!(global as any).chrome.storage) {
        this.pseudoStorage[name] = value;
        return resolve();
      }
      (global as any).chrome.storage.sync.set({ [name]: value }, function() {
        resolve();
      });
    });
  }

  static async getValue(name) {
    return new Promise((resolve, reject) => {
      if (!(global as any).chrome.storage) {
        return resolve(this.pseudoStorage[name]);
      }
      (global as any).chrome.storage.sync.get([name], function(result) {
        resolve(result[name]);
      });
    });
  }
}
