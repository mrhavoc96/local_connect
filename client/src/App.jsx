import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import Register from './pages/Register'
import SellerPortal from './pages/SellerPortal'
import Search from './pages/Search'
import Category from './pages/Category'
import Product from './pages/Product'
import SellerSignIn from './pages/SellerSignIn'
import SellerRegister from './pages/SellerRegister'
import SellerDashboard from './pages/SellerDashboard'
import SellerProducts from './pages/SellerProducts'


const App = () => {
  useEffect(() => {
    // Set dark theme background
    document.documentElement.style.setProperty('--bg', '#06080F')
    document.documentElement.style.setProperty('--surface', '#0D1120')
    document.documentElement.style.setProperty('--card', '#121729')
    document.documentElement.style.setProperty('--card-hover', '#18203A')
    document.documentElement.style.setProperty('--border', 'rgba(255,255,255,0.07)')
    document.documentElement.style.setProperty('--orange', '#FF5C1A')
    document.documentElement.style.setProperty('--orange-light', '#FF7A40')
    document.documentElement.style.setProperty('--cyan', '#00D4B4')
    document.documentElement.style.setProperty('--cyan-dim', 'rgba(0,212,180,0.15)')
    document.documentElement.style.setProperty('--text', '#EEF2FF')
    document.documentElement.style.setProperty('--muted', '#7B859E')
    document.documentElement.style.setProperty('--tag-bg', 'rgba(255,92,26,0.12)')

    document.body.style.background = '#06080F'
    document.body.style.color = '#EEF2FF'
  }, [])

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#06080F' }}>
        <Header />
        <main style={{ flex: 1, marginTop: '68px' }}>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/home' element={<Home />} />
            <Route path='/search' element={<Search />} />
          <Route path='/category/:category' element={<Category />} />
          <Route path='/product/:seller_product_id' element={<Product />} />
          <Route path='/login' element={<SignIn />} />
          <Route path='/register' element={<Register />} />
          <Route path='/signup' element={<Register />} />
          <Route path='/seller' element={<SellerPortal />} />
          <Route path='/seller/login' element={<SellerSignIn />} />
          <Route path='/seller/register' element={<SellerRegister />} />
          <Route path='/seller/signup' element={<SellerRegister />} />
          <Route path='/seller/dashboard' element={<SellerDashboard />} />
          <Route path='/seller/products' element={<SellerProducts />} />
        </Routes>
      </main>
      <Footer />
    </div>
  </Router>
  )
}

export default App