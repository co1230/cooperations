import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import { getSessions, removeSession } from '../../utils/chat'

function fmtTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function Messages() {
  const [sessions, setSessions] = useState([])
  useDidShow(() => { setSessions(getSessions()); Taro.setNavigationBarTitle({ title: '个人消息' }) })

  const del = (id) => {
    Taro.showModal({ title: '删除会话', content: '确认删除该会话？', success: (r) => { if (r.confirm) { removeSession(id); setSessions(getSessions()) } } })
  }
  const totalUnread = sessions.reduce((s, x) => s + (x.unread || 0), 0)

  return (
    <View style={{ padding: '16px' }}>
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <Text style={{ fontSize: '18px', fontWeight: 700 }}>个人消息{totalUnread > 0 && <Text style={{ color: '#ff4d4f', fontSize: '13px' }}>（{totalUnread} 条未读）</Text>}</Text>
      </View>

      {sessions.length === 0 ? (
        <View className='empty'><View className='icon'>💬</View>暂无消息<View className='btn' style={{ marginTop: '20px', display: 'inline-block' }} onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>去逛逛</View></View>
      ) : (
        sessions.map((s) => (
          <View key={s.id} className='card' style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => Taro.navigateTo({ url: `/pages/chat/index?shopId=${s.shopId}` })}>
            <View style={{ position: 'relative' }}>
              <View style={{ width: '52px', height: '52px', background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>{s.shopLogo}</View>
              {(s.unread || 0) > 0 && (
                <Text style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ff4d4f', color: '#fff', borderRadius: '12px', fontSize: '10px', minWidth: '18px', height: '18px', lineHeight: '18px', textAlign: 'center', padding: '0 4px' }}>{s.unread > 99 ? '99+' : s.unread}</Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ display: 'flex', alignItems: 'center' }}>
                <Text style={{ fontWeight: 700, fontSize: '15px' }}>{s.shopName} 客服</Text>
                <Text style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>{fmtTime(s.lastTime)}</Text>
              </View>
              <Text style={{ fontSize: '13px', color: (s.unread || 0) > 0 ? '#333' : '#999', marginTop: '4px' }}>{s.lastMsg || '开始聊天'}</Text>
            </View>
            <Text style={{ fontSize: '13px', color: '#bbb', padding: '4px' }} onClick={() => del(s.id)}>删除</Text>
          </View>
        ))
      )}
    </View>
  )
}
