import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { tradeApi, requestId } from '../api/trade'
import { getShopById } from '../mock/data'
import { load } from '../utils/store'

export default function Checkout() {
  const navigate = useNavigate()
  const location = useLocation()
  const buyNow = location.state?.fromBuyNow || null
  const requestPayload = useMemo(() => buyNow ? {
    mode: 'buy_now', buy_now: { source_product_id: buyNow.productId, spec_labels: buyNow.skuLabels, quantity: buyNow.qty },
  } : { mode: 'cart' }, [buyNow])
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [chosenAddress, setChosenAddress] = useState(null)
  const addresses = load('address', [])
  const defaultAddr = addresses.find((item) => item.isDefault) || addresses[0]

  useEffect(() => { tradeApi.preview(requestPayload).then(setPreview).catch((e) => setError(e.message)) }, [requestPayload])

  const placeOrder = async () => {
    const addr = chosenAddress || defaultAddr
    if (!addr) { alert('请先新增收货地址'); navigate('/address'); return }
    const receiverName = String(addr.name || addr.receiver_name || '').trim()
    const receiverPhone = String(addr.phone || addr.tel || addr.receiver_phone || '').trim()
    const receiverAddress = String(
      addr.address || addr.receiver_address || `${addr.region || ''} ${addr.detail || addr.detail_address || ''}`
    ).trim()
    if (!receiverName || !receiverPhone || !receiverAddress) {
      alert('当前收货地址资料不完整，请进入“管理地址”补齐姓名、手机号和详细地址')
      return
    }
    setSubmitting(true)
    try {
      const result = await tradeApi.createOrders({
        ...requestPayload,
        address: { name: receiverName, phone: receiverPhone, address: receiverAddress },
        request_id: requestId('order'),
      })
      navigate('/pay', { state: { checkoutNo: result.checkoutNo, payAmount: result.payAmount } })
    } catch (e) {
      setError(e.message)
      alert(`提交订单失败：${e.message}`)
    } finally { setSubmitting(false) }
  }

  if (error && !preview) return <div className="empty"><p>{error}</p><Link to="/cart" className="btn">返回购物车</Link></div>
  if (!preview) return <div className="empty"><p>正在由服务器校验库存和金额…</p></div>

  return <div className="page">
    <h2 className="section-title">确认订单</h2>
    {error && <div className="card" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><b>收货地址</b><Link to="/address">管理地址</Link></div>
      {addresses.length === 0 ? <Link to="/address">暂无地址，点击新增</Link> : <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {addresses.map((item) => <div key={item.id} onClick={() => setChosenAddress(item)} style={{ border: `2px solid ${(chosenAddress || defaultAddr)?.id === item.id ? 'var(--primary)' : '#eee'}`, borderRadius: 8, padding: 12, cursor: 'pointer', minWidth: 240 }}>
          <b>{item.name}</b> {item.phone}<div style={{ color: '#666', marginTop: 4 }}>{item.region} {item.detail}</div>
        </div>)}
      </div>}
    </div>
    {preview.groups.map((group) => {
      const shop = getShopById(group.shopId)
      return <div className="card" key={group.merchantId} style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 12, background: '#fafafa' }}><b>{shop?.logo} {shop?.name || `店铺 ${group.shopId}`}</b></div>
        {group.items.map((item) => <div key={`${item.productId}-${item.skuLabels.join('|')}`} style={{ display: 'flex', gap: 14, padding: 16, borderTop: '1px solid #eee' }}>
          <img src={item.image} style={{ width: 70, height: 70, borderRadius: 6 }} />
          <div style={{ flex: 1 }}><b>{item.name}</b><div style={{ color: '#666', marginTop: 5 }}>{item.skuLabels.join(' / ')} × {item.qty}</div></div>
          <span className="price">¥{item.subtotal}</span>
        </div>)}
      </div>
    })}
    <div className="card" style={{ marginBottom: 16 }}>
      {[["商品件数", `${preview.totalQty} 件`], ["服务器计算商品金额", `¥${preview.originalAmount}`], ["优惠减免", `-¥${preview.discountAmount}`], ["应付金额", `¥${preview.payAmount}`]].map(([name, value], index) => <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: 6, fontWeight: index === 3 ? 700 : 400 }}><span>{name}</span><span>{value}</span></div>)}
    </div>
    <button className="btn block" disabled={submitting} onClick={placeOrder} style={{ padding: 14 }}>{submitting ? '正在原子化创建订单…' : `提交订单，去支付 ¥${preview.payAmount}`}</button>
  </div>
}
