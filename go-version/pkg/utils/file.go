package utils

import (
	"io"
	"os"
	"path/filepath"

	"github.com/pkg/errors"
)

const (
	// DefaultChunkSize 默认分片大小 (5MB)
	DefaultChunkSize = 5 * 1024 * 1024
)

// FileChunk 表示文件分片
type FileChunk struct {
	Data []byte
	Size int
}

// SplitFile 将文件分片
func SplitFile(filePath string, chunkSize int) ([]FileChunk, error) {
	if chunkSize <= 0 {
		chunkSize = DefaultChunkSize
	}

	file, err := os.Open(filePath)
	if err != nil {
		return nil, errors.Wrap(err, "failed to open file")
	}
	defer file.Close()

	_, err = file.Stat()
	if err != nil {
		return nil, errors.Wrap(err, "failed to get file info")
	}

	var chunks []FileChunk
	buffer := make([]byte, chunkSize)

	for {
		n, err := file.Read(buffer)
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, errors.Wrap(err, "failed to read file")
		}

		chunk := FileChunk{
			Data: make([]byte, n),
			Size: n,
		}
		copy(chunk.Data, buffer[:n])
		chunks = append(chunks, chunk)
	}

	return chunks, nil
}

// MergeChunks 合并文件分片
func MergeChunks(chunks []FileChunk, outputPath string) error {
	// 确保输出目录存在
	dir := filepath.Dir(outputPath)
	if dir != "." {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return errors.Wrap(err, "failed to create output directory")
		}
	}

	// 创建或覆盖输出文件
	file, err := os.OpenFile(outputPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return errors.Wrap(err, "failed to create output file")
	}
	defer file.Close()

	for _, chunk := range chunks {
		if _, err := file.Write(chunk.Data); err != nil {
			return errors.Wrap(err, "failed to write chunk")
		}
	}

	return nil
}

// GetFileInfo 获取文件信息
func GetFileInfo(filePath string) (string, int64, error) {
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return "", 0, errors.Wrap(err, "failed to get file info")
	}

	return filepath.Base(filePath), fileInfo.Size(), nil
}