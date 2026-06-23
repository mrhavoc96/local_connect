import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'

const DEFAULT_COORDS = { lat: 18.5204, lng: 73.8567 } // Pune fallback

const Search = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [radius, setRadius] = useState(5)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, radius)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function getLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(DEFAULT_COORDS)
      const timeoutId = setTimeout(() => resolve(DEFAULT_COORDS), 5000)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeoutId)
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        },
        () => {
          clearTimeout(timeoutId)
          resolve(DEFAULT_COORDS)
        },
        { enableHighAccuracy: false, timeout: 4000 }
      )
    })
  }

  const performSearch = async (q, r = radius) => {
    if (!q || q.trim().length === 0) {
      setError('Please enter a search term.')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const loc = await getLocation()

      const resp = await axios.get(`${apiUrl}/api/search`, {
        params: { q: q.trim(), lat: loc.lat, lng: loc.lng, radius: r },
        timeout: 15000,
      })

      const payload = resp?.data?.data
      if (!payload) {
        setError('Unexpected server response.')
        setResults([])
      } else if (payload.status && payload.status !== 'found') {
        setMessage(payload.message || 'No results')
        setResults(payload.results || [])
      } else {
        setResults(payload.results || [])
      }

      // push query to URL
      navigate(`/search?q=${encodeURIComponent(q)}`)
    } catch (err) {
      console.error(err)
      setError(err?.response?.data?.message || 'Search failed. Check console for details.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSuggestions = async (q) => {
    if (!q || q.trim().length < 1) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const resp = await axios.get(`${apiUrl}/api/search/suggest`, {
        params: { q: q.trim() },
        timeout: 5000,
      })

      const data = resp?.data?.data || []
      setSuggestions(data)
      setShowSuggestions(data.length > 0)
    } catch (err) {
      console.error('Autocomplete fetch failed:', err)
      setSuggestions([])
    }
  }

  const handleQueryChange = (e) => {
    const value = e.target.value
    setQuery(value)
    fetchSuggestions(value)
  }

  const selectSuggestion = (suggestion) => {
    const searchTerm = suggestion.model_name || suggestion.brand || `Product ${suggestion.product_id}`
    setQuery(searchTerm)
    setSuggestions([])
    setShowSuggestions(false)
    performSearch(searchTerm)
  }

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              value={query}
              onChange={handleQueryChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder='Search products, e.g. iPhone 15 Pro'
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            
            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderTop: 'none',
                  borderRadius: '0 0 12px 12px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 10,
                }}
              >
                {suggestions.slice(0, 8).map((suggestion, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectSuggestion(suggestion)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#0d1120')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: '1.2rem' }}>🔍</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                        {suggestion.model_name || suggestion.brand || `Product ${suggestion.product_id}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {suggestion.category}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type='range' min='1' max='50' value={radius} onChange={(e) => setRadius(e.target.value)} style={{ width: '180px' }} />
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{radius} km</div>
            <button onClick={() => performSearch(query)} style={{ background: 'var(--orange)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '10px', cursor: 'pointer' }}>{loading ? 'Searching...' : 'Search'}</button>
          </div>
        </div>

        {error && <div style={{ color: '#FFB3A7', marginBottom: '12px' }}>{error}</div>}
        {message && <div style={{ color: 'var(--muted)', marginBottom: '12px' }}>{message}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
          <aside style={{ borderRight: '1px solid var(--border)', paddingRight: '12px' }}>
            <div style={{ marginBottom: '18px', color: 'var(--muted)', fontWeight: 700 }}>Filters</div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Availability</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className='btn-sm' style={{ border: '1px solid var(--border)' }}>In Stock</button>
                <button className='btn-sm' style={{ border: '1px solid var(--border)' }}>All</button>
              </div>
            </div>
          </aside>

          <main>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>{results.length} Results <span style={{ color: 'var(--muted)', fontWeight: 400 }}>for "{query}"</span></div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ color: 'var(--muted)' }}>Sort:</div>
                <select style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '8px' }}>
                  <option>Nearest First</option>
                  <option>Price: Low to High</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '40px', color: 'var(--muted)' }}>Searching nearby stores…</div>
            ) : results.length === 0 ? (
              <div style={{ padding: '40px', color: 'var(--muted)' }}>No results — try expanding radius or changing query.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {results.map((r) => (
                  <div key={r.seller_product_id} onClick={() => navigate(`/product/${r.seller_product_id}`)} style={{ display: 'flex', gap: '18px', padding: '16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer' }}>
                    <div style={{ width: '120px', height: '96px', background: '#0a0e1f', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={r.image_url || 'https://via.placeholder.com/120x96'} alt={r.model_name || r.brand} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '6px' }}>{r.brand}</div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{r.model_name}</div>
                      <div style={{ marginTop: '8px', color: 'var(--muted)', fontSize: '0.9rem' }}>{r.shop_name} · {r.distance_km ? `${r.distance_km.toFixed(1)} km` : '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '140px' }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.2rem', fontWeight: 800 }}>₹{Number(r.seller_price || r.base_price || 0).toLocaleString('en-IN')}</div>
                      {r.base_price && r.seller_price && r.base_price > r.seller_price && (
                        <div style={{ color: 'var(--muted)', textDecoration: 'line-through' }}>₹{Number(r.base_price).toLocaleString('en-IN')}</div>
                      )}
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button style={{ background: 'var(--orange)', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>View</button>
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '18px' }}>
                  <button className='pg-btn'>‹</button>
                  <button className='pg-btn active'>1</button>
                  <button className='pg-btn'>2</button>
                  <button className='pg-btn'>›</button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default Search
