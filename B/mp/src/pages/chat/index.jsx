import Taro, { useRouter, useLoad, useDidShow } from '@tarojs/taro'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import { useState } from 'react'
import { getShopById } from '../../mock/data'
import { openSession, getMessages, sendUserMessage, markRead, appendMessage } from '../../utils/chat'

const QUICK = ['在吗？', '这件商品还有货吗？', '什么时候发货？', '支持退换货吗？', '可以优惠一点吗？', '怎么联系人工客服？']

export default function Chat() {
  const router = useRouter()
  const shop = getShopById(Number(router.params.shopId))
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [resolved, setResolved] = useState(false)
  const [scrollTop, setScrollTop] = useState(9999)

  useLoad(() => {
    if (!shop) return
    const sid = openSession(shop)
    setSessionId(sid)
    setMessages(getMessages(sid))
    markRead(sid)
    setScrollTop(9999)
  })
  useDidShow(() => { if (sessionId) markRead(sessionId) })

  if (!shop) return <View className='empty'><View className='icon'>🏪</View>店铺不存在</View>

  const reload = () => {
    if (sessionId) { setMessages(getMessages(sessionId)); markRead(sessionId); setScrollTop(9999) }
  }

  const doSend = (text) => {
    const t = (text || input || '').trim()
    if (!t || !sessionId || refreshing) return
    setInput('')
    setRefreshing(true)
    appendMessage(sessionId, 'user', t)
    setMessages(getMessages(sessionId))
    sendUserMessage(sessionId, t, () => { setMessages(getMessages(sessionId)); setRefreshing(false); setScrollTop(9999) })
  }

  const transfer = () => {
    if (!sessionId) return
    appendMessage(sessionId, 'user', '我想转人工客服')
    appendMessage(sessionId, 'agent', '好的，正在为您转接人工客服，请稍候…（演示环境，已为您接通）')
    setResolved(true)
    setMessages(getMessages(sessionId))
  }

  const fmt = (time) => {
    const d = new Date(time)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <View style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      {/* 客服头部 */}
      <View style={{ background: '#fff', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: '1px solid #eee' }}>
        <View style={{ fontSize: '30px' }}>{shop.logo}</View>
        <View>
          <Text style={{ fontWeight: 700, fontSize: '15px', display: 'block' }}>{shop.name} 官方客服</Text>
          <Text style={{ fontSize: '11px', color: '#22c55e', marginTop: '2px' }}>{resolved ? '● 人工客服在线' : '● 智能客服 优小助 在线'}</Text>
        </View>
      </View>

      {/* 消息区 */}
      <ScrollView
        scrollY
        style={{ flex: 1 }}
        scrollTop={scrollTop}
        scrollWithAnimation
        onScroll={() => {}}
      >
        <View style={{ padding: '16px' }}>
          {messages.map((m) => {
            const isUser = m.from === 'user'
            if (isUser) {
              return (
                <View key={m.id} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
                  <View style={{ maxWidth: '75%' }}>
                    <View style={{ background: '#ff5000', color: '#fff', borderRadius: '12px', padding: '10px 14px', fontSize: '14px', wordBreak: 'break-all' }}>{m.text}</View>
                    <Text style={{ fontSize: '10px', color: '#bbb', marginTop: '4px', display: 'block', textAlign: 'right' }}>{fmt(m.time)}</Text>
                  </View>
                </View>
              )
            }
            return (
              <View key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '14px' }}>
                <View style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{shop.logo}</View>
                <View style={{ maxWidth: '75%' }}>
                  <View style={{ background: '#fff', borderRadius: '12px', padding: '10px 14px', fontSize: '14px', wordBreak: 'break-all' }}>{m.text}</View>
                  <Text style={{ fontSize: '10px', color: '#bbb', marginTop: '4px' }}>{fmt(m.time)}</Text>
                </View>
              </View>
            )
          })}
          {refreshing && (
            <View style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <View style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{shop.logo}</View>
              <View style={{ background: '#fff', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', color: '#999' }}>正在输入…</View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 快捷语 */}
      <View style={{ display: 'flex', gap: '8px', padding: '8px 14px', background: '#fff', overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {QUICK.map((q) => (
          <Text key={q} onClick={() => doSend(q)} style={{ flexShrink: 0, background: '#f3f3f3', borderRadius: '16px', padding: '6px 14px', fontSize: '12px' }}>{q}</Text>
        ))}
      </View>

      {/* 转人工 */}
      <View style={{ padding: '6px 14px', background: '#fff', borderTop: '1px solid #eee' }}>
        <Text onClick={() => !resolved && transfer()} style={{ fontSize: '12px', color: resolved ? '#999' : '#ff5000', padding: '4px 0', display: 'inline-block' }}>{resolved ? '已转接人工客服' : '转人工客服 ›'}</Text>
      </View>

      {/* 输入区 */}
      <View style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#fff', borderTop: '1px solid #eee', paddingBottom: '24px' }}>
        <Input
          style={{ flex: 1, border: '1px solid #ddd', borderRadius: '20px', padding: '9px 16px', fontSize: '14px' }}
          value={input}
          onInput={(e) => setInput(e.detail.value)}
          placeholder='请输入您要咨询的问题…'
          confirmType='send'
          onConfirm={() => doSend()}
        />
        <View className='btn' style={{ borderRadius: '20px', padding: '9px 20px', fontSize: '14px' }} onClick={() => doSend()}>发送</View>
      </View>
    </View>
  )
}
