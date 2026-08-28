import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCart, resolveProduct } from '../components/CartContext'
import { getShopById } from '../mock/data'
import { openSession } from '../utils/chat'

function groupItems(items) {
  const map = {}
  items.forEach((it) => {
    const shopId = resolveProduct(it.productId).shopId
    if (!map[shopId]) map[shopId] = []
    map[shopId].push(it)
  })
  return Object.entries(map).map(([shopId, its]) => ({ shop: getShopById(shopId), items: its }))
}

const statusColor = (s) => {
  const map = {
    待支付: 'var(--warn)', 待发货: 'var(--primary)', 待收货: 'var(--primary)',
    已完成: 'var(--success)', 已取消: '#999', 退款中: 'var(--warn)', 已退款: 'var(--success)',
  }
  return map[s] || '#333'
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { orders, updateOrder } = useCart()
  const order = orders.find((o) => o.id === id)

  const cancelOrder = () => {
    if (['待发货', '待收货', '已完成'].includes(order.status)) {
      alert('当前状态不可取消（模拟规则）')
      return
    }
    if (confirm('确认取消该订单？')) updateOrder(order.id, { status: '已取消' })
  }

  const refund = () => {
    const reason = prompt('请输入退款/退货原因', '不想要了，申请退款')
    if (reason === null) return
    updateOrder(order.id, { status: '退款中', refundReason: reason })
    alert('已提交退款申请（模拟：商家将处理）')
  }

  const confirmReceive = () => {
    if (confirm('确认已收到货？')) updateOrder(order.id, { status: '已完成' })
  }

  const contactShop = (shop) => {
    openSession(shop)
    navigate(`/chat/${shop.id}`)
  }

  if (!order) {
    return (
      <div className="empty">
        <div className="icon">📦</div>
        <p>订单不存在</p>
        <Link to="/orders" className="btn" style={{ marginTop: 12 }}>返回我的订单</Link>
      </div>
    )
  }

  const groups = groupItems(order.items)

  return (
    <div className="page">
      <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>
        <Link to="/orders">我的订单</Link> / {order.no}
      </div>

      {/* 头部状态 */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, padding: 24 }}>
        <div style={{ fontSize: 34 }}>🧾</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: statusColor(order.status) }}>{order.status}</div>
          <div style={{ color: '#666', fontSize: 13, marginTop: 4 }}>订单号 {order.no} · 下单时间 {order.createdAt}</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ color: '#999', fontSize: 13 }}>实付金额</div>
          <span className="price" style={{ fontSize: 26 }}>{order.payPrice}</span>
        </div>
      </div>

      {/* 商品清单 + 各店铺入口 */}
      {groups.map(({ shop, items }) => (
        <div className="card" key={shop.id} style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 20 }}>{shop.logo}</span>
            <Link to={`/shop/${shop.id}`} style={{ fontWeight: 700, fontSize: 15 }}>{shop.name}</Link>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Link to={`/shop/${shop.id}`} className="btn secondary" style={{ padding: '5px 12px', fontSize: 12 }}>进店看看</Link>
              <button className="btn" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => contactShop(shop)}>联系客服</button>
            </div>
          </div>
          {items.map((it) => {
            const prod = resolveProduct(it.productId)
            return (
              <div key={it.key} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <img src={prod.image} alt={prod.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/product/${prod.id}`} style={{ fontWeight: 600, fontSize: 14 }}>{prod.name}</Link>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{it.skuLabels.join(' / ')} × {it.qty}</div>
                </div>
                <span style={{ fontSize: 14 }}>¥{it.price * it.qty}</span>
              </div>
            )
          })}
        </div>
      ))}

      {/* 金额明细 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>金额明细</div>
        {[
          ['商品件数', `${order.items.reduce((s, i) => s + i.qty, 0)} 件`],
          ['商品金额', `¥${order.totalPrice}`],
          ['优惠减免', `-¥${order.discountPrice}`],
          ['实付金额', `¥${order.payPrice}`],
        ].map(([k, v], i) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontWeight: i === 3 ? 700 : 400, fontSize: i === 3 ? 17 : 14 }}>
            <span style={{ color: i === 3 ? '#333' : '#666' }}>{k}</span>
            <span style={{ color: i === 3 ? 'var(--primary)' : '#333' }}>{v}</span>
          </div>
        ))}
      </div>

      {/* 收货信息 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>收货信息</div>
        <div style={{ fontSize: 14, lineHeight: 2, color: '#333' }}>
          <div>收货人：{order.address.name}　{order.address.phone}</div>
          <div>收货地址：{order.address.region} {order.address.detail}</div>
        </div>
      </div>

      {/* 其他信息 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>订单信息</div>
        <div style={{ fontSize: 14, lineHeight: 2, color: '#333' }}>
          <div>订单编号：{order.no}</div>
          <div>下单时间：{order.createdAt}</div>
          <div>支付方式：{order.payMethod ? payName(order.payMethod) : '未支付'}</div>
          {order.refundReason && <div style={{ color: 'var(--warn)' }}>退款/退货原因：{order.refundReason}</div>}
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {(order.status === '待支付' || order.status === '已取消') && (
          <>
            <button className="btn secondary" style={{ padding: '9px 20px', fontSize: 14 }} onClick={cancelOrder}>取消订单</button>
            {order.status === '待支付' && (
              <Link to="/pay" state={{ orderId: order.id }} className="btn" style={{ padding: '9px 20px', fontSize: 14 }}>去支付</Link>
            )}
          </>
        )}
        {order.status === '待发货' && (
          <button className="btn secondary" style={{ padding: '9px 20px', fontSize: 14 }} onClick={cancelOrder}>申请退款</button>
        )}
        {order.status === '待收货' && (
          <>
            <button className="btn secondary" style={{ padding: '9px 20px', fontSize: 14, color: 'var(--danger)' }} onClick={refund}>申请退货</button>
            <button className="btn" style={{ padding: '9px 20px', fontSize: 14 }} onClick={confirmReceive}>确认收货</button>
          </>
        )}
        {order.status === '已完成' && (
          <button className="btn secondary" style={{ padding: '9px 20px', fontSize: 14, color: 'var(--danger)' }} onClick={refund}>申请售后</button>
        )}
      </div>
    </div>
  )
}

function payName(key) {
  return { wechat: '微信支付', alipay: '支付宝', balance: '余额支付' }[key] || key
}
