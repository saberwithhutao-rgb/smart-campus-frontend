const fs = require('fs');
const path = require('path');

// Vue文件用户使用说明映射 - 面向普通大学生,无技术术语
const vueFilesUserGuide = {
  'Login.vue': {
    title: '登录功能使用指南',
    description: '教你如何使用学号和密码登录智慧校园平台',
    category: 'views',
    difficulty: '初级',
    tags: ['登录', '账号密码', '验证码'],
    sections: [
      {
        title: '🔐 如何登录',
        steps: [
          '打开智慧校园平台,你会看到登录页面',
          '在「学号/用户名」输入框中,输入你的学号(例如:202301001)',
          '在「密码」输入框中,输入你的登录密码',
          '在「验证码」输入框中,输入图片上显示的字符(不区分大小写)',
          '如果看不清验证码,点击图片可以刷新一个新的',
          '勾选「记住我」,下次登录时可以自动填写账号信息',
          '点击蓝色的「登录」按钮'
        ]
      },
      {
        title: '✅ 登录成功',
        content: '登录成功后,你会自动跳转到首页,右上角会显示你的头像和姓名。'
      },
      {
        title: '❌ 常见问题',
        faqs: [
          {
            question: '提示"用户名或密码错误"?',
            answer: '请检查:\n- 学号是否输入正确(注意不要有空格)\n- 密码是否正确(注意大小写)\n- 是否开启了大写锁定键(Caps Lock)'
          },
          {
            question: '验证码总是提示错误?',
            answer: '试试这些方法:\n- 点击图片刷新一个新的验证码\n- 仔细核对输入的字符,注意区分 0 和 O、1 和 l\n- 验证码不区分大小写,可以放心输入'
          },
          {
            question: '忘记密码怎么办?',
            answer: '点击登录框下方的「忘记密码」链接,按照提示通过邮箱或手机号重置密码。'
          },
          {
            question: '没有账号怎么注册?',
            answer: '点击登录框下方的「立即注册」链接,填写相关信息即可创建新账号。'
          },
          {
            question: '登录后很快又退出?',
            answer: '可能是网络问题或登录过期,请重新登录。如果频繁出现,请联系管理员。'
          }
        ]
      },
      {
        title: '🔒 安全提醒',
        warnings: [
          '不要在公共电脑上勾选「记住我」',
          '密码要设置得复杂一些,包含字母和数字',
          '离开电脑前记得点击「退出登录」',
          '不要将密码告诉他人,包括同学和朋友'
        ]
      }
    ]
  },
  'Register.vue': {
    title: '注册账号使用指南',
    description: '教你如何创建智慧校园平台的新账号',
    category: 'views',
    difficulty: '初级',
    tags: ['注册', '创建账号', '实名认证'],
    sections: [
      {
        title: '📝 注册步骤',
        steps: [
          '在登录页面点击「立即注册」按钮',
          '填写学号(必须是学校分配的正式学号)',
          '设置登录密码(至少8位,建议包含字母和数字)',
          '再次输入密码进行确认',
          '填写真实姓名(必须与学籍信息一致)',
          '输入手机号码(用于找回密码和接收通知)',
          '输入邮箱地址(可选,建议填写学校邮箱)',
          '阅读并勾选「用户服务协议」',
          '点击「注册」按钮完成注册'
        ]
      },
      {
        title: '⚠️ 注意事项',
        tips: [
          '学号必须是真实有效的,系统会自动验证',
          '密码一旦设置,只能通过「忘记密码」功能重置',
          '手机号和邮箱要确保能正常使用,用于接收验证码',
          '姓名必须与身份证和学籍信息完全一致'
        ]
      },
      {
        title: '❓ 常见问题',
        faqs: [
          {
            question: '提示"学号已存在"?',
            answer: '说明该学号已经注册过账号,请直接登录或使用「忘记密码」功能重置密码。'
          },
          {
            question: '收不到手机验证码?',
            answer: '请检查:\n- 手机号是否输入正确\n- 手机是否有信号\n- 是否被拦截软件拦截\n- 等待60秒后可以重新发送'
          },
          {
            question: '密码有什么要求?',
            answer: '密码长度至少8位,建议包含大写字母、小写字母和数字的组合,不要使用生日、学号等容易被猜到的密码。'
          }
        ]
      }
    ]
  },
  'ForgotPassword.vue': {
    title: '找回密码使用指南',
    description: '忘记密码?教你如何通过手机或邮箱重置密码',
    category: 'views',
    difficulty: '初级',
    tags: ['找回密码', '密码重置', '验证码'],
    sections: [
      {
        title: '🔑 找回密码步骤',
        steps: [
          '在登录页面点击「忘记密码」链接',
          '选择找回方式:「手机号找回」或「邮箱找回」',
          '输入你注册时使用的手机号或邮箱',
          '点击「获取验证码」按钮',
          '查看手机短信或邮箱,找到6位验证码',
          '在输入框中填入验证码(注意有效期为5分钟)',
          '设置新密码(需要输入两次进行确认)',
          '点击「确认重置」按钮',
          '系统提示成功后,使用新密码重新登录'
        ]
      },
      {
        title: '⏰ 验证码说明',
        content: `获取验证码后:\n- 验证码有效期为 **5分钟**\n- 超过时间需要重新获取\n- 1分钟内只能获取一次验证码\n- 验证码是6位数字,不分大小写`
      },
      {
        title: '❓ 常见问题',
        faqs: [
          {
            question: '收不到验证码怎么办?',
            answer: '请检查:\n- 手机号/邮箱是否输入正确\n- 手机是否有信号或邮箱是否能正常收发邮件\n- 是否被垃圾短信/邮件过滤\n- 等待60秒后点击「重新发送」'
          },
          {
            question: '验证码提示过期?',
            answer: '验证码有效期只有5分钟,如果超时请点击「重新获取验证码」,使用新的验证码继续操作。'
          },
          {
            question: '手机号和邮箱都不可用?',
            answer: '请联系学校信息中心或系统管理员,提供学号和身份证明,由管理员协助重置密码。'
          }
        ]
      }
    ]
  },
  'LibraryReservation.vue': {
    title: '图书馆座位预约使用指南',
    description: '教你如何在手机上预约图书馆座位',
    category: 'views',
    difficulty: '中级',
    tags: ['图书馆', '座位预约', '选座'],
    sections: [
      {
        title: '📖 预约流程',
        steps: [
          '点击首页的「图书馆预约」或直接进入图书馆预约页面',
          '选择你要去的图书馆分馆(如:主图书馆、东区分馆等)',
          '选择楼层(1楼、2楼、3楼等)',
          '查看座位图:绿色表示空闲,红色表示已占用,灰色表示维护中',
          '点击绿色的空闲座位进行选择',
          '选择使用时段(开始时间和结束时间)',
          '确认预约信息无误后,点击「确认预约」',
          '系统提示预约成功后,你可以在「我的预约」中查看'
        ]
      },
      {
        title: '🗺️ 如何看座位图',
        content: `- **绿色座位**: 当前空闲,可以点击选择\n- **红色座位**: 已被他人预约,不可选择\n- **灰色座位**: 暂时不可用(维护中或已禁用)\n- **蓝色座位**: 你自己预约的座位`
      },
      {
        title: '⚠️ 重要规则',
        rules: [
          '每人同时只能预约一个座位',
          '预约后必须在15分钟内签到,否则自动取消',
          '临时离开超过30分钟,座位可能被释放',
          '一天最多预约2次(上午、下午各一次)',
          '爽约3次将被暂停预约权限一周'
        ]
      },
      {
        title: '❓ 常见问题',
        faqs: [
          {
            question: '想选的座位都是红色的怎么办?',
            answer: '说明该时段座位已满,你可以:\n- 选择其他时段\n- 选择其他楼层或分馆\n- 稍后再来刷新看看有没有人取消'
          },
          {
            question: '预约后忘记签到怎么办?',
            answer: '超过15分钟未签到,系统会自动取消预约并记录一次爽约。请尽快到座位扫码签到。'
          },
          {
            question: '可以帮别人预约吗?',
            answer: '不可以。系统规定一人一座,必须本人预约、本人使用。发现代预约行为会被处罚。'
          }
        ]
      }
    ]
  },
  'PersonalStudyPlan.vue': {
    title: '个人学习计划使用指南',
    description: '教你如何制定和管理自己的学习计划',
    category: 'views',
    difficulty: '初级',
    tags: ['学习计划', '任务管理', '进度跟踪'],
    sections: [
      {
        title: '📝 创建学习计划',
        steps: [
          '进入「个人学习计划」页面',
          '点击右上角的「新建计划」按钮',
          '填写计划名称(如:英语四级复习计划)',
          '选择计划类型(考试复习、课程学习、技能提升等)',
          '设置开始日期和结束日期',
          '添加具体任务(如:每天背50个单词)',
          '设置每日提醒时间(可选)',
          '点击「保存」完成创建'
        ]
      },
      {
        title: '✅ 标记任务完成',
        steps: [
          '在计划列表中找到今天的任务',
          '完成任务后,点击任务前面的复选框',
          '任务会显示为已完成状态(带删除线)',
          '进度条会自动更新完成百分比'
        ]
      },
      {
        title: '💡 使用技巧',
        tips: [
          '将大目标分解为小任务,更容易完成',
          '设置合理的每日任务量,不要贪多',
          '利用提醒功能养成学习习惯',
          '定期查看统计数据,调整学习计划'
        ]
      }
    ]
  },
  'SmartReview.vue': {
    title: '智能复习系统使用指南',
    description: '利用科学算法帮你高效复习,避免遗忘',
    category: 'views',
    difficulty: '中级',
    tags: ['智能复习', '记忆曲线', '学习工具'],
    sections: [
      {
        title: '🧠 什么是智能复习',
        content: '智能复习基于「艾宾浩斯遗忘曲线」原理,在你快要忘记的时候提醒你复习,让记忆更牢固。系统会自动计算最佳复习时间。'
      },
      {
        title: '📝 添加复习内容',
        steps: [
          '进入「智能复习」页面',
          '点击「添加复习内容」按钮',
          '输入复习标题(如:高等数学第三章公式)',
          '填写详细内容(可以是知识点、公式、笔记等)',
          '选择科目分类(数学、英语、专业课等)',
          '点击「保存」',
          '系统会自动安排第一次复习时间(通常是1天后)'
        ]
      },
      {
        title: '✍️ 进行复习',
        steps: [
          '在「今日待复习」列表中查看需要复习的内容',
          '点击任意一条开始复习',
          '仔细阅读内容,尝试回忆',
          '复习完成后,选择掌握程度:\n  - 😊 完全掌握 → 下次复习间隔变长\n  - 😐 基本掌握 → 正常间隔\n  - 😕 不太熟悉 → 缩短间隔,频繁复习',
          '系统会根据你的选择自动安排下次复习时间'
        ]
      },
      {
        title: '💡 使用建议',
        tips: [
          '每天坚持复习,不要中断',
          '如实反馈掌握程度,这样算法才准确',
          '重要的知识点可以添加详细备注',
          '定期清理已完全掌握的内容'
        ]
      }
    ]
  },
  'SecondHandMarket.vue': {
    title: '二手交易市场使用指南',
    description: '在校园内买卖二手物品,环保又实惠',
    category: 'views',
    difficulty: '中级',
    tags: ['二手交易', '闲置物品', '校园市场'],
    sections: [
      {
        title: '🛒 浏览商品',
        steps: [
          '进入「二手市场」页面',
          '可以看到所有在售商品列表',
          '使用搜索框查找特定商品(如:自行车、教材)',
          '使用筛选条件:按分类、价格区间、发布时间',
          '点击商品卡片查看详情'
        ]
      },
      {
        title: '📸 发布商品',
        steps: [
          '点击右上角「发布商品」按钮',
          '上传商品照片(最多9张,第一张作为封面)',
          '填写商品标题(简明扼要)',
          '详细描述商品情况(新旧程度、有无瑕疵等)',
          '选择商品分类',
          '设置价格(可以标注原价作参考)',
          '填写联系方式(微信/QQ/电话)',
          '点击「发布」',
          '等待审核通过后即可上架'
        ]
      },
      {
        title: '⚠️ 交易须知',
        rules: [
          '优先选择当面交易,现场验货',
          '贵重物品建议在公共场所交易',
          '保留聊天记录和转账凭证',
          '发现虚假宣传或欺诈行为立即举报',
          '禁止发布违禁品和侵权商品'
        ]
      },
      {
        title: '❓ 常见问题',
        faqs: [
          {
            question: '商品多久能审核通过?',
            answer: '通常1-2小时内审核完成,高峰期可能延长至24小时。'
          },
          {
            question: '可以修改已发布的商品吗?',
            answer: '可以。进入「我发布的」,找到对应商品点击「编辑」即可修改信息。'
          },
          {
            question: '遇到骗子怎么办?',
            answer: '立即停止交易,保存聊天记录和证据,点击商品页面的「举报」按钮。'
          }
        ]
      }
    ]
  },
  'Settings.vue': {
    title: '系统设置使用指南',
    description: '个性化定制你的平台体验',
    category: 'views',
    difficulty: '初级',
    tags: ['设置', '主题切换', '个性化'],
    sections: [
      {
        title: '🎨 主题设置',
        steps: [
          '进入「设置」页面',
          '在「外观设置」中选择主题:',
          '  - ☀️ 浅色模式:适合白天使用',
          '  - 🌙 深色模式:护眼,适合夜间',
          '  - 🔄 跟随系统:自动根据设备设置切换',
          '选择后立即生效,无需刷新页面'
        ]
      },
      {
        title: '🔔 通知设置',
        content: `你可以控制接收哪些通知:\n- ✅ 学习提醒:学习计划到期提醒\n- ✅ 复习提醒:智能复习通知\n- ✅ 预约提醒:图书馆/体育设施预约提醒\n- ✅ 系统公告:平台重要通知\n\n点击开关即可开启或关闭`
      },
      {
        title: '🗑️ 清除缓存',
        steps: [
          '如果页面显示异常或加载缓慢,可以尝试清除缓存',
          '点击「清除缓存」按钮',
          '确认后系统会清理本地存储的临时数据',
          '页面会自动刷新,需要重新登录'
        ]
      }
    ]
  },
  'CompetitionManagement.vue': {
    title: '竞赛报名使用指南',
    description: '查看和报名各类学科竞赛',
    category: 'views',
    difficulty: '初级',
    tags: ['竞赛', '报名', '比赛'],
    sections: [
      {
        title: '🏆 浏览竞赛',
        steps: [
          '进入「竞赛管理」页面',
          '可以看到所有正在报名的竞赛列表',
          '使用筛选功能:按类别(数学建模、程序设计等)、按级别(校级、省级、国家级)',
          '点击竞赛卡片查看详情'
        ]
      },
      {
        title: '📝 报名参赛',
        steps: [
          '在竞赛详情页查看比赛要求、时间、奖项等信息',
          '确认符合条件后,点击「立即报名」按钮',
          '填写报名表:选择参赛组别(个人/团队),如果是团队赛邀请队友加入',
          '确认信息无误后提交',
          '等待审核结果(通常会通过站内消息通知)'
        ]
      },
      {
        title: '💡 参赛建议',
        tips: [
          '提前了解比赛规则和要求',
          '组队赛要找靠谱的队友,明确分工',
          '注意报名截止时间,不要错过',
          '参加比赛重在学习和积累经验'
        ]
      }
    ]
  },
  'SportsReservation.vue': {
    title: '体育设施预约使用指南',
    description: '在线预约篮球场、羽毛球场等运动场地',
    category: 'views',
    difficulty: '初级',
    tags: ['体育', '场地预约', '运动'],
    sections: [
      {
        title: '🏀 预约流程',
        steps: [
          '进入「体育设施预约」页面',
          '选择运动项目(篮球、羽毛球、乒乓球等)',
          '选择场地编号(如:篮球场1号场)',
          '选择日期和时间段',
          '查看该时段是否空闲(绿色=可用,红色=已约)',
          '点击空闲时段进行选择',
          '确认预约信息,点击「确认预约」'
        ]
      },
      {
        title: '⚠️ 使用规则',
        rules: [
          '每人每天最多预约2个时段',
          '每个时段最长2小时',
          '预约后需在开始前10分钟到场',
          '迟到超过15分钟自动取消',
          '爱护场地设施,损坏需赔偿'
        ]
      }
    ]
  },
  'UserCenter.vue': {
    title: '个人中心使用指南',
    description: '查看个人信息和学习数据的地方',
    category: 'views',
    difficulty: '初级',
    tags: ['个人中心', '信息查看', '数据统计'],
    sections: [
      {
        title: '👤 个人信息',
        content: '在个人中心顶部可以看到:\n- 头像和昵称\n- 学号和姓名\n- 学院和专业\n- 注册时间\n\n点击头像可以更换'
      },
      {
        title: '📊 学习数据',
        content: `这里展示了你的学习成果:\n- 📚 累计学习时长\n- ✅ 完成的学习计划数量\n- 🧠 复习掌握率\n- 📅 连续学习天数\n- 🏆 在学习排行榜中的名次`
      },
      {
        title: '📋 我的记录',
        tabs: [
          '我的预约:查看图书馆和体育设施预约',
          '我的计划:查看正在进行的学习计划',
          '我的收藏:查看收藏的商品和内容',
          '我的发布:查看在二手市场发布的商品',
          '报名信息:查看竞赛报名记录'
        ]
      }
    ]
  },
  'ProfileEdit.vue': {
    title: '编辑个人资料使用指南',
    description: '修改你的头像、昵称和个人信息',
    category: 'views',
    difficulty: '初级',
    tags: ['资料编辑', '头像上传', '信息修改'],
    sections: [
      {
        title: '📸 更换头像',
        steps: [
          '在头像区域点击「更换头像」按钮',
          '从电脑中选择一张照片(支持JPG、PNG格式)',
          '拖动裁剪框选择想要的部分',
          '可以放大缩小调整大小',
          '点击「确认裁剪」',
          '头像会立即更新'
        ]
      },
      {
        title: '✏️ 修改信息',
        steps: [
          '在对应的输入框中修改信息:昵称、手机号、邮箱、个人简介',
          '修改完成后滚动到页面底部',
          '点击「保存修改」按钮',
          '系统提示保存成功后即完成'
        ]
      },
      {
        title: '⚠️ 注意事项',
        tips: [
          '学号和姓名不能修改(需联系管理员)',
          '头像大小不超过5MB',
          '建议使用清晰的正面照片作为头像',
          '手机号和邮箱修改后需要验证'
        ]
      }
    ]
  },
  'SmartQa.vue': {
    title: '智能问答AI助手使用指南',
    description: '有问题就问AI,24小时在线解答',
    category: 'views',
    difficulty: '初级',
    tags: ['AI助手', '智能问答', '聊天机器人'],
    sections: [
      {
        title: '🤖 如何与AI对话',
        steps: [
          '进入「智能问答」页面',
          '在底部输入框中输入你的问题',
          '可以问学习问题(如:解释微积分概念)',
          '可以问生活问题(如:图书馆几点关门)',
          '可以问技术问题(如:怎么写Python程序)',
          '按回车键或点击发送按钮',
          'AI会在几秒内给出回答',
          '可以继续追问,AI会记住上下文'
        ]
      },
      {
        title: '💡 提问技巧',
        tips: [
          '问题越具体,回答越准确',
          '可以分步骤提问,不要一次性问太多',
          '如果回答不满意,可以换个方式重新问',
          '复杂问题可以提供背景信息'
        ]
      },
      {
        title: '⚠️ 使用须知',
        warnings: [
          'AI的回答仅供参考,重要信息请核实',
          '不要询问违法或不当内容',
          '不要泄露个人隐私信息',
          '学术作业请独立思考,AI仅作辅助'
        ]
      }
    ]
  },
  'StudyData.vue': {
    title: '学习数据分析使用指南',
    description: '查看你的学习统计和进步轨迹',
    category: 'views',
    difficulty: '初级',
    tags: ['数据统计', '学习分析', '图表'],
    sections: [
      {
        title: '📊 数据概览',
        content: '在这里你可以看到自己的学习情况:\n- 本周/本月学习时长\n- 完成的任务数量\n- 复习掌握率\n- 学习趋势图表'
      },
      {
        title: '📈 查看图表',
        tabs: [
          '学习时长趋势:折线图展示每天的学习时间',
          '科目分布:饼图显示各科目的学习时间占比',
          '任务完成率:柱状图展示每周完成情况',
          '复习效果:曲线图显示记忆保持率'
        ]
      },
      {
        title: '💡 如何利用数据',
        tips: [
          '发现自己的学习高峰时段,合理安排任务',
          '找出薄弱环节,针对性加强',
          '设定合理的学习目标',
          '与同学对比(匿名),互相激励'
        ]
      }
    ]
  }
};

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

// 生成文档内容 - 纯用户操作指南,无代码无技术术语
function generateUserGuideContent(info) {
  let content = '\n';
  
  info.sections.forEach(section => {
    content += `## ${section.title}\n\n`;
    
    if (section.content) {
      content += `${section.content}\n\n`;
    }
    
    if (section.steps) {
      section.steps.forEach((step, index) => {
        content += `${index + 1}. ${step}\n`;
      });
      content += '\n';
    }
    
    if (section.items) {
      section.items.forEach(item => {
        content += `- ${item}\n`;
      });
      content += '\n';
    }
    
    if (section.faqs) {
      section.faqs.forEach(faq => {
        content += `### ❓ ${faq.question}\n\n${faq.answer}\n\n`;
      });
    }
    
    if (section.tips) {
      section.tips.forEach(tip => {
        content += `- ${tip}\n`;
      });
      content += '\n';
    }
    
    if (section.warnings) {
      section.warnings.forEach(warning => {
        content += `- ⚠️ ${warning}\n`;
      });
      content += '\n';
    }
    
    if (section.rules) {
      section.rules.forEach(rule => {
        content += `- ${rule}\n`;
      });
      content += '\n';
    }
    
    if (section.tabs) {
      section.tabs.forEach(tab => {
        content += `- ${tab}\n`;
      });
      content += '\n';
    }
    
    if (section.shortcuts) {
      section.shortcuts.forEach(shortcut => {
        content += `- ${shortcut}\n`;
      });
      content += '\n';
    }
  });
  
  content += `---

> 💬 **温馨提示**: 如果在使用过程中遇到任何问题,可以随时联系学校信息中心或查看帮助中心的详细教程。

*本指南专为大学生编写,希望能帮助你更好地使用智慧校园平台!* ✨
`;
  
  return content;
}

// 主函数
function main() {
  const outputDir = path.join(__dirname, 'docs', 'user-guides');
  
  // 创建输出目录
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('开始生成用户使用指南...\n');
  
  let successCount = 0;
  
  Object.keys(vueFilesUserGuide).forEach(fileName => {
    try {
      const info = vueFilesUserGuide[fileName];
      const frontmatter = generateFrontmatter(info, fileName);
      const content = generateUserGuideContent(info);
      const fullDoc = frontmatter + content;
      
      const baseName = fileName.replace('.vue', '');
      const outputPath = path.join(outputDir, `${baseName}.md`);
      
      fs.writeFileSync(outputPath, fullDoc, 'utf-8');
      console.log(`✅ ${fileName} -> ${baseName}.md`);
      successCount++;
    } catch (error) {
      console.error(`❌ 处理 ${fileName} 时出错:`, error.message);
    }
  });
  
  console.log(`\n🎉 用户使用指南生成完成!`);
  console.log(`   成功生成: ${successCount} 个文档`);
  console.log(`   输出目录: ${outputDir}`);
  console.log('\n💡 提示: 这些是面向普通大学生的使用说明,不包含任何代码和技术术语');
}

main();
