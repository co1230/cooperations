// ============ mock 数据层（预生成 JSON，后续替换为成员A的真实后端接口） ============
// 运行 scripts/generate-mock.js 可重新生成 JSON

import shopsData from './shops.json'
import productsData from './products.json'

export const categories = [
  { id: 1, name: '手机数码', icon: '📱', children: ['手机', '平板', '耳机', '智能穿戴'] },
  { id: 2, name: '家用电器', icon: '🏠', children: ['冰箱', '空调', '洗衣机', '厨房家电'] },
  { id: 3, name: '服饰鞋包', icon: '👕', children: ['男装', '女装', '运动鞋', '箱包'] },
  { id: 4, name: '美妆护肤', icon: '💄', children: ['护肤', '彩妆', '香水', '个护'] },
  { id: 5, name: '食品生鲜', icon: '🍎', children: ['零食', '生鲜', '粮油', '饮料'] },
  { id: 6, name: '运动户外', icon: '⚽', children: ['健身', '骑行', '露营', '球类'] },
  { id: 7, name: '图书文娱', icon: '📚', children: ['小说', '童书', '文具', '影音'] },
]

export const brands = ['华讯', '小米飞', '荣耀星', '美的莱', '优衣尚', '珀莱雅', '三只松鼠', '迪卡侬', '中信出版']

const reviewsPool = [
  { user: 'w***g', level: 5, content: '质量很好，和描述一致，客服态度也好，发货很快。', tag: '质量很好' },
  { user: '桐***雪', level: 4, content: '整体还不错，物流稍微慢了一点，其他都满意。', tag: '物流一般' },
  { user: 'q***8', level: 5, content: '包装很用心，没有破损，用起来手感很棒！', tag: '包装完好' },
  { user: '明***星', level: 3, content: '性价比还行，但和图片有一点点色差，能接受。', tag: '略有色差' },
  { user: '雾***er', level: 5, content: '第二次回购了，品质稳定，值得信赖！', tag: '回购' },
  { user: 'l***y', level: 4, content: '功能齐全，说明书详细，上手很快。', tag: '功能齐全' },
]
const reviewTimes = [
  '2026-07-' + (10 + (Math.random() * 15 | 0)),
  '2026-08-' + (1 + (Math.random() * 20 | 0)),
  '2026-08-' + (1 + (Math.random() * 25 | 0)),
]

export const shops = shopsData

// 加载时给每个商品附加轻量评价（详情页展示用）
export const products = productsData.map((p) => {
  const count = 2 + (p.id % 3)
  const reviews = []
  for (let i = 0; i < count; i++) {
    const base = reviewsPool[(p.id + i) % reviewsPool.length]
    reviews.push({
      id: p.id * 100 + i,
      productId: p.id,
      user: base.user,
      level: base.level,
      time: reviewTimes[(p.id + i) % reviewTimes.length],
      content: base.content,
      tag: base.tag,
    })
  }
  return { ...p, reviews }
})

export const currentUser = {
  id: 1,
  username: 'demo_user',
  nickname: '优购用户',
  phone: '138****8888',
  avatar: 'https://picsum.photos/seed/avatar/120/120',
}

export function getShopById(shopId) {
  return shops.find((s) => s.id === Number(shopId))
}

export function getProductsByShop(shopId) {
  return products.filter((p) => p.shopId === Number(shopId))
}
