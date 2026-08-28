import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './components/CartContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Search from './pages/Search'
import Category from './pages/Category'
import ProductDetail from './pages/ProductDetail'
import ShopDetail from './pages/ShopDetail'
import Profile from './pages/Profile'
import AddressList from './pages/AddressList'
import Favorites from './pages/Favorites'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Pay from './pages/Pay'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Chat from './pages/Chat'
import Messages from './pages/Messages'

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/category" element={<Category />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/shop/:id" element={<ShopDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pay" element={<Pay />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order/:id" element={<OrderDetail />} />
            <Route path="/chat/:shopId" element={<Chat />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/address" element={<AddressList />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </CartProvider>
    </BrowserRouter>
  )
}
