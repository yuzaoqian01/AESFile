import { createAESKey, ArrayBufferToWordArray, blobToArrayBuffer, decryptFile } from "./utils/util.js";
import { mergeChunks, splitFile } from './utils/fileUtils.js';

/**
 * 验证加密的Blob是否有效
 * @param {Blob} encryptedBlob - 加密的Blob对象
 * @throws {Error} 如果Blob无效则抛出错误
 */
const validateEncryptedBlob = (encryptedBlob) => {
  if (!encryptedBlob) throw new Error('加密数据不能为空');
  if (encryptedBlob.size === 0) throw new Error('加密数据大小不能为0');
};

/**
 * 文件解密处理函数
 * @param {Blob} encryptedBlob - 加密的文件 Blob
 * @param {Object} options - 配置对象
 * @param {string} options.key - 加密密钥
 * @param {string} options.iv - 初始化向量
 * @param {Function} [options.onProgress] - 进度回调函数
 * @param {string} fileType - 原文件类型
 * @returns {Promise<{decryptedBlob: Blob, success: boolean}>} - 解密后的文件 Blob 和状态
 * @throws {Error} 解密过程中的错误
 */
export const decryptFileChunks = async (encryptedBlob, options = {
  key: "",
  iv: "",
  onProgress: undefined
}, fileType) => {
  try {
    // 验证加密数据
    validateEncryptedBlob(encryptedBlob);

    const { key, iv, onProgress } = options;
    if (!key || !iv) {
      throw new Error('密钥和初始化向量不能为空');
    }
    if (!fileType) {
      throw new Error('需要提供原始文件类型');
    }

    // 将加密的 Blob 拆分为块
    const AES = createAESKey(key, iv);
    const chunks = splitFile(encryptedBlob);
    const totalChunks = chunks.length;

    // 逐块解密
    const decArrayBufferTasks = chunks.map(async (chunk, index) => {
      try {
        const arrayBuffer = await blobToArrayBuffer(chunk);
        const wordArray = ArrayBufferToWordArray(arrayBuffer);
        const decData = decryptFile(wordArray, AES.key, AES.iv);
        if (onProgress) {
          onProgress((index + 1) / totalChunks * 100);
        }
        return decData;
      } catch (error) {
        throw new Error(`块 ${index + 1} 解密失败: ${error.message}`);
      }
    });

    const decArrayBufferChunks = await Promise.all(decArrayBufferTasks);

    // 将解密后的数据块转换为 Blob 并合并
    const decBlobChunks = decArrayBufferChunks.map((decArrayBufferChunk) =>
      new Blob([decArrayBufferChunk], { type: fileType })
    );

    const decryptedBlob = mergeChunks(decBlobChunks, fileType);

    return {
      decryptedBlob,
      success: true
    };
  } catch (error) {
    console.error('文件解密失败:', error);
    throw new Error(`文件解密失败: ${error.message}`);
  }
};
