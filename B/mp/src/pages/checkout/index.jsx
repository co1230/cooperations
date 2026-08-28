import Taro, { useRouter, useLoad, useDidShow } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import { load } from '../../utils/store'
import { resolveProduct, groupByShop, createOrder } from '../../store/global'
import { getShopById } from '../../mock/data'

export default function Checkout() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [address, setAddress] = useState(null)
  const [totalPrice, setTotalPrice] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [payPrice, setPayPrice] = useState(0)

  const reloadAddress = () => {
    const sel = load('selectedAddress', null)
    const list = load('address', [])
    setAddress(sel || list.find((a) => a.isDefault) || list[0] || null)
  }

  useLoad(() => {
    const fromBuyNow = router.params.fromBuyNow === '1'
    if (fromBuyNow) {
      const item = Taro.getStorageSync('buyNowItem')
      if (item) {
        setItems([item])
        const t = item.price * item.qty
        setTotalPrice(t); setDiscount(0); setPayPrice(t)
      }
    } else {
      const list = Taro.getStorageSync('checkoutItems') || []
      setItems(list)
      const t = list.reduce((s, i) => s + i.price * i.qty, 0)
      const d = t >= 199 ? 20 : 0
      setTotalPrice(t); setDiscount(d); setPayPrice(t - d)
    }
    reloadAddress()
  })

  useDidShow(() => reloadAddress())

  const chooseAddress = () => {
    Taro.navigateTo({ url: '/pages/address/index?select=1' })
  }

  const submit = () => {
    if (!address) { Taro.showToast({ title: '请选择收货地址', icon: 'none' }); return }
    if (items.length === 0) { Taro.showToast({ title: '没有待结算商品', icon: 'none' }); return }
    const order = createOrder({
      items,
      totalPrice,
      discountPrice: discount,
      payPrice,
      address,
      payMethod: ''
    })
    Taro.setStorageSync('pendingOrderId', order.id)
    Taro.navigateTo({ url: `/pages/pay/index?id=${order.id}` })
  }

  const groups = groupByShop(items)

  return (
    <View style={{ paddingBottom: '110px' }}>
      {/* 收货地址 */}
      <View className='card' onClick={chooseAddress}>
        {address ? (
          <View style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <View style={{ fontSize: '26px' }}>📍</View>
            <View style={{ flex: 1 }}>
              <View style={{ fontSize: '15px', fontWeight: 600 }}>{address.name}　{address.phone}</View>
              <View style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{address.region} {address.detail}</View>
            </View>
            <Text style={{ color: '#999' }}>›</Text>
          </View>
        ) : (
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#999' }}>请选择收货地址</Text>
            <Text style={{ color: '#ff5000' }}>去选择 ›</Text>
          </View>
        )}
      </View>

      {/* 商品清单（按店） */}
      {groups.map(({ shopId, items: its }) => {
        const shop = getShopById(shopId)
        return (
          <View key={shopId} className='card' style={{ padding: 0, overflow: 'hidden' }}>
            <View style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text style={{ fontSize: '20px' }}>{shop.logo}</Text>
              <Text style={{ fontWeight: 600, fontSize: '14px' }}>{shop.name}</Text>
            </View>
            {its.map((it) => {
              const prod = resolveProduct(it.productId)
              return (
                <View key={it.key} style={{ display: 'flex', gap: '12px', padding: '12px 14px', borderBottom: '1px solid #f7f7f7' }}>
                  <Image src={prod.image} style={{ width: '62px', height: '62px', borderRadius: '8px', flexShrink: 0 }} mode='aspectFill' />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ fontSize: '13px', lineHeight: 1.4 }}>{prod.name}</View>
                    <View style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>{it.skuLabels.join(' / ')} × {it.qty}</View>
                  </View>
                  <Text style={{ fontSize: '14px' }}>¥{it.price * it.qty}</Text>
                </View>
              )
            })}
          </View>
        )
      })}

      {/* 金额明细 */}
      <View className='card'>
        <View style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px', color: '#666' }}>
          <Text>商品金额</Text><Text>¥{totalPrice}</Text>
        </View>
        <View style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px', color: '#666' }}>
          <Text>优惠减免</Text><Text style={{ color: '#ff5000' }}>-¥{discount}</Text>
        </View>
        <View style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: '16px', fontWeight: 700, borderTop: '1px solid #f0f0f0', marginTop: '6px' }}>
          <Text>实付金额</Text><Text className='price' style={{ fontSize: '22px' }}>¥{payPrice}</Text>
        </View>
      </View>

      {/* 提交栏 */}
      <View style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#fff', display: 'flex', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #eee', zIndex: 98 }}>
        <Text style={{ fontSize: '12px', color: '#999' }}>共 {items.reduce((s, i) => s + i.qty, 0)} 件，实付</Text>
        <Text className='price' style={{ fontSize: '22px', marginRight: '16px' }}>¥{payPrice}</Text>
        <View className='btn' style={{ marginLeft: 'auto', padding: '10px 30px', fontSize: '15px' }} onClick={submit}>提交订单</View>
      </View>
    </View>
  )
}
