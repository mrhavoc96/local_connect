import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'

const Product = () => {
  const { seller_product_id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [productDetail, setProductDetail] = useState(null)

  useEffect(() => {
    if (!seller_product_id) return
    const fetchProduct = async () => {
      setLoading(true)
      setError(null)
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const response = await axios.get(`${apiUrl}/api/products/${seller_product_id}`, {
          timeout: 15000,
        })
        setProductDetail(response?.data?.data ?? null)
      } catch (err) {
        console.error('Product fetch failed:', err)
        setError(err?.response?.data?.message || 'Unable to load product details.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [seller_product_id])

  const price = productDetail?.listing?.seller_price
  const basePrice = productDetail?.product?.base_price
  const rating = productDetail?.product?.average_rating ?? 0
  const reviews = productDetail?.product?.review_count ?? 0
  const imageUrl = productDetail?.product?.images?.[0]?.image_url || 'https://via.placeholder.com/520x520'

  return (
    <div style={{ padding: '20px 24px 40px', minHeight: 'calc(100vh - 68px)', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div>
          <button
            type='button'
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--text)',
              padding: '10px 16px',
              borderRadius: '12px',
              cursor: 'pointer',
              marginRight: '12px',
            }}
          >
            ← Back
          </button>
          <span style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>Product detail</span>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
          Listing ID: {seller_product_id}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', color: 'var(--muted)' }}>Loading product details…</div>
      ) : error ? (
        <div style={{ padding: '40px', color: '#FFB3A7' }}>{error}</div>
      ) : !productDetail ? (
        <div style={{ padding: '40px', color: 'var(--muted)' }}>No product details found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '28px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px', display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '24px' }}>
              <div style={{ background: 'var(--surface)', borderRadius: '18px', overflow: 'hidden', minHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={imageUrl} alt={productDetail?.product?.model_name || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '999px', padding: '6px 12px', color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    {productDetail?.product?.brand || 'Brand'}
                  </span>
                  <span style={{ color: productDetail?.seller?.is_verified ? 'var(--cyan)' : 'var(--muted)', fontSize: '0.82rem' }}>
                    {productDetail?.seller?.is_verified ? 'Verified seller' : 'Seller not verified'}
                  </span>
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 800, lineHeight: 1.1 }}>
                  {productDetail?.product?.model_name || 'Product Name'}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ color: '#FFC647', fontSize: '1rem' }}>{'★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))}</div>
                  <div style={{ color: 'var(--text)', fontWeight: 700 }}>{rating.toFixed(1)}</div>
                  <div style={{ color: 'var(--muted)' }}>({reviews} reviews)</div>
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--muted)', lineHeight: 1.7 }}>
                  {productDetail?.product?.description || 'No description available for this product.'}
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.2)', padding: '8px 12px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600 }}>
                    {productDetail?.listing?.is_available ? 'In Stock' : 'Out of Stock'}
                  </span>
                  <span style={{ background: 'rgba(255,92,26,0.1)', color: 'var(--orange-light)', border: '1px solid rgba(255,92,26,0.2)', padding: '8px 12px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600 }}>
                    Warranty {productDetail?.listing?.warranty_months || 0} months
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ fontSize: '2.6rem', fontWeight: 800, color: 'var(--text)' }}>₹{price?.toLocaleString('en-IN') ?? '—'}</div>
                  {basePrice && basePrice > price && (
                    <div style={{ color: 'var(--muted)', textDecoration: 'line-through', fontWeight: 500 }}>₹{basePrice?.toLocaleString('en-IN')}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button style={{ flex: 1, minWidth: '180px', background: 'var(--orange)', border: 'none', color: '#fff', padding: '14px 20px', borderRadius: '14px', cursor: 'pointer', fontWeight: 700 }}>Contact Seller</button>
                  <button style={{ flex: 1, minWidth: '180px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '14px 20px', borderRadius: '14px', cursor: 'pointer' }}>Request Quote</button>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '18px' }}>Product Specifications</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {productDetail?.product?.specifications?.map((spec) => (
                  <div key={spec.spec_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)' }}>{spec.spec_key}</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{spec.spec_value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside style={{ display: 'grid', gap: '20px' }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '22px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                  {productDetail?.seller?.shop_name?.[0] || 'S'}
                </div>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>{productDetail?.seller?.shop_name || 'Seller Store'}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{productDetail?.seller?.city || 'Unknown location'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                  <span>Seller rating</span>
                  <span>{productDetail?.seller?.average_rating?.toFixed(1) ?? '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                  <span>Reviews</span>
                  <span>{productDetail?.seller?.review_count ?? 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
                  <span>Distance</span>
                  <span>{productDetail?.seller?.city ? 'Nearby' : 'Unknown'}</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '22px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '18px' }}>Price History</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>View pricing changes over time for this listing.
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default Product
