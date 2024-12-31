import fs from 'fs';
import { encryptFile, decryptFile } from './index.js';

async function test() {
    // 使用相同的密钥和IV
    const key = "MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE="; // Base64编码的32字节
    const iv = "MDEyMzQ1Njc4OTAxMjM0NQ=="; // Base64编码的16字节

    // 读取原始文件
    const file = new File([fs.readFileSync('test_compatibility.txt')], 'test_compatibility.txt', { type: 'text/plain' });

    try {
        // 加密文件
        console.log('Starting JS encryption...');
        const encryptResult = await encryptFile(file, {
            key: key,
            iv: iv,
            onProgress: (progress) => {
                console.log(`Encryption progress: ${progress}%`);
            }
        });

        // 保存加密后的文件
        fs.writeFileSync('js_encrypted_file.bin', Buffer.from(await encryptResult.blob.arrayBuffer()));
        console.log('JS encryption completed');

        // 解密Go版本加密的文件
        const goEncryptedData = fs.readFileSync('test_compatibility.encrypted.txt');
        const goEncryptedBlob = new Blob([goEncryptedData], { type: 'application/octet-stream' });

        console.log('Starting JS decryption of Go encrypted file...');
        const decryptResult = await decryptFile(goEncryptedBlob, {
            key: key,
            iv: iv,
            fileType: 'text/plain',
            onProgress: (progress) => {
                console.log(`Decryption progress: ${progress}%`);
            }
        });

        // 保存解密后的文件
        fs.writeFileSync('js_decrypted_from_go.txt', Buffer.from(await decryptResult.blob.arrayBuffer()));
        console.log('JS decryption of Go encrypted file completed');

    } catch (error) {
        console.error('Error:', error);
    }
}

test();