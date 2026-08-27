import { Link } from 'react-router-dom'
import { products, categories } from '../mock/data'
import ProductGrid from '../components/ProductGrid'

export default function Home() {
  const featured = products.filter((p) => p.featured)

  return (
    <div className="page">
      <div className="card" style={{ marginBottom: 24, padding: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>欢迎来到优购商城 👋</div>
        <div style={{ color: '#666' }}>浏览全场商品、发现好物，挑选心仪的商品加入收藏。</div>
      </div>

      <h2 className="section-title">热门分类</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 12, marginBottom: 32 }}>
        {categories.map((c) => (
          <Link key={c.id} to={`/category?id=${c.id}`} className="card" style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 30 }}>{c.icon}</div>
            <div style={{ marginTop: 8, fontWeight: 600 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{c.children.slice(0, 3).join(' · ')}</div>
          </Link>
        ))}
      </div>

      <h2 className="section-title">精选推荐</h2>
      <ProductGrid products={featured} />

      <h2 className="section-title">全部商品</h2>
      <ProductGrid products={products} />
    </div>
  )
}
