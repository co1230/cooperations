import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { products, brands } from '../mock/data'
import PagedGrid from '../components/PagedGrid'

const allCats = ['', ...new Set(products.map((p) => p.category))]

const sortOptions = [
  { key: 'default', label: '综合' },
  { key: 'sales', label: '销量' },
  { key: 'price-asc', label: '价格低到高' },
  { key: 'price-desc', label: '价格高到低' },
  { key: 'positive', label: '好评优先' },
]

export default function Search() {
  const [params] = useSearchParams()
  const initKeyword = params.get('keyword') || ''
  const [keyword, setKeyword] = useState(initKeyword)
  const [category, setCategory] = useState(params.get('category') || '')
  const [brand, setBrand] = useState(params.get('brand') || '')
  const [priceRange, setPriceRange] = useState(params.get('price') || '')
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [sort, setSort] = useState('default')

  const priceRanges = [
    { key: '', label: '不限' },
    { key: '0-100', label: '¥100 以下' },
    { key: '100-500', label: '¥100 ~ 500' },
    { key: '500-1000', label: '¥500 ~ 1000' },
    { key: '1000-9999', label: '¥1000 以上' },
  ]

  const result = useMemo(() => {
    let list = [...products]

    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(k) ||
          p.desc.toLowerCase().includes(k) ||
          p.category.toLowerCase().includes(k)
      )
    }

    const allCats = ['', ...new Set(products.map((p) => p.category))]
    if (category) list = list.filter((p) => p.category === category)
    if (brand) list = list.filter((p) => p.brand === brand)

    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number)
      list = list.filter((p) => p.price >= min && p.price <= max)
    }

    if (onlyInStock) {
      list = list.filter((p) => p.combos.some((c) => c.stock > 0))
    }

    switch (sort) {
      case 'sales':
        list.sort((a, b) => b.sales - a.sales)
        break
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'positive':
        list.sort((a, b) => b.positive - a.positive)
        break
      default:
        break
    }
    return list
  }, [keyword, category, brand, priceRange, onlyInStock, sort])

  return (
    <div className="page">
      <h2 className="section-title">商品筛选与搜索</h2>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <input
            style={{ flex: 1, border: '1px solid #ddd', borderRadius: 4, padding: '9px 12px' }}
            placeholder="输入关键词筛选已选范围"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <span style={{ alignSelf: 'center', color: '#999', fontSize: 14 }}>共 {result.length} 件</span>
        </div>

        <FilterRow label="商品分类">
          {allCats.map((c) => (
            <FilterChip key={c || 'all'} active={category === c} onClick={() => setCategory(c)}>{c || '全部'}</FilterChip>
          ))}
        </FilterRow>

        <FilterRow label="品牌">
          <FilterChip active={brand === ''} onClick={() => setBrand('')}>全部</FilterChip>
          {brands.map((b) => (
            <FilterChip key={b} active={brand === b} onClick={() => setBrand(b)}>{b}</FilterChip>
          ))}
        </FilterRow>

        <FilterRow label="价格">
          {priceRanges.map((r) => (
            <FilterChip key={r.key} active={priceRange === r.key} onClick={() => setPriceRange(r.key)}>{r.label}</FilterChip>
          ))}
        </FilterRow>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 14, color: '#555', width: 84 }}>库存筛选</span>
          <label style={{ fontSize: 14 }}>
            <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} />
            {' '}仅看有货
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 14, color: '#555' }}>排序：</span>
        {sortOptions.map((o) => (
          <button
            key={o.key}
            className={`btn ${sort === o.key ? '' : 'secondary'}`}
            style={{ padding: '6px 14px', fontSize: 13 }}
            onClick={() => setSort(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <PagedGrid products={result} />
    </div>
  )
}

function FilterRow({ label, children }) {
  return (
    <div style={{ display: 'flex', marginBottom: 12, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 14, color: '#555', width: 84, flexShrink: 0, paddingTop: 6 }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>
    </div>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 14,
        fontSize: 13,
        background: active ? 'var(--primary)' : '#f5f5f5',
        color: active ? '#fff' : '#555',
        border: active ? '1px solid var(--primary)' : '1px solid transparent',
      }}
    >
      {children}
    </button>
  )
}
