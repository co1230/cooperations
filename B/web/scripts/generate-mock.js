// ========= 预生成 mock 数据脚本 =========
// 运行：node scripts/generate-mock.js
// 产出：src/mock/shops.json、src/mock/products.json
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'src', 'mock')
mkdirSync(outDir, { recursive: true })

// ---------- 确定性伪随机 ----------
let seed = 20260827
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
function randInt(min, max) {
  return min + Math.floor(rand() * (max - min + 1))
}
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)]
}
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---------- 分类 ----------
export const categories = [
  { id: 1, name: '手机数码', icon: '📱', children: ['手机', '平板', '耳机', '智能穿戴'] },
  { id: 2, name: '家用电器', icon: '🏠', children: ['冰箱', '空调', '洗衣机', '厨房家电'] },
  { id: 3, name: '服饰鞋包', icon: '👕', children: ['男装', '女装', '运动鞋', '箱包'] },
  { id: 4, name: '美妆护肤', icon: '💄', children: ['护肤', '彩妆', '香水', '个护'] },
  { id: 5, name: '食品生鲜', icon: '🍎', children: ['零食', '生鲜', '粮油', '饮料'] },
  { id: 6, name: '运动户外', icon: '⚽', children: ['健身', '骑行', '露营', '球类'] },
  { id: 7, name: '图书文娱', icon: '📚', children: ['小说', '童书', '文具', '影音'] },
]

// ---------- 千奇百怪的店铺命名素材 ----------
const shopAdj = ['星辰', '云端', '潮汐', '彩虹', '秘境', '银河', '喵窝', '芋泥', '薄荷', '晨雾', '野马', '鲸落', '萤火', '岛屿', '风铃', '拾光', '七月', '拾贰', '半糖', '微光', '雾里', '巷口', '山野', '星野', '暖阳', '皎月', '柠檬', '海盐', '青柠', '半夏']
const shopNoun = ['杂货铺', '小卖部', '旗舰店', '优选店', '研究所', '部落', '星球', '工厂', '食堂', '书坊', '衣橱', '匣子', '驿站', '梦工厂', '补给站', '实验室', '花园', '仓库', '博物馆', '放映室']
const shopSuffix = ['呀', '啊', '哦', '酱', '哎', '嘿', '呢', '啦']
const shopCoreWord = ['好物', '严选', '甄选', '爆款', '万物', '精选', '优选', '拾尚', '优品', '好店']
const cities = ['广东深圳', '浙江杭州', '广东广州', '上海', '北京', '四川成都', '江苏南京', '湖北武汉', '陕西西安', '福建厦门', '重庆', '湖南长沙', '山东青岛', '河南郑州']
const slogans = ['万物皆可入店', '只有你想不到', '品质这一块拿捏', '便宜也有好东西', '惊奇好物这里找', '每天上新一点点', '严选不将就', '让生活更好一点', '藏着一整座宝库', '进来就不要走啦', '比你想的更划算', '好物不用贵', '你的购物小乐园', '种类多到挑花眼']
const logos = ['🛍️', '🎪', '🎡', '🏪', '⭐', '🍭', '🏮', '🎈', '🌈', '🎯', '💎', '🍀']

// ---------- 商品系列：每个分类下多品牌×多系列，按型号展开成不同商品 ----------
// 结构：{ category, brand, series, base, type, models:[{model,prefix,desc}] }
const SERIES = []
const catMap = { 手机数码: 1, 家用电器: 2, 服饰鞋包: 3, 美妆护肤: 4, 食品生鲜: 5, 运动户外: 6, 图书文娱: 7 }

const phoneBrands = ['华讯', '小米飞', '荣耀星', 'vivo峰', 'oppo光', '真我', '红米', 'iQOO']
const phoneModels = {
  手机: { base: 1999, models: ['青春版', '标准版', 'Pro', 'Pro Max', 'Ultra', '旗舰版', 'S', 'SE', 'Note', 'Plus', 'Lite', '折叠屏', '新版', '青春Pro', '性能版', '大师版'] },
  平板: { base: 1999, models: ['Air', 'Pro', '标准版', 'Mini', 'Plus', 'Max', '2026款', '轻办公版', '游戏版'] },
  耳机: { base: 299, models: ['标准版', '降噪版', 'Pro', '青春版', '运动版', '游戏版', '半入耳版', '旗舰版'] },
  智能穿戴: { base: 899, models: ['标准版', 'Pro', '运动版', 'S', 'X', '儿童版', '尊享版'] },
}
phoneBrands.forEach((b, bi) => {
  Object.entries(phoneModels).forEach(([child, conf]) => {
    conf.models.forEach((m, mi) => {
      SERIES.push({ category: '手机数码', child, brand: b, series: `${b}${child} ${m}`, base: conf.base + mi * 150 + bi * 100, type: 'phone', model: m })
    })
  })
})

const elecBrands = ['美的莱', '格力王子', '海尔兄弟', '西门子风', '松下电', '飞利浦', '戴森', '小熊家']
const elecModels = {
  冰箱: { base: 2599, models: ['双门', '三门', '对开门', '十字对开', '法式', '风冷无霜', '迷你', '大容量'] },
  空调: { base: 2399, models: ['1匹', '1.5匹', '2匹', '3匹', '壁挂', '立柜', '变频', '一级能效'] },
  洗衣机: { base: 1999, models: ['滚筒', '波轮', '洗烘一体', '迷你', '大容量', '变频'] },
  厨房家电: { base: 399, models: ['破壁机', '电饭煲', '空气炸锅', '电磁炉', '电水壶', '微波炉', '烤箱', '绞肉机'] },
}
elecBrands.forEach((b, bi) => {
  Object.entries(elecModels).forEach(([child, conf]) => {
    conf.models.forEach((m, mi) => {
      SERIES.push({ category: '家用电器', child, brand: b, series: `${b}${child} ${m}`, base: conf.base + mi * 200 + bi * 120, type: 'generic', model: m })
    })
  })
})

const clothBrands = ['优衣尚', '森马家', '潮流前线', '韩都衣舍', '卡宾', '太平鸟', '美特斯邦', '真维斯']
const clothModels = {
  男装: { base: 199, models: ['休闲夹克', '衬衫', '卫衣', '西裤', '牛仔裤', '风衣', '羽绒服', 'POLO衫'] },
  女装: { base: 169, models: ['连衣裙', '针织衫', '半身裙', 'T恤', '大衣', '衬衫', '卫衣', '牛仔裤'] },
  运动鞋: { base: 329, models: ['跑鞋', '篮球鞋', '休闲鞋', '板鞋', '帆布鞋', '老爹鞋'] },
  箱包: { base: 159, models: ['双肩包', '斜挎包', '钱包', '行李箱', '手提包', '胸包'] },
}
clothBrands.forEach((b, bi) => {
  Object.entries(clothModels).forEach(([child, conf]) => {
    conf.models.forEach((m, mi) => {
      SERIES.push({ category: '服饰鞋包', child, brand: b, series: `${b}${child} ${m}`, base: conf.base + mi * 60 + bi * 30, type: 'clothes', model: m })
    })
  })
})

const beautyBrands = ['珀莱雅', '完美日记', '花西子', '薇诺娜', '相宜本草', '御泥坊', '百雀羚', '自然堂']
const beautyModels = {
  护肤: { base: 129, models: ['保湿面霜', '爽肤水', '精华液', '眼霜', '洗面奶', '面膜', '乳液', '防晒霜'] },
  彩妆: { base: 119, models: ['口红', '粉底液', '眼影盘', '眉笔', '睫毛膏', '气垫', '腮红'] },
  香水: { base: 199, models: ['淡香水', '浓香水', '香氛喷雾', '固体香水', '无酒精香氛'] },
  个护: { base: 69, models: ['洗发水', '沐浴露', '牙膏', '身体乳', '护手霜', '剃须刀'] },
}
beautyBrands.forEach((b, bi) => {
  Object.entries(beautyModels).forEach(([child, conf]) => {
    conf.models.forEach((m, mi) => {
      SERIES.push({ category: '美妆护肤', child, brand: b, series: `${b}${child} ${m}`, base: conf.base + mi * 30 + bi * 15, type: 'generic', model: m })
    })
  })
})

const foodBrands = ['三只松鼠', '良品铺子', '百草味', '沃隆', '卫龙', '洽洽', '来伊份', '好想你']
const foodModels = {
  零食: { base: 39, models: ['每日坚果', '肉脯', '薯片', '辣条', '饼干', '巧克力', '糖果', '果干'] },
  生鲜: { base: 59, models: ['车厘子', '苹果', '蓝莓', '草莓', '牛排', '虾仁', '三文鱼', '鸡蛋'] },
  粮油: { base: 49, models: ['大米', '面粉', '食用油', '酱油', '醋', '盐'] },
  饮料: { base: 25, models: ['矿泉水', '可乐', '果汁', '茶饮料', '气泡水', '酸奶'] },
}
foodBrands.forEach((b, bi) => {
  Object.entries(foodModels).forEach(([child, conf]) => {
    conf.models.forEach((m, mi) => {
      SERIES.push({ category: '食品生鲜', child, brand: b, series: `${b}${child} ${m}`, base: conf.base + mi * 5 + bi * 3, type: 'snack', model: m })
    })
  })
})

const sportBrands = ['迪卡侬', '李宁', '安踏', '特步', '鸿星尔克', '探路者', '骆驼', '北面']
const sportModels = {
  健身: { base: 129, models: ['蛋白粉', '哑铃', '瑜伽垫', '跑步机', '弹力带', '跳绳'] },
  骑行: { base: 499, models: ['山地车', '公路车', '头盔', '骑行服', '骑行手套'] },
  露营: { base: 159, models: ['帐篷', '折叠椅', '睡袋', '野餐垫', '露营灯', '烧烤架'] },
  球类: { base: 89, models: ['篮球', '足球', '羽毛球拍', '乒乓球拍', '网球拍'] },
}
sportBrands.forEach((b, bi) => {
  Object.entries(sportModels).forEach(([child, conf]) => {
    conf.models.forEach((m, mi) => {
      SERIES.push({ category: '运动户外', child, brand: b, series: `${b}${child} ${m}`, base: conf.base + mi * 80 + bi * 60, type: 'generic', model: m })
    })
  })
})

const bookBrands = ['中信出版', '人民文学', '磨铁图书', '读客文化', '果麦文化', '后浪', '新经典', '理想国']
const bookModels = {
  小说: { base: 58, models: ['悬疑精选', '科幻经典', '奇幻长篇', '青春文学', '推理大师'] },
  童书: { base: 45, models: ['绘本', '科普启蒙', '拼音故事', '益智游戏'] },
  文具: { base: 25, models: ['钢笔', '笔记本', '水性笔', '马克笔', '订书机', '修正带'] },
  影音: { base: 99, models: ['黑胶唱片', '蓝光碟', '桌游', '拼图', '乐器'] },
}
bookBrands.forEach((b, bi) => {
  Object.entries(bookModels).forEach(([child, conf]) => {
    conf.models.forEach((m, mi) => {
      SERIES.push({ category: '图书文娱', child, brand: b, series: `${b}${child} ${m}`, base: conf.base + mi * 12 + bi * 8, type: 'generic', model: m })
    })
  })
})

// ---------- 规格模板 ----------
const skuTemplates = {
  phone: [
    { spec: '颜色', options: ['曜石黑', '晨雾白', '松霜绿', '远山灰'] },
    { spec: '存储', options: ['8+128GB', '8+256GB', '12+256GB', '16+512GB'] },
  ],
  clothes: [
    { spec: '颜色', options: ['黑色', '白色', '卡其', '藏青'] },
    { spec: '尺码', options: ['S', 'M', 'L', 'XL', 'XXL'] },
  ],
  snack: [
    { spec: '口味', options: ['原味', '香辣', '海盐', '烧烤'] },
    { spec: '规格', options: ['小袋装', '家庭装'] },
  ],
  generic: [{ spec: '规格', options: ['标准版', '升级版', '旗舰版'] }],
}

let skuCounter = 0
function buildSku(template) {
  return template.map((s) => ({
    id: ++skuCounter,
    specName: s.spec,
    options: s.options.map((o, i) => ({
      id: ++skuCounter,
      label: o,
      stock: i % 5 === 4 ? 0 : 20 + i * 15 + randInt(0, 30),
    })),
  }))
}

function buildCombo(template, basePrice) {
  const dims = template.map((s) => s.options)
  const first = dims[0] || ['']
  const second = dims[1] || ['']
  const base = Number(basePrice) || 100
  const combos = []
  const isSingleDim = second.length === 0 || (second.length === 1 && second[0] === '')
  if (isSingleDim) {
    first.forEach((a, ai) => {
      combos.push({ key: a, price: Math.round(base * (1 + ai * 0.04)), stock: 30 + randInt(0, 80) })
    })
  } else {
    for (let ai = 0; ai < first.length; ai++) {
      for (let bi = 0; bi < second.length; bi++) {
        combos.push({
          key: `${first[ai]}|${second[bi]}`,
          price: Math.round(base * (1 + ai * 0.03 + bi * 0.04)),
          stock: 30 + randInt(0, 80),
        })
      }
    }
  }
  return combos
}

// ---------- 生成店铺 ----------
const TOTAL_SHOPS = 1000
const shops = []
const usedShopNames = new Set()
for (let i = 0; i < TOTAL_SHOPS; i++) {
  let name = ''
  for (let tries = 0; tries < 50; tries++) {
    const style = randInt(1, 4)
    if (style === 1) name = `${pick(shopAdj)}${pick(shopNoun)}`
    else if (style === 2) name = `${pick(shopAdj)}${pick(shopCoreWord)}${pick(shopSuffix)}`
    else if (style === 3) name = `${pick(shopAdj)}${pick(shopAdj)}${pick(shopNoun)}`
    else name = `${pick(shopCoreWord)}${pick(shopSuffix)}${pick(shopNoun)}`
    if (!usedShopNames.has(name)) break
  }
  usedShopNames.add(name)
  shops.push({
    id: i + 1,
    name,
    slogan: pick(slogans),
    desc: `${name}，${pick(slogans)}。${pick(['全品类好物', '别处买不到', '物美价廉', '每天秒杀', '正品保证', '包邮到家'])}。`,
    logo: pick(logos),
    followers: randInt(500, 200000),
    rating: Math.round((40 + rand() * 10) * 10) / 10,
    city: pick(cities),
  })
}

// ---------- 生成商品 ----------
// 目标 10000+：每个系列可生成多规格价位（颜色/存储等），但「不同型号 = 不同商品」
// 我们让每个 model 生成 getCount() 个变体商品（如多个款号/批次），凑足 1 万
const products = []
const reviewsPool = [
  { user: 'w***g', level: 5, time: '2026-07-12', content: '质量很好，和描述一致，客服态度也好，发货很快。', tag: '质量很好' },
  { user: '桐***雪', level: 4, time: '2026-07-18', content: '整体还不错，物流稍微慢了一点，其他都满意。', tag: '物流一般' },
  { user: 'q***8', level: 5, time: '2026-07-25', content: '包装很用心，没有破损，用起来手感很棒！', tag: '包装完好' },
  { user: '明***星', level: 3, time: '2026-08-02', content: '性价比还行，但和图片有一点点色差，能接受。', tag: '略有色差' },
  { user: '雾***er', level: 5, time: '2026-08-09', content: '第二次回购了，品质稳定，值得信赖！', tag: '回购' },
  { user: 'l***y', level: 4, time: '2026-08-15', content: '功能齐全，说明书详细，上手很快。', tag: '功能齐全' },
]

// 为了达到 10000+，每个商品按「款号/版本」扩展多个变体（不同款号=不同商品）
const modelSuffix = ['经典款', '新款', '时尚版', '尊享版', '青春版', '旗舰版', '轻享版', '珍藏版', '限量款', '海外版', '生肖定制', '大礼包']

let pid = 0
for (const s of SERIES) {
  const category = s.category
  const cat = categories.find((c) => c.name === category)
  const template = skuTemplates[s.type] || skuTemplates.generic
  const skus = buildSku(template)
  // 每个系列生成多个款号变体（不同款号 = 不同商品），凑足 1 万+
  const vars = randInt(7, 11)
  const suffixes = shuffle([...modelSuffix])
  for (let v = 0; v < vars; v++) {
    pid++
    const name = v === 0 ? `${s.series}` : `${s.series} ${suffixes[v % suffixes.length]}`
    const basePrice = s.base + randInt(0, 20)
    const combos = buildCombo(template, basePrice)
    const sales = randInt(30, 5000)
    const positive = 88 + randInt(0, 11)
    products.push({
      id: pid,
      name,
      category,
      categoryId: cat.id,
      shopId: randInt(1, TOTAL_SHOPS),
      brand: s.brand,
      desc: `${s.child} · ${name}，${pick(['品质之选', '口碑爆款', '性价比超高', '热销单品', '新品上架', '好评如潮'])}，${pick(['正品保障', '全国联保', '七天无理由', '最快次日达', '一件包邮'])}。`,
      price: basePrice,
      originalPrice: Math.round(basePrice * (1.2 + rand() * 0.3)),
      skus,
      combos,
      sales,
      positive,
      image: `https://picsum.photos/seed/p${pid}/600/600`,
      featured: pid <= 20,
    })
  }
  // reviews 不预存，由前端按需生成以减小文件体积
}

// ---------- 写出 ----------
writeFileSync(join(outDir, 'shops.json'), JSON.stringify(shops))
writeFileSync(join(outDir, 'products.json'), JSON.stringify(products))

console.log('店铺数:', shops.length)
console.log('商品数:', products.length)
console.log('分类数:', categories.length)
console.log('输出目录:', outDir)
