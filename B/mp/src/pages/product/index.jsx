import Taro, { useRouter, useLoad } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import { products, getShopById } from '../../mock/data'
import { load, save } from '../../utils/store'
import { addToCart } from '../../store/global'
import { openSession } from '../../utils/chat'

export default function Product() {
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [selected, setSelected] = useState({})
  const [favorites, setFavorites] = useState(load('favorites', []))
  const [toast, setToast] = useState('')
  const [toasting, setToasting] = useState(false)
  const [reviewsFilter, setReviewsFilter] = useState('all')

  useLoad(() => {
    const p = products.find((x) => x.id === Number(router.params.id))
    if (p) {
      setProduct(p)
      const init = {}
      p.skus.forEach((s) => {
        const ok = s.options.find((o) => o.stock > 0)
        if (ok) init[s.specName] = ok.label
      })
      setSelected(init)
    }
  })

  if (!product) return <View className='empty'><View className='icon'>📦</View>商品不存在</View>

  const combos = product.combos || []
  const shop = getShopById(product.shopId)
  const isFav = favorites.some((f) => f.id === product.id)
  const labels = product.skus.map((s) => selected[s.specName]).filter(Boolean)

  const currentCombo = combos.find((c) => c.key.split('|').every((part) => labels.includes(part)))
  const displayPrice = currentCombo ? currentCombo.price : product.price
  const availStock = currentCombo ? currentCombo.stock : 0
  const selectedLabels = product.skus.map((s) => selected[s.specName]).filter(Boolean)

  // 判断某选项在已选其它维度下是否有货
  const optionUsable = (specName, label, runId) => {
    const trial = { ...selected, [specName]: label }
    const dims = product.skus.map((s) => s.specName)
    const filled = dims.filter((d) => trial[d])
    if (filled.length < dims.length) return true
    const tl = filled.map((d) => trial[d])
    const c = combos.find((x) => x.key.split('|').every((p) => tl.includes(p)))
    return c ? c.stock > 0 : false
  }

  const select = (specName, label) => {
    if (!optionUsable(specName, label)) {
      showToast('该规格已售罄')
      return
    }
    setSelected((p) => ({ ...p, [specName]: label }))
  }

  const showToast = (m) => {
    setToast(m)
    setToasting(true)
    setTimeout(() => { setToast(''); setToasting(false) }, 1800)
  }

  const toggleFav = () => {
    if (isFav) {
      const next = favorites.filter((f) => f.id !== product.id)
      setFavorites(next); save('favorites', next); showToast('已取消收藏')
    } else {
      const next = [{ id: product.id, product }, ...favorites]
      setFavorites(next); save('favorites', next); showToast('已加入收藏')
    }
  }

  const validateSpec = () => {
    if (selectedLabels.length < product.skus.length) { showToast('请先选择完整规格'); return false }
    if (availStock <= 0) { showToast('该规格已售罄'); return false }
    return true
  }

  const handleAddCart = () => {
    if (!validateSpec()) return
    addToCart({ productId: product.id, skuLabels: selectedLabels, price: currentCombo.price, qty: 1, maxStock: availStock })
    showToast('已加入购物车')
  }

  const handleBuy = () => {
    if (!validateSpec()) return
    const buyItem = {
      key: `buy-${Date.now()}`,
      productId: product.id,
      skuLabels: selectedLabels,
      price: currentCombo.price,
      qty: 1,
      maxStock: availStock
    }
    Taro.setStorageSync('buyNowItem', buyItem)
    Taro.navigateTo({ url: '/pages/checkout/index?fromBuyNow=1' })
  }

  const goShop = () => shop && Taro.navigateTo({ url: `/pages/shop/index?id=${shop.id}` })
  const goChat = () => {
    if (!shop) return
    openSession(shop)
    Taro.navigateTo({ url: `/pages/chat/index?shopId=${shop.id}` })
  }

  return (
    <View style={{ paddingBottom: '110px' }}>
      {/* 商品图 */}
      <Image src={product.image} style={{ width: '100%', height: '390px' }} mode='aspectFill' />

      {/* 店铺入口 */}
      {shop && (
        <View onClick={goShop} style={{ background: '#fff', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', marginTop: '10px' }}>
          <View style={{ width: '54px', height: '54px', background: '#f5f5f5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>{shop.logo}</View>
          <View style={{ flex: 1 }}>
            <View style={{ fontWeight: 700, fontSize: '15px' }}>{shop.name}</View>
            <View style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{shop.slogan} · 好评率 {product.positive}% · 粉丝 {(shop.followers) / 10000}万</View>
          </View>
          <Text style={{ color: '#ff5000', fontSize: '13px' }}>进店 ›</Text>
        </View>
      )}

      {/* 商品信息 */}
      <View style={{ background: '#fff', padding: '16px', marginTop: '10px' }}>
        <View style={{ fontSize: '19px', fontWeight: 700, lineHeight: 1.4 }}>{product.name}</View>
        <View style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>{product.desc}</View>
        <View style={{ background: '#fff7f3', borderRadius: '8px', padding: '14px', marginTop: '12px' }}>
          <View style={{ color: '#999', fontSize: '12px', marginBottom: '6px' }}>价格{currentCombo && `（${selectedLabels.join(' / ')}）`}</View>
          <Text className='price' style={{ fontSize: '30px' }}>¥{displayPrice}</Text>
          {!currentCombo && <Text style={{ fontSize: '12px', color: '#999', marginLeft: '10px' }}>请选择规格</Text>}
          {currentCombo && <Text style={{ fontSize: '12px', color: '#999', marginLeft: '10px' }}>库存 {availStock}</Text>}
        </View>
        <View style={{ display: 'flex', gap: '20px', marginTop: '12px', fontSize: '12px', color: '#555' }}>
          <Text>已售 <Text style={{ color: '#333' }}>{product.sales}+</Text></Text>
          <Text>好评率 <Text className='primary'>{product.positive}%</Text></Text>
          <Text>品牌 <Text style={{ color: '#333' }}>{product.brand}</Text></Text>
        </View>
      </View>

      {/* 规格选择 */}
      {product.skus.map((sku) => (
        <View key={sku.id} style={{ background: '#fff', padding: '16px', marginTop: '10px' }}>
          <View style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>{sku.specName}</View>
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {sku.options.map((o) => {
              const active = selected[sku.specName] === o.label
              const usable = optionUsable(sku.specName, o.label)
              const soldOut = o.stock === 0 || !usable
              return (
                <View
                  key={o.id}
                  onClick={() => usable && select(sku.specName, o.label)}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                    border: active ? '1px solid #ff5000' : '1px solid #eee',
                    background: active ? '#fff0e8' : soldOut ? '#f2f2f2' : '#fff',
                    color: soldOut ? '#ccc' : active ? '#ff5000' : '#333'
                  }}
                >
                  {o.label}{o.stock === 0 && '（缺货）'}
                </View>
              )
            })}
          </View>
        </View>
      ))}

      {/* 商品说明 */}
      <View style={{ background: '#fff', padding: '16px', marginTop: '10px' }}>
        <View style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>售后服务</View>
        <View style={{ fontSize: '12px', color: '#666', lineHeight: 1.8 }}>
          <View>· 正品保障，支持 7 天无理由退换</View>
          <View>· 48 小时内发货 · 全程物流跟踪</View>
        </View>
      </View>

      {/* Toast */}
      {toasting && (
        <View style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '14px 22px', borderRadius: '10px', fontSize: '14px', zIndex: 99 }}>
          {toast}
        </View>
      )}

      {/* 底部操作栏 */}
      <View style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#fff', display: 'flex', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #eee', zIndex: 98 }}>
        <View onClick={toggleFav} style={{ textAlign: 'center', marginRight: '16px' }}>
          <View style={{ fontSize: '22px' }}>{isFav ? '❤️' : '🤍'}</View>
          <View style={{ fontSize: '10px', color: '#999' }}>收藏</View>
        </View>
        <View onClick={goShop} style={{ textAlign: 'center', marginRight: '16px' }}>
          <View style={{ fontSize: '22px' }}>🏪</View>
          <View style={{ fontSize: '10px', color: '#999' }}>店铺</View>
        </View>
        <View onClick={goChat} style={{ textAlign: 'center', marginRight: '16px' }}>
          <View style={{ fontSize: '22px' }}>💬</View>
          <View style={{ fontSize: '10px', color: '#999' }}>客服</View>
        </View>
        <View className='btn' style={{ flex: 1, marginRight: '10px', textAlign: 'center' }} onClick={handleAddCart}>加入购物车</View>
        <View className='btn' style={{ flex: 1, background: '#ff7a32', textAlign: 'center' }} onClick={handleBuy}>立即购买</View>
      </View>
    </View>
  )
}
