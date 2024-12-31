import CryptoJS from 'crypto-js';

class CryptoAES {
  constructor(secretKey, secretIv) {
    this.AES = {
      key: CryptoJS.enc.Utf8.parse(secretKey),
      iv: CryptoJS.enc.Utf8.parse(secretIv),
    };
  }

  /**
   * buffer 转 ArrayBuffer
   * @param {Buffer} buffer
   * @returns {ArrayBuffer}
   */
  bufferToArrayBuffer(buffer) {
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const res = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; ++i) {
      res[i] = buffer[i];
    }
    return arrayBuffer;
  }

  /**
   * blob 转 ArrayBuffer
   * @param {Blob} blob
   * @returns {Promise<ArrayBuffer>}
   */
  blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
      const file = new FileReader();
      file.onload = () => resolve(file.result);
      file.onerror = reject;
      file.readAsArrayBuffer(blob);
    });
  }

  /**
   * ArrayBuffer 转 WordArray
   * @param {ArrayBuffer} arrayBuffer
   * @returns {CryptoJS.lib.WordArray}
   */
  arrayBufferToWordArray(arrayBuffer) {
    const u8 = new Uint8Array(arrayBuffer, 0, arrayBuffer.byteLength);
    const len = u8.length;
    const words = [];
    for (let i = 0; i < len; i += 1) {
      words[i >>> 2] |= (u8[i] & 0xff) << (24 - (i % 4) * 8);
    }
    return CryptoJS.lib.WordArray.create(words, len);
  }

  /**
   * WordArray 转 ArrayBuffer
   * @param {CryptoJS.lib.WordArray} wordArray
   * @returns {ArrayBuffer}
   */
  wordArrayToArrayBuffer(wordArray) {
    const { words, sigBytes } = wordArray;
    const u8 = new Uint8Array(sigBytes);
    for (let i = 0; i < sigBytes; i += 1) {
      u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return u8;
  }

  /**
   * 加密 WordArray
   * @param {CryptoJS.lib.WordArray} wordArray
   * @returns {ArrayBuffer}
   */
  encryptFile(wordArray) {
    const encrypt = CryptoJS.AES.encrypt(wordArray, this.AES.key, {
      iv: this.AES.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return this.wordArrayToArrayBuffer(encrypt.ciphertext);
  }

  /**
   * 解密 WordArray
   * @param {CryptoJS.lib.WordArray} wordArray
   * @returns {ArrayBuffer}
   */
  decryptFile(wordArray) {
    const decrypt = CryptoJS.AES.decrypt({ ciphertext: wordArray }, this.AES.key, {
      iv: this.AES.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return this.wordArrayToArrayBuffer(decrypt);
  }

  /**
   * 加密 Blob
   * @param {Blob} blob
   * @returns {Promise<ArrayBuffer>}
   */
  async encryptBlob(blob) {
    const arrayBuffer = await this.blobToArrayBuffer(blob);
    const wordArray = this.arrayBufferToWordArray(arrayBuffer);
    return this.encryptFile(wordArray);
  }

  /**
   * 解密 Blob
   * @param {Blob} blob
   * @returns {Promise<ArrayBuffer>}
   */
  async decryptBlob(blob) {
    const arrayBuffer = await this.blobToArrayBuffer(blob);
    const wordArray = this.arrayBufferToWordArray(arrayBuffer);
    return this.decryptFile(wordArray);
  }

  /**
   * 对字符串加密
   * @param {string|object} data
   * @returns {string}
   */
  encryptString(data) {
    if (typeof data === 'object') {
      data = JSON.stringify(data);
    }
    const srcs = CryptoJS.enc.Utf8.parse(data);
    const encrypted = CryptoJS.AES.encrypt(srcs, this.AES.key, {
      iv: this.AES.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
  }

  /**
   * 解密字符串
   * @param {string} data
   * @returns {string}
   */
  decryptString(data) {
    const base64 = CryptoJS.enc.Base64.parse(data);
    const srcs = CryptoJS.enc.Base64.stringify(base64);
    const decrypt = CryptoJS.AES.decrypt(srcs, this.AES.key, {
      iv: this.AES.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypt.toString(CryptoJS.enc.Utf8);
  }
}

export default CryptoAES;