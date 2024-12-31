import CryptoJS from 'crypto-js';

export const createAESKey = function (secret_key, secret_iv) {
  try {
    // Base64解码密钥和IV
    const keyBytes = Buffer.from(secret_key, 'base64').toString('binary');
    const ivBytes = Buffer.from(secret_iv, 'base64').toString('binary');

    // 验证长度
    if (keyBytes.length !== 32) {
      throw new Error('key must be 32 bytes (256 bits)');
    }
    if (ivBytes.length !== 16) {
      throw new Error('iv must be 16 bytes (128 bits)');
    }

    let AES = {
      key: CryptoJS.enc.Latin1.parse(keyBytes),
      iv: CryptoJS.enc.Latin1.parse(ivBytes)
    }
    return AES
  } catch (error) {
    throw new Error(`Failed to create AES key: ${error.message}`);
  }
}

export const blobToArrayBuffer = async function(blob) {
  return await blob.arrayBuffer();
}

export const ArrayBufferToWordArray = arrayBuffer => {
  const u8 = new Uint8Array(arrayBuffer);
  const len = u8.length;
  const words = [];
  for (let i = 0; i < len; i += 1) {
    words[i >>> 2] |= (u8[i] & 0xff) << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, len);
}

export const encryptFile = function (wordArray, key, iv) {
  const encrypt = CryptoJS.AES.encrypt(wordArray, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  const ciphertext = encrypt.ciphertext;
  const u8 = new Uint8Array(ciphertext.words.length * 4);
  for (let i = 0; i < ciphertext.words.length; i++) {
    const word = ciphertext.words[i];
    u8[i * 4] = (word >>> 24) & 0xff;
    u8[i * 4 + 1] = (word >>> 16) & 0xff;
    u8[i * 4 + 2] = (word >>> 8) & 0xff;
    u8[i * 4 + 3] = word & 0xff;
  }
  return u8.slice(0, ciphertext.sigBytes);
}

export const decryptFile = function(wordArray, key, iv) {
  const decrypt = CryptoJS.AES.decrypt({ ciphertext: wordArray }, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  const u8 = new Uint8Array(decrypt.words.length * 4);
  for (let i = 0; i < decrypt.words.length; i++) {
    const word = decrypt.words[i];
    u8[i * 4] = (word >>> 24) & 0xff;
    u8[i * 4 + 1] = (word >>> 16) & 0xff;
    u8[i * 4 + 2] = (word >>> 8) & 0xff;
    u8[i * 4 + 3] = word & 0xff;
  }
  return u8.slice(0, decrypt.sigBytes);
}