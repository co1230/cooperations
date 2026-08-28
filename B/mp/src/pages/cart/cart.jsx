import Taro from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { useGlobalStore, updateQty, removeItem, toggleCheck, toggleCheckAll, resolveProduct, groupByShop } from '../../store/global'
import { getShopById } from '../../mock/data'

export default function Cart() {
  const { cart } = useGlobalStore()
  const checked = cart.filter((i) => i.checked)
  const checkedTotal = checked.reduce((s, i) => s + i.price * i.qty, 0)
  const allChecked = cart.length > 0 && checked.length === cart.length
  const groups = groupByShop(cart)

  const goHome = () => Taro.switchTab({ url: '/pages/index/index' })
  const goCheckout = () => {
    if (checked.length === 0) return
    const totalPrice = checkedTotal
    const discount = totalPrice >= 199 ? 20 : 0
    Taro.setStorageSync('checkoutItems', checked)
    Taro.navigateTo({ url: `/pages/checkout/index?totalPrice=${totalPrice}&discount=${discount}` })
  }
  const goProduct = (id) => Taro.navigateTo({ url: `/pages/product/index?id=${id}` })
  const goShop = (shopId) => Taro.navigateTo({ url: `/pages/shop/index?id=${shopId}` })

  return (
    <View style={{ paddingBottom: '120px' }}>
      <View className='header-title' style={{ padding: '16px 16px 0' }}>购物车</View>

      {groups.length === 0 ? (
        <View className='empty'>
          <View className='icon'>🛒</View>
          <View>购物车是空的</View>
          <View className='btn' style={{ marginTop: '20px', display: 'inline-block' }} onClick={goHome}>去逛逛</View>
        </View>
      ) : (
        groups.map(({ shopId, items }) => {
          const shop = getShopById(shopId)
          return (
            <View key={shopId} className='card' style={{ padding: 0, overflow: 'hidden' }}>
              {/* 店铺头 */}
              <View style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', borderBottom: '1px solid #f0f0f0' }}>
                <Text style={{ fontSize: '20px' }}>{shop.logo}</Text>
                <Text style={{ fontWeight: 600, fontSize: '14px' }} onClick={() => goShop(shopId)}>{shop.name}</Text>
                <Text style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>{items.length} 件</Text>
              </View>

              {items.map((it) => {
                const prod = resolveProduct(it.productId)
                return (
                  <View key={it.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderBottom: '1px solid #f7f7f7' }}>
                    <View onClick={() => toggleCheck(it.key)} style={{ fontSize: '22px', color: it.checked ? '#ff5000' : '#ccc' }}>{it.checked ? '⭕' : '⚪'}</View>
                    <Image src={prod.image} style={{ width: '74px', height: '74px', borderRadius: '8px', flexShrink: 0 }} mode='aspectFill' onClick={() => goProduct(prod.id)} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ fontSize: '13px', height: '36px', overflow: 'hidden', lineHeight: 1.4 }}>{prod.name}</View>
                      <View style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>{it.skuLabels.join(' / ')}</View>
                      <View style={{ display: 'flex', alignItems: 'center', marginTop: '6px' }}>
                        <Text className='price' style={{ fontSize: '16px' }}>¥{it.price}</Text>
                        {/* 数量步进 */}
                        <View style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <View style={{ width: '26px', height: '26px', border: '1px solid #ddd', borderRadius: '6px', textAlign: 'center', lineHeight: '24px', fontSize: '16px' }} onClick={() => updateQty(it.key, it.qty - 1)}>−</View>
                          <Text style={{ fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{it.qty}</Text>
                          <View style={{ width: '26px', height: '26px', border: '1px solid #ddd', borderRadius: '6px', textAlign: 'center', lineHeight: '24px', fontSize: '16px' }} onClick={() => updateQty(it.key, it.qty + 1)}>+</View>
                        </View>
                      </View>
                    </View>
                    <View onClick={() => removeItem(it.key)} style={{ color: '#bbb', fontSize: '18px', alignSelf: 'flex-start' }}>✕</View>
                  </View>
                )
              })}
            </View>
          )
        })
      )}

      {/* 底部结算栏 */}
      {cart.length > 0 && (
        <View style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#fff', display: 'flex', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #eee', zIndex: 98 }}>
          <View onClick={() => toggleCheckAll(!allChecked)} style={{ fontSize: '22px', color: allChecked ? '#ff5000' : '#ccc', marginRight: '8px' }}>{allChecked ? '⭕' : '⚪'}</View>
          <Text style={{ fontSize: '12px', color: '#333', marginRight: '16px' }}>全选</Text>
          <Text style={{ fontSize: '12px', color: '#999' }}>合计：</Text>
          <Text className='price' style={{ fontSize: '20px', marginRight: '16px' }}>¥{checkedTotal}</Text>
          <View className='btn' style={{ marginLeft: 'auto', padding: '10px 28px', fontSize: '15px' }} onClick={goCheckout}>去结算({checked.length})</View>
        </View>
      )}
    </View>
  )
}
