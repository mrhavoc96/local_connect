import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [authUser, setAuthUser] = useState(null)
  const [isSeller, setIsSeller] = useState(false)

  useEffect(() => {
    const storedSeller = localStorage.getItem('sellerUser')
    const storedUser = localStorage.getItem('user')

    if (storedSeller) {
      try {
        setAuthUser(JSON.parse(storedSeller))
        setIsSeller(true)
      } catch (e) {
        setAuthUser(null)
        setIsSeller(false)
      }
    } else if (storedUser) {
      try {
        setAuthUser(JSON.parse(storedUser))
        setIsSeller(false)
      } catch (e) {
        setAuthUser(null)
        setIsSeller(false)
      }
    } else {
      setAuthUser(null)
      setIsSeller(false)
    }
  }, [location])

  const handleLogout = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const logoutPath = isSeller ? '/api/seller/auth/logout' : '/api/auth/logout'
      await fetch(`${apiUrl}${logoutPath}`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('sellerAccessToken')
      localStorage.removeItem('user')
      localStorage.removeItem('sellerUser')
      setAuthUser(null)
      setIsSeller(false)
      navigate('/')
    }
  }

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 48px',
      height: '68px',
      background: 'rgba(6, 8, 15, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
    }}>
      <Link to='/' style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: '1.4rem',
        color: '#eef2ff',
        textDecoration: 'none',
        letterSpacing: '-0.02em'
      }}>
        Local<span style={{ color: '#ff5c1a' }}>Connect</span>
      </Link>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {authUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 92, 26, 0.1)',
              border: '1px solid rgba(255, 92, 26, 0.2)',
              padding: '8px 16px',
              borderRadius: '8px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff5c1a, #ff7a40)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}>
                {authUser.name ? authUser.name.charAt(0).toUpperCase() : '👤'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#eef2ff' }}>{authUser.name || 'User'}</div>
                <div style={{ fontSize: '0.7rem', color: '#7b859e' }}>{authUser.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 92, 26, 0.15)',
                border: '1px solid rgba(255, 92, 26, 0.3)',
                color: '#ff5c1a',
                padding: '8px 16px',
                borderRadius: '8px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.target.style.background = 'rgba(255, 92, 26, 0.25)'
                e.target.style.borderColor = '#ff5c1a'
              }}
              onMouseLeave={e => {
                e.target.style.background = 'rgba(255, 92, 26, 0.15)'
                e.target.style.borderColor = 'rgba(255, 92, 26, 0.3)'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <button onClick={() => navigate('/login')} style={{
            background: '#ff5c1a',
            color: '#fff',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '8px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }} onMouseEnter={e => {
            e.target.style.background = '#ff7a40'
            e.target.style.transform = 'translateY(-1px)'
          }} onMouseLeave={e => {
            e.target.style.background = '#ff5c1a'
            e.target.style.transform = 'translateY(0)'
          }}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  )
}

export default Header
