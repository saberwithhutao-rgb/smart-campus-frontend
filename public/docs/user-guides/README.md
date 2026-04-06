# 📚 智慧校园平台 - 用户使用指南

> 专为大学生编写的友好使用手册,教你如何使用平台的各项功能

## ✨ 特点说明

- ✅ **零技术术语**: 不出现任何代码、编程概念
- ✅ **操作步骤清晰**: 一步步告诉你点击哪里、输入什么
- ✅ **常见问题解答**: 包含使用过程中可能遇到的问题
- ✅ **语气友好亲切**: 像朋友在教你使用App
- ✅ **YAML Frontmatter**: 标准文档格式,便于管理和检索

## 📂 文档列表

### 🔐 账号管理
- [Login.md](./Login.md) - 登录功能使用指南
- [Register.md](./Register.md) - 注册账号使用指南
- [ForgotPassword.md](./ForgotPassword.md) - 找回密码使用指南

### 📚 学习工具
- [PersonalStudyPlan.md](./PersonalStudyPlan.md) - 个人学习计划使用指南
- [SmartReview.md](./SmartReview.md) - 智能复习系统使用指南
- [StudyData.md](./StudyData.md) - 学习数据分析使用指南

### 🏛️ 资源预约
- [LibraryReservation.md](./LibraryReservation.md) - 图书馆座位预约使用指南
- [SportsReservation.vue](./SportsReservation.md) - 体育设施预约使用指南

### 🎯 职业发展
- [CompetitionManagement.md](./CompetitionManagement.md) - 竞赛报名使用指南

### 💰 生活服务
- [SecondHandMarket.md](./SecondHandMarket.md) - 二手交易市场使用指南

### 🤖 智能助手
- [SmartQa.md](./SmartQa.md) - 智能问答AI助手使用指南

### 👤 个人中心
- [UserCenter.md](./UserCenter.md) - 个人中心使用指南
- [ProfileEdit.md](./ProfileEdit.md) - 编辑个人资料使用指南
- [Settings.md](./Settings.md) - 系统设置使用指南

## 🎯 快速开始

### 新用户入门路径

1. **注册账号** → 阅读 [Register.md](./Register.md)
2. **首次登录** → 阅读 [Login.md](./Login.md)
3. **完善资料** → 阅读 [ProfileEdit.md](./ProfileEdit.md)
4. **探索功能** → 从首页开始,逐个了解各模块

### 常用功能速查

- 📖 **想预约图书馆座位?** → [LibraryReservation.md](./LibraryReservation.md)
- 📝 **想制定学习计划?** → [PersonalStudyPlan.md](./PersonalStudyPlan.md)
- 🧠 **想高效复习?** → [SmartReview.md](./SmartReview.md)
- 🏆 **想参加竞赛?** → [CompetitionManagement.md](./CompetitionManagement.md)
- 🛒 **想买二手物品?** → [SecondHandMarket.md](./SecondHandMarket.md)
- 🤖 **有问题想问AI?** → [SmartQa.md](./SmartQa.md)

## 📖 文档结构示例

以登录功能为例,每个文档包含:

```markdown
---
title: 登录功能使用指南
description: 教你如何使用学号和密码登录智慧校园平台
category: views
difficulty: 初级
tags:
  - 登录
  - 账号密码
  - 验证码
lastUpdated: 2026-04-06
---

## 🔐 如何登录

1. 打开智慧校园平台,你会看到登录页面
2. 在「学号/用户名」输入框中,输入你的学号
3. ...

## ❌ 常见问题

### ❓ 提示"用户名或密码错误"?

请检查:
- 学号是否输入正确
- 密码是否正确
...
```

## 💡 使用建议

### 对于新生
建议按顺序阅读:
1. 账号管理(注册、登录、找回密码)
2. 个人中心(查看和编辑资料)
3. 主要功能(图书馆预约、学习计划等)

### 对于老用户
可以直接搜索你需要的功能指南,或收藏常用文档。

### 遇到问题时
1. 先查看对应的使用指南
2. 查看"常见问题"部分
3. 如果仍无法解决,联系学校信息中心

## 🎓 文档规范

所有文档遵循以下标准:

### Frontmatter字段
- `title`: 文档标题(中文)
- `description`: 简短描述
- `category`: 分类(views/components)
- `fileName`: 对应的Vue文件名
- `difficulty`: 难度等级(初级/中级/高级)
- `tags`: 相关标签数组
- `lastUpdated`: 最后更新日期

### 内容结构
- 📖 功能简介:用通俗语言说明这是什么
- 🎯 操作步骤: numbered list,一步步指导
- ❓ 常见问题:FAQ形式解答疑惑
- ⚠️ 注意事项:重要提醒和安全须知
- 💡 使用技巧:提升体验的小贴士

### 语言风格
- 使用第二人称"你",拉近距离
- 避免专业术语,用日常语言表达
- 多用emoji增加可读性
- 步骤清晰,逻辑连贯
- 语气友好,像朋友间的交流

## 🔄 更新维护

如需添加新功能的使用指南:

1. 在 `generate-user-guides.cjs` 中添加新功能的配置
2. 运行 `node generate-user-guides.cjs` 生成文档
3. 检查生成的文档是否符合要求
4. 提交到版本库

## 📝 与技术开发文档的区别

| 对比项 | 用户使用指南 | 技术开发文档 |
|--------|-------------|-------------|
| 目标读者 | 普通大学生用户 | 开发者、技术人员 |
| 内容重点 | 操作步骤、常见问题 | 代码实现、技术原理 |
| 语言风格 | 通俗易懂、友好亲切 | 专业准确、简洁明了 |
| 技术术语 | ❌ 完全不出现 | ✅ 大量使用 |
| 代码示例 | ❌ 没有任何代码 | ✅ 包含代码片段 |
| 使用场景 | 学习如何使用功能 | 学习和开发功能 |

## 🌟 特色亮点

1. **完全无代码**: 适合没有任何编程基础的用户
2. **问题导向**: 针对实际使用中会遇到的问题
3. **步骤详细**: 每一步都清楚说明操作位置
4. **视觉友好**: 大量使用emoji和格式化排版
5. **易于检索**: YAML frontmatter便于分类和搜索

## 📞 反馈与建议

如果你发现文档有问题或有改进建议:
- 指出具体哪个文档的哪部分内容
- 说明你遇到的实际问题
- 提出你的改进建议

我们会持续优化这些使用指南!

---

*希望这些指南能帮助你更好地使用智慧校园平台!* 🎉

**祝你大学生活充实而精彩!** ✨📚
