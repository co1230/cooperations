// ============ 客服聊天消息存储（localStorage） ============
import { uid } from './store'

const KEY_SESSIONS = 'chat_sessions'
const KEY_MSGS = (sessionId) => `chat_msgs_${sessionId}`

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// 客服自动回复的话术
const REPLIES = [
  '您好，很高兴为您服务～请问有什么可以帮您？',
  '这款商品目前有现货哦，正常 48 小时内发货～',
  '亲，物流信息会同步更新，请您耐心等待，也可以随时问我进度哦。',
  '关于退换货，订单支持 7 天无理由退换的哈。',
  '好的，我帮您记录一下，稍后会有专员跟进处理～',
  '感谢您的支持，祝您购物愉快！还有其他需要吗？',
]

export function getSessions() {
  return read(KEY_SESSIONS, [])
}

function saveSessions(sessions) {
  write(KEY_SESSIONS, sessions.slice(0, 100))
}

export function getMessages(sessionId) {
  return read(KEY_MSGS(sessionId), [])
}

function saveMessages(sessionId, msgs) {
  write(KEY_MSGS(sessionId), msgs.slice(-200))
}

// 打开/创建与某店铺的会话，返回 sessionId
export function openSession(shop) {
  const sessions = getSessions()
  let session = sessions.find((s) => s.shopId === shop.id)
  if (!session) {
    session = {
      id: uid(),
      shopId: shop.id,
      shopName: shop.name,
      shopLogo: shop.logo,
      lastTime: Date.now(),
      lastMsg: '',
      unread: 0,
    }
    saveSessions([session, ...sessions])
    // 初始化客服欢迎语
    appendMessage(session.id, 'agent', `欢迎光临【${shop.name}】，我是智能客服小优，请问有什么可以帮您？`)
  }
  return session.id
}

// 追加一条消息到会话（更新 lastMsg/lastTime，若来自客服则未读+1）
export function appendMessage(sessionId, from, text, extra = {}) {
  const sessions = getSessions()
  const session = sessions.find((s) => s.id === sessionId)
  if (!session) return

  const msgs = getMessages(sessionId)
  msgs.push({
    id: uid(),
    sessionId,
    from,
    text,
    time: Date.now(),
    ...extra,
  })
  saveMessages(sessionId, msgs)

  session.lastMsg = text
  session.lastTime = Date.now()
  if (from === 'agent') session.unread = (session.unread || 0) + 1
  saveSessions(sessions)
  return sessionId
}

// 用户发送消息，返回消息；自动异步生成客服回复并回调
export function sendUserMessage(sessionId, text, onReply) {
  appendMessage(sessionId, 'user', text)
  const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)]
  setTimeout(() => {
    appendMessage(sessionId, 'agent', reply)
    if (onReply) onReply()
  }, 900 + Math.random() * 900)
  return
}

export function markRead(sessionId) {
  const sessions = getSessions()
  const session = sessions.find((s) => s.id === sessionId)
  if (session && session.unread) {
    session.unread = 0
    saveSessions(sessions)
  }
}

export function getUnreadTotal() {
  return getSessions().reduce((sum, s) => sum + (s.unread || 0), 0)
}

export function removeSession(sessionId) {
  const sessions = getSessions().filter((s) => s.id !== sessionId)
  saveSessions(sessions)
  localStorage.removeItem(KEY_MSGS(sessionId))
}
