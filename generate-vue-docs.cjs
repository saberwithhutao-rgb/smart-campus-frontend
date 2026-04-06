const fs = require('fs');
const path = require('path');

// Vue文件信息映射
const vueFilesInfo = {
  // Views
  'Home.vue': {
    title: '智慧校园首页',
    description: '平台的门户页面,展示核心功能入口和快捷导航',
    category: 'views',
    difficulty: '初级',
    tags: ['路由导航', '响应式布局', '动画效果'],
    features: [
      '展示平台主要功能模块入口',
      '智能问答AI助手快捷访问',
      '学习生活、竞赛管理等功能卡片',
      '响应式设计,支持移动端适配',
      '动态背景动画效果'
    ],
    techPoints: [
      '使用Vue Router进行页面跳转',
      '通过window.innerWidth检测屏幕尺寸实现响应式',
      'CSS动画实现浮动几何图形背景',
      'Element Plus组件库集成'
    ],
    learningPoints: [
      'Vue组合式API (setup语法糖)',
      '响应式数据ref的使用',
      '生命周期钩子onMounted',
      '事件监听器的添加与移除'
    ]
  },
  'Login.vue': {
    title: '用户登录页面',
    description: '提供学生账号密码登录、验证码验证等功能',
    category: 'views',
    difficulty: '中级',
    tags: ['表单验证', '身份认证', '状态管理'],
    features: [
      '用户名/密码登录',
      '图形验证码验证',
      '记住登录状态',
      '忘记密码链接',
      '注册账号入口',
      '登录错误提示'
    ],
    techPoints: [
      'Pinia Store管理用户登录状态',
      '表单双向数据绑定v-model',
      '异步登录请求处理',
      '本地存储Token管理',
      '路由守卫跳转'
    ],
    learningPoints: [
      '表单验证最佳实践',
      '异步/await处理API请求',
      '错误处理与用户反馈',
      '安全存储敏感信息'
    ]
  },
  'Register.vue': {
    title: '用户注册页面',
    description: '新用户注册账号,填写个人信息并完成验证',
    category: 'views',
    difficulty: '中级',
    tags: ['表单验证', '用户注册', '数据校验'],
    features: [
      '基本信息填写(学号、姓名等)',
      '密码强度检测',
      '邮箱/手机验证',
      '协议勾选确认',
      '注册成功跳转'
    ],
    techPoints: [
      '复杂表单字段验证',
      '正则表达式匹配',
      'API注册接口调用',
      '条件渲染显示不同步骤'
    ],
    learningPoints: [
      '表单验证规则设计',
      '用户体验优化(实时反馈)',
      '数据安全与隐私保护'
    ]
  },
  'ForgotPassword.vue': {
    title: '找回密码页面',
    description: '通过邮箱或手机号重置忘记的密码',
    category: 'views',
    difficulty: '中级',
    tags: ['密码重置', '邮件发送', '安全验证'],
    features: [
      '输入注册邮箱/手机号',
      '发送验证码',
      '验证码倒计时',
      '新密码设置',
      '密码确认验证'
    ],
    techPoints: [
      '验证码倒计时实现',
      '邮件/SMS发送接口集成',
      '多步骤表单流程',
      '安全性校验'
    ],
    learningPoints: [
      '倒计时器实现技巧',
      '安全防护措施',
      '用户引导流程设计'
    ]
  },
  'Logout.vue': {
    title: '退出登录页面',
    description: '安全退出当前账号,清除本地缓存',
    category: 'views',
    difficulty: '初级',
    tags: ['退出登录', '清理缓存', '路由跳转'],
    features: [
      '清除用户Token',
      '清空Pinia Store状态',
      '删除本地存储数据',
      '跳转到登录页'
    ],
    techPoints: [
      'Store状态重置',
      'localStorage清理',
      '路由重定向'
    ],
    learningPoints: [
      '安全退出的重要性',
      '数据清理最佳实践'
    ]
  },
  'LibraryReservation.vue': {
    title: '图书馆预约系统',
    description: '在线预约图书馆座位和楼层,查看预约记录',
    category: 'views',
    difficulty: '高级',
    tags: ['预约系统', '地图交互', '时间选择', '状态管理'],
    features: [
      '图书馆楼层平面图展示',
      '座位可视化选择',
      '时间段预约',
      '我的预约记录查询',
      '预约取消功能',
      '实时座位状态更新'
    ],
    techPoints: [
      'Canvas/SVG绘制座位图',
      '复杂的预约逻辑处理',
      'WebSocket实时更新(可选)',
      '日期时间选择器集成',
      '权限控制(仅本人可操作)'
    ],
    learningPoints: [
      '复杂业务逻辑实现',
      '图形化界面交互设计',
      '并发冲突处理',
      '用户体验优化'
    ]
  },
  'SportsReservation.vue': {
    title: '体育设施预约',
    description: '预约篮球场、羽毛球场等体育场馆和设施',
    category: 'views',
    difficulty: '中级',
    tags: ['场地预约', '时间管理', '资源调度'],
    features: [
      '体育设施列表展示',
      '场地时间段选择',
      '预约确认与取消',
      '预约历史记录',
      '冲突检测(避免重复预约)'
    ],
    techPoints: [
      '日历组件集成',
      '时间段可用性检查',
      '预约规则验证',
      '数据持久化'
    ],
    learningPoints: [
      '资源调度算法',
      '时间冲突检测',
      '业务规则实现'
    ]
  },
  'PersonalStudyPlan.vue': {
    title: '个人学习计划',
    description: '创建和管理个人学习日程,制定学习目标',
    category: 'views',
    difficulty: '中级',
    tags: ['学习计划', '任务管理', '进度跟踪'],
    features: [
      '创建新的学习计划',
      '编辑/删除已有计划',
      '计划进度可视化',
      '提醒通知设置',
      '计划分类管理'
    ],
    techPoints: [
      'CRUD操作完整实现',
      '进度条组件使用',
      '定时提醒功能',
      '数据筛选与排序'
    ],
    learningPoints: [
      '任务管理系统设计',
      '进度追踪实现',
      '提醒机制开发'
    ]
  },
  'PlanDetail.vue': {
    title: '学习计划详情',
    description: '查看单个学习计划的详细信息和执行进度',
    category: 'views',
    difficulty: '初级',
    tags: ['详情页', '数据展示', '进度统计'],
    features: [
      '计划基本信息展示',
      '任务完成进度',
      '时间轴视图',
      '相关数据统计'
    ],
    techPoints: [
      '路由参数传递与接收',
      '数据聚合展示',
      '图表组件集成'
    ],
    learningPoints: [
      '详情页设计模式',
      '数据可视化基础'
    ]
  },
  'SmartReview.vue': {
    title: '智能复习系统',
    description: '基于遗忘曲线的智能复习提醒和管理',
    category: 'views',
    difficulty: '高级',
    tags: ['艾宾浩斯遗忘曲线', '智能算法', '复习管理'],
    features: [
      '添加复习内容',
      '自动生成复习计划',
      '遗忘曲线算法计算复习时间',
      '复习提醒通知',
      '复习进度统计'
    ],
    techPoints: [
      '艾宾浩斯遗忘曲线算法实现',
      '定时任务调度',
      '浏览器通知API',
      '数据持久化与同步'
    ],
    learningPoints: [
      '算法在实际项目中的应用',
      '定时任务设计',
      '推送通知实现'
    ]
  },
  'ReviewDetail.vue': {
    title: '复习详情页面',
    description: '查看单次复习任务的详细内容和历史记录',
    category: 'views',
    difficulty: '初级',
    tags: ['详情展示', '历史记录', '数据查询'],
    features: [
      '复习内容详情',
      '历史复习记录',
      '掌握程度标记',
      '下次复习时间预览'
    ],
    techPoints: [
      '数据关联查询',
      '状态管理',
      '时间计算'
    ],
    learningPoints: [
      '数据关系建模',
      '状态流转管理'
    ]
  },
  'StudyData.vue': {
    title: '学习数据分析',
    description: '可视化展示学习数据统计和趋势分析',
    category: 'views',
    difficulty: '中级',
    tags: ['数据可视化', 'ECharts', '统计分析'],
    features: [
      '学习时长统计图表',
      '完成率趋势分析',
      '各科目学习时间分布',
      '学习效果评估',
      '数据导出功能'
    ],
    techPoints: [
      'ECharts图表库集成',
      '数据聚合计算',
      '响应式图表适配',
      '数据格式化'
    ],
    learningPoints: [
      '数据可视化技术',
      '图表类型选择与应用',
      '数据分析思维'
    ]
  },
  'CompetitionManagement.vue': {
    title: '竞赛管理中心',
    description: '浏览、报名和管理各类学科竞赛信息',
    category: 'views',
    difficulty: '中级',
    tags: ['竞赛管理', '列表展示', '报名系统'],
    features: [
      '竞赛列表浏览',
      '竞赛详情查看',
      '在线报名参赛',
      '我的竞赛记录',
      '竞赛分类筛选',
      '报名时间提醒'
    ],
    techPoints: [
      '列表分页加载',
      '筛选与搜索功能',
      '表单提交流程',
      '状态标签显示'
    ],
    learningPoints: [
      '列表性能优化',
      '筛选器设计',
      '业务流程实现'
    ]
  },
  'CompetitionDetail.vue': {
    title: '竞赛详情页面',
    description: '查看单个竞赛的详细信息、要求和报名状态',
    category: 'views',
    difficulty: '初级',
    tags: ['详情页', '信息展示', '报名操作'],
    features: [
      '竞赛基本信息',
      '比赛规则说明',
      '时间节点展示',
      '报名按钮/状态',
      '相关资源下载'
    ],
    techPoints: [
      '富文本内容渲染',
      '条件渲染(已报名/未报名)',
      '文件下载功能'
    ],
    learningPoints: [
      '详情页信息架构',
      '用户操作流程设计'
    ]
  },
  'CareerNavigation.vue': {
    title: '职业发展导航',
    description: '提供职业规划、就业指导和资源推荐',
    category: 'views',
    difficulty: '中级',
    tags: ['职业规划', '资源推荐', '就业指导'],
    features: [
      '职业方向探索',
      '技能要求分析',
      '学习资源推荐',
      '就业资讯浏览',
      '简历制作指导'
    ],
    techPoints: [
      '内容分类展示',
      '资源链接管理',
      '个性化推荐(可选)'
    ],
    learningPoints: [
      '信息架构设计',
      '内容管理系统'
    ]
  },
  'PostgraduateSupport.vue': {
    title: '考研支持中心',
    description: '为考研学生提供资料、经验和交流平台',
    category: 'views',
    difficulty: '中级',
    tags: ['考研辅导', '资料分享', '经验交流'],
    features: [
      '考研院校信息查询',
      '复习资料下载',
      '学长学姐经验分享',
      '备考计划模板',
      '考研社区讨论'
    ],
    techPoints: [
      'Markdown内容渲染',
      '文件上传下载',
      '评论区功能',
      '标签分类系统'
    ],
    learningPoints: [
      '内容管理系统(CMS)基础',
      '社区功能实现',
      '文件处理技术'
    ]
  },
  'SecondHandMarket.vue': {
    title: '二手交易市场',
    description: '校园内二手物品买卖平台,支持发布和浏览商品',
    category: 'views',
    difficulty: '高级',
    tags: ['电商平台', '图片上传', '即时通讯', '交易管理'],
    features: [
      '商品发布(图文)',
      '商品浏览与搜索',
      '分类筛选',
      '收藏感兴趣商品',
      '联系卖家',
      '交易状态管理'
    ],
    techPoints: [
      '图片上传与预览',
      '搜索与过滤算法',
      '实时聊天(可选)',
      '分页加载优化',
      '用户评价系统'
    ],
    learningPoints: [
      '电商平台核心功能',
      '图片处理技术',
      '搜索优化策略',
      '社交功能集成'
    ]
  },
  'UserCenter.vue': {
    title: '个人中心',
    description: '查看和管理个人信息、设置和偏好',
    category: 'views',
    difficulty: '初级',
    tags: ['个人信息', '设置管理', '数据展示'],
    features: [
      '个人基本信息展示',
      '学习统计数据概览',
      '我的收藏/预约/报名记录',
      '快速设置入口',
      '账号安全设置'
    ],
    techPoints: [
      '数据聚合展示',
      'Tab切换组件',
      '快捷操作入口'
    ],
    learningPoints: [
      '个人中心设计规范',
      '数据汇总展示技巧'
    ]
  },
  'ProfileEdit.vue': {
    title: '个人资料编辑',
    description: '修改个人头像、昵称、联系方式等信息',
    category: 'views',
    difficulty: '中级',
    tags: ['表单编辑', '图片上传', '数据更新'],
    features: [
      '头像上传与裁剪',
      '基本信息修改',
      '联系方式更新',
      '密码修改',
      '保存与取消操作'
    ],
    techPoints: [
      '图片裁剪组件集成',
      '表单验证与提交',
      '数据回显',
      '乐观更新策略'
    ],
    learningPoints: [
      '图片处理技术',
      '表单编辑最佳实践',
      '数据同步策略'
    ]
  },
  'Settings.vue': {
    title: '系统设置页面',
    description: '配置应用偏好、通知设置和主题切换',
    category: 'views',
    difficulty: '初级',
    tags: ['设置管理', '主题切换', '偏好配置'],
    features: [
      '深色/浅色主题切换',
      '通知开关设置',
      '语言选择',
      '隐私设置',
      '清除缓存'
    ],
    techPoints: [
      'CSS变量动态切换主题',
      '本地存储配置',
      '全局状态同步'
    ],
    learningPoints: [
      '主题切换实现原理',
      '配置管理设计',
      '用户体验优化'
    ]
  },
  'FunctionSearch.vue': {
    title: '功能搜索页面',
    description: '快速搜索和定位平台各项功能',
    category: 'views',
    difficulty: '初级',
    tags: ['搜索功能', '模糊匹配', '快捷导航'],
    features: [
      '关键词搜索',
      '搜索结果高亮',
      '热门搜索推荐',
      '搜索历史记录',
      '快捷跳转'
    ],
    techPoints: [
      '前端搜索算法',
      '防抖处理(debounce)',
      '本地搜索历史存储'
    ],
    learningPoints: [
      '搜索功能实现',
      '性能优化技巧',
      '用户体验细节'
    ]
  },
  'UserManage.vue': {
    title: '用户管理后台',
    description: '管理员查看和管理平台用户信息',
    category: 'views',
    difficulty: '中级',
    tags: ['后台管理', '权限控制', '数据表格'],
    features: [
      '用户列表展示',
      '用户信息编辑',
      '账号禁用/启用',
      '角色权限分配',
      '批量操作'
    ],
    techPoints: [
      '表格组件高级用法',
      '权限指令/守卫',
      '批量数据处理',
      '操作日志记录'
    ],
    learningPoints: [
      '后台管理系统设计',
      '权限控制实现',
      '数据安全管理'
    ]
  },
  'SmartQa.vue': {
    title: '智能问答AI助手',
    description: '基于AI的智能对话系统,解答学习和生活问题',
    category: 'views',
    difficulty: '高级',
    tags: ['AI对话', '自然语言处理', '流式响应'],
    features: [
      '智能对话交互',
      '上下文理解',
      '历史记录保存',
      '多轮对话支持',
      '知识库检索'
    ],
    techPoints: [
      'WebSocket/Server-Sent Events流式响应',
      '消息队列管理',
      'Markdown渲染回复',
      '打字机效果实现'
    ],
    learningPoints: [
      'AI接口集成',
      '流式数据处理',
      '聊天界面设计',
      '状态管理复杂度'
    ]
  },

  // Components
  'GlobalNavbar.vue': {
    title: '全局导航栏组件',
    description: '网站顶部导航栏,包含Logo、菜单和用户信息',
    category: 'components',
    difficulty: '中级',
    tags: ['导航栏', '响应式', '用户状态'],
    features: [
      '品牌Logo展示',
      '主导航菜单',
      '用户头像/下拉菜单',
      '移动端汉堡菜单',
      '当前路由高亮'
    ],
    techPoints: [
      '路由联动(active状态)',
      '下拉菜单组件',
      '响应式断点处理',
      '用户登录状态判断'
    ],
    learningPoints: [
      '导航组件设计模式',
      '响应式导航实现',
      '组件复用性'
    ]
  },
  'BadgeDot.vue': {
    title: '角标提示组件',
    description: '在图标或文字右上角显示小红点或数字徽章',
    category: 'components',
    difficulty: '初级',
    tags: ['UI组件', '徽章', '提示'],
    features: [
      '红点提示(无数字)',
      '数字徽章显示',
      '自定义位置',
      '动画效果'
    ],
    techPoints: [
      'Props传参',
      '条件渲染',
      'CSS动画'
    ],
    learningPoints: [
      '小组件封装技巧',
      'Props设计与验证',
      '插槽(slot)使用'
    ]
  },
  'CaptchaComponent.vue': {
    title: '验证码组件',
    description: '图形验证码生成和验证组件',
    category: 'components',
    difficulty: '中级',
    tags: ['验证码', 'Canvas绘图', '安全验证'],
    features: [
      '随机验证码生成',
      'Canvas绘制干扰线/噪点',
      '点击刷新验证码',
      '大小写不敏感验证'
    ],
    techPoints: [
      'Canvas API绘图',
      '随机数生成',
      '事件发射($emit)',
      '组件通信'
    ],
    learningPoints: [
      'Canvas基础绘图',
      '验证码安全原理',
      '父子组件通信'
    ]
  },
  'MouseBubbles.vue': {
    title: '鼠标气泡特效组件',
    description: '鼠标移动时产生彩色气泡跟随效果',
    category: 'components',
    difficulty: '初级',
    tags: ['动画效果', '鼠标事件', '视觉特效'],
    features: [
      '鼠标轨迹追踪',
      '气泡粒子生成',
      '渐隐动画',
      '颜色随机变化'
    ],
    techPoints: [
      '全局鼠标事件监听',
      'DOM动态创建与销毁',
      'CSS过渡动画',
      '性能优化(requestAnimationFrame)'
    ],
    learningPoints: [
      '事件监听与清理',
      '动画性能优化',
      '创意交互实现'
    ]
  },
  'ReviewReminderBanner.vue': {
    title: '复习提醒横幅组件',
    description: '在页面顶部显示今日待复习内容的提醒横幅',
    category: 'components',
    difficulty: '初级',
    tags: ['提醒通知', '横幅', '状态提示'],
    features: [
      '显示待复习数量',
      '一键跳转到复习',
      '关闭提醒',
      '今日不再提示'
    ],
    techPoints: [
      '全局状态订阅',
      '条件显示控制',
      '本地存储偏好'
    ],
    learningPoints: [
      '通知组件设计',
      '用户偏好记忆',
      '全局状态管理'
    ]
  },
  'select.vue': {
    title: '自定义选择器组件',
    description: '增强的下拉选择框组件,支持搜索和自定义选项',
    category: 'components',
    difficulty: '中级',
    tags: ['表单组件', '下拉选择', '搜索过滤'],
    features: [
      '下拉选项列表',
      '关键词搜索过滤',
      '多选/单选模式',
      '自定义选项渲染',
      '键盘导航支持'
    ],
    techPoints: [
      'v-model双向绑定',
      '计算属性过滤选项',
      '键盘事件处理',
      '点击外部关闭'
    ],
    learningPoints: [
      '表单组件封装',
      '双向绑定原理',
      '无障碍访问(a11y)'
    ]
  }
};

// 获取所有Vue文件
const viewsDir = path.join(__dirname, 'src', 'views');
const componentsDir = path.join(__dirname, 'src', 'components');
const appFile = path.join(__dirname, 'src', 'App.vue');

function getAllVueFiles() {
  const files = [];
  
  // 读取views目录
  if (fs.existsSync(viewsDir)) {
    const viewFiles = fs.readdirSync(viewsDir)
      .filter(file => file.endsWith('.vue'))
      .map(file => ({ name: file, path: path.join(viewsDir, file), type: 'view' }));
    files.push(...viewFiles);
  }
  
  // 读取components目录
  if (fs.existsSync(componentsDir)) {
    const componentFiles = fs.readdirSync(componentsDir)
      .filter(file => file.endsWith('.vue'))
      .map(file => ({ name: file, path: path.join(componentsDir, file), type: 'component' }));
    files.push(...componentFiles);
  }
  
  // 添加App.vue
  if (fs.existsSync(appFile)) {
    files.push({ name: 'App.vue', path: appFile, type: 'app' });
  }
  
  return files;
}

// 生成Frontmatter
function generateFrontmatter(info, fileName) {
  const today = new Date().toISOString().split('T')[0];
  const tagsYaml = info.tags.map(tag => `\n  - ${tag}`).join('');
  
  return `---
title: ${info.title}
description: ${info.description}
category: ${info.category}
fileName: ${fileName}
difficulty: ${info.difficulty}
tags:${tagsYaml}
lastUpdated: ${today}
---`;
}

// 生成文档内容
function generateDocContent(info, fileName) {
  const featuresList = info.features.map(f => `- ✅ ${f}`).join('\n');
  const techList = info.techPoints.map(t => `- 🔹 ${t}`).join('\n');
  const learningList = info.learningPoints.map(l => `- 📖 ${l}`).join('\n');
  
  return `

## 📖 功能简介

${info.description}。这是智慧校园平台的重要组成部分,帮助大学生更好地管理学习和生活。

## 🎯 主要功能

${featuresList}

## 🔧 技术实现

${techList}

## 📚 学习要点

对于正在学习前端开发的同学,这个文件可以帮助你掌握以下知识点:

${learningList}

## 💡 使用示例

\`\`\`vue
<!-- 在路由配置中使用 -->
import ${fileName.replace('.vue', '')} from '@/views/${fileName}'

// 或在其他组件中引入(如果是组件)
import ${fileName.replace('.vue', '')} from '@/components/${fileName}'
\`\`\`

## ⚠️ 注意事项

- 📌 确保已安装所有依赖包后再运行项目
- 🔐 涉及用户数据的操作需要登录状态
- 📱 注意响应式布局在不同设备上的表现
- 🔄 数据更新后记得刷新页面查看最新状态

## 🎓 适合人群

- 🌱 **初学者**: 可以学习基础的Vue组件结构和模板语法
- 🌿 **进阶者**: 深入研究状态管理和API调用逻辑
- 🌳 **高手**: 优化性能、重构代码结构、添加新功能

## 🔗 相关文件

- 查看 \`src/api/\` 目录了解相关的API接口定义
- 查看 \`src/stores/\` 目录了解状态管理实现
- 查看 \`src/types/\` 目录了解TypeScript类型定义

---

> 💬 **小贴士**: 阅读源码时,建议从 \`<script setup>\` 部分开始,理解数据流和业务逻辑,然后再看 \`<template>\` 的UI结构和 \`<style>\` 的样式设计。

*本文档由自动化工具生成,旨在帮助大学生更好地理解和学习智慧校园平台的代码结构* ✨
`;
}

// 生成App.vue的特殊文档
function generateAppDoc() {
  const info = {
    title: '应用根组件',
    description: '整个应用的入口组件,负责全局状态初始化、主题切换和消息提醒',
    category: 'app',
    difficulty: '高级',
    tags: ['根组件', '全局状态', '主题管理', '消息通知'],
    features: [
      '应用初始化和Token验证',
      '全局主题切换(深色/浅色模式)',
      '系统问候语显示(根据时间段)',
      '学习提醒定时检查',
      '浏览器通知推送',
      '用户设置同步'
    ],
    techPoints: [
      '生命周期钩子协调(onMounted/onBeforeUnmount)',
      '计算属性computed监听状态变化',
      '定时器管理与清理',
      '本地存储与Store同步',
      '浏览器Notification API使用',
      '全局样式类动态切换'
    ],
    learningPoints: [
      'Vue应用架构设计',
      '全局状态管理策略',
      '定时器内存泄漏防范',
      '浏览器API集成',
      '用户体验细节处理'
    ]
  };

  const frontmatter = generateFrontmatter(info, 'App.vue');
  const content = generateDocContent(info, 'App.vue');
  
  return frontmatter + content;
}

// 主函数
function main() {
  const outputDir = path.join(__dirname, 'docs', 'vue-components');
  
  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const vueFiles = getAllVueFiles();
  console.log(`找到 ${vueFiles.length} 个Vue文件,开始生成文档...\n`);
  
  let successCount = 0;
  let skipCount = 0;
  
  vueFiles.forEach(({ name, path: filePath, type }) => {
    try {
      // 跳过App.vue,单独处理
      if (name === 'App.vue') {
        const docContent = generateAppDoc();
        const outputPath = path.join(outputDir, 'App.md');
        fs.writeFileSync(outputPath, docContent, 'utf-8');
        console.log(`✅ App.vue -> App.md`);
        successCount++;
        return;
      }
      
      // 查找文件信息
      const info = vueFilesInfo[name];
      if (!info) {
        console.log(`⚠️  未找到 ${name} 的配置信息,跳过`);
        skipCount++;
        return;
      }
      
      // 生成文档
      const frontmatter = generateFrontmatter(info, name);
      const content = generateDocContent(info, name);
      const fullDoc = frontmatter + content;
      
      // 确定输出文件名
      const baseName = name.replace('.vue', '');
      const outputFileName = `${baseName}.md`;
      const outputPath = path.join(outputDir, outputFileName);
      
      // 写入文件
      fs.writeFileSync(outputPath, fullDoc, 'utf-8');
      console.log(`✅ ${name} -> ${outputFileName}`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ 处理 ${name} 时出错:`, error.message);
    }
  });
  
  console.log(`\n🎉 文档生成完成!`);
  console.log(`   成功: ${successCount} 个文件`);
  console.log(`   跳过: ${skipCount} 个文件`);
  console.log(`   输出目录: ${outputDir}`);
}

main();
