import { useParams, Link } from 'react-router-dom'
import { getShopById, getProductsByShop } from '../mock/data'
import PagedGrid from '../components/PagedGrid'

export default function ShopDetail() {
  const { id } = useParams()
  const shop = getShopById(id)
  const shopProducts = getProductsByShop(id)

  if (!shop) {
    return <div className="empty"><p>店铺不存在</p></div>
  }

  // 店铺好评率：由其商品好评率取平均值
  const avgPositive = Math.round(
    shopProducts.reduce((s, p) => s + p.positive, 0) / shopProducts.length
  )

  return (
    <div className="page">
      <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>
        <Link to="/">首页</Link> / 店铺 · {shop.name}
      </div>

      {/* 店铺头图 */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 24, marginBottom: 16, background: 'linear-gradient(135deg,#fff7f3,#fff)' }}>
        <div style={{ fontSize: 56, width: 84, height: 84, background: '#f5f5f5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {shop.logo}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24 }}>{shop.name}</h1>
            <span className="tag">{shop.slogan}</span>
          </div>
          <div style={{ color: '#666', fontSize: 14, marginTop: 8 }}>{shop.desc}</div>
          <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: 13, color: '#999' }}>
            <span>粉丝 <b style={{ color: '#333' }}>{shop.followers.toLocaleString()}</b></span>
            <span>店铺评分 <b style={{ color: 'var(--primary)' }}>{shop.rating}</b></span>
            <span>好评率 <b style={{ color: '#333' }}>{avgPositive}%</b></span>
            <span>所在地 <b style={{ color: '#333' }}>{shop.city}</b></span>
          </div>
        </div>
      </div>

      <h2 className="section-title">店内商品（{shopProducts.length}）</h2>
      <PagedGrid products={shopProducts} />
    </div>
  )
}
