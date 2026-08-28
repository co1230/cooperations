// ============ mock 数据层（与 Web 端复用同一份生成数据） ============
// shops.json 为完整 1000 家店铺；products.weapp.json 为从完整 products.json
// 采样生成的约 600 条精简数据（脚本：scripts/gen-weapp.js），适配小程序包体积限制

const shopsData = require('./shops.json')
const productsData = require('./products.weapp.json')

export const categories = [
  { id: 1, name: '手机数码', icon: '📱', children: ['手机', '平板', '耳机', '智能穿戴'] },
  { id: 2, name: '家用电器', icon: '🏠', children: ['冰箱', '空调', '洗衣机', '厨房家电'] },
  { id: 3, name: '服饰鞋包', icon: '👕', children: ['男装', '女装', '运动鞋', '箱包'] },
  { id: 4, name: '美妆护肤', icon: '💄', children: ['护肤', '彩妆', '香水', '个护'] },
  { id: 5, name: '食品生鲜', icon: '🍎', children: ['零食', '生鲜', '粮油', '饮料'] },
  { id: 6, name: '运动户外', icon: '⚽', children: ['健身', '骑行', '露营', '球类'] },
  { id: 7, name: '图书文娱', icon: '📚', children: ['小说', '童书', '文具', '影音'] }
]

export const brands = ['华讯', '小米飞', '荣耀星', '美的莱', '优衣尚', '珀莱雅', '三只松鼠', '迪卡侬', '中信出版']

export const shops = shopsData

export const products = productsData.map((p) => ({
  ...p,
  price: p.combos && p.combos.length ? p.combos[0].price : p.price
}))

export const currentUser = {
  id: 1,
  username: 'demo_user',
  nickname: '优购用户',
  phone: '138****8888',
  avatar: 'https://picsum.photos/seed/avatar/120/120'
}

export function getShopById(shopId) {
  return shops.find((s) => s.id === Number(shopId))
}

export function getProductsByShop(shopId) {
  return products.filter((p) => p.shopId === Number(shopId))
}
