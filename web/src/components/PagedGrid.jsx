import { useEffect, useState } from 'react'
import ProductGrid from './ProductGrid'

export const PAGE_SIZE = 20

// 固定分页展示商品：每页 PAGE_SIZE 件，上一页 / 下一页 / 页码 / 跳转
export default function PagedGrid({ products }) {
  const [page, setPage] = useState(1)
  const [jump, setJump] = useState('')

  // 当商品列表变化（筛选/切换/搜索）时回到第 1 页
  useEffect(() => {
    setPage(1)
  }, [products])

  const total = products.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const shown = products.slice(start, start + PAGE_SIZE)

  if (!total) {
    return (
      <div className="empty">
        <div className="icon">🔍</div>
        <p>没有找到相关商品</p>
      </div>
    )
  }

  // 页码列表（窗口化，避免上万页时渲染大量页码）
  const pageWindow = []
  const startPage = Math.max(1, safePage - 2)
  const endPage = Math.min(totalPages, safePage + 2)
  for (let p = startPage; p <= endPage; p++) pageWindow.push(p)

  const goTo = (p) => setPage(Math.max(1, Math.min(p, totalPages)))

  return (
    <>
      <ProductGrid products={shown} />

      {/* 分页条 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28, flexWrap: 'wrap' }}>
        <button className="btn secondary" style={{ padding: '8px 18px', fontSize: 13 }} disabled={safePage <= 1} onClick={() => goTo(safePage - 1)}>
          ‹ 上一页
        </button>

        {startPage > 1 && (
          <>
            <PageNum active={false} onClick={() => goTo(1)}>1</PageNum>
            {startPage > 2 && <span style={{ color: '#999', fontSize: 13 }}>…</span>}
          </>
        )}

        {pageWindow.map((p) => (
          <PageNum key={p} active={p === safePage} onClick={() => goTo(p)}>{p}</PageNum>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span style={{ color: '#999', fontSize: 13 }}>…</span>}
            <PageNum active={false} onClick={() => goTo(totalPages)}>{totalPages}</PageNum>
          </>
        )}

        <button className="btn secondary" style={{ padding: '8px 18px', fontSize: 13 }} disabled={safePage >= totalPages} onClick={() => goTo(safePage + 1)}>
          下一页 ›
        </button>

        {/* 跳转页码 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          <span style={{ color: '#999', fontSize: 13 }}>跳至</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const p = parseInt(jump, 10)
                if (!isNaN(p)) goTo(p)
                setJump('')
              }
            }}
            style={{ width: 62, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 4, textAlign: 'center', fontSize: 13 }}
          />
          <button
            className="btn"
            style={{ padding: '6px 12px', fontSize: 13 }}
            onClick={() => {
              const p = parseInt(jump, 10)
              if (!isNaN(p)) goTo(p)
              setJump('')
            }}
          >
            跳转
          </button>
        </div>

        <span style={{ color: '#999', fontSize: 13, marginLeft: 8 }}>
          第 {safePage} / {totalPages} 页 · 共 {total.toLocaleString()} 件
        </span>
      </div>
    </>
  )
}

function PageNum({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        minWidth: 36, height: 36, borderRadius: 4, fontSize: 14,
        background: active ? 'var(--primary)' : '#fff',
        color: active ? '#fff' : '#555',
        border: active ? '1px solid var(--primary)' : '1px solid #ddd',
      }}
    >
      {children}
    </button>
  )
}
