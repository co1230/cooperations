// 为小程序生成精简版商品数据：从完整 products.json 采样，控制在 600 条左右
// 用法：node scripts/gen-weapp.js
const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', '..', 'web', 'src', 'mock', 'products.json')
const OUT = path.join(__dirname, '..', 'src', 'mock', 'products.weapp.json')

const products = JSON.parse(fs.readFileSync(SRC, 'utf8'))

const TARGET = 600
const byCategory = {}
for (const p of products) {
  if (!byCategory[p.categoryId]) byCategory[p.categoryId] = []
  byCategory[p.categoryId].push(p)
}

const picked = []
// 每个品类按固定步长采样，保证品类/品牌覆盖
for (const catId of Object.keys(byCategory)) {
  const list = byCategory[catId]
  const quota = Math.round((list.length / products.length) * TARGET)
  const step = Math.max(1, Math.floor(list.length / quota))
  for (let i = 0; i < list.length && picked.length < 600; i += step) {
    picked.push(list[i])
  }
}
// 补足到接近 TARGET
let idx = 0
while (picked.length < TARGET && idx < products.length) {
  const p = products[idx]
  if (!picked.some((x) => x.id === p.id)) picked.push(p)
  idx++
}

fs.writeFileSync(OUT, JSON.stringify(picked))
console.log(`写入 ${OUT}，共 ${picked.length} 条商品`)
