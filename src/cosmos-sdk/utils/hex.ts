function hexToBytes(hex) {
  let bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}

function bytesToHex(bytes) {
  const hex = [];

  for (let i = 0; i < bytes.length; i++) {
    hex.push((bytes[i] >>> 4).toString(16));
    hex.push((bytes[i] & 0xf).toString(16));
  }
  return hex.join('').toUpperCase();
}

function stringToHex(str) {
  const bytes = [];

  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i).toString(16));
  }
  return bytes.join('');
}

function arrToHex(arr, hasPrefix = true) {
  let hex = arr
    .map(e => {
      return ('00' + (e & 0xff).toString(16)).slice(-2);
    })
    .join('');
  if (hasPrefix) return '0x'.concat(hex);
  return hex;
}

function hexToArr(hex, hasPrefix = true) {
  if (hasPrefix) {
    hex = hex.slice(2);
  }

  return hexToBytes(hex);
}

function isHex(str) {
  str = str.replace('0x', '');
  return /^[0-9a-fA-F]*$/i.test(str);
}

module.exports = {
  hexToBytes,
  bytesToHex,
  stringToHex,
  isHex,
  arrToHex,
  hexToArr,
};
