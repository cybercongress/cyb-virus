export enum Settings {
  StorageCyberAddress = 'storage-cyber-address',
  StorageNodeAddress = 'storage-node-address',
  StorageNodeKey = 'storage-node-key',
  StorageExtensionIpld = 'storage-extension-ipld',
  StorageExtensionIpldUpdatedAt = 'storage-extension-ipld-updated-at',
  StorageExtensionIpnsUpdatedAt = 'storage-extension-ipns-updated-at',
  StorageExtensionIpldError = 'storage-extension-ipld-error',
}

export function getSettingData(name) {
  if (name === Settings.StorageExtensionIpldUpdatedAt || name === Settings.StorageExtensionIpnsUpdatedAt) {
    return {
      type: 'date',
    };
  }
  if (name === Settings.StorageExtensionIpld) {
    return {
      type: 'hash',
    };
  }
  return {
    type: 'string',
  };
}
