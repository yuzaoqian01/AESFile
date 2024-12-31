# File Encryption Tool

一个使用Go语言编写的文件加密工具，支持AES-256-CBC加密算法的文件加密和解密。

## 特性

- 使用AES-256-CBC加密算法
- 支持大文件处理（文件分片处理）
- 自动生成加密密钥和初始化向量（IV）
- 详细的进度显示
- 支持命令行操作
- 支持自定义输出文件名

## 安装

1. 确保已安装Go环境（要求Go 1.16或更高版本）

2. 克隆项目
```bash
git clone https://github.com/your-username/encrypy-file.git
cd encrypy-file
```

3. 安装依赖
```bash
go mod tidy
```

4. 编译项目
```bash
go build -o encrypy-file
```

## 使用方法

### 加密文件

基本用法：
```bash
./encrypy-file -mode encrypt -input <input-file>
```

例如：
```bash
./encrypy-file -mode encrypt -input test.txt
```

加密时会自动生成密钥和IV，请务必保存好这些信息，解密时会用到。

### 解密文件

基本用法：
```bash
./encrypy-file -mode decrypt -input <encrypted-file> -key <encryption-key> -iv <initialization-vector>
```

例如：
```bash
./encrypy-file -mode decrypt -input test.encrypted.txt -key "your-key" -iv "your-iv"
```

### 命令行参数

- `-mode`: 操作模式，可选值：`encrypt`（加密）或 `decrypt`（解密）
- `-input`: 输入文件路径
- `-output`: 输出文件路径（可选，默认会自动生成）
- `-key`: 加密密钥（可选，加密时如果不提供会自动生成）
- `-iv`: 初始化向量（可选，加密时如果不提供会自动生成）

### 输出文件命名规则

- 加密时：原文件名后添加`.encrypted`后缀
- 解密时：原文件名后添加`.decrypted`后缀

例如：
- `test.txt` -> `test.encrypted.txt`（加密后）
- `test.encrypted.txt` -> `test.encrypted.decrypted.txt`（解密后）

## 技术细节

- 使用AES-256-CBC加密算法
- 密钥长度：256位（32字节）
- IV长度：128位（16字节）
- 使用PKCS7填充
- 默认分片大小：5MB
- 所有加密操作都在内存中进行，保证数据安全

## 注意事项

1. 请务必保存好加密时生成的密钥和IV，这些信息在解密时是必需的
2. 程序会自动处理文件的分片，支持任意大小的文件
3. 建议在解密前备份加密的文件
4. 密钥和IV使用Base64编码格式

## 错误处理

程序会在遇到错误时提供详细的错误信息，常见的错误包括：
- 文件不存在
- 密钥或IV格式不正确
- 文件读写权限问题
- 内存不足

## 示例

1. 加密文件：
```bash
./encrypy-file -mode encrypt -input document.pdf
# 输出示例：
# 生成的密钥: AbC123...
# 生成的IV: XyZ789...
# 正在读取文件: document.pdf
# 文件已分片，共 X 个分片
# 正在加密分片 1/X...
# 加密完成，输出文件: document.encrypted.pdf
```

2. 解密文件：
```bash
./encrypy-file -mode decrypt -input document.encrypted.pdf -key "AbC123..." -iv "XyZ789..."
# 输出示例：
# 已解密分片 1/X
# 操作完成！
```

## 许可证

MIT License