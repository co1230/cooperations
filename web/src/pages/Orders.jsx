import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart, resolveProduct } from '../components/CartContext'
import { getShopById } from '../mock/data'

// 按店铺分组订单内商品
function groupItems(items) {
  const map = {}
  items.forEach((it) => {
    const shopId = resolveProduct(it.productId).shopId
    if (!map[shopId]) map[shopId] = []
    map[shopId].push(it)
  })
  return Object.entries(map).map(([shopId, its]) => ({ shop: getShopById(shopId), items: its }))
}

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: '待支付', label: '待支付' },
  { key: '待发货', label: '待发货' },
  { key: '待收货', label: '待收货' },
  { key: '已完成', label: '已完成' },
  { key: '售后', label: '退款/退货' },
]

export default function Orders() {
  const { orders, updateOrder } = useCart()
  const [tab, setTab] = useState('all')
  const [detail, setDetail] = useState(null)

  const list = orders.filter((o) => {
    if (tab === 'all') return true
    if (tab === '售后') return ['退款中', '已退款'].includes(o.status)
    return o.status === tab
  })

  const statusColor = (s) => {
    const map = {
      待支付: 'var(--warn)', 待发货: 'var(--primary)', 待收货: 'var(--primary)',
      已完成: 'var(--success)', 已取消: '#999', 退款中: 'var(--warn)', 已退款: 'var(--success)',
    }
    return map[s] || '#333'
  }

  const cancelOrder = (o) => {
    if (['待发货', '待收货', '已完成'].includes(o.status)) {
      alert('当前状态不可取消（模拟规则）')
      return
    }
    if (confirm('确认取消该订单？')) updateOrder(o.id, { status: '已取消' })
  }

  const refund = (o) => {
    const reason = prompt('请输入退款/退货原因', '不想要了，申请退款')
    if (reason === null) return
    updateOrder(o.id, { status: '退款中', refundReason: reason })
    alert('已提交退款申请（模拟：商家将处理）')
  }

  const confirmReceive = (o) => {
    if (confirm('确认已收到货？')) updateOrder(o.id, { status: '已完成' })
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>我的订单（{orders.length}）</h2>
        <Link to="/" className="btn secondary" style={{ padding: '6px 14px', fontSize: 13 }}>去购物</Link>
      </div>

      {orders.length === 0 ? (
        <div className="empty">
          <div className="icon">📦</div>
          <p>还没有订单</p>
          <Link to="/" className="btn" style={{ marginTop: 12 }}>去逛逛</Link>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 8, marginBottom: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {statusTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '7px 16px', borderRadius: 16, fontSize: 13,
                  background: tab === t.key ? 'var(--primary)' : '#f5f5f5',
                  color: tab === t.key ? '#fff' : '#555',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <div className="empty"><p>该分类下暂无订单</p></div>
          ) : (
            list.map((o) => (
              <div className="card" key={o.id} style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: '#666', fontSize: 13 }}>订单号 {o.no}</span>
                  <span style={{ color: '#999', fontSize: 12 }}>{o.createdAt}</span>
                  <button className="btn secondary" style={{ marginLeft: 'auto', padding: '3px 12px', fontSize: 12 }} onClick={() => setDetail(detail?.id === o.id ? null : o)}>
                    {detail?.id === o.id ? '收起' : '查看详情'}
                  </button>
                </div>

                {groupItems(o.items).map(({ shop, items: shopItems }) => (
                  <div key={shop.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#fafafa', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 18 }}>{shop.logo}</span>
                      <Link to={`/shop/${shop.id}`} style={{ fontWeight: 600, fontSize: 14 }}>{shop.name}</Link>
                    </div>
                    {shopItems.map((it) => {
                      const prod = resolveProduct(it.productId)
                      return (
                        <div key={it.key} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                          <img src={prod.image} alt={prod.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{prod.name}</div>
                            <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{it.skuLabels.join(' / ')} × {it.qty}</div>
                          </div>
                          <span style={{ fontSize: 14 }}>¥{it.price * it.qty}</span>
                        </div>
                      )
                    })}
                  </div>
                ))}

                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                    <span>实付 <b className="price" style={{ fontSize: 18 }}>{o.payPrice}</b></span>
                    {o.discountPrice > 0 && <span style={{ color: '#999', fontSize: 12 }}>（已优惠 ¥{o.discountPrice}）</span>}
                    <span style={{ marginLeft: 'auto', fontWeight: 700, color: statusColor(o.status) }}>{o.status}</span>
                  </div>
                  {o.payMethod && <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>支付方式：{payName(o.payMethod)}</div>}
                  {o.refundReason && <div style={{ fontSize: 12, color: 'var(--warn)', marginBottom: 8 }}>退款原因：{o.refundReason}</div>}

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {(o.status === '待支付' || o.status === '已取消') && (
                      <>
                        <button className="btn secondary" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => cancelOrder(o)}>
                          取消订单
                        </button>
                        {o.status === '待支付' && (
                          <Link to="/pay" state={{ orderId: o.id }} className="btn" style={{ padding: '7px 16px', fontSize: 13 }}>
                            去支付
                          </Link>
                        )}
                      </>
                    )}
                    {o.status === '待发货' && (
                      <button className="btn secondary" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => cancelOrder(o)}>
                        申请退款
                      </button>
                    )}
                    {o.status === '待收货' && (
                      <>
                        <button className="btn" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => confirmReceive(o)}>
                          确认收货
                        </button>
                        <button className="btn secondary" style={{ padding: '7px 16px', fontSize: 13, color: 'var(--danger)' }} onClick={() => refund(o)}>
                          申请退货
                        </button>
                      </>
                    )}
                    {o.status === '已完成' && (
                      <button className="btn secondary" style={{ padding: '7px 16px', fontSize: 13, color: 'var(--danger)' }} onClick={() => refund(o)}>
                        申请售后
                      </button>
                    )}
                  </div>
                </div>

                {/* 详情展开 */}
                {detail?.id === o.id && (
                  <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', background: '#fafafa' }}>
                    <div style={{ fontSize: 13, color: '#666', lineHeight: 2 }}>
                      <div>收货人：{o.address.name} {o.address.phone}</div>
                      <div>收货地址：{o.address.region} {o.address.detail}</div>
                      <div>商品金额：¥{o.totalPrice}，优惠：¥{o.discountPrice}，实付：¥{o.payPrice}</div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}

function payName(key) {
  return { wechat: '微信支付', alipay: '支付宝', balance: '余额支付' }[key] || key
}
