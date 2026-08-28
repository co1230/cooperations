import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getShopById } from '../mock/data'
import { openSession, getMessages, getSessions, sendUserMessage, markRead, appendMessage } from '../utils/chat'

const QUICK_REPLIES = ['在吗？', '这件商品还有货吗？', '什么时候发货？', '支持退换货吗？', '可以优惠一点吗？', '怎么联系到客服？']

export default function Chat() {
  const { shopId } = useParams()
  const navigate = useNavigate()
  const shop = getShopById(shopId)
  const endRef = useRef(null)

  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [resolved, setResolved] = useState(false)

  // 初始化会话
  useEffect(() => {
    if (!shop) return
    const sid = openSession(shop)
    setSessionId(sid)
    setMessages(getMessages(sid))
    markRead(sid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId])

  // 滚动到底
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
    // 标记已读
    if (sessionId) markRead(sessionId)
  }, [messages, sessionId])

  if (!shop) {
    return <div className="empty"><p>店铺不存在</p></div>
  }

  const reload = () => {
    if (sessionId) {
      setMessages(getMessages(sessionId))
      markRead(sessionId)
    }
  }

  const doSend = (text) => {
    const t = (text || input || '').trim()
    if (!t || !sessionId || refreshing) return
    setInput('')
    setRefreshing(true)
    // 先在本地立即加一条用户消息展示
    appendMessage(sessionId, 'user', t)
    setMessages(getMessages(sessionId))
    sendUserMessage(sessionId, t, () => {
      setMessages(getMessages(sessionId))
      setRefreshing(false)
    })
    // 触发重渲染以标记已读（本会话自身不需未读角标）
  }

  const transfer = () => {
    if (!sessionId) return
    appendMessage(sessionId, 'user', '我想转人工客服')
    appendMessage(sessionId, 'agent', '好的，正在为您转接人工客服，请稍候…（演示环境，已为您接通）')
    setResolved(true)
    setMessages(getMessages(sessionId))
  }

  return (
    <div className="page" style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* 顶部：返回/客服信息 */}
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
        {/* 客服头部 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg,#fff7f3,#fff)' }}>
          <button className="btn secondary" style={{ padding: '5px 12px', fontSize: 13 }} onClick={() => navigate(-1)}>← 返回</button>
          <div style={{ fontSize: 30 }}>{shop.logo}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{shop.name} 官方客服</div>
            <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 2 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--success)', borderRadius: '50%', marginRight: 4 }} />
              {resolved ? '人工客服在线' : '智能客服 优小助 在线'}
            </div>
          </div>
          <Link to={`/shop/${shop.id}`} className="btn secondary" style={{ marginLeft: 'auto', padding: '5px 12px', fontSize: 12 }}>进店</Link>
        </div>

        {/* 消息区 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', background: '#f7f8fa' }}>
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} shop={shop} />
          ))}
          {refreshing && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{shop.logo}</div>
              <div style={{ background: '#fff', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#999' }}>正在输入…</div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* 快捷回复 */}
        <div style={{ display: 'flex', gap: 8, padding: '8px 14px', background: '#fff', borderTop: '1px solid var(--border)', overflowX: 'auto' }}>
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              className="btn secondary"
              style={{ flexShrink: 0, padding: '5px 12px', fontSize: 12 }}
              onClick={() => doSend(q)}
            >
              {q}
            </button>
          ))}
        </div>

        {/* 转人工 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#fff', borderTop: '1px solid var(--border)' }}>
          <button className="btn secondary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={transfer} disabled={resolved}>
            {resolved ? '已转接人工客服' : '转人工客服'}
          </button>
          <span style={{ fontSize: 12, color: '#999' }}>工作时间 9:00 - 21:00</span>
        </div>

        {/* 输入区 */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: '#fff', borderTop: '1px solid var(--border)' }}>
          <input
            style={{ flex: 1, border: '1px solid #ddd', borderRadius: 20, padding: '9px 16px', fontSize: 14 }}
            placeholder="请输入您要咨询的问题…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSend()}
          />
          <button className="btn" style={{ padding: '9px 22px', borderRadius: 20 }} onClick={() => doSend()} disabled={refreshing}>
            发送
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg, shop }) {
  const time = new Date(msg.time)
  const hhmm = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
  const isUser = msg.from === 'user'

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{ maxWidth: '72%' }}>
          <div style={{ background: 'var(--primary)', color: '#fff', borderRadius: 12, padding: '9px 14px', fontSize: 14, wordBreak: 'break-word' }}>{msg.text}</div>
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 4, textAlign: 'right' }}>{hhmm}</div>
        </div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{shop.logo}</div>
      <div style={{ maxWidth: '72%' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '9px 14px', fontSize: 14, wordBreak: 'break-word' }}>{msg.text}</div>
        <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>{hhmm}</div>
      </div>
    </div>
  )
}
