export enum Settings {
  StorageNodeType = 'storage-node-type',
  StorageNodeAddress = 'storage-node-address',
  StorageNodeKey = 'storage-node-key',
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

  return {
    type: 'string',
  };
}
