const Footer = () => {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.07)',
      padding: '28px 48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: '1rem'
      }}>
        Local<span style={{ color: '#ff5c1a' }}>Connect</span>
      </div>
      <p style={{
        fontSize: '0.8rem',
        color: '#7b859e',
        margin: 0
      }}>© {new Date().getFullYear()} LocalConnect. Connecting buyers to local sellers.</p>
    </footer>
  )
}

export default Footer
