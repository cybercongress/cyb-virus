export enum Settings {
  StorageNodeType = 'storage-node-type',
  StorageNodeAddress = 'storage-node-address',
  StorageNodeKey = 'storage-node-key',
  StorageExtensionIpd = 'storage-extension-ipld',
  StorageExtensionIpdUpdatedAt = 'storage-extension-ipld-updated-at',
  StorageExtensionIpdError = 'storage-extension-ipld-error',
}

export function getSettingData(name) {
  if (name === Settings.StorageNodeType) {
    return {
      type: 'list',
      list: [
        {
          title: 'IPFS',
          value: 'ipfs',
        },
        {
          title: 'GeeSome',
          value: 'geesome',
        },
      ],
    };
  }
  if (name === Settings.StorageExtensionIpdUpdatedAt) {
    return {
      type: 'date',
    };
  }
  if (name === Settings.StorageExtensionIpd) {
    return {
      type: 'hash',
    };
  }

  return {
    type: 'string',
  };
}
