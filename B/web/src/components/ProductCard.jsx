import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <img src={product.image} alt={product.name} loading="lazy" />
      <div className="body">
        <div className="name">{product.name}</div>
        <div className="price-row">
          <span className="price">{product.price}</span>
          <span className="original-price">¥{product.originalPrice}</span>
          <span className="sales">已售 {product.sales}+</span>
        </div>
      </div>
    </Link>
  )
}
