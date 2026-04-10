// scripts/generate-docs-index.mjs
import fs from 'fs'
import path from 'path'

// 配置路径
const docsDir = path.join(import.meta.dirname, '../public/docs/user-guides')
const outputPath = path.join(import.meta.dirname, '../public/docs-index.json')

const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'))

const index = []

for (const file of files) {
  const filePath = path.join(docsDir, file)
  const content = fs.readFileSync(filePath, 'utf-8')

  // 提取 title
  const titleMatch = content.match(/^---\s*\ntitle:\s*(.+?)\s*\n/)
  const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '')

  // 提取 tags（新增）
  let tags = []
  const tagsMatch = content.match(/^---\s*\ntags:\s*\n((?:[\s\S]*?))^(?=\w+:|---)/m)
  if (tagsMatch) {
    // 解析 YAML 数组格式：
    // tags:
    //   - 登录
    //   - 注册
    const tagLines = tagsMatch[1].match(/-\s*(.+)/g)
    if (tagLines) {
      tags = tagLines.map(line => line.replace(/^-\s*/, '').trim())
    }
  } else {
    // 也支持单行格式：tags: [登录, 注册] 或 tags: 登录,注册
    const singleLineMatch = content.match(/^---\s*\ntags:\s*\[?(.+?)\]?\s*\n/m)
    if (singleLineMatch) {
      tags = singleLineMatch[1]
        .split(/[,，]/)
        .map(t => t.trim().replace(/^['"]|['"]$/g, ''))
        .filter(t => t)
    }
  }

  index.push({
    title,
    path: `/docs/user-guides/${file}`,
    fileName: file,
    tags  // 新增字段
  })
}

fs.writeFileSync(outputPath, JSON.stringify(index, null, 2))
console.log(`✅ 生成完成！共 ${index.length} 个文档`)
