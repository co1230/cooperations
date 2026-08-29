import { useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { products, getShopById } from '../mock/data'
import { load, save } from '../utils/store'
import Rating from '../components/Rating'
import { useCart } from '../components/CartContext'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const product = products.find((p) => p.id === Number(id))
  const { addToCart } = useCart()

  const [selected, setSelected] = useState({})
  const [reviewsFilter, setReviewsFilter] = useState('all')
  const [favorites, setFavorites] = useState(load('favorites', []))
  const [toast, setToast] = useState('')

  const isFav = favorites.some((f) => f.id === product?.id)
  const shop = product ? getShopById(product.shopId) : null

  // 支持单元：展示当前选择是否可用的组合
  const combos = product?.combos || []

  const showToast = (msg) => {
    setToast(msg)
    clearTimeout(showToast._t)
    showToast._t = setTimeout(() => setToast(''), 1800)
  }

  if (!product) {
    return <div className="empty"><p>商品不存在</p></div>
  }

  const toggleFav = () => {
    if (isFav) {
      setFavorites((prev) => prev.filter((f) => f.id !== product.id))
      save('favorites', favorites.filter((f) => f.id !== product.id))
      showToast('已取消收藏')
    } else {
      const next = [{ id: product.id, product }, ...favorites]
      setFavorites(next)
      save('favorites', next)
      showToast('已加入收藏')
    }
  }

  // 在【已选】维度下，判断某个选项是否可售（与其它已选维度匹配的组合存在且有货）
  const setOption = (specName, optionLabel) => {
    setSelected((prev) => ({ ...prev, [specName]: optionLabel }))
  }

  const currentCombo = useMemo(() => {
    if (!product) return null
    const [aK, bK] = product.skus.map((s) => s.specName)
    const labels = [selected[aK], selected[bK]].filter(Boolean)
    if (labels.length < product.skus.length) return null
    const found = combos.find((c) => {
      const parts = c.key.split('|')
      return parts.every((part) => labels.includes(part))
    })
    return found
  }, [product, selected, combos])

  const availStock = currentCombo ? currentCombo.stock : 0
  const displayPrice = currentCombo ? currentCombo.price : product.price

  const selectedLabels = product.skus.map((s) => selected[s.specName]).filter(Boolean)

  const handleAction = async (kind) => {
    if (selectedLabels.length < product.skus.length) {
      alert('请先选择完整规格')
      return
    }
    if (availStock <= 0) {
      alert('该规格已售罄，请选择其他规格')
      return
    }
    if (kind === 'cart') {
      try {
        await addToCart({ productId: product.id, skuLabels: selectedLabels, qty: 1 })
        showToast('已加入购物车')
      } catch (error) { alert(error.message) }
    } else {
      // 立即购买：不写入购物车，直接把购买项传给结算页
      const buyItem = {
        key: `buy-${Date.now()}`,
        productId: product.id,
        skuLabels: selectedLabels,
        price: currentCombo.price,
        qty: 1,
        maxStock: availStock,
      }
      navigate('/checkout', { state: { fromBuyNow: buyItem } })
    }
  }

  const filteredReviews = useMemo(() => {
    if (!product) return []
    const base = product.reviews
    if (reviewsFilter === 'good') return base.filter((r) => r.level >= 4)
    if (reviewsFilter === 'mid') return base.filter((r) => r.level === 3)
    if (reviewsFilter === 'bad') return base.filter((r) => r.level <= 2)
    return base
  }, [product, reviewsFilter])

  return (
    <div className="page">
      {/* 面包屑 */}
      <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>
        <Link to="/">首页</Link> / <Link to={`/category?id=${product.categoryId}`}>{product.category}</Link> / {product.name}
      </div>

      {/* 店铺信息 */}
      {shop && (
        <Link to={`/shop/${shop.id}`} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 34, width: 56, height: 56, background: '#f5f5f5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {shop.logo}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{shop.name}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{shop.slogan} · 好评率 {product.positive}% · 粉丝 {shop.followers.toLocaleString()}</div>
          </div>
          <span style={{ color: 'var(--primary)', fontSize: 14 }}>进店逛逛 ›</span>
        </Link>
      )}

      <div className="card" style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        {/* 图片 */}
        <div style={{ width: 360, maxWidth: '100%' }}>
          <img src={product.image} alt={product.name} style={{ width: '100%', borderRadius: 8, aspectRatio: 1, objectFit: 'cover' }} />
        </div>

        {/* 信息 */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>{product.name}</h1>
          <div style={{ color: '#666', marginBottom: 12 }}>{product.desc}</div>

          <div style={{ background: '#fff7f3', borderRadius: 6, padding: 14, marginBottom: 16 }}>
            <div style={{ color: '#999', fontSize: 13, marginBottom: 6 }}>价格</div>
            <span className="price" style={{ fontSize: 28 }}>{displayPrice}</span>
            {currentCombo === null && (
              <span style={{ marginLeft: 12, fontSize: 13, color: '#999' }}>选择规格后显示具体价格</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 24, marginBottom: 20, fontSize: 14, color: '#555' }}>
            <span>已售 <b style={{ color: '#333' }}>{product.sales}+</b></span>
            <span>好评率 <b style={{ color: 'var(--primary)' }}>{product.positive}%</b></span>
            <span>品牌 <b style={{ color: '#333' }}>{product.brand}</b></span>
          </div>

          {/* 规格选择 */}
          <div style={{ marginBottom: 20 }}>
            {product.skus.map((sku) => {
              const picked = selected[sku.specName]
              return (
                <div key={sku.id} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                    {sku.specName}：<b style={{ color: '#333' }}>{picked || '请选择'}</b>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {sku.options.map((opt) => (
                      <button
                        key={opt.id}
                        disabled={opt.stock === 0}
                        onClick={() => setOption(sku.specName, opt.label)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 4,
                          background: picked === opt.label ? 'var(--primary)' : '#f5f5f5',
                          color: picked === opt.label ? '#fff' : opt.stock === 0 ? '#bbb' : '#444',
                          border: picked === opt.label ? '1px solid var(--primary)' : '1px solid transparent',
                          fontSize: 14,
                        }}
                      >
                        {opt.label}
                        {opt.stock === 0 && <span style={{ fontSize: 11, marginLeft: 6 }}>(缺货)</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 14, color: '#666' }}>
              当前库存：{currentCombo ? availStock : '—'}
              {currentCombo && availStock <= 10 && availStock > 0 && <span style={{ color: 'var(--warn)', marginLeft: 6 }}>库存紧张</span>}
              {currentCombo && availStock === 0 && <span style={{ color: 'var(--danger)', marginLeft: 6 }}>已售罄</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn ghost" onClick={toggleFav} style={{ padding: '10px 24px' }}>
              {isFav ? '♥ 已收藏' : '♡ 收藏'}
            </button>
            <button className="btn ghost" onClick={() => handleAction('cart')} style={{ padding: '10px 24px' }}>
              加入购物车
            </button>
            <button className="btn" onClick={() => handleAction('buy')} style={{ padding: '10px 24px', flex: 1 }}>
              立即购买
            </button>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
            * 购物车、订单和库存已接入 C 交易服务；支付仍为不真实扣款的模拟网关。
          </div>
        </div>
      </div>

      {/* 评价区 */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>商品评价（{product.reviews.length}）</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'good', 'mid', 'bad'].map((f) => (
              <button
                key={f}
                onClick={() => setReviewsFilter(f)}
                className={`btn ${reviewsFilter === f ? '' : 'secondary'}`}
                style={{ padding: '5px 12px', fontSize: 13 }}
              >
                {{ all: '全部', good: '好评', mid: '中评', bad: '差评' }[f]}
              </button>
            ))}
          </div>
        </div>
        {filteredReviews.length ? (
          filteredReviews.map((r) => (
            <div className="review" key={r.id}>
              <div className="review-head">
                <div className="avatar">👤</div>
                <div>
                  <div style={{ fontSize: 14 }}>{r.user}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{r.time}</div>
                </div>
                <span className="tag" style={{ marginLeft: 'auto' }}>{r.tag}</span>
              </div>
              <Rating value={r.level} />
              <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>{r.content}</p>
            </div>
          ))
        ) : (
          <div className="empty" style={{ padding: 30 }}><p>该分类暂无评价</p></div>
        )}
      </div>

      {/* toast */}
      {toast && (
        <div style={{
          position: 'fixed', left: '50%', top: 80, transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '10px 20px', borderRadius: 20, zIndex: 999, fontSize: 14,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
