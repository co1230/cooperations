import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import { currentUser } from '../../mock/data'
import { load } from '../../utils/store'
import { getUnreadTotal } from '../../utils/chat'
import { useGlobalStore } from '../../store/global'

export default function Profile() {
  const { cart, orders } = useGlobalStore()
  const [unread, setUnread] = useState(0)
  useDidShow(() => setUnread(getUnreadTotal()))

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const favCount = load('favorites', []).length
  const addrCount = load('address', []).length

  const menu = [
    { icon: '📦', name: '我的订单', desc: `${orders.length} 笔订单`, url: '/pages/orders/index' },
    { icon: '📍', name: '收货地址', desc: `${addrCount} 个地址`, url: '/pages/address/index' },
    { icon: '❤️', name: '我的收藏', desc: `${favCount} 件商品`, url: '/pages/favorites/index' },
    { icon: '💬', name: '个人消息', desc: `客服会话${unread ? ` · ${unread} 条未读` : ''}`, url: '/pages/messages/index', unread }
  ]

  return (
    <View>
      {/* 用户信息 */}
      <View style={{ background: 'linear-gradient(135deg,#ff5000,#ff7a32)', padding: '30px 20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Image src={currentUser.avatar} style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#fff' }} mode='aspectFill' />
        <View>
          <Text style={{ fontSize: '20px', fontWeight: 700, display: 'block' }}>{currentUser.nickname}</Text>
          <Text style={{ fontSize: '12px', opacity: 0.85, marginTop: '4px' }}>{currentUser.phone} · 普通用户</Text>
        </View>
      </View>

      {/* 个人消息醒目入口 */}
      <View className='card' style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px', border: '1px solid #ffe3d0', background: '#fffaf6' }}>
        <Text style={{ fontSize: '30px' }}>💬</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: '16px', fontWeight: 700, display: 'block' }}>个人消息</Text>
          <Text style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>查看客服聊天记录，及时跟进未读消息</Text>
        </View>
        {unread > 0 && <Text style={{ background: '#ff5000', color: '#fff', borderRadius: '16px', padding: '4px 12px', fontSize: '12px' }}>{unread} 条未读</Text>}
        <Text style={{ fontSize: '18px', color: '#999' }}>›</Text>
      </View>

      {/* 菜单 */}
      <View className='card' style={{ margin: '0 16px', padding: 0, overflow: 'hidden' }}>
        {menu.map((m) => (
          <View key={m.name} onClick={() => Taro.navigateTo({ url: m.url })} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #f5f5f5' }}>
            <Text style={{ fontSize: '24px' }}>{m.icon}</Text>
            <Text style={{ flex: 1, fontSize: '15px' }}>{m.name}</Text>
            {m.unread > 0 && <Text style={{ background: '#ff4d4f', color: '#fff', borderRadius: '12px', fontSize: '10px', padding: '2px 8px', minWidth: '18px', textAlign: 'center' }}>{m.unread > 99 ? '99+' : m.unread}</Text>}
            <Text style={{ fontSize: '12px', color: '#999' }}>{m.desc}</Text>
            <Text style={{ fontSize: '16px', color: '#ccc' }}>›</Text>
          </View>
        ))}
      </View>

      <View style={{ textAlign: 'center', color: '#bbb', fontSize: '11px', padding: '24px 0' }}>购物流程 · 由成员 B 构建的小程序演示端</View>
    </View>
  )
}
