import { encryptFileChunks } from './encryptFile.js';
import { decryptFileChunks } from './decryptFile.js';

/**
 * 生成随机密钥和IV
 * @returns {{key: string, iv: string}} 生成的密钥和IV
 */
export const generateKeyAndIV = () => {
  // 生成随机字节
  const keyBytes = crypto.getRandomValues(new Uint8Array(32));
  const ivBytes = crypto.getRandomValues(new Uint8Array(16));

  // 转换为Base64
  const key = btoa(String.fromCharCode.apply(null, keyBytes));
  const iv = btoa(String.fromCharCode.apply(null, ivBytes));

  return { key, iv };
};

/**
 * 文件加密处理函数
 * @param {File} file - 文件对象
 * @param {Object} options - 配置对象
 * @param {string} options.key - 加密密钥
 * @param {string} options.iv - 初始化向量
 * @param {Function} [options.onProgress] - 进度回调函数
 * @param {Function} [options.onComplete] - 完成回调函数
 * @returns {Promise<{url: string, blob: Blob, metadata: Object}>}
 */
export const encryptFile = async (file, options) => {
  try {
    const result = await encryptFileChunks(file, options);
    const url = URL.createObjectURL(result.encryptedBlob);

    if (options.onComplete) {
      options.onComplete({
        success: true,
        url,
        metadata: {
          originalName: result.originalName,
          originalType: result.originalType,
          size: result.size
        }
      });
    }

    return {
      url,
      blob: result.encryptedBlob,
      metadata: {
        originalName: result.originalName,
        originalType: result.originalType,
        size: result.size
      }
    };
  } catch (error) {
    if (options.onComplete) {
      options.onComplete({
        success: false,
        error: error.message
      });
    }
    throw error;
  }
};

/**
 * 文件解密处理函数
 * @param {Blob} encryptedBlob - 加密的文件Blob
 * @param {Object} options - 配置对象
 * @param {string} options.key - 解密密钥
 * @param {string} options.iv - 初始化向量
 * @param {string} options.fileType - 原始文件类型
 * @param {Function} [options.onProgress] - 进度回调函数
 * @param {Function} [options.onComplete] - 完成回调函数
 * @returns {Promise<{url: string, blob: Blob}>}
 */
export const decryptFile = async (encryptedBlob, options) => {
  try {
    const result = await decryptFileChunks(encryptedBlob, {
      key: options.key,
      iv: options.iv,
      onProgress: options.onProgress
    }, options.fileType);

    const url = URL.createObjectURL(result.decryptedBlob);

    if (options.onComplete) {
      options.onComplete({
        success: true,
        url
      });
    }

    return {
      url,
      blob: result.decryptedBlob
    };
  } catch (error) {
    if (options.onComplete) {
      options.onComplete({
        success: false,
        error: error.message
      });
    }
    throw error;
  }
};

export default {
  encryptFile,
  decryptFile,
  generateKeyAndIV
};
