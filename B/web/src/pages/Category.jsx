import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { products, categories } from '../mock/data'
import PagedGrid from '../components/PagedGrid'

export default function Category() {
  const [params] = useSearchParams()
  const initId = Number(params.get('id')) || categories[0].id
  const [activeId, setActiveId] = useState(initId)
  const [activeChild, setActiveChild] = useState('全部')

  const activeCat = categories.find((c) => c.id === activeId) || categories[0]

  const list = useMemo(() => {
    let l = products.filter((p) => p.category === activeCat.name)
    if (activeChild !== '全部') {
      l = l.filter((p) => p.name.includes(activeChild) || p.category.includes(activeChild))
    }
    return l
  }, [activeCat, activeChild])

  const onSelect = (id) => {
    setActiveId(id)
    setActiveChild('全部')
  }

  return (
    <div className="page">
      <h2 className="section-title">商品分类</h2>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div className="card" style={{ width: 200, flexShrink: 0, padding: 8 }}>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              style={{
                display: 'flex',
                width: '100%',
                padding: '12px 14px',
                background: activeId === c.id ? 'rgba(255,80,0,0.08)' : 'transparent',
                color: activeId === c.id ? 'var(--primary)' : '#333',
                fontWeight: activeId === c.id ? 600 : 400,
                borderRadius: 4,
                fontSize: 14,
                textAlign: 'left',
                marginBottom: 4,
              }}
            >
              <span style={{ marginRight: 8 }}>{c.icon}</span>
              {c.name}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          <div className="card" style={{ marginBottom: 16, padding: 12 }}>
            <span style={{ fontSize: 14, color: '#555', marginRight: 8 }}>子分类：</span>
            {['全部', ...activeCat.children].map((ch) => (
              <button
                key={ch}
                onClick={() => setActiveChild(ch)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 14,
                  fontSize: 13,
                  marginRight: 8,
                  background: activeChild === ch ? 'var(--primary)' : '#f5f5f5',
                  color: activeChild === ch ? '#fff' : '#555',
                }}
              >
                {ch}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 16, color: '#666', fontSize: 14 }}>
            <Link to="/search">去搜索页进行多条件筛选 →</Link>
          </div>

          <PagedGrid products={list} />
        </div>
      </div>
    </div>
  )
}
