import { useState } from 'react'
import { Link } from 'react-router-dom'
import { load, save } from '../utils/store'
import ProductGrid from '../components/ProductGrid'

export default function Favorites() {
  const [items, setItems] = useState(load('favorites', []))

  const remove = (id) => {
    const next = items.filter((f) => f.id !== id)
    setItems(next)
    save('favorites', next)
  }

  const clearAll = () => {
    setItems([])
    save('favorites', [])
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>我的收藏（{items.length}）</h2>
        {items.length > 0 && (
          <button className="btn secondary" onClick={clearAll}>清空收藏</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <div className="icon">❤️</div>
          <p>还没有收藏商品</p>
          <Link to="/" className="btn" style={{ marginTop: 12 }}>去逛逛</Link>
        </div>
      ) : (
        <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))' }}>
          {items.map((f) => (
            <div className="product-card" key={f.id}>
              <Link to={`/product/${f.id}`}>
                <img src={f.product.image} alt={f.product.name} />
                <div className="body">
                  <div className="name">{f.product.name}</div>
                  <div className="price-row">
                    <span className="price">{f.product.price}</span>
                    <span className="sales">已售 {f.product.sales}+</span>
                  </div>
                </div>
              </Link>
              <button
                className="btn secondary"
                style={{ margin: '0 12px 14px', padding: '7px', width: 'calc(100% - 24px)', color: 'var(--danger)' }}
                onClick={() => remove(f.id)}
              >
                移除收藏
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
