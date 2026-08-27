import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { load, save, uid } from '../utils/store'

const emptyForm = { id: '', name: '', phone: '', region: '', detail: '', isDefault: false }

export default function AddressList() {
  const [addresses, setAddresses] = useState(load('address', []))
  const [editing, setEditing] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  const openNew = () => {
    setEditing({ ...emptyForm, id: uid() })
    setShowForm(true)
  }

  const startEdit = (a) => {
    setEditing({ ...a })
    setShowForm(true)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!editing.name.trim() || !editing.phone.trim() || !editing.region.trim() || !editing.detail.trim()) {
      alert('请填写完整信息')
      return
    }
    let next
    if (editing.isDefault) {
      next = addresses.map((a) => ({ ...a, isDefault: false }))
    } else {
      next = [...addresses]
    }
    const exists = next.some((a) => a.id === editing.id)
    if (exists) {
      next = next.map((a) => (a.id === editing.id ? editing : a))
    } else {
      next.push(editing)
    }
    setAddresses(next)
    save('address', next)
    setShowForm(false)
    setEditing(emptyForm)
  }

  const remove = (id) => {
    const next = addresses.filter((a) => a.id !== id)
    setAddresses(next)
    save('address', next)
  }

  const setDefault = (id) => {
    const next = addresses.map((a) => ({ ...a, isDefault: a.id === id }))
    setAddresses(next)
    save('address', next)
  }

  const onField = (k, v) => setEditing((prev) => ({ ...prev, [k]: v }))

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>收货地址管理</h2>
        <button className="btn" onClick={openNew} style={{ padding: '8px 20px' }}>+ 新增地址</button>
      </div>

      {addresses.length === 0 && !showForm && (
        <div className="empty">
          <div className="icon">📍</div>
          <p>还没有收货地址，点击右上角「新增地址」添加</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 16 }}>
        {addresses.map((a) => (
          <div className="card" key={a.id} style={{ position: 'relative' }}>
            {a.isDefault && <span className="tag" style={{ position: 'absolute', top: 12, right: 12 }}>默认</span>}
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
              {a.name} <span style={{ color: '#666', fontWeight: 400 }}> {a.phone}</span>
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 14 }}>{a.region} {a.detail}</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {!a.isDefault && (
                <button className="btn secondary" style={{ padding: '5px 12px', fontSize: 13 }} onClick={() => setDefault(a.id)}>
                  设为默认
                </button>
              )}
              <button className="btn secondary" style={{ padding: '5px 12px', fontSize: 13 }} onClick={() => startEdit(a)}>
                编辑
              </button>
              <button className="btn secondary" style={{ padding: '5px 12px', fontSize: 13, color: 'var(--danger)' }} onClick={() => remove(a.id)}>
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div className="card" style={{ width: 460, maxWidth: '100%' }}>
            <h3 style={{ marginBottom: 16 }}>{editing.name ? '编辑地址' : '新增地址'}</h3>
            <form onSubmit={submit}>
              <div className="form-row">
                <label>收货人</label>
                <input value={editing.name} onChange={(e) => onField('name', e.target.value)} placeholder="请输入收货人姓名" />
              </div>
              <div className="form-row">
                <label>手机号码</label>
                <input value={editing.phone} onChange={(e) => onField('phone', e.target.value)} placeholder="请输入手机号" />
              </div>
              <div className="form-row">
                <label>所在地区</label>
                <input value={editing.region} onChange={(e) => onField('region', e.target.value)} placeholder="如：广东省 深圳市 南山区" />
              </div>
              <div className="form-row">
                <label>详细地址</label>
                <input value={editing.detail} onChange={(e) => onField('detail', e.target.value)} placeholder="街道、门牌号等" />
              </div>
              <div className="form-row">
                <label>
                  <input type="checkbox" checked={editing.isDefault} onChange={(e) => onField('isDefault', e.target.checked)} />
                  {' '}设为默认地址
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn secondary" onClick={() => setShowForm(false)}>取消</button>
                <button type="submit" className="btn">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
