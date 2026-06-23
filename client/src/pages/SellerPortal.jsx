import { useNavigate } from 'react-router-dom'

const SellerPortal = () => {
  const navigate = useNavigate()

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px', alignItems: 'center' }}>
          <div>
            <div style={{ marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderRadius: '999px', background: 'rgba(0, 212, 180, 0.12)', color: '#00D4B4', fontWeight: 700, fontSize: '0.9rem' }}>
              Seller Portal
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '3rem', lineHeight: 1.05, marginBottom: '24px', color: '#eef2ff' }}>
              Sell locally, manage inventory, and reach nearby buyers.
            </h1>
            <p style={{ color: '#7b859e', fontSize: '1rem', lineHeight: 1.8, maxWidth: '620px' }}>
              Create a seller account to list products, control pricing, and connect with local customers through LocalConnect. Your seller portal gives you access to dashboard tools built for local commerce.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '36px' }}>
              <button onClick={() => navigate('/seller/login')} style={{ minWidth: '180px', border: 'none', borderRadius: '16px', padding: '14px 24px', color: '#fff', background: 'linear-gradient(135deg, #ff5c1a, #ff7a40)', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' }}>
                Seller Login
              </button>
              <button onClick={() => navigate('/seller/register')} style={{ minWidth: '180px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px 24px', color: '#eef2ff', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
                Register as Seller
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '28px', padding: '32px', boxShadow: '0 32px 90px rgba(0,0,0,0.18)' }}>
            <h2 style={{ fontSize: '1.55rem', color: '#eef2ff', marginBottom: '18px' }}>Get started in minutes</h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                { title: 'Fast seller onboarding', description: 'Register with your shop details and start listing immediately.' },
                { title: 'Local buyer visibility', description: 'Appeal to customers searching for electronics nearby.' },
                { title: 'Clear seller status', description: 'Watch your verification and dashboard access in one place.' },
              ].map((item, index) => (
                <div key={index} style={{ padding: '18px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(0,212,180,0.15)', color: '#00D4B4', display: 'grid', placeItems: 'center', fontSize: '1.05rem' }}>
                      ✓
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#eef2ff' }}>{item.title}</h3>
                  </div>
                  <p style={{ margin: 0, color: '#7b859e', fontSize: '0.95rem', lineHeight: 1.7 }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SellerPortal
