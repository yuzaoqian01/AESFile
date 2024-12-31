import { createAESKey, ArrayBufferToWordArray, blobToArrayBuffer, encryptFile } from "./utils/util.js";
import { splitFile, mergeChunks } from './utils/fileUtils.js';

/**
 * 验证文件是否有效
 * @param {File} file - 文件对象
 * @throws {Error} 如果文件无效则抛出错误
 */
const validateFile = (file) => {
  if (!file) throw new Error('文件不能为空');
  if (file.size === 0) throw new Error('文件大小不能为0');
  if (file.size > 1024 * 1024 * 1024) throw new Error('文件大小不能超过1GB');
};

/**
 * 文件加密处理函数
 * @param {File} file - 文件对象
 * @param {Object} options - 配置对象
 * @param {string} options.key - 加密密钥
 * @param {string} options.iv - 初始化向量
 * @param {Function} [options.onProgress] - 进度回调函数
 * @returns {Promise<{encryptedBlob: Blob, originalName: string, originalType: string, size: number}>}
 * @throws {Error} 加密过程中的错误
 */
export const encryptFileChunks = async (file, options = {
  key: "",
  iv: "",
  onProgress: null
}) => {
  try {
    // 验证文件
    validateFile(file);

    const { key, iv, onProgress } = options;
    if (!key || !iv) {
      throw new Error('密钥和初始化向量不能为空');
    }

    // 将文件分片并转换为 ArrayBuffer
    const chunks = splitFile(file);
    const totalChunks = chunks.length;

    const arrayBufferChunks = await Promise.all(
      chunks.map(async (chunk, index) => {
        const buffer = await blobToArrayBuffer(chunk);
        if (onProgress) {
          onProgress((index + 1) / totalChunks * 50); // 前50%进度用于文件转换
        }
        return buffer;
      })
    );

    // 转换为 WordArray 格式后进行加密
    const wordBufferChunks = arrayBufferChunks.map(ArrayBufferToWordArray);
    const AES = createAESKey(key, iv);

    const encDataChunks = await Promise.all(
      wordBufferChunks.map(async (wordBuffer, index) => {
        const encData = encryptFile(wordBuffer, AES.key, AES.iv);
        if (onProgress) {
          onProgress(50 + (index + 1) / totalChunks * 50); // 后50%进度用于加密
        }
        return encData;
      })
    );

    // 将加密数据转为 Blob 并合并
    const fileBlobChunks = encDataChunks.map((encDataChunk) =>
      new Blob([encDataChunk], { type: file.type })
    );

    const encryptedBlob = mergeChunks(fileBlobChunks, file.type);

    return {
      encryptedBlob,
      originalType: file.type,
      originalName: file.name,
      size: encryptedBlob.size
    };
  } catch (error) {
    console.error('文件加密失败:', error);
    throw new Error(`文件加密失败: ${error.message}`);
  }
};
