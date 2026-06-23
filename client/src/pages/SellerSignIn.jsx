import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

const SellerSignIn = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const response = await axios.post(
        `${apiUrl}/api/seller/auth/login`,
        { email, password },
        { withCredentials: true }
      )

      if (response?.data?.data?.accessToken) {
        const { accessToken, user } = response.data.data
        localStorage.setItem('sellerAccessToken', accessToken)
        localStorage.setItem('sellerUser', JSON.stringify(user))
        setMessage('Seller login successful! Redirecting to dashboard...')
        setTimeout(() => navigate('/seller/dashboard'), 1500)
      } else {
        setError(response?.data?.message || 'Login failed')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '60px 24px' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', padding: '48px', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: 800, marginBottom: '12px', color: '#eef2ff' }}>Seller Sign In</h1>
          <p style={{ color: '#7b859e', fontSize: '0.95rem' }}>Sign in with your seller account to access your seller portal.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', color: '#7b859e', fontSize: '0.95rem', marginBottom: '8px', fontWeight: 500 }}>Email address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type='email'
              placeholder='you@seller.com'
              required
              disabled={loading}
              style={{ width: '100%', background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px 16px', color: '#eef2ff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#7b859e', fontSize: '0.95rem', marginBottom: '8px', fontWeight: 500 }}>Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type='password'
              placeholder='••••••••'
              required
              disabled={loading}
              style={{ width: '100%', background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px 16px', color: '#eef2ff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(255, 92, 26, 0.12)', border: '1px solid rgba(255, 92, 26, 0.3)', color: '#ffb0a1', padding: '12px 14px', borderRadius: '14px', fontSize: '0.95rem' }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ background: 'rgba(0, 212, 180, 0.12)', border: '1px solid rgba(0, 212, 180, 0.3)', color: '#b3ffeb', padding: '12px 14px', borderRadius: '14px', fontSize: '0.95rem' }}>
              {message}
            </div>
          )}

          <button type='submit' disabled={loading} style={{ marginTop: '10px', width: '100%', border: 'none', borderRadius: '14px', background: loading ? 'rgba(255, 92, 26, 0.6)' : 'linear-gradient(135deg, #ff5c1a, #ff7a40)', color: '#fff', padding: '14px 18px', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'transform 0.2s ease, background 0.2s ease' }}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ color: '#7b859e', fontSize: '0.85rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#7b859e', fontSize: '0.95rem', marginBottom: '12px' }}>Don't have a seller account?</p>
          <Link to='/seller/register' style={{ display: 'inline-block', background: 'rgba(255, 92, 26, 0.1)', border: '1px solid rgba(255, 92, 26, 0.3)', color: '#ff5c1a', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, transition: 'all 0.2s', fontSize: '0.95rem' }}>
            Register as Seller
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SellerSignIn
