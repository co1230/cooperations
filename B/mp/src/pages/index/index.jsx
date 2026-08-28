import Taro, { useLoad, useReachBottom } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import { categories, products } from '../../mock/data'

const PAGE_SIZE = 8

export default function Index() {
  const [list, setList] = useState([])
  const [page, setPage] = useState(1)
  const total = products.length

  useLoad(() => loadPage(1))

  const loadPage = (p) => {
    const start = (p - 1) * PAGE_SIZE
    setList((prev) => (p === 1 ? products.slice(0, PAGE_SIZE) : [...prev, ...products.slice(start, start + PAGE_SIZE)]))
    setPage(p)
  }

  useReachBottom(() => {
    if (page * PAGE_SIZE < total) loadPage(page + 1)
  })

  const goSearch = () => Taro.navigateTo({ url: '/pages/search/search' })
  const goProduct = (id) => Taro.navigateTo({ url: `/pages/product/index?id=${id}` })
  const goCategory = (c) =>
    Taro.navigateTo({ url: `/pages/search/search?categoryId=${c.id}&name=${c.name}` })

  return (
    <View>
      {/* 搜索栏 */}
      <View
        style={{ margin: '16px', padding: '10px 18px', background: '#fff', borderRadius: '24rpx', textAlign: 'center', color: '#999', fontSize: '14px' }}
        onClick={goSearch}
      >
        🔍 搜索商品，如：手机、连衣裙…
      </View>

      {/* 分类快捷入口 */}
      <View style={{ background: '#fff', margin: '0 16px 16px', borderRadius: '12px', padding: '16px 8px', display: 'flex', flexWrap: 'wrap' }}>
        {categories.map((c) => (
          <View
            key={c.id}
            onClick={() => goCategory(c)}
            style={{ width: '25%', textAlign: 'center', marginBottom: '12px' }}
          >
            <View style={{ fontSize: '30px', marginBottom: '6px' }}>{c.icon}</View>
            <Text style={{ fontSize: '12px', color: '#333' }}>{c.name}</Text>
          </View>
        ))}
      </View>

      {/* 精选好物 */}
      <View style={{ padding: '0 16px' }}>
        <View style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>🔥 精选好物</View>
        <View className='grid-2'>
          {list.map((p) => (
            <View key={p.id} className='grid-item' onClick={() => goProduct(p.id)} style={{ marginBottom: '10px' }}>
              <Image className='thumb' src={p.image} mode='aspectFill' />
              <View style={{ padding: '10px 10px 12px' }}>
                <View style={{ fontSize: '13px', lineHeight: 1.4, height: '36px', overflow: 'hidden' }}>{p.name}</View>
                <View style={{ display: 'flex', alignItems: 'baseline', marginTop: '6px' }}>
                  <Text className='price' style={{ fontSize: '17px' }}>¥{p.price}</Text>
                  <Text style={{ fontSize: '11px', color: '#999', textDecoration: 'line-through', marginLeft: '8px' }}>¥{p.originalPrice}</Text>
                </View>
                <View style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <Text style={{ fontSize: '10px', color: '#999' }}>已售 {p.sales}</Text>
                  <Text style={{ fontSize: '10px', color: '#999' }}>{p.positive}% 好评</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        <View style={{ textAlign: 'center', color: '#999', fontSize: '12px', padding: '10px 0 20px' }}>
          {page * PAGE_SIZE >= total ? '— 已经到底啦 —' : '加载中…上拉加载更多'}
        </View>
      </View>
    </View>
  )
}
