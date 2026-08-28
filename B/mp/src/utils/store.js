import Taro from '@tarojs/taro'

const KEY = {
  address: 'yg_addresses',
  favorites: 'yg_favorites',
  cart: 'yg_cart',
  orders: 'yg_orders'
}

export function load(key, fallback) {
  try {
    const raw = Taro.getStorageSync(KEY[key] || key)
    if (raw === '' || raw === undefined || raw === null) return fallback
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (e) {
    return fallback
  }
}

export function save(key, value) {
  Taro.setStorageSync(KEY[key] || key, value)
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
