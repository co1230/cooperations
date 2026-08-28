import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSessions, removeSession } from '../utils/chat'

function fmtTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function Messages() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState(getSessions())

  const refresh = () => setSessions(getSessions())

  const del = (e, id) => {
    e.stopPropagation()
    if (confirm('删除该会话？')) {
      removeSession(id)
      refresh()
    }
  }

  const totalUnread = sessions.reduce((s, x) => s + (x.unread || 0), 0)

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          个人消息
          {totalUnread > 0 && <span style={{ fontSize: 13, color: 'var(--danger)', marginLeft: 8 }}>（{totalUnread} 条未读）</span>}
        </h2>
        <span className="tag">客服会话</span>
      </div>

      {sessions.length === 0 ? (
        <div className="empty">
          <div className="icon">💬</div>
          <p>暂无消息</p>
          <Link to="/" className="btn" style={{ marginTop: 12 }}>去逛逛</Link>
        </div>
      ) : (
        sessions.map((s) => (
          <div
            key={s.id}
            className="card"
            onClick={() => navigate(`/chat/${s.shopId}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, cursor: 'pointer', padding: 16 }}
          >
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 34, width: 52, height: 52, background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.shopLogo}
              </div>
              {(s.unread || 0) > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4, background: 'var(--danger)', color: '#fff',
                  borderRadius: 12, fontSize: 11, minWidth: 18, height: 18, lineHeight: '18px', textAlign: 'center', padding: '0 4px',
                }}>
                  {s.unread > 99 ? '99+' : s.unread}
                </span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{s.shopName} 客服</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#999' }}>{fmtTime(s.lastTime)}</span>
              </div>
              <div style={{ fontSize: 13, color: (s.unread || 0) > 0 ? '#333' : '#999', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.lastMsg || '开始聊天'}
              </div>
            </div>
            <button className="btn secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={(e) => del(e, s.id)}>删除</button>
          </div>
        ))
      )}
    </div>
  )
}
