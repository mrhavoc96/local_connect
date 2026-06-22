import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const navigate = useNavigate()

  const searchTags = ['📱 iPhones', '💻 Laptops', '🎧 Headphones', '📺 Smart TVs', '⌚ Smartwatches', '🎮 Gaming']

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        
        // Fetch products
        const productResponse = await axios.get(`${apiUrl}/api/landing/suggestions`)
        const productData = productResponse?.data?.data || []
        setProducts(productData)

        // Fetch categories
        const categoryResponse = await axios.get(`${apiUrl}/api/landing/categories`)
        const categoryData = categoryResponse?.data?.data || []
        setCategories(categoryData)
      } catch (err) {
        console.error('Failed to load landing data:', err)
        setProducts([])
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const toggleChat = () => setChatOpen(!chatOpen)

  const fetchSearchSuggestions = async (q) => {
    if (!q || q.trim().length < 1) {
      setSearchSuggestions([])
      setShowSearchSuggestions(false)
      return
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const resp = await axios.get(`${apiUrl}/api/search/suggest`, {
        params: { q: q.trim() },
        timeout: 5000,
      })

      const data = resp?.data?.data || []
      setSearchSuggestions(data)
      setShowSearchSuggestions(data.length > 0)
    } catch (err) {
      console.error('Autocomplete fetch failed:', err)
      setSearchSuggestions([])
    }
  }

  const handleSearchInput = (e) => {
    const value = e.target.value
    setSearchQuery(value)
    fetchSearchSuggestions(value)
  }

  const selectSearchSuggestion = (suggestion) => {
    const searchTerm = suggestion.model_name || suggestion.brand || `Product ${suggestion.product_id}`
    setSearchQuery('')
    setSearchSuggestions([])
    setShowSearchSuggestions(false)
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`)
  }

  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setSearchSuggestions([])
    }
  }

  // Map category names to icons
  const getCategoryIcon = (categoryName) => {
    const iconMap = {
      'Phones': '📱',
      'Laptops': '💻',
      'Smart TVs': '📺',
      'Audio': '🎧',
      'Wearables': '⌚',
      'Cameras': '📷',
      'Gaming': '🎮',
      'Desktops': '🖥️',
      'Printers': '🖨️',
      'Accessories': '🔋',
    }
    return iconMap[categoryName] || '📦'
  }

  const handleCategoryClick = (categoryName) => {
    navigate(`/category/${encodeURIComponent(categoryName)}`)
  }

  return (
    <div style={{ paddingTop: '30px' }}>
      {/* ========== HERO SECTION ========== */}
      <section style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 24px 60px', position: 'relative', textAlign: 'center', background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(255,92,26,0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(0,212,180,0.05) 0%, transparent 60%)' }} className='hero'>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,92,26,0.12)', border: '1px solid rgba(255,92,26,0.25)', padding: '6px 16px', borderRadius: '100px', fontSize: '0.78rem', color: '#ff7a40', fontWeight: 500, marginBottom: '28px', animation: 'fadeDown 0.6s ease' }}>
          <span style={{ width: '6px', height: '6px', background: '#ff5c1a', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
          4,200+ local electronics stores near you
        </div>

        {/* Hero Title */}
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(3.2rem, 7vw, 6rem)', lineHeight: 1.0, letterSpacing: '-0.03em', marginBottom: '20px', animation: 'fadeUp 0.7s ease 0.1s both' }}>
          Find Electronics<br />
          at <span style={{ color: '#ff5c1a' }}>Local Shops</span><br />
          <span style={{ color: '#00d4b4' }}>Near You.</span>
        </h1>

        {/* Hero Subtitle */}
        <p style={{ fontSize: '1.1rem', color: '#7b859e', maxWidth: '520px', lineHeight: 1.65, marginBottom: '40px', animation: 'fadeUp 0.7s ease 0.2s both', fontWeight: 400 }}>
          Search products available at stores in your neighbourhood. Compare prices, check availability, and visit in person.
        </p>

        {/* SEARCH BAR */}
        <div style={{ width: '100%', maxWidth: '720px', position: 'relative', animation: 'fadeUp 0.7s ease 0.3s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#0d1120', border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '6px 6px 6px 20px', boxShadow: '0 0 0 0 rgba(255,92,26,0)', transition: 'all 0.3s' }}>
            <svg width='18' height='18' fill='none' viewBox='0 0 24 24' style={{ color: '#7b859e', flexShrink: 0 }}>
              <circle cx='11' cy='11' r='8' stroke='currentColor' strokeWidth='2' />
              <path d='M21 21l-4.35-4.35' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
            </svg>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type='text'
                value={searchQuery}
                onChange={handleSearchInput}
                onFocus={() => searchSuggestions.length > 0 && setShowSearchSuggestions(true)}
                placeholder='Search for iPhone, MacBook, Samsung TV…'
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#eef2ff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '1rem',
                  fontWeight: 400,
                  marginLeft: '12px',
                  marginRight: '12px',
                  boxSizing: 'border-box',
                  padding: 0,
                }}
              />

              {/* Search Suggestions Dropdown */}
              {showSearchSuggestions && searchSuggestions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '-20px',
                    right: '-6px',
                    background: '#0d1120',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderTop: 'none',
                    borderRadius: '0 0 16px 16px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    zIndex: 20,
                    marginTop: '4px',
                  }}
                >
                  {searchSuggestions.slice(0, 6).map((suggestion, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectSearchSuggestion(suggestion)}
                      style={{
                        padding: '12px 20px',
                        borderBottom: idx < searchSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#121729')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: '1rem' }}>🔍</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#eef2ff' }}>
                          {suggestion.model_name || suggestion.brand || `Product ${suggestion.product_id}`}
                        </div>
                        {suggestion.category && (
                          <div style={{ fontSize: '0.75rem', color: '#7b859e' }}>
                            {suggestion.category}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ width: '1px', height: '26px', background: 'rgba(255,255,255,0.07)', margin: '0 16px' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00d4b4', fontSize: '0.85rem', fontWeight: 500, background: 'rgba(0,212,180,0.15)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' style={{ width: '14px', height: '14px' }}>
                <path d='M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z' />
                <circle cx='12' cy='10' r='3' />
              </svg>
              Pune, MH · 5 km
            </div>
            <button onClick={handleSearchClick} style={{ background: '#ff5c1a', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
              <svg width='16' height='16' fill='none' viewBox='0 0 24 24'>
                <circle cx='11' cy='11' r='8' stroke='currentColor' strokeWidth='2.5' />
                <path d='M21 21l-4.35-4.35' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' />
              </svg>
              Search
            </button>
          </div>

          {/* Search Tags */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {searchTags.map((tag, idx) => (
              <span key={idx} onClick={() => navigate('/search')} style={{ background: '#121729', border: '1px solid rgba(255,255,255,0.07)', padding: '5px 14px', borderRadius: '100px', fontSize: '0.78rem', color: '#7b859e', cursor: 'pointer', transition: 'all 0.2s' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* STATS ROW */}
        <div style={{ display: 'flex', gap: '48px', justifyContent: 'center', marginTop: '48px', animation: 'fadeUp 0.7s ease 0.4s both' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: '#eef2ff' }}>4,200+</div>
            <div style={{ fontSize: '0.78rem', color: '#7b859e', marginTop: '2px' }}>Partner Stores</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: '#eef2ff' }}>1.2L+</div>
            <div style={{ fontSize: '0.78rem', color: '#7b859e', marginTop: '2px' }}>Products Listed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: '#eef2ff' }}>38 Cities</div>
            <div style={{ fontSize: '0.78rem', color: '#7b859e', marginTop: '2px' }}>Across India</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: '#eef2ff' }}>4.8 ★</div>
            <div style={{ fontSize: '0.78rem', color: '#7b859e', marginTop: '2px' }}>Average Store Rating</div>
          </div>
        </div>
      </section>

      {/* ========== TRUST STRIP ========== */}
      <div style={{ background: '#0d1120', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '20px 48px', display: 'flex', gap: '48px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.3rem' }}>📍</span>
          <span style={{ fontSize: '0.8rem', color: '#7b859e', fontWeight: 500 }}>Proximity-based results — nearest first</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.3rem' }}>✅</span>
          <span style={{ fontSize: '0.8rem', color: '#7b859e', fontWeight: 500 }}>Verified local stores only</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.3rem' }}>🔒</span>
          <span style={{ fontSize: '0.8rem', color: '#7b859e', fontWeight: 500 }}>Secure & transparent pricing</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.3rem' }}>🛠️</span>
          <span style={{ fontSize: '0.8rem', color: '#7b859e', fontWeight: 500 }}>Extended warranty available</span>
        </div>
      </div>

      {/* ========== CATEGORIES ========== */}
      <div style={{ padding: '40px 48px 8px' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.1rem', marginBottom: '16px' }}>Browse by Category</div>
      </div>
      <div style={{ display: 'flex', gap: '12px', padding: '0 48px', overflowX: 'auto', marginBottom: '8px', scrollBehavior: 'smooth', scrollbarWidth: 'none' }}>
        {categories.map((cat, idx) => (
          <div key={idx} onClick={() => handleCategoryClick(cat.name)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: '#121729', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px 20px', minWidth: '90px', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}>
            <span style={{ fontSize: '1.6rem' }}>{getCategoryIcon(cat.name)}</span>
            <span style={{ fontSize: '0.72rem', color: '#7b859e', fontWeight: 500, whiteSpace: 'nowrap' }}>{cat.name}</span>
          </div>
        ))}
      </div>

      {/* ========== PRODUCTS SECTION ========== */}
      <section style={{ padding: '60px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.02em' }}>🔥 Trending Near You</div>
          <span onClick={() => navigate('/search')} style={{ color: '#ff5c1a', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>View all →</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7b859e' }}>Loading products...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 40px', color: '#7b859e' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>No products available right now</div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '18px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
            {products.slice(0, 6).map((product, idx) => (
              <div key={idx} onClick={() => navigate(`/product/${product.seller_product_id}`)} style={{ background: '#121729', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '16px', minWidth: '220px', maxWidth: '220px', cursor: 'pointer', transition: 'all 0.25s', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                {product.discount && (
                  <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#ff5c1a', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                    -{product.discount}%
                  </span>
                )}
                <div style={{ width: '100%', height: '140px', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px', background: '#0a0e1f' }}>
                  <img src={product.images?.[0] || 'https://via.placeholder.com/220x140'} alt={product.product_name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: '#7b859e', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '4px' }}>
                  {product.seller_name || 'Local Seller'}
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '8px' }}>
                  {product.product_name || product.model_name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#FFC647', marginBottom: '10px' }}>
                  {'★'.repeat(Math.floor(product.average_rating || 0))}
                  {'☆'.repeat(5 - Math.floor(product.average_rating || 0))}
                  <span style={{ color: '#7b859e', fontSize: '0.72rem' }}>({product.review_count || 0})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#eef2ff' }}>₹{Number(product.price || product.base_price || 0).toLocaleString('en-IN')}</div>
                  {product.original_price && (
                    <div style={{ fontSize: '0.78rem', color: '#7b859e', textDecoration: 'line-through' }}>₹{Number(product.original_price).toLocaleString('en-IN')}</div>
                  )}
                </div>
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: '0.72rem', color: '#7b859e', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#00d4b4', borderRadius: '50%' }}></span>
                  {product.seller_name || 'Local Store'} · {product.distance || '1.5 km'}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========== CHATBOT ========== */}
      <button id='chat-btn' onClick={toggleChat} style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 200, width: '58px', height: '58px', borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, #ff5c1a, #ff8c42)', color: '#fff', cursor: 'pointer', fontSize: '1.5rem', boxShadow: '0 8px 24px rgba(255,92,26,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
        🤖
      </button>

      {chatOpen && (
        <div id='chat-window' style={{ position: 'fixed', bottom: '104px', right: '32px', zIndex: 200, width: '380px', background: '#0d1120', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #0f1320, #1a1f35)', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff5c1a, #ff8c42)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                🤖
              </div>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.9rem' }}>LocalConnect AI</div>
                <div style={{ fontSize: '0.72rem', color: '#00d4b4' }}>● Online — powered by AI</div>
              </div>
            </div>
            <button onClick={toggleChat} style={{ background: 'none', border: 'none', color: '#7b859e', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', height: '320px', overflowY: 'auto' }}>
            <div style={{ maxWidth: '85%', alignSelf: 'flex-start' }}>
              <div style={{ padding: '10px 14px', borderRadius: '14px', fontSize: '0.85rem', lineHeight: 1.5, background: '#121729', color: '#eef2ff', borderBottomLeftRadius: '4px' }}>
                Hey there! 👋 I'm your AI shopping assistant. Tell me what you're looking for and I'll find the best options from stores near you!
              </div>
              <div style={{ fontSize: '0.65rem', color: '#7b859e', marginTop: '4px', textAlign: 'left' }}>Just now</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type='text' placeholder='Ask me anything about electronics…' style={{ flex: 1, background: '#121729', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '9px 14px', color: '#eef2ff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', outline: 'none' }} />
            <button style={{ background: '#ff5c1a', color: '#fff', border: 'none', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>➤</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        div::-webkit-scrollbar { width: 4px; height: 4px; }
        div::-webkit-scrollbar-track { background: transparent; }
        div::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  )
}

export default Home
