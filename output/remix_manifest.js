window.__PRINTER_REMIX_MANIFEST__ = {
  "schema_version": 1,
  "remixes": [
    {
      "id": "remix-4804456229e5",
      "slug": "mcti",
      "file": "mcti.html",
      "description_file": "mcti.remix.json",
      "title": "MCTI 我的世界生物人格测评",
      "kind": "Remix",
      "source_file": "sbti-fake.html",
      "parent_slug": "sbti-fake",
      "lineage": [
        "sbti-fake",
        "mcti"
      ],
      "summary": "基于 Minecraft 生物群系的 16 型人格测评（MCTI），在合成台揭晓你的主副型生物人格。",
      "accent": "#22f4ee",
      "glyph": "改",
      "created_at": "2026-04-25T07:43:44.891979+00:00",
      "agent_description": {
        "one_liner": "基于 Minecraft 生物群系的 16 型人格测评（MCTI），在合成台揭晓你的主副型生物人格。",
        "core_loop": "玩家在 8 个不同生物群系场景中做出选择，收集人格精华；答题结束后进入工作台合成阶段，经验粒子飞升并播放附魔动画，最终揭晓主型+副型组合结果。",
        "controls": "触摸点击单选答案；在合成界面点击“合成结果”按钮触发揭晓；结果页一键复制召唤指令。",
        "mechanics": [
          "生物群系光照系统：每道题切换背景与选项边框色，模拟平原、沙漠、洞穴、下界、末地环境。",
          "主副型配方机制：记录四维分值最高的两项，组合出 16 种 MCTI 亚型（如苦力怕·末影人亚型）。",
          "工作台合成仪式：答题结束后进入合成台界面，精华按分值自动填入 2x2 槽位，用户需点击合成触发进度与粒子动画后才能看到结果。",
          "月光倒计时条：每题附带可随 advanceTime(ms) 推进的衰减条，超时自动低分兜底。",
          "世界种子与召唤指令：基于答案序列哈希生成唯一 Seed 与 /summon 命令，作为分享点。"
        ],
        "visual_language": "Minecraft 大地色系（草绿、泥土棕、矿石蓝、下界红），等宽字体营造像素感；昼夜/群系背景渐变切换；方块加载式转场；经验条与附魔台 UI。",
        "state_model": "state.phase ∈ {quiz, crafting, result}; state.scores 记录四维分值; state.result / state.subResult 记录主副型; state.index 为当前题号; state.timer 控制单题倒计时。",
        "share_hook": "结果页展示唯一 MCTI 世界种子与可复制的 /summon 指令文本，玩家可一键复制分享到群聊或社交平台。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材与字体",
          "保留 printer artifact、phone-shell 与 pipeline API"
        ],
        "next_evolution_hooks": [
          "加入基于 Canvas 的像素生物头像绘制",
          "用 Web Audio API 模拟 MC 音效（嘶嘶声、工作台叮当声）",
          "本地存储历史结果并对比种子相似度"
        ]
      }
    },
    {
      "id": "remix-2d26676edea2",
      "slug": "orange-grove-clicker",
      "file": "orange-grove-clicker.html",
      "description_file": "orange-grove-clicker.remix.json",
      "title": "橘子摇晃果园",
      "kind": "Remix",
      "source_file": "brainrot-clicker.html",
      "parent_slug": "brainrot-clicker",
      "lineage": [
        "brainrot-clicker",
        "orange-grove-clicker"
      ],
      "summary": "橘子主题下落接果点击器：摇晃果树、点击接住、升级果园。",
      "accent": "#22f4ee",
      "glyph": "改",
      "created_at": "2026-04-25T08:11:37.408786+00:00",
      "agent_description": {
        "one_liner": "橘子主题下落接果点击器：摇晃果树、点击接住、升级果园。",
        "core_loop": "点击大按钮摇晃橘子树，让橘子物理下落；在画布上点击飞落的橘子将其接住入库；用橘子购买浇水、肥料、蜂箱与阳光灯四项升级，提升单次摇晃产量与自动掉落速度；每10颗橘子自动折算为1杯橙汁，用于分享比拼。",
        "controls": "点击「SHAKE TREE」大按钮摇晃果树；点击画布中下落中的橘子进行接果（金橘子价值5倍）；点击商店行购买升级；点击「分享收成」复制文案。",
        "mechanics": [
          "摇晃产果：点击按钮一次性产生多颗带物理的橘子，初始位置在树冠随机点",
          "点击接果：玩家需在橘子落地前点中画布，金橘子提供5倍收益",
          "重力与摆动：橘子受重力加速下落，并随正弦风场左右摇摆，超时或落地即消失",
          "CPS自动掉落：升级后果树自动产果，无需点击",
          "榨汁单位：每10颗库存橘子计为1杯橙汁，作为统一分享单位"
        ],
        "visual_language": "暖橙与草绿的自然果园色调，画布采用深褐到暗橙的黄昏渐变，右上角有朦胧太阳与半透明云朵，底部草地呈波浪起伏；橘子以圆形带绿叶图标下落，接住时溅射橙黄果汁粒子；右下角拟人化橘子吉祥物随节奏晃动。",
        "state_model": "oranges(库存橘子), shake(单次摇晃产量), cps(每秒自动掉落), bought[4](升级等级), falling[](活跃下落橘子对象数组：x,y,vy,r,life,gold), particles[](果汁溅射粒子数组), caught(累计接住数), missed(累计错过估算), t(全局时间), autoTimer(自动产果累加器), shakeOffset(树摇晃幅度)",
        "share_hook": "点击「分享收成」按钮自动生成并复制文案：'我在橘子摇晃果园接住了 X 颗橘子，榨了 Y 杯橙汁！'，以橙汁杯数作为核心攀比单位。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链无CDN",
          "单文件HTML自包含"
        ],
        "next_evolution_hooks": [
          "加入季节系统（春夏秋冬影响掉落速度与风向）",
          "加入连击倍率（连续接住触发果汁喷泉与双倍金橘子）",
          "加入果园装扮与稀有水果图鉴收集"
        ]
      }
    },
    {
      "id": "remix-office-loop-sort",
      "slug": "office-loop-sort",
      "file": "office-loop-sort.html",
      "description_file": "office-loop-sort.remix.json",
      "title": "夜班传单回路",
      "kind": "Remix",
      "source_file": "loop-sort-fake.html",
      "parent_slug": "loop-sort-fake",
      "lineage": [
        "loop-sort-fake",
        "office-loop-sort"
      ],
      "summary": "办公室主题的 Loop Sort 二创：把夜班单据从四侧投上回路，等同类三件沿环带贴到一起后整批清走。",
      "accent": "#9cefd8",
      "glyph": "环",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "办公室主题的 Loop Sort 二创：把夜班单据从四侧投上回路，等同类三件沿环带贴到一起后整批清走。",
        "core_loop": "玩家面对一圈不断前进的夜班传单回路，四侧各有一条投递线；每次点击任意一条投递线，最前面的单据就会压进对应入口格，然后随着整圈回路持续前进；只要三份同类单据在环带上连成一段，就会立刻整批处理掉；如果整圈先被不同单据堵满，这班夜路就算彻底卡死。",
        "controls": "单指点击底部四个投递按钮把对应单据塞进入口；点击“回路一步”手动推进一格；点击“重开这一圈”恢复固定投递序列。",
        "mechanics": [
          "四侧投递：不是直接拖拽排序，而是从四个入口选择哪一边先把单据送上回路，保留这条玩法最关键的入口判断",
          "环带自走：单据上带后会沿整圈持续前进，玩家要预判它下一次转到哪一侧时会和谁贴在一起",
          "三件即清：任意连续三件同类单据会立刻整批处理掉，留下空格继续接下一批",
          "入口堵塞：如果某个入口格被旧单据占住，这条投递线暂时无法再发，迫使玩家等回路先转开",
          "短局堵环：12 份固定单据、14 格回路，几十秒就能完整打一轮，也足够制造一两次明显卡顿"
        ],
        "visual_language": "把糖果色货箱换成冷绿夜班文书，深色玻璃回路板配发光入口，仍保持离线单文件、手机竖屏与轻量画布渲染。",
        "state_model": "state.belt 记录 14 格回路上当前每格的单据颜色或空位；state.trucks 保存四条投递线剩余序列和入口索引；state.cleared 统计已处理件数；state.moves 统计投递次数；state.mode 在 playing/won/lost 间切换。",
        "share_hook": "“把一整圈夜班堆单顺空了”比普通货箱分拣更贴合办公室梗，也方便继续扩到客服、物流或审批题材。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入第二套投递序列 seed",
          "加入冰格或门帘这类单个障碍",
          "加入限步达成文案"
        ]
      },
      "prompt": {
        "text": "把 Loop Sort 式卡车放货环带三连清改成办公室夜班传单主题，货箱换成邮件、审批、报销和排班单，保留四侧投放、环带前进和三件即清。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-office-stamp-away",
      "slug": "office-stamp-away",
      "file": "office-stamp-away.html",
      "description_file": "office-stamp-away.remix.json",
      "title": "工单盖章弹出",
      "kind": "Remix",
      "source_file": "hexa-away-fake.html",
      "parent_slug": "hexa-away-fake",
      "lineage": [
        "hexa-away-fake",
        "office-stamp-away"
      ],
      "summary": "办公室主题的 Hexa Away 二创：先把边缘工单流转走，再逐层清空整张审批盘。",
      "accent": "#95efd4",
      "glyph": "章",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "办公室主题的 Hexa Away 二创：先把边缘工单流转走，再逐层清空整张审批盘。",
        "core_loop": "玩家面对一团堆叠的六角审批工单，只能点击那些能顺着箭头直接流转出边界的单据；如果某张单据的箭路被其他工单挡住，就要先转动整盘审批视角，换出新的空边；当所有工单都被流转走，这轮审批盘才算彻底清空。",
        "controls": "单指点击可直接流转的六角工单；左右按钮或左右划动旋转整盘；点击“重开审批盘”恢复固定布局。",
        "mechanics": [
          "顺箭头弹出：每张工单只有在箭头指向的整条路径都畅通时才能直接流转走，复刻这个玩法最关键的判断压力",
          "转盘换边：玩家需要不断旋转六角团，找出不同视角下新露出的可弹出边缘块",
          "六角布局：不是立方方块，而是蜂窝式六边形堆叠，视觉上和当前库里的 Tap Away 家族拉开差异",
          "短局固定盘：十几块工单、一个固定 seed，几十秒就能完整刷完一盘",
          "逐层露出：外层先走，中心与上层块随后变成可操作目标，维持连锁揭示节奏"
        ],
        "visual_language": "冷绿夜班办公室配色，把彩色六角块换成不同流程单据，玻璃审批板承接画布场景，继续保持离线单文件和手机竖屏。",
        "state_model": "state.tiles 记录每张工单的轴坐标、高度、箭头方向和激活状态；state.yaw 记录当前六向旋转；state.cleared 统计已流转工单数；state.mode 在 playing/won 间切换。",
        "share_hook": "“把整盘待审批工单一把盖空了”天然适合办公室二创梗图。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入第二套 hex seed",
          "加入一步提示按钮",
          "加入限旋转挑战文案"
        ]
      },
      "prompt": {
        "text": "把 Hexa Away 式六角箭头弹出盘改成办公室审批主题，六角块换成采购、报销、差旅等工单，保留只能顺箭头流转和转盘换角度。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-desk-clutter-triples",
      "slug": "desk-clutter-triples",
      "file": "desk-clutter-triples.html",
      "description_file": "desk-clutter-triples.remix.json",
      "title": "工位清台局",
      "kind": "Remix",
      "source_file": "triple-match-fake.html",
      "parent_slug": "triple-match-fake",
      "lineage": [
        "triple-match-fake",
        "desk-clutter-triples"
      ],
      "summary": "办公室主题的堆物三连清二创：先拿露头杂件，再把同类工位物凑成三件整盒归档。",
      "accent": "#92f0d9",
      "glyph": "台",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "办公室主题的堆物三连清二创：先拿露头杂件，再把同类工位物凑成三件整盒归档。",
        "core_loop": "玩家面对一团堆在工位桌面的杂件，只能先点当前露在最上层的工牌、鼠标、便签、咖啡杯、线材和长尾夹；每点一件就会掉进下方七格待归档盒，任意同类累计到三件会立刻整盒归档清掉；如果暂存盒先被不同杂件塞满，或者倒计时先归零，这张桌面就算清台失败。",
        "controls": "单指点击当前可见的最上层杂件；点击“重开这张桌”恢复固定堆物布局。",
        "mechanics": [
          "顶层遮挡：被更高层杂件压住的东西不能直接拿，必须先剥掉上层，保留这个赛道最关键的视觉搜索压力",
          "七格托盘：所有点击物都会先进七格暂存，三件同类才会立刻消掉，不同类堆太多就直接输",
          "三件即清：不需要拖拽或交换，只要凑够三件同类就立刻给出很强的整理反馈",
          "隐藏露出：下层物件随着上层清掉逐渐露头，维持“越清越能看见新东西”的节奏",
          "短局计时：单局几十秒内必须把整桌清掉，复刻热门堆物三连盘常见的时间压迫"
        ],
        "visual_language": "把大众生活杂物换成工位清台主题，深青桌面配冷色玻璃盒与高对比标签，继续保持离线单文件、手机竖屏和轻量 DOM 交互。",
        "state_model": "state.items 记录每件杂件的类型、层级、坐标和是否仍在桌面上；state.tray 保存当前七格待归档盒；state.remaining 保存每个类型还剩多少件未清；state.timeLeft 是本局剩余时间；state.mode 在 playing/won/lost 间切换。",
        "share_hook": "“这张工位桌我一把清台了”比普通日用品更适合办公室梗图和后续同主题扩展。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入第二套堆物 seed",
          "加入风扇或磁吸类最小辅助道具",
          "加入连清统计文案"
        ]
      },
      "prompt": {
        "text": "把 Triple Match 3D / Match Factory 式堆物三连清改成办公室清台主题，杂物换成工牌、鼠标、咖啡、便签和线材，保留顶层遮挡、七格托盘和三件即消。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-office-snack-stock",
      "slug": "office-snack-stock",
      "file": "office-snack-stock.html",
      "description_file": "office-snack-stock.remix.json",
      "title": "茶水间补货局",
      "kind": "Remix",
      "source_file": "goods-sort-fake.html",
      "parent_slug": "goods-sort-fake",
      "lineage": [
        "goods-sort-fake",
        "office-snack-stock"
      ],
      "summary": "办公室茶水间主题的货架理货二创：只拿前排零食饮料，三件同类立刻整盒补走。",
      "accent": "#9df0d4",
      "glyph": "柜",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "办公室茶水间主题的货架理货二创：只拿前排零食饮料，三件同类立刻整盒补走。",
        "core_loop": "玩家面对三层茶水间零食柜，只能点击每条货道最前排可见的一件补给，把它送进下方七格补货暂存台；任意同类累计到三件会立刻整盒补走清空；前排拿走后，后排库存会自动补到最前面；如果暂存台先被不同物件塞满，这面柜就算整理失败。",
        "controls": "单指点击任意货道当前最前排的一件；点击“重开这面柜”恢复固定补货布局。",
        "mechanics": [
          "前排可拿：每条货道永远只暴露一件前排货，必须先处理近端库存，保留货架理货类最关键的拿取节奏",
          "后排补位：前排一走，后排自然露出，形成持续的小揭示反馈",
          "七格暂存：拿起的补给先进七格暂存，三件同类才会整盒补走，不同品类堆太多就会堵台",
          "三件即清：没有拖拽换位，纯点击选择，尽量用最小交互复刻热门理货盘的短线判断",
          "短局货架：18 件物品、9 条货道，十几秒到几十秒就能完整刷完一轮"
        ],
        "visual_language": "把大众超市货架换成夜间办公室茶水间，深色柜体配冷绿灯箱、简化零食饮料图标和玻璃感暂存条，继续保持离线单文件与竖屏 DOM 结构。",
        "state_model": "state.lanes 记录每条货道所属柜层和从前到后的库存序列；state.tray 保存当前七格补货暂存；state.remaining 保存各品类剩余件数；state.cleared 统计已整盒补走数量；state.mode 在 playing/won/lost 间切换。",
        "share_hook": "“把茶水间零食柜一把理顺了”比普通商超货架更适合办公室梗图和后续同题材二创。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入第二套货道 seed",
          "加入限步目标",
          "加入补货连击文案"
        ]
      },
      "prompt": {
        "text": "把 Goods Sort 式货架理货盘改成办公室茶水间补货主题，商品换成冷萃、茶包、饼干、杯面和气泡水，保留前排取货、后排补位和七格三件即清。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-office-badge-stack",
      "slug": "office-badge-stack",
      "file": "office-badge-stack.html",
      "description_file": "office-badge-stack.remix.json",
      "title": "工牌六角归档",
      "kind": "Remix",
      "source_file": "hexa-sort-fake.html",
      "parent_slug": "hexa-sort-fake",
      "lineage": [
        "hexa-sort-fake",
        "office-badge-stack"
      ],
      "summary": "办公室主题的 Hexa Sort 二创：先腾空归档栏，再把同部门工牌叠满一柱整批收走。",
      "accent": "#9ff0d1",
      "glyph": "档",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "办公室主题的 Hexa Sort 二创：先腾空归档栏，再把同部门工牌叠满一柱整批收走。",
        "core_loop": "玩家面对七根蜂巢式归档栏，只能搬运每栏最上方连续相同部门的一段工牌；把它们倒进空栏，或倒到同部门顶牌上继续叠高；任意一栏叠满四张同部门工牌就会整栏直接归档消失，直到五个部门都被清空。",
        "controls": "单指先点源栏锁定，再点空栏或同部门顶牌栏执行搬运；再次点同一栏取消选择；点击“重开这一栏”恢复固定盘面。",
        "mechanics": [
          "顶层连续搬运：不是一张一张挪，而是顶层连着的同部门整段一起滑走，复刻 Hexa Sort 最关键的爽点",
          "空栏缓冲：两根空栏负责中转，玩家先腾位再归并，形成连续短线决策",
          "满柱即清：四张同部门叠满整栏会直接整批归档，给出很强的节奏反馈",
          "蜂巢布局：七栏按六角蜂窝排开，不再是试管或直排瓶子，视觉和操作都更贴近这个玩法族",
          "固定短局：五种部门牌、两根缓冲栏，几十秒到一两分钟就能完整复盘一轮"
        ],
        "visual_language": "冷绿办公夜班配色，六角工牌取代普通色块，归档栏像玻璃文件槽，仍保持单文件竖屏与纯画布渲染。",
        "state_model": "state.columns 记录七个归档栏自底向上的部门牌序列；state.selected 记录当前源栏；state.cleared 保存已整批归档的部门；state.moves 统计搬运步数；state.mode 在 playing/won 间切换。",
        "share_hook": "“我把五个部门的工牌一把归完了”很像办公室梗图，也方便继续往归档、排班、审批主题扩。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入更多蜂巢盘面 seed",
          "加入一步撤回",
          "加入限步三星文案"
        ]
      },
      "prompt": {
        "text": "把 Hexa Sort 式六角堆叠分色盘改成办公室归档主题，六角块换成不同部门工牌，保留整段搬运和满柱整批清空。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-night-shift-crate-out",
      "slug": "night-shift-crate-out",
      "file": "night-shift-crate-out.html",
      "description_file": "night-shift-crate-out.remix.json",
      "title": "夜班货架出箱",
      "kind": "Remix",
      "source_file": "tap-away-fake.html",
      "parent_slug": "tap-away-fake",
      "lineage": [
        "tap-away-fake",
        "night-shift-crate-out"
      ],
      "summary": "夜班仓储主题的 3D 出块二创：先推出外层货箱，再靠旋转货架把整架清空。",
      "accent": "#8ef6d8",
      "glyph": "箱",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "夜班仓储主题的 3D 出块二创：先推出外层货箱，再靠旋转货架把整架清空。",
        "core_loop": "玩家面对一团堆在夜班货架上的立体货箱，只要某个箱子的贴纸箭头方向没有别箱阻挡，点它就会顺着货道直接推出货架；中层和内层暂时被外壳包住时，需要先左右旋转货架，换一个角度继续拆露在外面的箱子，直到 15 个货箱全部出完。",
        "controls": "单指点货箱尝试推出；左右滑动或点“左转 / 右转”旋转货架；点击“重开这架”恢复固定堆叠。",
        "mechanics": [
          "箭头即出路：每个货箱都绑定一个固定推出方向，只要那条线上没有别箱就会立刻出架",
          "外层先拆：内层货箱天然被外层包住，必须先清掉包壳，保留 Tap Away 最核心的剥层爽点",
          "旋转找角度：不能平移整团，只能旋转视角重新判断哪些货箱已经露在边缘",
          "无时间压力：没有计时和道具，只靠顺序与空间判断制造短线策略",
          "固定短局：单团 15 箱，十几秒到几十秒就能完整复盘一轮"
        ],
        "visual_language": "把高饱和彩色方块换成冷色夜班货箱、仓储标签和低照度货架，继续保持离线单文件、手机竖屏和纯画布渲染。",
        "state_model": "state.blocks 保存每个货箱的 3D 坐标、箭头方向、颜色标签和是否仍在架上；state.yaw 记录当前货架旋转角度；state.cleared 记录已推出数量；state.mode 在 playing/won 间切换。",
        "share_hook": "“这一架终于拆空了”比普通方块更像打工人夜班梗图，也方便继续往仓储题材扩。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入第二套更厚的 3x3x3 牌面",
          "加入上下倾斜视角切换",
          "加入最少步数或最快清架文案"
        ]
      },
      "prompt": {
        "text": "把 Tap Away 式 3D 箭头出块改成夜班仓储主题，彩块换成不同标签货箱，保留旋转货架和顺着箭头推出外层箱子的节奏。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-office-folder-jam",
      "slug": "office-folder-jam",
      "file": "office-folder-jam.html",
      "description_file": "office-folder-jam.remix.json",
      "title": "工位文件归槽",
      "kind": "Remix",
      "source_file": "color-block-jam-fake.html",
      "parent_slug": "color-block-jam-fake",
      "lineage": [
        "color-block-jam-fake",
        "office-folder-jam"
      ],
      "summary": "办公室主题的彩块滑门二创：先给大文件夹让路，再把所有部门件滑进对应收纳槽。",
      "accent": "#8ae8ff",
      "glyph": "档",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "办公室主题的彩块滑门二创：先给大文件夹让路，再把所有部门件滑进对应收纳槽。",
        "core_loop": "玩家面对一块被柜体挡住的 6x6 工位归档板，先选中文件夹，再朝四个方向一划；文件夹会沿空路一直滑到停点，若正好贴到同部门收纳槽边缘就会直接归档离场；把大文件夹先挪走、为后排小件腾出通道，直到整盘文件都滑进各自槽位。",
        "controls": "单指点中文件夹后朝四个方向滑动，或使用下方方向按钮微调；点击“重开这一层”恢复固定牌面。",
        "mechanics": [
          "任意方向滑动：不同于固定箭头位移，这类彩块可以朝四个方向尝试，直到撞到柜体或别的文件夹才停下",
          "同色门口离场：只有对应部门文件夹贴到自己的收纳槽边缘时才会立刻消失，保留 Color Block Jam 的核心目标",
          "尺寸差异：盘里同时有长条夹和小件夹，必须先处理占位最大的长条件",
          "固定障碍：柜体不会移动，只负责制造窄通道和卡位，强化短线空间规划",
          "短局复玩：单盘几步到十几步即可解完，天然适合快速连刷和再二创"
        ],
        "visual_language": "把亮色彩块换成冷色办公室文件夹与收纳槽，深蓝背景配玻璃感面板，仍保持离线单文件和手机竖屏的轻量节奏。",
        "state_model": "state.blocks 保存每个文件夹的行列位置、尺寸、颜色和是否已归档；state.selectedId 记录当前被选中的文件夹；state.moves 统计推档次数；state.mode 在 playing/won 间切换。",
        "share_hook": "“把一层文件一次性归槽完了”很像办公室段子截图，也适合作为同一玩法线的轻主题二创。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入更多固定盘面 seed",
          "加入一步撤回",
          "加入更长的双格和三格文件夹组合"
        ]
      },
      "prompt": {
        "text": "把 Color Block Jam 式彩块滑门谜题改成办公室文件归档主题，彩块换成不同部门文件夹，出口换成收纳槽。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-subway-snake-shift",
      "slug": "subway-snake-shift",
      "file": "subway-snake-shift.html",
      "description_file": "subway-snake-shift.remix.json",
      "title": "地铁刷卡蛇",
      "kind": "Remix",
      "source_file": "snake-battle-fake.html",
      "parent_slug": "snake-battle-fake",
      "lineage": [
        "snake-battle-fake",
        "subway-snake-shift"
      ],
      "summary": "通勤主题的蛇局二创：单指变道、长按冲刺、吃刷卡点把列车长龙冲进榜单。",
      "accent": "#5dc2ff",
      "glyph": "蛇",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "通勤主题的蛇局二创：单指变道、长按冲刺、吃刷卡点把列车长龙冲进榜单。",
        "core_loop": "玩家操控一列蛇形通勤列车在竖屏大厅内单指变道，持续吃掉散落的刷卡点来增长车厢长度；长按冲刺可以快速抢点，但尾部会不断掉出票根，既可能被自己回收，也会给对手留下可抢资源；只要把列车长度冲到 40 就算通勤通关。",
        "controls": "手指在画布上拖动决定车头朝向；长按“长按冲刺”按钮或空格键进入加速；点击“重开”立即重置一局。",
        "mechanics": [
          "单指转向：车头始终朝最近指针方向平滑扭动，保留热门蛇局最核心的低门槛手感",
          "冲刺掉尾：长按冲刺显著提速，但会把尾部长度逐段抖成票根豆点，形成经典风险换速度",
          "撞身判负：只要蛇头蹭到任意蛇身就会立刻出局，逼玩家在换乘口做极短决策",
          "Bot 冲榜：四条 AI 列车也会抢点、撞线、爆豆，场面始终维持轻度 io 压迫",
          "短局目标：长度冲到 40 即胜，适合十几秒到几十秒的碎片复玩"
        ],
        "visual_language": "深蓝换乘大厅、荧蓝轨道网格、暖黄刷卡点与橙色票根，蛇身更像一串发光车厢，整体比原型更偏通勤夜色。",
        "state_model": "state.player 保存玩家列车的头部坐标、角度、长度与轨迹；state.bots 是四条 AI 列车；state.pellets 是大厅内散落的刷卡点与票根；state.mode 在 playing/won/lost 之间切换。",
        "share_hook": "“晚高峰我把地铁蛇冲到榜一了”这类结果文案天然适合截图传播。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入换乘高峰时段速度波动",
          "加入站台广播倒计时",
          "加入双蛇交错的更密车流 seed"
        ]
      },
      "prompt": {
        "text": "把贪吃蛇大作战式冲榜局改成地铁通勤主题，光豆换成刷卡点，冲刺掉出票根，整体更像晚高峰换乘。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-night-shift-screws",
      "slug": "night-shift-screws",
      "file": "night-shift-screws.html",
      "description_file": "night-shift-screws.remix.json",
      "title": "夜班拆钉台",
      "kind": "Remix",
      "source_file": "screw-sorter.html",
      "parent_slug": "screw-sorter",
      "lineage": [
        "screw-sorter",
        "night-shift-screws"
      ],
      "summary": "夜班工位主题的拧钉排序局：拆挡板、收同色、避免夜班盒爆仓。",
      "accent": "#22f4ee",
      "glyph": "改",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "夜班工位主题的拧钉排序局：拆挡板、收同色、避免夜班盒爆仓。",
        "core_loop": "玩家先拆最上层可点击的彩钉，让被工牌和键帽压住的下层螺丝逐步露出；每拆下一枚都会进入下方六格夜班盒，凑满三枚同类自动归档清除；如果盒子被不同颜色塞满则失败，拆空全部层板即通关。",
        "controls": "触摸点击高亮可拆的螺丝；不可点击被上层挡住的螺丝；点击“重开这一板”重置关卡。",
        "mechanics": [
          "层叠遮挡：只有不被更高层板件覆盖的螺丝可以拆除",
          "三枚归档：同类螺丝进入六格盒后，累计三枚自动清空",
          "有限槽位：不同类颜色混装会快速占满盒子，迫使玩家规划顺序",
          "板件剥离：拆空某层板件上的螺丝后，该板件视觉上退出场景，露出更深层",
          "短局复玩：单局目标明确，适合十几秒到几十秒反复尝试"
        ],
        "visual_language": "冷色夜班工位风，深蓝背景加霓虹冷光，板件替换成工牌压板、键帽挡片与主控底板，收纳盒字符也改成工位符号。",
        "state_model": "state.screws 记录每枚螺丝的层级、颜色、位置与激活状态；state.tray 为六格夜班盒；state.mode 为 playing/won/lost；state.removed 记录已归档数量。",
        "share_hook": "结果文案天然适合截图分享，比如“我把夜班拆钉台一板清空了”或“夜班盒又爆仓了”。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保留 printer artifact 元数据与页面契约"
        ],
        "next_evolution_hooks": [
          "加入限时夜班倒计时",
          "加入特殊锁钉与万能空槽",
          "加入每日板面 seed 与排行榜文案"
        ]
      },
      "prompt": {
        "text": "改成夜班工位主题，板材换成工牌和键帽，反馈更冷更硬。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-parcel-screw-boxes",
      "slug": "parcel-screw-boxes",
      "file": "parcel-screw-boxes.html",
      "description_file": "parcel-screw-boxes.remix.json",
      "title": "分拨拆钉台",
      "kind": "Remix",
      "source_file": "screw-box-blitz.html",
      "parent_slug": "screw-box-blitz",
      "lineage": [
        "screw-box-blitz",
        "parcel-screw-boxes"
      ],
      "summary": "快递分拨主题的彩盒拆钉二创：先拆挡板，再把同色封签塞进对应包裹框。",
      "accent": "#ffb347",
      "glyph": "箱",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "快递分拨主题的彩盒拆钉二创：先拆挡板，再把同色封签塞进对应包裹框。",
        "core_loop": "玩家先从上层可点击位置拆出封签钉，露出被包材压住的下层钉件；每枚钉件会进入对应颜色的包裹框，同色累计到三枚就会立刻整框出库清空；如果四个包裹框总待处理量堆到六枚，分拨台就会堵塞失败。",
        "controls": "触摸点击发亮的可拆封签钉；被高层包材遮挡的钉件不能点；点击“重开这一局”恢复固定板面。",
        "mechanics": [
          "层叠遮挡：只有最上层不被遮住的钉件才能被拆出",
          "同色入框：拆下来的钉件直接进入对应颜色的包裹框，不再进入混合暂存栏",
          "三枚即出库：任意颜色累计到三枚会立刻清空该框，形成明确节奏点",
          "六格堵塞失败：所有包裹框的待处理量合计到六枚时失败，逼玩家按颜色规划顺序",
          "短局强复盘：板面固定、反馈清晰，适合反复优化拆钉路径"
        ],
        "visual_language": "把工业拆板主题换成快递分拨台：暖橙背景、纸箱色挡板、四色包裹框，钉件标签则改成急件与色签的分拨符号。",
        "state_model": "state.screws 记录每枚钉件的层级、颜色、位置与激活状态；state.bins 记录四个包裹框当前各自待处理数量；state.mode 为 playing/won/lost；state.removed 记录已出库数量。",
        "share_hook": "“这车封签又把分拨台堵死了”这类失败文案很适合做梗图，成功清空时也有明确的收尾截图点。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保留 printer artifact 元数据与页面契约"
        ],
        "next_evolution_hooks": [
          "加入万能快递框",
          "加入限时快件倒计时",
          "加入第二块更密的分拨板面"
        ]
      },
      "prompt": {
        "text": "把同色彩盒拆钉局改成快递分拨台主题，盒子换成包裹框，保留三枚同色立即出库的节奏。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-office-pin-pile",
      "slug": "office-pin-pile",
      "file": "office-pin-pile.html",
      "description_file": "office-pin-pile.remix.json",
      "title": "工位夹签归档",
      "kind": "Remix",
      "source_file": "screwdom-fake.html",
      "parent_slug": "screwdom-fake",
      "lineage": [
        "screwdom-fake",
        "office-pin-pile"
      ],
      "summary": "办公室主题的针位拆钉二创：只处理每根柱子的顶层夹签，三张同部门立刻整框归档。",
      "accent": "#97f0ff",
      "glyph": "签",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "办公室主题的针位拆钉二创：只处理每根柱子的顶层夹签，三张同部门立刻整框归档。",
        "core_loop": "玩家面对五根竖向夹签柱，只能处理每根柱子最上层那张部门夹签；第一次点击用于锁定当前顶层颜色，第二次点击同一根柱子就把它送进底部对应部门归档框；只要某个部门累计到三张就会立刻整框归档清空，而如果四个框位累计待处理量涨到六张则失败。",
        "controls": "单指点击任意夹签柱最上层标签进行“选中 -> 拆下”两段操作；点到空白区域会取消选中；点击“重开这一盘”恢复固定牌面。",
        "mechanics": [
          "只拆顶层：任何时候都只能操作每根柱子最上面露出的那张夹签，保留 Screwdom 最核心的顺序压力",
          "同色整框：底部每个部门框最多先暂存两张，第三张入框时立即整框清空，形成明确节奏点",
          "有限待处理：四个部门框的待清总量达到六张就失败，迫使玩家提前规划颜色顺序",
          "纯针位堆叠：没有额外道具、移动或 meta，只靠竖向堆叠和底部箱位制造短线策略",
          "固定短局：五根柱、十七张夹签的固定牌面几十秒内即可复盘一轮"
        ],
        "visual_language": "深蓝办公室夜班底色，竖向针柱和部门夹签取代工业螺丝模型，底部四个归档框保持纯色和大字标签，继续遵守单文件竖屏契约。",
        "state_model": "state.pins 保存五根夹签柱当前的颜色栈；state.selected 记录是否已锁定某根柱子的顶层；state.bins 保存四个部门框当前待清数量；state.removed 记录已归档总数；state.mode 为 playing/won/lost。",
        "share_hook": "“这盘归档又被客服签卡死了”这种结果文案很像办公室段子，适合继续往工位主题扩。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入第二块更深的夹签柱牌面",
          "加入一步撤销",
          "加入每日固定 seed 与最优步数文案"
        ]
      },
      "prompt": {
        "text": "把 Screwdom 式针位堆叠拆钉改成办公室归档主题，钉帽换成部门夹签，底部箱位换成归档框。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-overtime-pixel-loop",
      "slug": "overtime-pixel-loop",
      "file": "overtime-pixel-loop.html",
      "description_file": "overtime-pixel-loop.remix.json",
      "title": "加班像素回路",
      "kind": "Remix",
      "source_file": "pixel-loop-fake.html",
      "parent_slug": "pixel-loop-fake",
      "lineage": [
        "pixel-loop-fake",
        "overtime-pixel-loop"
      ],
      "summary": "夜班工位主题的像素环流二创：处理头同色消件，五个夜班槽一旦报废就会堵死全局。",
      "accent": "#6ee7ff",
      "glyph": "班",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "夜班工位主题的像素环流二创：处理头同色消件，五个夜班槽一旦报废就会堵死全局。",
        "core_loop": "玩家面对一条绕着像素任务板循环移动的杂务环带，持续把当前处理头部署到下方空槽；已部署处理头会自动拦截同色工单并点亮中间像素板，电量耗尽后会变成废槽，需要玩家手动清走；在堆单上限与五格废槽之间维持平衡，直到整块像素板被点亮。",
        "controls": "点击下方空槽部署当前处理头；点击已报废槽位可立刻清槽；点击“重开这一环”恢复固定循环序列。",
        "mechanics": [
          "实时环带：工单沿固定路径持续绕圈，拖久就会形成稳定压迫",
          "同色自动拦截：处理头只会清掉自己颜色的工单，玩家要先分配有限槽位",
          "五格堵槽：每个处理头只有固定电量，用尽会占住槽位，全部报废会直接失败",
          "像素点亮：每次正确拦截都会把中间任务板点亮一格，形成清晰的进度反馈",
          "固定序列短局：颜色与来件顺序是确定的，天然适合反复复盘最优部署节奏"
        ],
        "visual_language": "夜班工位主题，深蓝黑底、冷青发光环带，中间像素板像发亮任务屏，颜色字块全部原创且无外部素材。",
        "state_model": "state.carriers 保存环带工单的颜色与位置；state.slots 记录五个处理槽的颜色、电量与报废状态；state.nextColor 为待部署处理头；state.overflow 是漏件计数；state.painted 记录已点亮像素格。",
        "share_hook": "“我把整块加班像素屏一把点亮了”这种结果很适合做短视频封面或截图。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入更长的环带与多层像素图",
          "加入一次性清槽道具",
          "加入每日工单 seed 与极限分数"
        ]
      },
      "prompt": {
        "text": "把 Pixel Flow 式像素环流局改成夜班工位主题，彩块换成邮件、表格、会议和报销，保留实时堵槽压力。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-lunchbox-merge-pot",
      "slug": "lunchbox-merge-pot",
      "file": "lunchbox-merge-pot.html",
      "description_file": "lunchbox-merge-pot.remix.json",
      "title": "午饭合成锅",
      "kind": "Remix",
      "source_file": "brainrot-merge-pot.html",
      "parent_slug": "brainrot-merge-pot",
      "lineage": [
        "brainrot-merge-pot",
        "lunchbox-merge-pot"
      ],
      "summary": "午饭配菜主题的掉落合成锅：同类碰撞升级，越堆越大，别越过打包线。",
      "accent": "#5eead4",
      "glyph": "饭",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "午饭配菜主题的掉落合成锅：同类碰撞升级，越堆越大，别越过打包线。",
        "core_loop": "玩家在锅口上方左右瞄准，把当前配菜球投进容器；球体会在重力与碰撞下滚动堆叠，两颗同级食材接触后合成为更大一级；持续叠高直到触碰上方打包线即失败，分数来自每次升级合成。",
        "controls": "手指在锅口上方移动改变预览落点；点击屏幕把当前食材投下；点“重开这一锅”重置局面。",
        "mechanics": [
          "顶部投放：始终只有一个当前球与一个下一球提示，决策节奏非常快",
          "刚体堆叠：球体受重力、边界与相互挤压影响，会自然滚动寻找缝隙",
          "同级升级：只有相同等级球体能合成为更大一档，形成连锁空间管理",
          "翻锅失败：稳定堆叠高度越过警戒线并维持一段时间即结束",
          "短回合复玩：单局几十秒即可结束，天然适合反复开新局冲更高合成链"
        ],
        "visual_language": "便当午饭主题，冷青锅体配暖色食材，顶部虚线改成打包线，所有球面只用单字标签和纯色圆形表达，保持离线单文件的轻量感。",
        "state_model": "state.pieces 保存所有活跃球体的 tier、位置、速度与合成冷却；state.next 是下一个食材等级；state.hold 记录危险线停留时长；state.mode 为 aiming/falling/lost。",
        "share_hook": "“今天午饭合成到盒饭王了吗”这种结果文案天然能截图传播。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入连续合成 bonus",
          "加入每日固定投放序列",
          "加入锅体皮肤与结果卡"
        ]
      },
      "prompt": {
        "text": "把脑腐梗怪改成午饭配菜版，保留合成大西瓜式掉落手感和翻锅警戒线。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-office-raider-yard",
      "slug": "office-raider-yard",
      "file": "office-raider-yard.html",
      "description_file": "office-raider-yard.remix.json",
      "title": "工位摸鱼盘",
      "kind": "Remix",
      "source_file": "brainrot-raider-yard.html",
      "parent_slug": "brainrot-raider-yard",
      "lineage": [
        "brainrot-raider-yard",
        "office-raider-yard"
      ],
      "summary": "工位杂物主题的偷家合成盘：摆物件、拖同类升级、挂机摸鱼，还得拦住巡查经理。",
      "accent": "#22f4ee",
      "glyph": "盘",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "工位杂物主题的偷家合成盘：摆物件、拖同类升级、挂机摸鱼，还得拦住巡查经理。",
        "core_loop": "玩家用摸鱼币不断往工位盘里摆进便签、咖啡杯和表格等低阶杂物，再把两个同类拖到一起升级成更值钱的大件；工位会持续自动产出摸鱼币，但每隔一段时间巡查经理都会来收走最低阶物件，玩家必须在倒计时结束前按下拦截按钮，否则节奏会被打断。",
        "controls": "点击“摆一件”消耗货币生成新物件；按住并拖动物件，把同级物件拖到一起完成合成；巡查经理弹窗出现时点“拦截小偷”；点击“重开这块场”重置局面。",
        "mechanics": [
          "生成单位：花费随场上单位数上涨，逼玩家平衡扩张速度",
          "拖拽合成：只有同级物件可以合成，合成后会直接抬高秒产",
          "挂机产币：每个物件每秒稳定产出，形成明确的养成坡度",
          "定时防偷：巡查经理总是盯最低阶物件，形成轻度实时打断",
          "格子解锁：随着合成次数增长，工位盘会逐步开放更多位置"
        ],
        "visual_language": "夜班工位主题，深青背景加冷色霓虹，圆形单位改成工位杂物徽章，保持离线单文件和手机竖屏的轻量手感。",
        "state_model": "state.units 保存每个单位的 tier 与 slot；state.coins 与 totalIncome 组成养成经济；state.raid 记录当前巡查事件；state.slotCount 控制已解锁工位数。",
        "share_hook": "“经理一来我就被偷走三杯咖啡”这种结果文案很适合做轻吐槽截图。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入更强偷家事件",
          "加入随机 buff 物件",
          "加入结果卡和最高摸鱼币排行"
        ]
      },
      "prompt": {
        "text": "把偷家脑腐怪改成工位杂物主题，保留生单位、拖拽合成、产币和定时防偷。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-office-egg-run",
      "slug": "office-egg-run",
      "file": "office-egg-run.html",
      "description_file": "office-egg-run.remix.json",
      "title": "快递柜摸鱼蛋",
      "kind": "Remix",
      "source_file": "brainrot-egg-run.html",
      "parent_slug": "brainrot-egg-run",
      "lineage": [
        "brainrot-egg-run",
        "office-egg-run"
      ],
      "summary": "办公室快递盲盒二创：拿盒、拖回工位拆、持续产币，再截胡隔壁加急件。",
      "accent": "#34d399",
      "glyph": "件",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "办公室快递盲盒二创：拿盒、拖回工位拆、持续产币，再截胡隔壁加急件。",
        "core_loop": "玩家先花摸鱼币从快递柜传送带拿盲盒，把盒子直接拖回下方空工位开始拆；拆开的办公室摆件会持续产出摸鱼币，用于购买更高一级的盒子；与此同时，隔壁工区会周期性刷新一颗可截胡的加急件，玩家需要在窗口打开时点按钮把它拖走，补足高阶收益。",
        "controls": "点击“拿一盒”购买当前盒子；按住传送带或截胡区里的盒子并拖到下方空工位；窗口亮起时点击“截胡隔壁件”抢下高阶包裹；点击“重开这条线”恢复开局。",
        "mechanics": [
          "双传送带来源：上方固定是自购快递柜，另一条则是周期性出现的截胡窗口",
          "拖回工位：盒子必须放进空工位里才会开始拆，保留原作“买回来还得带回家”的手感",
          "定时孵化产币：每个工位都有独立拆盒进度，完成后转成稳定秒产摆件",
          "高阶解锁：随着场上摆件增加，自购盒子和截胡件会逐步升阶，复刻增长斜坡",
          "满位取舍：三格工位很快会塞满，错过腾位时截胡件会直接折现，形成短期策略点"
        ],
        "visual_language": "办公室快递柜主题，深青背景配薄荷绿高光，蛋和怪物都改成快递盒与工位摆件，用纯色图形和单字符号保持离线单文件轻量感。",
        "state_model": "state.eggs 保存传送带或工位中的盲盒、来源与拆盒进度；state.units 记录已拆出的摆件 tier 与工位位置；state.coins 和 incomeTotal 构成养成经济；state.raidTimer 驱动隔壁加急件窗口。",
        "share_hook": "“工位满了只能眼看加急件折现”这种办公室失败瞬间很适合截图传播。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入工位扩容槽位",
          "加入随机主管巡楼打断",
          "加入盲盒图鉴和最高摸鱼币成绩"
        ]
      },
      "prompt": {
        "text": "把 Collect Brainrot Egg 的买蛋-拖回基地-孵化产币-偷蛋窗口改成办公室快递盲盒题材，保持单屏小循环。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-courier-arrow-rush",
      "slug": "courier-arrow-rush",
      "file": "courier-arrow-rush.html",
      "description_file": "courier-arrow-rush.remix.json",
      "title": "快递箭阵",
      "kind": "Remix",
      "source_file": "arrow-escape-fake.html",
      "parent_slug": "arrow-escape-fake",
      "lineage": [
        "arrow-escape-fake",
        "courier-arrow-rush"
      ],
      "summary": "快递分拣主题的箭块解谜：外层先出站，给中间箭道腾路线。",
      "accent": "#fbbf24",
      "glyph": "站",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "快递分拣主题的箭块解谜：外层先出站，给中间箭道腾路线。",
        "core_loop": "玩家点击一枚朝出口方向没有阻挡的箭块，它会立刻从站台飞出；外层箭先清走后，中层与内层才会逐步露出通路；误点被挡住的箭会消耗一次容错，三次用完即失败。",
        "controls": "单指点击箭块尝试出站；按钮“重开这一局”重置固定棋盘。",
        "mechanics": [
          "单向出站：箭块只能沿自己的朝向笔直离场，不允许转弯",
          "外层剥离：外缘可行动作会逐步打开内层路径，形成连续爽点",
          "有限容错：错误点击会立刻消耗机会，逼玩家先看后点",
          "固定短局：同一面板十几秒到几十秒就能跑完一局，很适合连刷"
        ],
        "visual_language": "分拣站台主题，蜂蜜黄与深棕色面板，箭块像站内分流牌，整体保留单屏轻量气质。",
        "state_model": "state.tiles 保存每枚箭块的网格坐标、朝向与激活状态；state.hearts 记录剩余容错；state.cleared 记录已出站数量；state.mode 为 playing/won/lost。",
        "share_hook": "“我一把没压单清完快递箭阵”这种结果很适合截图。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入每日面板 seed",
          "加入传送带障碍",
          "加入连清评级文案"
        ]
      },
      "prompt": {
        "text": "把拔箭逃生改成快递分拣主题，保留从外层剥到内层的单指解谜节奏。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-office-hop-stack",
      "slug": "office-hop-stack",
      "file": "office-hop-stack.html",
      "description_file": "office-hop-stack.remix.json",
      "title": "工牌踩箱梯",
      "kind": "Remix",
      "source_file": "emoji-gator-hop.html",
      "parent_slug": "emoji-gator-hop",
      "lineage": [
        "emoji-gator-hop",
        "office-hop-stack"
      ],
      "summary": "夜班工位主题的纵向跳跃二创：托盘接跳、破箱会塌、咖啡徽章给一次猛冲。",
      "accent": "#7dd3fc",
      "glyph": "梯",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "夜班工位主题的纵向跳跃二创：托盘接跳、破箱会塌、咖啡徽章给一次猛冲。",
        "core_loop": "玩家控制一个工牌徽章在一串向上排列的文件托盘和纸箱间自动回弹，只需要左右接下一个落点；普通托盘稳定回弹，破箱只会承重一次，灰色危险托盘会直接让本局结束，而漂浮的咖啡徽章会把角色猛冲到更高的楼层。",
        "controls": "单指左右拖动控制落点，角色落到平台就会自动弹起；点击“重开这一跳”回到固定开局节奏。",
        "mechanics": [
          "自动弹跳：保留社交 App 彩蛋小游戏那种零学习成本，上手即玩",
          "纵向追镜头：镜头始终追着最高点走，失误掉屏就结束，短局复玩很强",
          "一次性破箱：黄箱踩过就塌，逼玩家及时横移换线",
          "危险托盘：灰色骷髅托盘碰到即死，保留原始玩法的明确惩罚点",
          "加速徽章：漂浮咖啡徽章提供强上冲，复刻原作里表情/道具触发的爽点"
        ],
        "visual_language": "把绿色鳄梯换成冷色工位托盘和纸箱，角色改成工牌徽章，保持单屏纵向跳跃和社交彩蛋游戏的轻量感。",
        "state_model": "state.player 保存横向位置、纵向速度和当前冲刺尾迹；state.platforms 记录不同平台类型与是否已损坏；state.pickups 记录漂浮咖啡徽章；state.cameraY 决定纵向追踪镜头；state.score 与 combo 管理当前高度与连踩表现。",
        "share_hook": "“夜班工牌连踩 80 层才掉下去”这种成绩天然适合截图分享。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入每日固定平台 seed",
          "加入好友最高层文案",
          "加入冲刺后短暂无敌特效"
        ]
      },
      "prompt": {
        "text": "把 TikTok 隐藏表情跳跃游戏改成夜班工位主题，保留自动弹跳、易碎台、危险台和表情/道具冲刺。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-milk-tea-sorter",
      "slug": "milk-tea-sorter",
      "file": "milk-tea-sorter.html",
      "description_file": "milk-tea-sorter.remix.json",
      "title": "奶茶封杯局",
      "kind": "Remix",
      "source_file": "marble-sort-fake.html",
      "parent_slug": "marble-sort-fake",
      "lineage": [
        "marble-sort-fake",
        "milk-tea-sorter"
      ],
      "summary": "奶茶备料主题的换杯分拣局：把同料倒进空杯或同料顶层，直到每杯单色。",
      "accent": "#f59e0b",
      "glyph": "茶",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "奶茶备料主题的换杯分拣局：把同料倒进空杯或同料顶层，直到每杯单色。",
        "core_loop": "玩家先点选一个顶部有配料的杯子，再点目标空杯或同色顶层杯，把顶部连续同类一次性倒过去；随着杯中层次逐步变纯，每个杯子最终只保留一种配料并装满四层即可过关。",
        "controls": "单指点击杯子进行“选源杯 -> 选目标杯”；再次点击源杯可取消；点击“重开这一局”恢复固定牌面。",
        "mechanics": [
          "单指换杯：一来一回只有两次点击，门槛极低",
          "连续倒料：源杯顶部连续同色会被成组移动，保留 Marble Sort 的真实手感",
          "目标约束：只能倒进空杯，或倒到同色顶层且有剩余容量的杯子",
          "固定短局：一面固定牌几十步内即可解完，天然适合碎片时间反复开局",
          "完成判定：所有非空杯都变成满四层单色后立刻通关"
        ],
        "visual_language": "暖色奶茶门店备料台，玻璃试管替成封杯杯体，配料只用单字与纯色圆点表示，不使用任何外部素材。",
        "state_model": "state.tubes 是每个杯子的颜色栈；state.selected 记录当前源杯；state.moves 记录完成的倒料手数；state.mode 为 playing/won。",
        "share_hook": "“今天把奶茶备料一把理顺了”这种结果很适合做短视频封面或截图。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入更多关卡 seed",
          "加入撤回一步",
          "加入封杯连击评级"
        ]
      },
      "prompt": {
        "text": "把 Marble Sort 式分色瓶改成奶茶备料台，保留选杯换杯的单指 sorting 节奏。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-office-loom-sort",
      "slug": "office-loom-sort",
      "file": "office-loom-sort.html",
      "description_file": "office-loom-sort.remix.json",
      "title": "工位理线板",
      "kind": "Remix",
      "source_file": "wool-sort-fake.html",
      "parent_slug": "wool-sort-fake",
      "lineage": [
        "wool-sort-fake",
        "office-loom-sort"
      ],
      "summary": "夜班工位主题的绕线分拣二创：先把四路线束理顺，再让工牌像素图完整亮出来。",
      "accent": "#60a5fa",
      "glyph": "线",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "夜班工位主题的绕线分拣二创：先把四路线束理顺，再让工牌像素图完整亮出来。",
        "core_loop": "玩家先点选一卷顶部可见的线束，再把顶部连续同色的一组绕进空卷轴或同色顶层卷轴；只要某个卷轴被整理成满四层单色，这一路就会被视为归束完成，同时点亮上方工牌面板里对应颜色的像素绣块；当所有非空卷轴都变成单色满卷，整块图案也随之亮满，当前短局结束。",
        "controls": "单指点击执行“选源卷轴 -> 选目标卷轴”；再次点击同一卷轴可取消；点击“重开这一绷”恢复固定牌面。",
        "mechanics": [
          "单指绕线：操作门槛与热门 sort puzzle 一样低，保持两次点击完成一次转移",
          "连续同色搬运：源卷顶部连续同色会被整段搬走，完整保留原玩法最关键的读顶层手感",
          "目标约束：只能绕进空卷轴，或绕到同色顶层且仍有剩余容量的卷轴",
          "显图反馈：每理顺一路颜色，就会同步亮起一部分工牌像素图，强化“排序不只是清关而是在补图”的爽点",
          "固定短局：固定六卷牌面几十步内可解完，天然适合反复优化路径"
        ],
        "visual_language": "深蓝夜班工位色板，卷轴像收线盘，预览区不再是手工绣片而是发光工牌像素面板，整体更像办公桌面的冷色收线工具。",
        "state_model": "state.spools 记录六个卷轴当前的颜色栈；state.selected 记录当前源卷轴；state.moves 记录排线手数；state.stitched 保存已经因归束而点亮的像素格；state.mode 在 playing/won 间切换。",
        "share_hook": "“终于把工位理线板一次收干净了”这种结果文案很像打工人梗图，适合继续往办公室题材扩。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入更多像素图 seed",
          "加入撤回一步",
          "加入更长的五色线束局"
        ]
      },
      "prompt": {
        "text": "把 Wool Sort 式绕线分拣改成夜班工位理线主题，保留同色绕线和逐步显图，但把绣片换成工牌面板。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-meeting-gridlock",
      "slug": "meeting-gridlock",
      "file": "meeting-gridlock.html",
      "description_file": "meeting-gridlock.remix.json",
      "title": "会议室别挨着",
      "kind": "Remix",
      "source_file": "zen-logic-fake.html",
      "parent_slug": "zen-logic-fake",
      "lineage": [
        "zen-logic-fake",
        "meeting-gridlock"
      ],
      "summary": "会议室座位版逻辑盘：按行列和分区排人，每块区域只能坐一位，还不能挨着。",
      "accent": "#7cc8ff",
      "glyph": "座",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "会议室座位版逻辑盘：按行列和分区排人，每块区域只能坐一位，还不能挨着。",
        "core_loop": "玩家面对一个被划成六块区域的 6x6 座位盘，需要把六位参会人安排进不同格子里；每一行、每一列、每个色块区域都只能出现一位，而且任何两位都不能横竖或斜角相邻，直到整盘约束同时成立。",
        "controls": "点击空格放下一位参会人；再点已放的人即可撤回；点到冲突格只会给出冲突原因，不会落子；点击“重开这盘”恢复空盘。",
        "mechanics": [
          "行列唯一：每一行、每一列最终都只能保留一位参会人",
          "色块唯一：每个彩色分区也只能放一位，直接复刻热门逻辑盘的区域约束",
          "斜角禁贴：八方向相邻都算冲突，保留原作最关键的高压限制",
          "自动排除：已放角色会自动让同行、同列、同区和相邻格变灰，形成扫雷式排除反馈",
          "唯一候选提示：当某行、某列或某分区只剩一个可放点时，会被高亮提示，复刻“只剩一格就该落子”的爽点"
        ],
        "visual_language": "把柔和小羊盘换成会议室座位图：冷色背景、彩色会议分区、圆点头像符号，仍旧保持单屏竖版和极简离线风格。",
        "state_model": "state.queens 保存当前已放角色的行列位置；forced 记录由行列分区推导出的唯一候选格；state.note 记录最近一次冲突或撤回提示；state.mode 在 playing/won 间切换。",
        "share_hook": "“终于把这 6 个人排开了”天然像办公室梗图，适合做轻度传播和再二创。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入每日盘面 seed",
          "加入手动叉号笔记层",
          "加入完成步数或误触统计"
        ]
      },
      "prompt": {
        "text": "把佛系逻辑羊盘改成会议室座位安排：保留每行每列每色块唯一、且不能相邻的硬约束。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-night-shift-shuttle",
      "slug": "night-shift-shuttle",
      "file": "night-shift-shuttle.html",
      "description_file": "night-shift-shuttle.remix.json",
      "title": "夜班摆渡车",
      "kind": "Remix",
      "source_file": "bus-jam-fake.html",
      "parent_slug": "bus-jam-fake",
      "lineage": [
        "bus-jam-fake",
        "night-shift-shuttle"
      ],
      "summary": "夜班园区主题的 Bus Jam 二创：点发对应班车，把门口这排工牌快速分流送走。",
      "accent": "#8be9ff",
      "glyph": "班",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "夜班园区主题的 Bus Jam 二创：点发对应班车，把门口这排工牌快速分流送走。",
        "core_loop": "玩家面对四列堵在夜班园区门口的工牌队列，只能处理每列最靠门的那张；下方三辆不同组别的摆渡车持续轮换，点中某辆车后，它会立刻带走当前所有能直接上车的同组工牌，前排一空，后排人才会继续露头。",
        "controls": "单指点击底部摆渡车发车；如果当前门口没有对应颜色的工牌，这辆车不会动；点击“重开这一班”恢复固定牌面。",
        "mechanics": [
          "前排可见约束：只有每列最靠门的那张工牌是可操作对象，完整保留 Bus Jam 的“先清前排再露后排”压力",
          "同色批量上车：一辆摆渡车发出后，会把当前所有能直接登车的同组工牌连续带走，形成爽快的链式揭露",
          "三车轮换：底部始终只给三辆当前车，旧车发走后新车顶上，保留对颜色次序的短线决策",
          "堵死判负：如果露出来的工牌颜色和眼前三辆车全部不匹配，整站会直接卡死失败",
          "固定短局：单局十几秒到几十秒，天然适合碎片时间复玩和截图传播"
        ],
        "visual_language": "把明亮通勤站换成冷色夜班园区：深蓝门岗、低饱和车灯、工牌标签替代普通乘客，整体更像凌晨换班的摆渡口。",
        "state_model": "state.lanes 保存四列门口队伍；state.buses 保存当前三个车位里的班车颜色、已载人数与发车动画；state.queueIndex 指向后续进站车辆；state.mode 在 playing/won/lost 间切换。",
        "share_hook": "“夜班门口又堵住了”或者“这班摆渡我一把清完”都很像办公室段子，适合拿来做封面和二创。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入更长的发车队列",
          "加入每日门口 seed",
          "加入一键提示下一辆该先发哪台"
        ]
      },
      "prompt": {
        "text": "把 Bus Jam 式乘客分流改成夜班园区摆渡车，乘客换成工牌队列，整体更冷更硬。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-office-seat-scramble",
      "slug": "office-seat-scramble",
      "file": "office-seat-scramble.html",
      "description_file": "office-seat-scramble.remix.json",
      "title": "工位让一让",
      "kind": "Remix",
      "source_file": "seat-away-fake.html",
      "parent_slug": "seat-away-fake",
      "lineage": [
        "seat-away-fake",
        "office-seat-scramble"
      ],
      "summary": "办公室主题的挪座二创：顺着箭头推开工椅，让整片工位区快速散场。",
      "accent": "#8ae8ff",
      "glyph": "座",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "办公室主题的挪座二创：顺着箭头推开工椅，让整片工位区快速散场。",
        "core_loop": "玩家面对一块 5x5 的拥挤工位盘，每张工牌工椅都只允许沿箭头方向直线滑动；如果前方一路通到边缘，工位就会直接撤出场外，否则只能先滑到最近空位，为别的工位腾出通道；把整盘工位全部送出走道就算过关。",
        "controls": "单指点击任意工位椅触发滑动；能直通边缘的会直接离场，被堵住但前方有空位的会先滑到空位；点击“重开这一层”恢复固定牌面。",
        "mechanics": [
          "单向滑动：每张工椅都绑定一个固定箭头，只能沿这一方向直线移动",
          "直通即离场：如果从当前位置到边缘没有阻挡，这张椅子会直接滑出工位区",
          "先挪后通：被其他椅子挡住时，只能先滑到最近空位，慢慢给后排让道",
          "固定短局：固定八张椅子的牌面几十秒内就能反复尝试，天然适合碎片复玩",
          "清盘收尾：全部工椅离场后立刻出现散场提示，形成明确截图点"
        ],
        "visual_language": "把原型里的乘客座位换成冷色办公室工位：深蓝地板、发光走道、彩色工牌椅背与极简箭头，整体更像夜班散场前的办公层。",
        "state_model": "state.seats 记录每张工椅的行列位置、箭头方向、标签与是否仍在场内；state.moves 统计推椅次数；state.mode 在 playing/won 间切换；render_game_to_text 会同时给出每张椅子下一步是 blocked/slide/exit。",
        "share_hook": "“终于把这一层工位全清空了”天然是打工人梗图文案，也方便继续往更多办公室谜题扩。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入更多固定工位 seed",
          "加入一步撤回",
          "加入连续离场的散场连击文案"
        ]
      },
      "prompt": {
        "text": "把 Seat Away 式挪座局改成办公室散场主题，乘客换成工牌，座椅换成工位椅，保留只沿箭头滑出通道的短线决策。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-overtime-carpool-jam",
      "slug": "overtime-carpool-jam",
      "file": "overtime-carpool-jam.html",
      "description_file": "overtime-carpool-jam.remix.json",
      "title": "下班拼车出库",
      "kind": "Remix",
      "source_file": "parking-jam-fake.html",
      "parent_slug": "parking-jam-fake",
      "lineage": [
        "parking-jam-fake",
        "overtime-carpool-jam"
      ],
      "summary": "办公室主题的 Parking Jam 二创：先疏通门口短车，再把下班拼车一台台放出园区。",
      "accent": "#9be9d4",
      "glyph": "车",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "办公室主题的 Parking Jam 二创：先疏通门口短车，再把下班拼车一台台放出园区。",
        "core_loop": "玩家面对一层被晚班拼车塞满的园区车位，每台车都只会顺着自己的车头方向往前开；如果前方车道完全打通，它就会直接出库，否则会先往前蹭到最近空位，继续给后排班车让路；只有先放掉出口边的小车，后排长车和竖停班车才会逐步得到通道，直到整层全部清空。",
        "controls": "单指点击任意拼车，车辆会立刻沿车头方向滑到尽头或直接出库；点击“重开这一层”恢复固定盘面。",
        "mechanics": [
          "车头朝向约束：每台车只能顺着自己的朝向前进，保留 Parking Jam 最核心的堵点判断",
          "先滑再出：前方没完全打通时，车辆会先占住最近空位，为下一辆腾出链式通道",
          "长短车混排：两格与三格车辆同时出现，必须先处理占位最恶心的长车或门口短车",
          "多出口压力：盘边不只一个闸口，需要读懂每辆车更接近哪一侧才能快速放行",
          "固定短局：单盘十辆车、几十秒到一两分钟即可通掉，天然适合碎片时间反复试顺序"
        ],
        "visual_language": "冷色夜班园区配色，普通车辆换成不同部门的拼车标签，出口做成发光闸口，保持单文件竖屏和纯画布停车场表现。",
        "state_model": "state.cars 记录每台车的行列、长度、朝向、颜色和是否仍在场内；state.selectedId 记录最近一次点中的车辆；state.moves 统计放车次数；state.escaped 统计已出库车辆；state.mode 在 playing/won 间切换。",
        "share_hook": "“终于把这层下班拼车都放出去了”很像打工人段子，也方便继续往园区、仓储、校车等题材扩。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入更多固定停车盘面",
          "加入按出口分类的放行统计",
          "加入更长的三格班车组合"
        ]
      },
      "prompt": {
        "text": "把 Parking Jam 式停车解堵改成办公室下班拼车主题，保留点车顺着车头滑出、先清门口短车再放后排长车的节奏。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-factory-bolt-jam",
      "slug": "factory-bolt-jam",
      "file": "factory-bolt-jam.html",
      "description_file": "factory-bolt-jam.remix.json",
      "title": "夜班进厂通车",
      "kind": "Remix",
      "source_file": "traffic-bolt-jam.html",
      "parent_slug": "traffic-bolt-jam",
      "lineage": [
        "traffic-bolt-jam",
        "factory-bolt-jam"
      ],
      "summary": "进厂主题的挪车二创：先疏通闸口，再把班车一台台送进厂门。",
      "accent": "#9ce8c4",
      "glyph": "厂",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "进厂主题的挪车二创：先疏通闸口，再把班车一台台送进厂门。",
        "core_loop": "玩家面对一层堵在厂门前的夜班班车，每台车都只会沿着自己的车头方向往前开；如果前方一路通到闸口，它就会直接滑进去，否则只能先蹭到最近空位，继续给别的班车腾路；只有先处理门口那几台短车和竖停小车，后排长车才会逐步打开通道，直到整层车都顺利进厂。",
        "controls": "单指点击任意班车触发滑动；能直通闸口的会直接进厂，否则先滑到最近空位；点击“重开这一班”恢复固定盘面。",
        "mechanics": [
          "车头朝向约束：每台车只能沿着自己的车头方向前进，保留热点挪车盘最关键的堵点判断",
          "先滑后通：当前路没完全打通时，车辆会先占住最近空位，制造连续腾位链条",
          "长短车混排：两格与三格班车并存，必须先动门口小车，后排长车才会真正松动",
          "多闸口读盘：三个不同边缘闸口同时存在，要读懂哪台车离哪个出口最近",
          "短局高复玩：固定十车盘面，几十秒到一两分钟就能完整试一轮，很适合碎片时间反复找顺序"
        ],
        "visual_language": "把泛用停车场换成低照度夜班厂门，普通车辆换成班组标签和冷绿闸口灯，保留单文件竖屏与纯画布堵车解盘手感。",
        "state_model": "state.cars 记录每台车的行列、长度、朝向、标签和是否仍在场内；state.moves 统计进车次数；state.escaped 统计已进厂车辆；state.mode 在 playing/won 间切换；render_game_to_text 给出每台车当前下一步是 blocked/slide/exit。",
        "share_hook": "“终于把这一班车全送进厂门了”天然带打工人梗感，也方便继续往园区、仓储、校门口等题材扩。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入第二套厂门盘面 seed",
          "加入按闸口分类的放行统计",
          "加入一步撤回或提示"
        ]
      },
      "prompt": {
        "text": "把今天热门“挪车打螺丝”盘改成夜班进厂通车主题，保留点车顺车头挪位、先清门口短车再放后排长车。",
        "voice_transcript": ""
      }
    },
    {
      "id": "remix-midnight-goose-rush",
      "slug": "midnight-goose-rush",
      "file": "midnight-goose-rush.html",
      "description_file": "midnight-goose-rush.remix.json",
      "title": "夜宵颠锅抓鸽王",
      "kind": "Remix",
      "source_file": "goose-ladle.html",
      "parent_slug": "goose-ladle",
      "lineage": [
        "goose-ladle",
        "midnight-goose-rush"
      ],
      "summary": "夜宵锅主题的抓鹅二创版：先过热身锅，再进高压第二锅把鸽王抓出来。",
      "accent": "#f97316",
      "glyph": "锅",
      "created_at": "2026-06-16T01:38:56.108Z",
      "agent_description": {
        "one_liner": "夜宵锅主题的抓鹅二创版：先过热身锅，再进高压第二锅把鸽王抓出来。",
        "core_loop": "玩家先在第一锅里快速理解“三个相同即消除”的规则，捞出第一只鸽子后立刻进入第二锅，物件数量和遮挡层级同步上升，必须靠更谨慎的点选和有限次数的颠锅把锅底鸽王翻出来。",
        "controls": "触摸点击最上层食材；当锅底露出鸽子时直接点它过关；点击“颠锅”打乱食材并压低部分遮挡层；第一锅结束后继续点同一按钮进入第二锅。",
        "mechanics": [
          "两段式难度：第一锅是十几件食材的热身局，第二锅直接切到满盘高遮挡局",
          "七格暂存栏：点到的食材先进入下方格子，凑满三个同类立刻消除",
          "锅底目标：并非必须清空所有物件，只要让底部鸽子暴露并被点击就算过锅",
          "有限颠锅：每锅可用次数固定，颠锅会重排可见物并下压几件上层食材",
          "倒计时压迫：热身锅和第二锅各自独立计时，第二锅在更短容错里放大失误感"
        ],
        "visual_language": "夜宵摊锅底气质，暖橙锅面配深棕背景，食材图标都压成简化单色图形，保持离线单文件的轻量感，同时把露鹅提示做成更醒目的锅底字幕。",
        "state_model": "state.levelIndex 标记当前是第几锅；state.tiles 记录现存食材的图标、坐标、层级和激活状态；state.tray 为七格暂存栏；state.timeLeft 与 state.shakes 管理每锅的高压资源；state.mode 在 playing/between/won/lost 间切换。",
        "share_hook": "“第一锅随便过，第二锅卡成狗”是这个类型天然的传播点，这版结果文案就围绕两锅反差来写。",
        "known_constraints": [
          "离线单文件",
          "移动竖屏优先",
          "无外链素材",
          "保持 printer artifact 契约"
        ],
        "next_evolution_hooks": [
          "加入每日锅面 seed",
          "加入省份/好友对战文案",
          "加入锅内食材轻微物理滚动以更贴近原作颠锅感"
        ]
      },
      "prompt": {
        "text": "把锅底三消做得更贴近抓大鹅的节奏：第一锅热身，第二锅立刻上强度，再把颠锅和露鹅做得更显眼。",
        "voice_transcript": ""
      }
    }
  ]
};
