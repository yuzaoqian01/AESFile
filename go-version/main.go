package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/encrypy-file/pkg/crypto"
	"github.com/encrypy-file/pkg/utils"
)

func main() {
	// 命令行参数
	mode := flag.String("mode", "", "操作模式: encrypt/decrypt")
	inputFile := flag.String("input", "", "输入文件路径")
	outputFile := flag.String("output", "", "输出文件路径")
	key := flag.String("key", "", "加密密钥 (可选，如果不提供将自动生成)")
	iv := flag.String("iv", "", "初始化向量 (可选，如果不提供将自动生成)")
	flag.Parse()

	// 验证必要参数
	if *mode == "" || *inputFile == "" {
		flag.Usage()
		os.Exit(1)
	}

	// 如果未提供输出文件路径，则自动生成
	if *outputFile == "" {
		ext := filepath.Ext(*inputFile)
		base := strings.TrimSuffix(*inputFile, ext)
		if *mode == "encrypt" {
			*outputFile = base + ".encrypted" + ext
		} else {
			*outputFile = base + ".decrypted" + ext
		}
	}

	// 如果未提供密钥和IV，则生成新的
	var err error
	if *key == "" || *iv == "" {
		*key, *iv, err = crypto.GenerateKeyAndIV()
		if err != nil {
			log.Fatalf("生成密钥失败: %v", err)
		}
		fmt.Printf("生成的密钥: %s\n", *key)
		fmt.Printf("生成的IV: %s\n", *iv)
	}

	// 创建加密器
	cryptoAES, err := crypto.NewCryptoAES(*key, *iv)
	if err != nil {
		log.Fatalf("创建加密器失败: %v", err)
	}

	// 根据模式执行操作
	switch *mode {
	case "encrypt":
		err = encryptFile(cryptoAES, *inputFile, *outputFile)
	case "decrypt":
		err = decryptFile(cryptoAES, *inputFile, *outputFile)
	default:
		log.Fatalf("无效的操作模式: %s", *mode)
	}

	if err != nil {
		log.Fatalf("操作失败: %v", err)
	}

	fmt.Println("操作完成!")
}

func encryptFile(cryptoAES *crypto.CryptoAES, inputPath, outputPath string) error {
	fmt.Printf("正在读取文件: %s\n", inputPath)

	// 读取并分片文件
	chunks, err := utils.SplitFile(inputPath, utils.DefaultChunkSize)
	if err != nil {
		return fmt.Errorf("分片文件失败: %v", err)
	}

	fmt.Printf("文件已分片，共 %d 个分片\n", len(chunks))

	// 加密每个分片
	encryptedChunks := make([]utils.FileChunk, len(chunks))
	for i, chunk := range chunks {
		fmt.Printf("正在加密分片 %d/%d...\n", i+1, len(chunks))
		encryptedData, err := cryptoAES.EncryptBytes(chunk.Data)
		if err != nil {
			return fmt.Errorf("加密分片 %d 失败: %v", i, err)
		}
		encryptedChunks[i] = utils.FileChunk{
			Data: encryptedData,
			Size: len(encryptedData),
		}
	}

	fmt.Printf("正在写入加密文件: %s\n", outputPath)
	// 合并加密后的分片
	if err := utils.MergeChunks(encryptedChunks, outputPath); err != nil {
		return fmt.Errorf("合并加密分片失败: %v", err)
	}

	fmt.Printf("加密完成，输出文件: %s\n", outputPath)
	return nil
}

func decryptFile(cryptoAES *crypto.CryptoAES, inputPath, outputPath string) error {
	// 读取并分片加密文件
	chunks, err := utils.SplitFile(inputPath, utils.DefaultChunkSize)
	if err != nil {
		return fmt.Errorf("分片文件失败: %v", err)
	}

	// 解密每个分片
	decryptedChunks := make([]utils.FileChunk, len(chunks))
	for i, chunk := range chunks {
		decryptedData, err := cryptoAES.DecryptBytes(chunk.Data)
		if err != nil {
			return fmt.Errorf("解密分片 %d 失败: %v", i, err)
		}
		decryptedChunks[i] = utils.FileChunk{
			Data: decryptedData,
			Size: len(decryptedData),
		}
		fmt.Printf("已解密分片 %d/%d\n", i+1, len(chunks))
	}

	// 合并解密后的分片
	if err := utils.MergeChunks(decryptedChunks, outputPath); err != nil {
		return fmt.Errorf("合并解密分片失败: %v", err)
	}

	return nil
}