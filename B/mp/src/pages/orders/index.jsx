import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import { useGlobalStore, updateOrder, resolveProduct, groupByShop } from '../../store/global'
import { getShopById } from '../../mock/data'
import { openSession } from '../../utils/chat'

const TABS = ['全部', '待支付', '待发货', '待收货', '已完成', '已取消']

export default function Orders() {
  const { orders } = useGlobalStore()
  const [tab, setTab] = useState('全部')
  const [refundOrder, setRefundOrder] = useState(null)
  const [reason, setReason] = useState('')

  useLoad(() => Taro.setNavigationBarTitle({ title: '我的订单' }))

  const list = tab === '全部' ? orders : orders.filter((o) => o.status === tab)

  const contactShop = (shop) => {
    openSession(shop)
    Taro.navigateTo({ url: `/pages/chat/index?shopId=${shop.id}` })
  }
  const goDetail = (id) => Taro.navigateTo({ url: `/pages/order-detail/index?id=${id}` })
  const goPay = (id) => Taro.redirectTo({ url: `/pages/pay/index?id=${id}` })

  const cancel = (o) => {
    Taro.showModal({ title: '取消订单', content: '确认取消该订单？', success: (r) => { if (r.confirm) updateOrder(o.id, { status: '已取消' }) } })
  }
  const confirmReceive = (o) => {
    Taro.showModal({ title: '确认收货', content: '确认已收到全部商品？', success: (r) => { if (r.confirm) updateOrder(o.id, { status: '已完成' }) } })
  }
  const openRefund = (o) => { setRefundOrder(o); setReason('') }
  const submitRefund = () => {
    const r = reason.trim() || '不想要了，申请退款'
    updateOrder(refundOrder.id, { status: '退款中', refundReason: r })
    Taro.showToast({ title: '已提交退款申请', icon: 'success' })
    setRefundOrder(null)
  }

  return (
    <View>
      {/* 状态 tab */}
      <View style={{ display: 'flex', background: '#fff', overflowX: 'auto', whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 10 }}>
        {TABS.map((t) => (
          <View key={t} onClick={() => setTab(t)} style={{ padding: '14px 16px', fontSize: '14px', flexShrink: 0, color: tab === t ? '#ff5000' : '#333', fontWeight: tab === t ? 700 : 400, borderBottom: tab === t ? '3px solid #ff5000' : '3px solid transparent' }}>
            {t}
          </View>
        ))}
      </View>

      {list.length === 0 ? (
        <View className='empty'><View className='icon'>📦</View>该分类下暂无订单</View>
      ) : (
        list.map((o) => {
          const groups = groupByShop(o.items)
          return (
            <View key={o.id} className='card' style={{ padding: 0, overflow: 'hidden' }}>
              {/* 订单头 */}
              <View style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                <Text style={{ fontSize: '12px', color: '#666' }}>订单号 {o.no}</Text>
                <Text style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: 700, color: o.status === '已取消' ? '#999' : o.status === '退款中' ? '#ff7a32' : '#ff5000' }}>{o.status}</Text>
              </View>

              {/* 商品（按店） */}
              {groups.map(({ shopId, items: its }) => {
                const shop = getShopById(shopId)
                return (
                  <View key={shopId} onClick={() => goDetail(o.id)}>
                    <View style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#fafafa', borderBottom: '1px solid #f5f5f5' }}>
                      <Text style={{ fontSize: '18px' }}>{shop.logo}</Text>
                      <Text style={{ fontWeight: 600, fontSize: '13px', flex: 1 }}>{shop.name}</Text>
                      <Text style={{ fontSize: '12px', color: '#ff5000' }} onClick={(e) => { e.stopPropagation(); contactShop(shop) }}>联系客服</Text>
                    </View>
                    {its.map((it) => {
                      const prod = resolveProduct(it.productId)
                      return (
                        <View key={it.key} style={{ display: 'flex', gap: '10px', padding: '10px 14px', borderBottom: '1px solid #f7f7f7' }}>
                          <Image src={prod.image} style={{ width: '56px', height: '56px', borderRadius: '8px', flexShrink: 0 }} mode='aspectFill' />
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <View style={{ fontSize: '13px', lineHeight: 1.4 }}>{prod.name}</View>
                            <View style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>{it.skuLabels.join(' / ')} × {it.qty}</View>
                          </View>
                          <Text style={{ fontSize: '13px' }}>¥{it.price * it.qty}</Text>
                        </View>
                      )
                    })}
                  </View>
                )
              })}

              {/* 金额 & 操作 */}
              <View style={{ padding: '12px 14px' }}>
                <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '10px' }}>
                  <Text style={{ fontSize: '13px', color: '#666', marginRight: '8px' }}>实付</Text>
                  <Text className='price' style={{ fontSize: '18px' }}>¥{o.payPrice}</Text>
                </View>
                <View style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  {(o.status === '待支付' || o.status === '已取消') && (
                    <>
                      <View className='btn-secondary' style={{ padding: '6px 16px', fontSize: '13px' }} onClick={() => cancel(o)}>取消订单</View>
                      {o.status === '待支付' && <View className='btn' style={{ padding: '6px 20px', fontSize: '13px' }} onClick={() => goPay(o.id)}>去支付</View>}
                    </>
                  )}
                  {o.status === '待发货' && <View className='btn-secondary' style={{ padding: '6px 16px', fontSize: '13px', color: '#999' }} onClick={() => openRefund(o)}>申请退款</View>}
                  {o.status === '待收货' && (
                    <>
                      <View className='btn-secondary' style={{ padding: '6px 16px', fontSize: '13px', color: '#ff4d4f' }} onClick={() => openRefund(o)}>申请退货</View>
                      <View className='btn' style={{ padding: '6px 20px', fontSize: '13px' }} onClick={() => confirmReceive(o)}>确认收货</View>
                    </>
                  )}
                  {o.status === '已完成' && <View className='btn-secondary' style={{ padding: '6px 16px', fontSize: '13px', color: '#ff4d4f' }} onClick={() => openRefund(o)}>申请售后</View>}
                  {(o.status === '退款中' || o.status === '已退款') && <Text style={{ fontSize: '12px', color: '#999' }}>售后处理中，如有疑问请联系客服</Text>}
                </View>
              </View>
            </View>
          )
        })
      )}

      {/* 退款原因弹层 */}
      {refundOrder && (
        <View style={{ position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ background: '#fff', width: '82%', borderRadius: '12px', padding: '20px' }}>
            <View style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', textAlign: 'center' }}>申请退款/退货</View>
            <View style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>请填写退款原因</View>
            <textarea
              style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', fontSize: '14px', height: '80px', boxSizing: 'border-box' }}
              value={reason}
              onInput={(e) => setReason(e.detail.value)}
              placeholder='不想要了，申请退款'
            />
            <View style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <View className='btn-secondary' style={{ flex: 1, textAlign: 'center', padding: '10px' }} onClick={() => setRefundOrder(null)}>取消</View>
              <View className='btn' style={{ flex: 1, textAlign: 'center', padding: '10px' }} onClick={submitRefund}>提交</View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
