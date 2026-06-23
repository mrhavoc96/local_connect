import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'

const SellerRegister = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [shopName, setShopName] = useState('')
  const [city, setCity] = useState('')
  const [pincode, setPincode] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [locationStatus, setLocationStatus] = useState('Detecting your location...')
  const [locationAllowed, setLocationAllowed] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const loginSeller = async () => {
    const response = await axios.post(
      `${apiUrl}/api/seller/auth/login`,
      { email, password },
      { withCredentials: true }
    )

    const { accessToken, user } = response.data.data
    localStorage.setItem('sellerAccessToken', accessToken)
    localStorage.setItem('sellerUser', JSON.stringify(user))
    return accessToken
  }

  const completeSellerProfile = async (token) => {
    const payload = {
      shop_name: shopName,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      city,
      pincode,
    }

    await axios.put(
      `${apiUrl}/api/seller/profile/complete`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    )
  }

  useEffect(() => {
    const storedSeller = localStorage.getItem('sellerUser')
    if (storedSeller) {
      setIsLoggedIn(true)
      navigate('/seller/dashboard')
      return
    }

    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser. Please use a compatible browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6))
        setLongitude(position.coords.longitude.toFixed(6))
        setLocationAllowed(true)
        setLocationStatus('Location captured from your browser. No manual entry required.')
      },
      () => {
        setLocationAllowed(false)
        setLocationStatus('Please allow location access to register your shop. The browser will capture it automatically.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (!locationAllowed || !latitude || !longitude) {
      setError('Please allow browser location access so we can set your shop location.')
      return
    }

    setLoading(true)

    try {
      const response = await axios.post(`${apiUrl}/api/seller/auth/register`, {
        name,
        email,
        phone,
        password,
        shop_name: shopName,
        city,
        pincode,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      })

      if (response?.data?.data) {
        const sellerToken = await loginSeller()
        await completeSellerProfile(sellerToken)

        setMessage('✅ Seller registration complete! Your shop profile is now marked complete. Redirecting to dashboard...')
        setName('')
        setEmail('')
        setPhone('')
        setPassword('')
        setShopName('')
        setCity('')
        setPincode('')
        setLatitude('')
        setLongitude('')
        setTimeout(() => navigate('/seller/dashboard'), 2000)
      } else {
        setError(response?.data?.message || 'Registration failed')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '60px 24px' }}>
      <div style={{ width: '100%', maxWidth: '600px', background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', padding: '48px', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: 800, marginBottom: '12px', color: '#eef2ff' }}>Seller Registration</h1>
          <p style={{ color: '#7b859e', fontSize: '0.95rem' }}>Create your seller account to list products and access the seller dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', color: '#7b859e', fontSize: '0.95rem', marginBottom: '8px', fontWeight: 500 }}>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} type='text' placeholder='John Doe' required disabled={loading} style={{ width: '100%', background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px 16px', color: '#eef2ff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', color: '#7b859e', fontSize: '0.95rem', marginBottom: '8px', fontWeight: 500 }}>Email address</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type='email' placeholder='seller@example.com' required disabled={loading} style={{ width: '100%', background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px 16px', color: '#eef2ff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', outline: 'none' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#7b859e', fontSize: '0.95rem', marginBottom: '8px', fontWeight: 500 }}>Phone number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type='tel' placeholder='+91 98765 43210' disabled={loading} style={{ width: '100%', background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px 16px', color: '#eef2ff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: '#7b859e', fontSize: '0.95rem', marginBottom: '8px', fontWeight: 500 }}>Shop name</label>
              <input value={shopName} onChange={(e) => setShopName(e.target.value)} type='text' placeholder='Your shop name' required disabled={loading} style={{ width: '100%', background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px 16px', color: '#eef2ff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', outline: 'none' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: '#7b859e', fontSize: '0.95rem', marginBottom: '8px', fontWeight: 500 }}>Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type='password' placeholder='••••••••' required disabled={loading} style={{ width: '100%', background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px 16px', color: '#eef2ff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', outline: 'none' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', color: '#7b859e', fontSize: '0.95rem', marginBottom: '8px', fontWeight: 500 }}>City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} type='text' placeholder='Pune' disabled={loading} style={{ width: '100%', background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px 16px', color: '#eef2ff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', color: '#7b859e', fontSize: '0.95rem', marginBottom: '8px', fontWeight: 500 }}>Pincode</label>
              <input value={pincode} onChange={(e) => setPincode(e.target.value)} type='text' placeholder='411001' disabled={loading} style={{ width: '100%', background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px 16px', color: '#eef2ff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', outline: 'none' }} />
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#eef2ff' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>Shop location</div>
            <p style={{ margin: 0, color: '#7b859e', fontSize: '0.92rem', lineHeight: 1.6 }}>{locationStatus}</p>
            {locationAllowed && (
              <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#b3ffeb' }}>
                Latitude: {latitude}, Longitude: {longitude}
              </p>
            )}
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ color: '#7b859e', fontSize: '0.85rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        </div>

        {!isLoggedIn && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#7b859e', fontSize: '0.95rem', marginBottom: '12px' }}>Already have a seller account?</p>
            <Link to='/seller/login' style={{ display: 'inline-block', background: 'rgba(255, 92, 26, 0.1)', border: '1px solid rgba(255, 92, 26, 0.3)', color: '#ff5c1a', padding: '12px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, transition: 'all 0.2s', fontSize: '0.95rem' }}>
              Sign In as Seller
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default SellerRegister
