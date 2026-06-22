import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const SellerDashboard = () => {
  const [seller, setSeller] = useState(null)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [selectedTab, setSelectedTab] = useState('products')
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  useEffect(() => {
    const storedSeller = localStorage.getItem('sellerUser')
    const token = localStorage.getItem('sellerAccessToken')

    if (!storedSeller || !token) {
      navigate('/seller/login')
      return
    }

    try {
      const sellerData = JSON.parse(storedSeller)
      setSeller(sellerData)
      fetchSellerListings(token)
    } catch (e) {
      navigate('/seller/login')
    }
  }, [navigate])

  const fetchSellerListings = async (token) => {
    try {
      const response = await axios.get(`${apiUrl}/api/seller/dashboard/listings`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data?.success) {
        setProducts(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load seller listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStock = async (sellerProductId, newStock) => {
    const token = localStorage.getItem('sellerAccessToken')
    if (!token) return

    try {
      const response = await axios.patch(
        `${apiUrl}/api/seller/dashboard/listings/${sellerProductId}`,
        { stock_quantity: Number(newStock) },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data?.success) {
        setProducts((current) =>
          current.map((item) =>
            item.seller_product_id === sellerProductId
              ? { ...item, stock_quantity: response.data.data.stock_quantity }
              : item
          )
        )
      }
    } catch (error) {
      console.error('Failed to update stock:', error)
    }
  }

  const totalProducts = products.length
  const totalRevenue = products.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.stock_quantity) || 0),
    0
  )
  const totalOrders = 0
  const avgRating = 0

  if (!seller) return null
  if (loading) return <div style={{ padding: '100px 24px', textAlign: 'center', color: '#7B859E' }}>Loading seller dashboard...</div>

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
            {seller.shop_name}
          </h1>
          <p style={{ color: '#7B859E', fontSize: '0.95rem' }}>
            Seller ID: {seller.seller_id} · {seller.is_verified ? '✅ Verified' : '⏳ Pending verification'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {[
            { label: 'Total Products', value: totalProducts, color: '#00D4B4' },
            { label: 'Total Orders', value: totalOrders, color: '#FF5C1A' },
            { label: 'Revenue', value: `₹${totalRevenue.toFixed(2)}`, color: '#22C55E' },
            { label: 'Avg Rating', value: `${avgRating.toFixed(1)}★`, color: '#FFC647' },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--surface)',
                border: `1px solid rgba(${stat.color === '#00D4B4' ? '0,212,180' : stat.color === '#FF5C1A' ? '255,92,26' : stat.color === '#22C55E' ? '34,197,94' : '255,198,71'},0.15)`,
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#7B859E', marginBottom: '12px' }}>{stat.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          {['products', 'analytics', 'orders'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                color: selectedTab === tab ? '#00D4B4' : '#7B859E',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderBottom: selectedTab === tab ? '2px solid #00D4B4' : 'none',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {selectedTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.3rem', fontWeight: 700 }}>Your Catalogue Listings</h2>
              <button
                onClick={() => navigate('/seller/products')}
                style={{ padding: '8px 16px', background: '#FF5C1A', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                + Add Product
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7B859E' }}>
                  No products yet. Use the catalogue search to add your first listing.
                </div>
              ) : (
                products.map((product) => (
                  <div
                    key={product.seller_product_id}
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 180px 120px',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 700, marginBottom: '4px' }}>{product.model_name || `Product #${product.product_id}`}</p>
                      <p style={{ fontSize: '0.85rem', color: '#7B859E', marginBottom: 8 }}>{product.category || product.brand || 'Catalogue item'}</p>
                      <p style={{ fontSize: '0.9rem', marginTop: 8 }}>₹{product.price?.toFixed(2) || 0}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.8rem', color: '#7B859E', marginBottom: '6px' }}>Stock</p>
                      <input
                        type="number"
                        min="0"
                        value={product.stock_quantity || 0}
                        onChange={(e) => handleUpdateStock(product.seller_product_id, e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif', textAlign: 'center' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                      <div style={{ padding: '6px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: product.is_available ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: product.is_available ? '#22C55E' : '#EF4444' }}>
                        {product.is_available ? 'Available' : 'Out of Stock'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#7B859E' }}>Listing ID {product.seller_product_id}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {selectedTab === 'analytics' && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#7B859E' }}>
            Analytics module coming soon
          </div>
        )}

        {selectedTab === 'orders' && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#7B859E' }}>
            Orders module coming soon
          </div>
        )}
      </div>
    </div>
  )
}

export default SellerDashboard
