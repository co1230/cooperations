import Taro, { useRouter, useLoad } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import { useGlobalStore, updateOrder, resolveProduct, groupByShop } from '../../store/global'
import { getShopById } from '../../mock/data'
import { openSession } from '../../utils/chat'

const PAYNAME = { wechat: '微信支付', alipay: '支付宝', balance: '余额支付' }

export default function OrderDetail() {
  const router = useRouter()
  const { orders } = useGlobalStore()
  const order = orders.find((o) => o.id === router.params.id)

  if (!order) return <View className='empty'><View className='icon'>📦</View>订单不存在</View>

  const contact = (shop) => { openSession(shop); Taro.navigateTo({ url: `/pages/chat/index?shopId=${shop.id}` }) }
  const groups = groupByShop(order.items)

  return (
    <View style={{ padding: '16px', paddingBottom: '20px' }}>
      {/* 状态 */}
      <View className='card' style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
        <Text style={{ fontSize: '30px' }}>🧾</Text>
        <View>
          <Text style={{ fontSize: '20px', fontWeight: 700, color: order.status === '已取消' ? '#999' : order.status === '退款中' ? '#ff7a32' : '#ff5000', display: 'block' }}>{order.status}</Text>
          <Text style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>订单号 {order.no} · {order.createdAt}</Text>
        </View>
      </View>

      {/* 商品 + 店铺入口 */}
      {groups.map(({ shopId, items }) => {
        const shop = getShopById(shopId)
        return (
          <View key={shopId} className='card' style={{ padding: 0, overflow: 'hidden', marginBottom: '14px' }}>
            <View style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
              <Text style={{ fontSize: '18px' }}>{shop.logo}</Text>
              <Text style={{ fontWeight: 600, fontSize: '14px', flex: 1 }}>{shop.name}</Text>
              <Text style={{ fontSize: '12px', color: '#ff5000' }} onClick={() => Taro.navigateTo({ url: `/pages/shop/index?id=${shop.id}` })}>进店</Text>
              <Text style={{ fontSize: '12px', color: '#ff5000' }} onClick={() => contact(shop)}>联系客服</Text>
            </View>
            {items.map((it) => {
              const prod = resolveProduct(it.productId)
              return (
                <View key={it.key} style={{ display: 'flex', gap: '12px', padding: '12px 14px', borderBottom: '1px solid #f7f7f7' }}>
                  <Image src={prod.image} style={{ width: '64px', height: '64px', borderRadius: '8px', flexShrink: 0 }} mode='aspectFill' />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ fontSize: '14px', lineHeight: 1.4 }}>{prod.name}</View>
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
        <View style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>金额明细</View>
        <View style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px', color: '#666' }}>
          <Text>商品件数</Text><Text>{order.items.reduce((s, i) => s + i.qty, 0)} 件</Text>
        </View>
        <View style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px', color: '#666' }}>
          <Text>商品金额</Text><Text>¥{order.totalPrice}</Text>
        </View>
        <View style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px', color: '#666' }}>
          <Text>优惠减免</Text><Text style={{ color: '#ff5000' }}>-¥{order.discountPrice}</Text>
        </View>
        <View style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: '16px', fontWeight: 700, borderTop: '1px solid #f0f0f0', marginTop: '6px' }}>
          <Text>实付金额</Text><Text className='price' style={{ fontSize: '20px' }}>¥{order.payPrice}</Text>
        </View>
      </View>

      {/* 收货信息 */}
      <View className='card'>
        <View style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>收货信息</View>
        <View style={{ fontSize: '14px', lineHeight: 1.8, color: '#333' }}>
          <Text style={{ display: 'block' }}>收货人：{order.address.name}　{order.address.phone}</Text>
          <Text style={{ display: 'block' }}>收货地址：{order.address.region} {order.address.detail}</Text>
        </View>
      </View>

      {/* 订单信息 */}
      <View className='card'>
        <View style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>订单信息</View>
        <View style={{ fontSize: '13px', lineHeight: 1.9, color: '#333' }}>
          <Text style={{ display: 'block' }}>订单编号：{order.no}</Text>
          <Text style={{ display: 'block' }}>下单时间：{order.createdAt}</Text>
          <Text style={{ display: 'block' }}>支付方式：{order.payMethod ? PAYNAME[order.payMethod] : '未支付'}</Text>
          {order.refundReason && <Text style={{ display: 'block', color: '#ff7a32' }}>退款/退货原因：{order.refundReason}</Text>}
        </View>
      </View>
    </View>
  )
}
