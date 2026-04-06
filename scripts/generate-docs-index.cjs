// scripts/generate-docs-index.cjs
const fs = require('fs')
const path = require('path')

// 配置路径
const docsDir = path.join(__dirname, '../public/docs/user-guides')
const outputPath = path.join(__dirname, '../public/docs-index.json')

// 确保目录存在
if (!fs.existsSync(docsDir)) {
  console.error(`错误: 目录不存在 ${docsDir}`)
  process.exit(1)
}

// 读取所有 md 文件
const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'))

// 提取 frontmatter 中的 title
const extractTitle = (content) => {
  const match = content.match(/^---\s*\ntitle:\s*(.+?)\s*\n/)
  return match ? match[1].trim() : null
}

// 从文件名提取关键词
const extractKeywordsFromFileName = (fileName) => {
  const name = fileName.replace('.md', '')
  // 按驼峰、下划线、连字符分割
  const words = name.split(/[-_]/)
  return words.filter((w) => w.length > 0)
}

// 构建索引
const index = []

for (const file of files) {
  const filePath = path.join(docsDir, file)
  const content = fs.readFileSync(filePath, 'utf-8')

  const title = extractTitle(content) || file.replace('.md', '')
  const fileNameKeywords = extractKeywordsFromFileName(file)

  // 关键词：标题 + 文件名拆解的词
  const keywords = [...new Set([title, ...fileNameKeywords])]

  index.push({
    title,
    keywords,
    path: `/docs/user-guides/${file}`,
    fileName: file,
  })
}

// 写入 JSON 文件
fs.writeFileSync(outputPath, JSON.stringify(index, null, 2))
