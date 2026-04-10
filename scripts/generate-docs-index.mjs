// scripts/generate-docs-index.mjs
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const docsDir = path.join(__dirname, '../public/docs/user-guides')
const outputPath = path.join(__dirname, '../public/docs-index.json')

if (!fs.existsSync(docsDir)) {
  console.error(`❌ 目录不存在: ${docsDir}`)
  process.exit(1)
}

const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'))

if (files.length === 0) {
  console.warn(`⚠️ 没有找到 .md 文件: ${docsDir}`)
}

// 解析 YAML frontmatter 中的 tags
function extractTags(content) {
  // 匹配 frontmatter 块（--- 开头，下一个 --- 结束）
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/)
  if (!frontmatterMatch) return []

  const frontmatter = frontmatterMatch[1]

  // 查找 tags: 所在行及其后续内容
  const tagsMatch = frontmatter.match(/^tags:\s*$/m)
  if (!tagsMatch) return []

  // 获取 tags: 后面的行
  const lines = frontmatter.split(/\r?\n/)
  let tagsStartIndex = -1

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^tags:\s*$/)) {
      tagsStartIndex = i
      break
    }
  }

  if (tagsStartIndex === -1) return []

  // 收集后面的 - xxx 行
  const tags = []
  for (let i = tagsStartIndex + 1; i < lines.length; i++) {
    const line = lines[i]
    // 匹配以空格开头的 - xxx 格式
    const match = line.match(/^\s+-\s+(.+)$/)
    if (match) {
      tags.push(match[1].trim())
    } else {
      // 如果遇到非 tags 行（比如空行或其他字段），停止
      if (line.trim() !== '' && !line.match(/^\s/)) {
        break
      }
    }
  }

  return tags
}

const index = []

for (const file of files) {
  const filePath = path.join(docsDir, file)
  const content = fs.readFileSync(filePath, 'utf-8')

  // 提取 title
  const titleMatch = content.match(/^---\s*\ntitle:\s*(.+?)\s*\n/)
  const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '')

  // 提取 tags（使用新方法）
  const tags = extractTags(content)

  index.push({
    title,
    path: `/docs/user-guides/${file}`,
    fileName: file,
    tags,
  })
}

fs.writeFileSync(outputPath, JSON.stringify(index, null, 2))
console.log(`✅ 生成完成！共 ${index.length} 个文档`)
console.log(`📁 输出路径: ${outputPath}`)
console.log(`\n📝 有 tags 的文档预览:`)
const hasTags = index.filter((doc) => doc.tags && doc.tags.length > 0)
if (hasTags.length > 0) {
  hasTags.forEach((doc) => {
    console.log(`   ✅ ${doc.title}: [${doc.tags.join(', ')}]`)
  })
} else {
  console.log(`   ⚠️ 没有找到任何包含 tags 的文档`)
  console.log(`\n🔍 调试：检查第一个文件的前几行`)
  if (files[0]) {
    const firstFilePath = path.join(docsDir, files[0])
    const firstContent = fs.readFileSync(firstFilePath, 'utf-8')
    console.log(firstContent.split('\n').slice(0, 15).join('\n'))
  }
}
