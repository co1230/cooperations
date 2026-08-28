import Taro, { useRouter, useLoad, useReachBottom } from '@tarojs/taro'
import { View, Text, Image, Input } from '@tarojs/components'
import { useState } from 'react'
import { categories, brands, products } from '../../mock/data'
import ProductCard from '../../components/ProductCard'

const PAGE_SIZE = 8

export default function Search() {
  const router = useRouter()
  const [kw, setKw] = useState('')
  const [cat, setCat] = useState(null)
  const [brand, setBrand] = useState(null)
  const [list, setList] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [initName, setInitName] = useState('')

  useLoad(() => {
    const { keyword, categoryId, name } = router.params
    const initKw = keyword || ''
    const initCat = categoryId ? Number(categoryId) : null
    setKw(initKw)
    setCat(initCat)
    setInitName(name || '')
    doSearch(initKw, initCat, null, 1)
  })

  const filtered = () => {
    let arr = products
    if (cat) arr = arr.filter((p) => p.categoryId === cat)
    if (brand) arr = arr.filter((p) => p.brand === brand)
    if (kw.trim()) {
      const k = kw.trim()
      arr = arr.filter((p) => p.name.includes(k) || p.brand.includes(k))
    }
    return arr
  }

  const doSearch = (k = kw, c = cat, b = brand, p = 1) => {
    let arr = products
    if (c) arr = arr.filter((x) => x.categoryId === c)
    if (b) arr = arr.filter((x) => x.brand === b)
    if (k.trim()) {
      const kk = k.trim()
      arr = arr.filter((x) => x.name.includes(kk) || x.brand.includes(kk))
    }
    setTotal(arr.length)
    const start = (p - 1) * PAGE_SIZE
    setList(p === 1 ? arr.slice(0, PAGE_SIZE) : arr.slice(0, start + PAGE_SIZE))
    setPage(p)
  }

  useReachBottom(() => {
    if (page * PAGE_SIZE < total) doSearch(kw, cat, brand, page + 1)
  })

  const onInput = (e) => setKw(e.detail.value)

  return (
    <View>
      {/* 搜索栏 */}
      <View style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: '#fff' }}>
        <Input
          className='search-input'
          style={{ flex: 1 }}
          value={kw}
          onInput={onInput}
          placeholder={initName || '搜索商品…'}
          confirmType='search'
          onConfirm={() => doSearch(kw, cat, brand, 1)}
        />
        <View className='btn' style={{ fontSize: '13px', padding: '8px 16px' }} onClick={() => doSearch(kw, cat, brand, 1)}>搜索</View>
      </View>

      {/* 品牌筛选 */}
      <View style={{ padding: '10px 16px', background: '#fff', display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {brands.map((b) => (
          <View
            key={b}
            onClick={() => { setBrand(b); doSearch(kw, cat, b, 1) }}
            style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '12px', background: brand === b ? '#ff5000' : '#f3f3f3', color: brand === b ? '#fff' : '#333', flexShrink: 0 }}
          >
            {b}
          </View>
        ))}
      </View>

      {/* 分类 tab */}
      <View style={{ padding: '10px 16px', background: '#fff', display: 'flex', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        <View onClick={() => { setCat(null); doSearch(kw, null, brand, 1) }} style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '12px', background: !cat ? '#ff5000' : '#f3f3f3', color: !cat ? '#fff' : '#333', flexShrink: 0 }}>全部</View>
        {categories.map((c) => (
          <View
            key={c.id}
            onClick={() => { setCat(c.id); doSearch(kw, c.id, brand, 1) }}
            style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '12px', background: cat === c.id ? '#ff5000' : '#f3f3f3', color: cat === c.id ? '#fff' : '#333', flexShrink: 0 }}
          >
            {c.name}
          </View>
        ))}
      </View>

      <View style={{ color: '#999', fontSize: '12px', padding: '12px 16px 4px' }}>共 {total} 件相关商品</View>

      <View style={{ padding: '0 16px' }}>
        {list.length === 0 ? (
          <View className='empty'><View className='icon'>🔍</View>暂无相关商品</View>
        ) : (
          <View className='grid-2'>
            {list.map((p) => <ProductCard key={p.id} product={p} style={{ marginBottom: '10px' }} />)}
          </View>
        )}
        {list.length > 0 && (
          <View style={{ textAlign: 'center', color: '#999', fontSize: '12px', padding: '10px 0 20px' }}>
            {page * PAGE_SIZE >= total ? '— 已经到底啦 —' : '加载中…上拉加载更多'}
          </View>
        )}
      </View>
    </View>
  )
}
