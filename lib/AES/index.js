import CryptoJS from 'crypto-js';
// AES加密
/**
 * AES加密函数
 * @param {String} message 要加密的消息
 * @param {String} secretKey 秘钥
 * @returns {String} 加密后的字符串
 */
export const encryptAES = function(message, secretKey) {
	const encrypted = CryptoJS.AES.encrypt(message, secretKey).toString();
	return encrypted;
}

// AES解密
/**
 * AES解密函数
 * @param {String} encrypted 加密后的字符串
 * @param {String} secretKey 秘钥
 * @returns {String} 解密后的消息
 */
export const decryptAES = function(encrypted, secretKey) {
	const decryptedBytes = CryptoJS.AES.decrypt(encrypted, secretKey);
	const decryptedMessage = decryptedBytes.toString(CryptoJS.enc.Utf8);
	return decryptedMessage;
}