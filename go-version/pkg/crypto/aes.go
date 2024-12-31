package crypto

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"io"

	"github.com/pkg/errors"
)

// CryptoAES 结构体用于处理AES加密解密
type CryptoAES struct {
	key []byte
	iv  []byte
}

// NewCryptoAES 创建新的CryptoAES实例
func NewCryptoAES(key, iv string) (*CryptoAES, error) {
	keyBytes, err := base64.StdEncoding.DecodeString(key)
	if err != nil {
		return nil, errors.Wrap(err, "failed to decode key")
	}

	ivBytes, err := base64.StdEncoding.DecodeString(iv)
	if err != nil {
		return nil, errors.Wrap(err, "failed to decode iv")
	}

	if len(keyBytes) != 32 {
		return nil, errors.New("key must be 32 bytes (256 bits)")
	}
	if len(ivBytes) != 16 {
		return nil, errors.New("iv must be 16 bytes (128 bits)")
	}

	return &CryptoAES{
		key: keyBytes,
		iv:  ivBytes,
	}, nil
}

// GenerateKeyAndIV 生成随机的密钥和IV
func GenerateKeyAndIV() (key string, iv string, err error) {
	keyBytes := make([]byte, 32)
	ivBytes := make([]byte, 16)

	if _, err := io.ReadFull(rand.Reader, keyBytes); err != nil {
		return "", "", errors.Wrap(err, "failed to generate key")
	}
	if _, err := io.ReadFull(rand.Reader, ivBytes); err != nil {
		return "", "", errors.Wrap(err, "failed to generate iv")
	}

	key = base64.StdEncoding.EncodeToString(keyBytes)
	iv = base64.StdEncoding.EncodeToString(ivBytes)
	return key, iv, nil
}

// EncryptBytes 加密字节数据
func (c *CryptoAES) EncryptBytes(data []byte) ([]byte, error) {
	block, err := aes.NewCipher(c.key)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create cipher")
	}

	// 填充数据
	paddedData := pkcs7Padding(data, aes.BlockSize)
	ciphertext := make([]byte, len(paddedData))

	mode := cipher.NewCBCEncrypter(block, c.iv)
	mode.CryptBlocks(ciphertext, paddedData)

	return ciphertext, nil
}

// DecryptBytes 解密字节数据
func (c *CryptoAES) DecryptBytes(ciphertext []byte) ([]byte, error) {
	block, err := aes.NewCipher(c.key)
	if err != nil {
		return nil, errors.Wrap(err, "failed to create cipher")
	}

	if len(ciphertext)%aes.BlockSize != 0 {
		return nil, errors.New("ciphertext is not a multiple of the block size")
	}

	mode := cipher.NewCBCDecrypter(block, c.iv)
	plaintext := make([]byte, len(ciphertext))
	mode.CryptBlocks(plaintext, ciphertext)

	// 去除填充
	unpaddedData, err := pkcs7Unpadding(plaintext)
	if err != nil {
		return nil, errors.Wrap(err, "failed to unpad data")
	}

	return unpaddedData, nil
}

// EncryptString 加密字符串
func (c *CryptoAES) EncryptString(data string) (string, error) {
	encrypted, err := c.EncryptBytes([]byte(data))
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(encrypted), nil
}

// DecryptString 解密字符串
func (c *CryptoAES) DecryptString(encryptedStr string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(encryptedStr)
	if err != nil {
		return "", errors.Wrap(err, "failed to decode base64 string")
	}

	decrypted, err := c.DecryptBytes(data)
	if err != nil {
		return "", err
	}
	return string(decrypted), nil
}

// pkcs7Padding 添加PKCS7填充
func pkcs7Padding(data []byte, blockSize int) []byte {
	padding := blockSize - len(data)%blockSize
	padtext := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(data, padtext...)
}

// pkcs7Unpadding 移除PKCS7填充
func pkcs7Unpadding(data []byte) ([]byte, error) {
	length := len(data)
	if length == 0 {
		return nil, errors.New("empty data")
	}

	unpadding := int(data[length-1])
	if unpadding > length {
		return nil, errors.New("invalid padding size")
	}

	return data[:(length - unpadding)], nil
}