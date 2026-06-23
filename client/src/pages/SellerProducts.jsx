import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const SellerProducts = () => {
  const [query, setQuery] = useState('Apple')
  const [catalogue, setCatalogue] = useState([])
  const [selected, setSelected] = useState(null)
  const [manualProductId, setManualProductId] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState(1)
  const [warranty, setWarranty] = useState('None')
  const [services, setServices] = useState({ aftersales: true, emi: true, exchange: true, homeDemo: false })
  const navigate = useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  useEffect(() => {
    const storedSeller = localStorage.getItem('sellerUser')
    const token = localStorage.getItem('sellerAccessToken')
    if (!storedSeller || !token) return navigate('/seller/login')
    fetchCatalogue(query)
  }, [])

  const fetchCatalogue = async (q) => {
    const token = localStorage.getItem('sellerAccessToken')
    if (!token) return navigate('/seller/login')

    try {
      const catalogResponse = await axios.get(`${apiUrl}/api/seller/dashboard/catalogue/search`, {
        params: { q: q.trim() },
        headers: { Authorization: `Bearer ${token}` },
      })

      if (catalogResponse.data?.data) {
        setCatalogue(catalogResponse.data.data)
        return
      }
    } catch (e) {
      console.warn('Seller catalogue search failed, falling back to search suggestions.', e)
    }

    try {
      const fallbackResponse = await axios.get(`${apiUrl}/api/search/suggest`, {
        params: { q: q.trim() },
      })
      if (fallbackResponse.data?.data) {
        setCatalogue(fallbackResponse.data.data)
      }
    } catch (e2) {
      console.error('Fallback catalogue fetch failed', e2)
    }
  }

  const selectProduct = (item) => {
    setSelected(item)
    setManualProductId('')
    setPrice(item.base_price ? String(item.base_price) : '')
  }

  const toggleService = (key) => {
    setServices({ ...services, [key]: !services[key] })
  }

  const handlePublish = async () => {
    const seller = JSON.parse(localStorage.getItem('sellerUser') || 'null')
    const token = localStorage.getItem('sellerAccessToken')
    if (!seller || !token) return navigate('/seller/login')

    const productId = selected ? Number(selected.product_id) : Number(manualProductId)
    if (!productId || productId <= 0) return alert('Select a product or enter a valid product ID.')

    const payload = {
      product_id: productId,
      price: parseFloat(String(price).replace(/,/g, '')) || 0,
      stock_quantity: Number(stock),
      warranty_months: warranty === 'None' ? 0 : parseInt(warranty, 10),
    }

    try {
      const res = await axios.post(`${apiUrl}/api/seller/dashboard/listings`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.data?.success) {
        alert(res.data.message || 'Listing published successfully')
        navigate('/seller/dashboard')
      } else {
        alert('Failed to publish listing. Please review the details and try again.')
      }
    } catch (err) {
      console.error('Error publishing listing', err)
      alert('Error publishing listing')
    }
  }

  return (
    <div style={{ paddingTop: 68, minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        <div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>Product Catalogue</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search catalogue"
                  style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
                <button
                  onClick={() => fetchCatalogue(query)}
                  style={{ background: 'var(--orange)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8 }}
                >
                  Search
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {catalogue.length === 0 ? (
                <div style={{ color: 'var(--muted)', padding: 24 }}>No catalogue results yet. Try another search.</div>
              ) : (
                catalogue.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => selectProduct(p)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 10,
                      padding: 12,
                      background: selected?.product_id === p.product_id ? 'rgba(255,92,26,0.06)' : 'var(--surface)',
                      border: selected?.product_id === p.product_id ? '1px solid var(--orange)' : '1px solid var(--border)',
                    }}
                  >
                    <div style={{ height: 90, borderRadius: 8, background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt="" style={{ maxHeight: '100%', maxWidth: '100%' }} />
                      ) : (
                        <div style={{ fontSize: 28 }}>📦</div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{p.brand}</div>
                    <div style={{ fontWeight: 700 }}>{p.model_name || p.product_name || `Product ${p.product_id}`}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>MRP: ₹{p.base_price ?? p.mrp ?? '—'}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 8 }}>Your current listings</div>
            <div style={{ color: 'var(--muted)' }}>Existing listings appear on your dashboard after publishing.</div>
          </div>
        </div>

        <div style={{ position: 'sticky', top: 88 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 12 }}>Listing Details</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Selected Product</div>
              <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700 }}>{selected ? selected.model_name || selected.product_name : (manualProductId ? `Product ${manualProductId}` : 'No product selected')}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{selected ? selected.brand : ''}</div>
              </div>
            </div>

            {!selected && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Manual Product ID</div>
                <input
                  value={manualProductId}
                  onChange={(e) => setManualProductId(e.target.value)}
                  placeholder="Enter existing Product ID"
                  style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
            )}

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Your Selling Price (₹)</div>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 124900"
                style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Units in Stock</div>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Warranty</div>
                <select
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  style={{ width: '100%', padding: 10, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <option>None</option>
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Services</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div
                  onClick={() => toggleService('aftersales')}
                  style={{ padding: 10, borderRadius: 8, cursor: 'pointer', background: services.aftersales ? 'rgba(255,92,26,0.06)' : 'var(--surface)', border: '1px solid var(--border)', color: services.aftersales ? 'var(--text)' : 'var(--muted)' }}
                >
                  After-sales Service
                </div>
                <div
                  onClick={() => toggleService('emi')}
                  style={{ padding: 10, borderRadius: 8, cursor: 'pointer', background: services.emi ? 'rgba(255,92,26,0.06)' : 'var(--surface)', border: '1px solid var(--border)', color: services.emi ? 'var(--text)' : 'var(--muted)' }}
                >
                  EMI / Financing
                </div>
                <div
                  onClick={() => toggleService('exchange')}
                  style={{ padding: 10, borderRadius: 8, cursor: 'pointer', background: services.exchange ? 'rgba(255,92,26,0.06)' : 'var(--surface)', border: '1px solid var(--border)', color: services.exchange ? 'var(--text)' : 'var(--muted)' }}
                >
                  Exchange Offer
                </div>
                <div
                  onClick={() => toggleService('homeDemo')}
                  style={{ padding: 10, borderRadius: 8, cursor: 'pointer', background: services.homeDemo ? 'rgba(255,92,26,0.06)' : 'var(--surface)', border: '1px solid var(--border)', color: services.homeDemo ? 'var(--text)' : 'var(--muted)' }}
                >
                  Home Demo
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                onClick={() => navigate('/seller/dashboard')}
                style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: 10, borderRadius: 10 }}
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                style={{ flex: 1, background: 'var(--orange)', color: '#fff', border: 'none', padding: 10, borderRadius: 10 }}
              >
                Publish Listing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SellerProducts
