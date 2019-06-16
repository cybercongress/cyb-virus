const axios = require('axios');
let $http = axios.create({});
$http.defaults.baseURL = 'https://geesome.galtproject.io:7722';

let cybFolderId;

const loginPromise = $http.post('/v1/login', { username: 'admin', password: 'admin' });
if (loginPromise && loginPromise.then) {
  loginPromise.then(response => {
    $http.defaults.headers['Authorization'] = 'Bearer ' + response.data.apiKey;

    $http
      .get(`/v1/user/file-catalog/`, {
        params: {
          parentItemId: null,
          type: 'folder',
          sortField: 'updatedAt',
          sortDir: 'desc',
          limit: 100,
          offset: 0,
        },
      })
      .then(response => {
        const cybFolder = _.find(response.data, { name: 'cyb' });
        if (cybFolder) {
          cybFolderId = cybFolder.id;
          console.log('cyb folder found', cybFolderId);
        } else {
          $http.post(`/v1/user/file-catalog/create-folder`, { parentItemId: null, name: 'cyb' }).then(response => {
            cybFolderId = response.data.id;
            console.log('cyb folder found', cybFolderId);
          });
        }
      });
  });
}

module.exports = {
  saveData(content, filename) {
    return new Promise((resolve, reject) => {
      $http
        .post('/v1/user/save-data', {
          content: content,
          folderId: cybFolderId,
          name: filename,
        })
        .then(response => {
          console.log('save-data', response.data);
          const contentIpfsHash = response.data.storageId;

          resolve(contentIpfsHash);
        });
    });
  },
};
