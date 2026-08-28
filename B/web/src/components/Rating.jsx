export default function Rating({ value }) {
  return (
    <span className="rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="star" style={{ color: i <= Math.round(value) ? '#ffb400' : '#ddd' }}>
          ★
        </span>
      ))}
    </span>
  )
}
