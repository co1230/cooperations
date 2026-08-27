// ============ mock 数据层（后续替换为成员A的真实后端接口） ============

export const categories = [
  { id: 1, name: '手机数码', icon: '📱', children: ['手机', '平板', '耳机', '智能穿戴'] },
  { id: 2, name: '家用电器', icon: '🏠', children: ['冰箱', '空调', '洗衣机', '厨房家电'] },
  { id: 3, name: '服饰鞋包', icon: '👕', children: ['男装', '女装', '运动鞋', '箱包'] },
  { id: 4, name: '美妆护肤', icon: '💄', children: ['护肤', '彩妆', '香水', '个护'] },
  { id: 5, name: '食品生鲜', icon: '🍎', children: ['零食', '生鲜', '粮油', '饮料'] },
  { id: 6, name: '运动户外', icon: '⚽', children: ['健身', '骑行', '露营', '球类'] },
  { id: 7, name: '图书文娱', icon: '📚', children: ['小说', '童书', '文具', '影音'] },
]

export const brands = ['优享', '品越', '科创', '臻选', '绿鲜', '悦动', '阅趣']

// 规格模板：颜色 + 尺码/容量
const skuTemplates = {
  phone: [
    { spec: '颜色', options: ['曜石黑', '晨雾白', '松霜绿'] },
    { spec: '存储', options: ['8+128GB', '8+256GB', '12+256GB'] },
  ],
  clothes: [
    { spec: '颜色', options: ['黑色', '白色', '藏青'] },
    { spec: '尺码', options: ['S', 'M', 'L', 'XL', 'XXL'] },
  ],
  snack: [
    { spec: '口味', options: ['原味', '香辣', '海盐'] },
    { spec: '规格', options: ['180g/袋', '360g/袋'] },
  ],
  generic: [{ spec: '规格', options: ['标准版', '套装版'] }],
}

const reviewsPool = [
  { user: 'w***g', level: 5, time: '2026-07-12', content: '质量很好，和描述一致，客服态度也好，发货很快。', tag: '质量很好' },
  { user: '桐***雪', level: 4, time: '2026-07-18', content: '整体还不错，就是物流稍微慢了一点，其他都满意。', tag: '物流一般' },
  { user: 'q***8', level: 5, time: '2026-07-25', content: '包装很用心，没有破损，用起来手感很棒，推荐购买！', tag: '包装完好' },
  { user: '明***星', level: 3, time: '2026-08-02', content: '性价比还行，但和图片有一点点色差，能接受。', tag: '略有色差' },
  { user: '雾***er', level: 5, time: '2026-08-09', content: '第二次回购了，品质稳定，值得信赖！', tag: '回购' },
  { user: 'l***y', level: 4, time: '2026-08-15', content: '功能齐全，说明书详细，上手很快。', tag: '功能齐全' },
]

let skuCounter = 0
const buildSku = (template) => {
  return template.specs.map((s) => ({
    id: ++skuCounter,
    specName: s.spec,
    options: s.options.map((o, i) => ({
      id: ++skuCounter,
      label: o,
      // 模拟不同选项的库存
      stock: (i % 3 === 0 ? 0 : 20 + i * 15),
    })),
  }))
}

// 生成商品的属性组合（用于展示可选的规格集合）
const buildCombo = (template) => {
  const dims = template.specs.map((s) => s.options)
  // 只生成前若干组合
  const combos = []
  const first = dims[0] || ['']
  const second = dims[1] || ['']
  let price = 100 + Math.round(Math.random() * 800)
  let count = 0
  for (const a of first) {
    for (const b of second) {
      if (count >= 4) break
      price += Math.round(Math.random() * 40)
      combos.push({
        key: `${a}|${b}`,
        price,
        stock: (a === first[1] && b === second[1]) ? 0 : 30 + Math.round(Math.random() * 80),
      })
      count++
    }
  }
  return combos
}

export const products = (() => {
  const templatesByType = { phone: skuTemplates.phone, clothes: skuTemplates.clothes, snack: skuTemplates.snack }
  const list = []

  const names = [
    ['手机数码', '量子旗舰 5G 智能手机', 'phone', '高清全面屏、大电池长续航、旗舰影像', 3999],
    ['手机数码', '降噪真无线蓝牙耳机', 'phone', '主动降噪、超长续航、低延迟', 499],
    ['手机数码', '轻薄平板电脑 11 英寸', 'phone', '2.5K 高分屏、四扬声器、手写笔支持', 2799],
    ['家用电器', '变频一级能效冰箱', 'generic', '风冷无霜、大容量分区、静音节能', 3299],
    ['家用电器', '智能变频空调 1.5 匹', 'generic', '一级能效、自清洁、手机智控', 2599],
    ['家用电器', '破壁料理机', 'generic', '高速电机、静音降噪、一键清洗', 699],
    ['服饰鞋包', '男士休闲夹克外套', 'clothes', '防风防水、简约百搭、春秋通勤', 499],
    ['服饰鞋包', '女士针织连衣裙', 'clothes', '柔软亲肤、修身显瘦、多种颜色', 329],
    ['服饰鞋包', '轻便透气跑步鞋', 'clothes', '缓震回弹、轻盈透气、抓地耐磨', 399],
    ['美妆护肤', '玻尿酸保湿面霜', 'generic', '深层补水、持久保湿、温和不刺激', 259],
    ['美妆护肤', '丝绒哑光口红', 'generic', '显色持久、丝绒质地、贴合唇部', 189],
    ['食品生鲜', '混合坚果每日坚果', 'snack', '多种坚果、独立小包、营养均衡', 128],
    ['食品生鲜', '手撕面包整箱', 'snack', '松软拉丝、奶香浓郁、早餐代餐', 39.9],
    ['运动户外', '专业健身蛋白粉', 'generic', '乳清蛋白、增肌塑形、多种口味', 298],
    ['运动户外', '便携露营折叠椅', 'generic', '加粗钢管、耐磨面料、承重强', 159],
    ['图书文娱', '长篇小说全集套装', 'generic', '精装典藏、含书签、纸质护眼', 198],
  ]

  names.forEach(([cat, name, type, desc, basePrice], idx) => {
    const template = skuTemplates[type] || skuTemplates.generic
    const skus = buildSku({ specs: template })
    const combos = buildCombo({ specs: template })
    // 每个商品固定 2~5 条评价
    const rvCount = 2 + (idx % 3)
    const reviews = reviewsPool.slice(idx % 3, (idx % 3) + rvCount)

    // 总销量 / 好评率
    const sales = 200 + ((idx * 137) % 4000)
    const positive = 92 + ((idx * 3) % 8)

    list.push({
      id: idx + 1,
      name,
      category: cat,
      categoryId: categories.find((c) => c.name === cat).id,
      brand: brands[idx % brands.length],
      desc,
      price: basePrice,
      originalPrice: Math.round(basePrice * 1.3),
      skus,
      combos,
      sales,
      positive,
      reviews: reviews.map((r, i) => ({ ...r, id: (idx + 1) * 100 + i, productId: idx + 1 })),
      image: `https://picsum.photos/seed/p${idx + 1}/600/600`,
      featured: idx < 6,
    })
  })
  return list
})()

// 用户信息（模拟当前登录用户）
export const currentUser = {
  id: 1,
  username: 'demo_user',
  nickname: '优购用户',
  phone: '138****8888',
  avatar: 'https://picsum.photos/seed/avatar/120/120',
}
