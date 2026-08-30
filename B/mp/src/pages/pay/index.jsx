import Taro, { useRouter, useLoad } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import { getState, updateOrder, removeItemsByKeys } from '../../store/global'

const METHODS = [
  { key: 'wechat', name: '微信支付', icon: '💬' },
  { key: 'alipay', name: '支付宝', icon: '💙' },
  { key: 'balance', name: '余额支付', icon: '💰' }
]

export default function Pay() {
  const router = useRouter()
  const [order, setOrder] = useState(null)
  const [method, setMethod] = useState('wechat')
  const [paying, setPaying] = useState(false)

  useLoad(() => {
    const id = router.params.id || Taro.getStorageSync('pendingOrderId')
    const o = getState().orders.find((x) => x.id === id)
    setOrder(o || null)
  })

  if (!order) return <View className='empty'><View className='icon'>🧾</View>订单不存在</View>

  const doPay = () => {
    if (paying) return
    setPaying(true)
    setTimeout(() => {
      updateOrder(order.id, { status: '待发货', payMethod: method })
      removeItemsByKeys(order.items.map((i) => i.key))
      Taro.removeStorageSync('pendingOrderId')
      Taro.showModal({
        title: '支付成功',
        content: `已通过${METHODS.find((m) => m.key === method).name}支付 ¥${order.payPrice}`,
        showCancel: false,
        confirmText: '查看订单',
        success: () => Taro.redirectTo({ url: '/pages/orders/index' })
      })
      setPaying(false)
    }, 1200)
  }

  return (
    <View style={{ padding: '16px' }}>
      {/* 金额 */}
      <View className='card' style={{ textAlign: 'center', padding: '30px' }}>
        <View style={{ color: '#999', fontSize: '13px', marginBottom: '8px' }}>需支付金额</View>
        <Text className='price' style={{ fontSize: '42px' }}>¥{order.payPrice}</Text>
        <View style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>订单号 {order.no}</View>
      </View>

      {/* 支付方式 */}
      <View style={{ fontSize: '15px', fontWeight: 700, margin: '16px 4px 10px' }}>选择支付方式</View>
      <View className='card' style={{ padding: 0, overflow: 'hidden' }}>
        {METHODS.map((m) => (
          <View
            key={m.key}
            onClick={() => setMethod(m.key)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #f5f5f5' }}
          >
            <Text style={{ fontSize: '24px' }}>{m.icon}</Text>
            <Text style={{ flex: 1, fontSize: '15px' }}>{m.name}</Text>
            <Text style={{ fontSize: '20px', color: method === m.key ? '#ff5000' : '#ccc' }}>{method === m.key ? '⭕' : '⚪'}</Text>
          </View>
        ))}
      </View>

      <View className='btn' style={{ marginTop: '24px', padding: '14px', fontSize: '16px', textAlign: 'center' }} onClick={doPay}>
        {paying ? '支付处理中…' : `确认支付 ¥${order.payPrice}`}
      </View>
    </View>
  )
}