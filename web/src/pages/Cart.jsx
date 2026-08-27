import { Link, useNavigate } from 'react-router-dom'
import { useCart, resolveProduct } from '../components/CartContext'

export default function Cart() {
  const navigate = useNavigate()
  const { cart, updateQty, removeItem, toggleCheck, toggleCheckAll, clearChecked } = useCart()

  const checkedItems = cart.filter((i) => i.checked)
  const allChecked = cart.length > 0 && checkedItems.length === cart.length

  const totalPrice = checkedItems.reduce((s, i) => s + i.price * i.qty, 0)
  const totalQty = checkedItems.reduce((s, i) => s + i.qty, 0)

  const toCheckout = () => {
    if (checkedItems.length === 0) {
      alert('请先勾选要结算的商品')
      return
    }
    navigate('/checkout')
  }

  return (
    <div className="page">
      <h2 className="section-title">购物车（{cart.length}）</h2>

      {cart.length === 0 ? (
        <div className="empty">
          <div className="icon">🛒</div>
          <p>购物车还是空的</p>
          <Link to="/" className="btn" style={{ marginTop: 12 }}>去逛逛</Link>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {cart.map((item) => {
              const prod = resolveProduct(item.productId)
              return (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderBottom: '1px solid var(--border)' }}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleCheck(item.key)}
                    style={{ width: 18, height: 18 }}
                  />
                  <Link to={`/product/${prod.id}`} style={{ flexShrink: 0 }}>
                    <img src={prod.image} alt={prod.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                  </Link>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{prod.name}</div>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                      {item.skuLabels.map((l, i) => (
                        <span key={i} style={{ background: '#f5f5f5', borderRadius: 3, padding: '2px 6px', marginRight: 6 }}>{l}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="price" style={{ fontSize: 16 }}>{item.price}</span>
                      <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>库存 {item.maxStock}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 4 }}>
                      <button
                        onClick={() => updateQty(item.key, item.qty - 1)}
                        style={{ width: 30, height: 30, background: '#f5f5f5' }}
                      >−</button>
                      <span style={{ width: 40, textAlign: 'center' }}>{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.key, item.qty + 1)}
                        style={{ width: 30, height: 30, background: '#f5f5f5' }}
                      >+</button>
                    </div>
                    <button className="btn secondary" style={{ padding: '6px 10px', fontSize: 13, color: 'var(--danger)' }} onClick={() => removeItem(item.key)}>
                      删除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 底部结算栏 */}
          <div style={{
            position: 'sticky', bottom: 12, background: '#fff', borderRadius: 8,
            boxShadow: '0 -2px 12px rgba(0,0,0,0.08)', padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 20, marginTop: 16,
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              <input type="checkbox" checked={allChecked} onChange={(e) => toggleCheckAll(e.target.checked)} />
              全选
            </label>
            <button className="btn secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={clearChecked}>
              删除已选
            </button>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#666' }}>
                已选 <b style={{ color: 'var(--primary)' }}>{totalQty}</b> 件，合计：
                <span className="price" style={{ fontSize: 22 }}>{totalPrice}</span>
              </div>
              <div style={{ fontSize: 11, color: '#999' }}>模拟结算，不实际扣款</div>
            </div>
            <button className="btn" style={{ padding: '12px 40px' }} disabled={checkedItems.length === 0} onClick={toCheckout}>
              去结算
            </button>
          </div>
        </>
      )}
    </div>
  )
}
