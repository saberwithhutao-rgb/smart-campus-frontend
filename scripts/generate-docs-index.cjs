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

  // 提取标题
  const titleMatch = content.match(/^---\s*\ntitle:\s*(.+?)\s*\n/)
  const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '')

  index.push({
    title,
    path: `/docs/user-guides/${file}`,
    fileName: file
  })
}

fs.writeFileSync(outputPath, JSON.stringify(index, null, 2))
console.log(`✅ 生成完成！共 ${index.length} 个文档`)
