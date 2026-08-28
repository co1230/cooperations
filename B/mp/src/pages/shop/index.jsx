import Taro, { useRouter, useLoad, useReachBottom } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import { getShopById, getProductsByShop } from '../../mock/data'
import { openSession } from '../../utils/chat'
import ProductCard from '../../components/ProductCard'

const PAGE_SIZE = 8

export default function Shop() {
  const router = useRouter()
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(1)

  useLoad(() => {
    const id = Number(router.params.id)
    const s = getShopById(id)
    setShop(s)
    if (s) {
      const list = getProductsByShop(id)
      setProducts(list.slice(0, PAGE_SIZE))
      setPage(1)
    }
  })

  const contact = () => {
    if (!shop) return
    openSession(shop)
    Taro.navigateTo({ url: `/pages/chat/index?shopId=${shop.id}` })
  }

  useReachBottom(() => {
    if (!shop) return
    const list = getProductsByShop(shop.id)
    if (page * PAGE_SIZE < list.length) {
      setPage((p) => p + 1)
      setProducts(list.slice(0, (page + 1) * PAGE_SIZE))
    }
  })

  if (!shop) return <View className='empty'><View className='icon'>🏪</View>店铺不存在</View>

  return (
    <View style={{ paddingBottom: '110px' }}>
      {/* 店铺头部 */}
      <View style={{ background: 'linear-gradient(135deg,#ff5000,#ff7a32)', padding: '24px 18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <View style={{ width: '64px', height: '64px', background: '#fff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>{shop.logo}</View>
        <View style={{ flex: 1 }}>
          <View style={{ fontSize: '19px', fontWeight: 700 }}>{shop.name}</View>
          <View style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>{shop.slogan}</View>
          <View style={{ fontSize: '11px', opacity: 0.85, marginTop: '4px' }}>📍 {shop.city} · 粉丝 {(shop.followers / 10000).toFixed(1)}万 · 好评 {shop.rating}%</View>
        </View>
      </View>

      <View style={{ display: 'flex', padding: '12px 18px', gap: '10px' }}>
        <View className='btn' style={{ flex: 1, textAlign: 'center', fontSize: '13px' }} onClick={contact}>💬 联系客服</View>
      </View>

      <View style={{ padding: '0 16px' }}>
        <View style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px' }}>店铺商品</View>
        <View className='grid-2'>
          {products.map((p) => <ProductCard key={p.id} product={p} style={{ marginBottom: '10px' }} />)}
        </View>
        {page * PAGE_SIZE >= getProductsByShop(shop.id).length && (
          <View style={{ textAlign: 'center', color: '#999', fontSize: '12px', padding: '10px 0 20px' }}>— 已经到底啦 —</View>
        )}
      </View>
    </View>
  )
}
