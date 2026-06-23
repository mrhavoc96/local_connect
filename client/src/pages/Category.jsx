import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'

const Category = () => {
  const { category } = useParams()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProductsByCategory = async () => {
      if (!category) {
        setError('Category not specified.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await axios.get(`${apiUrl}/api/landing/category/${encodeURIComponent(category)}`)
        const data = response?.data?.data || []
        setProducts(data)
      } catch (err) {
        console.error('Failed to load category products:', err)
        setError(err?.response?.data?.message || 'Failed to load products')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProductsByCategory()
  }, [category])

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff5c1a',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ← Back
          </button>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '2rem', marginBottom: '8px' }}>
            {decodeURIComponent(category)}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
            {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ background: 'rgba(255, 179, 167, 0.1)', border: '1px solid #FFB3A7', color: '#FFB3A7', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
            <div>Loading products...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📦</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>No products in this category yet</div>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: '24px',
                background: '#ff5c1a',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Back to Home
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '18px' }}>
            {products.map((product, idx) => (
              <div
                key={idx}
                style={{
                  background: '#121729',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ff5c1a'
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
                onClick={() => navigate(`/search?q=${encodeURIComponent(product.model_name || product.brand)}`)}
              >
                {/* Image */}
                <div
                  style={{
                    height: '140px',
                    borderRadius: '12px',
                    background: '#0d1120',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    overflow: 'hidden',
                  }}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.model_name || product.brand}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ fontSize: '2.5rem' }}>📦</div>
                  )}
                </div>

                {/* Brand */}
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 500 }}>
                  {product.brand || 'Unknown Brand'}
                </div>

                {/* Model Name */}
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: '8px',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {product.model_name || 'Product'}
                </div>

                {/* Category */}
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '12px' }}>
                  {product.category}
                </div>

                {/* Price */}
                {product.base_price && (
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ff5c1a' }}>
                    ₹{product.base_price.toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Category
