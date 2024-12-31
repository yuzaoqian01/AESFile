
/**
 * @description 文件分片
 * @param {File} file
 * @param {Number} chunkSize
 * @returns {Array<Blob>}
 */
export const splitFile = function  (file, chunkSize = 5*1024 * 1024) {
  const chunks = [];
  let currentPosition = 0;

  while (currentPosition < file.size) {
    const chunk = file.slice(currentPosition, currentPosition + chunkSize);
    chunks.push(chunk);
    currentPosition += chunkSize;
  }

  return chunks;
}

/**
 * @description 文件合并
 * @param {Array<Blob>} chunks
 * @param { String } type
 * @returns { Blob }
 */
export const mergeChunks = function (chunks, type) {
  if(!type) throw new Error("type is required!")
  return new Blob(chunks, { type });
}