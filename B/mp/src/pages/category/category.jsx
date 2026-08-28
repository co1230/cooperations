import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { useState } from 'react'
import { categories } from '../../mock/data'

export default function Category() {
  const [active, setActive] = useState(0)
  const cur = categories[active]

  const go = (keyword) => {
    Taro.navigateTo({ url: `/pages/search/search?keyword=${encodeURIComponent(keyword)}` })
  }

  return (
    <View style={{ display: 'flex', minHeight: '100vh' }}>
      {/* 左侧分类 */}
      <View style={{ width: '180px', background: '#f6f6f6' }}>
        {categories.map((c, i) => (
          <View
            key={c.id}
            onClick={() => setActive(i)}
            style={{
              padding: '18px 12px', textAlign: 'center', fontSize: '14px',
              background: active === i ? '#fff' : 'transparent',
              color: active === i ? '#ff5000' : '#333', fontWeight: active === i ? 700 : 400,
              borderLeft: active === i ? '4px solid #ff5000' : '4px solid transparent'
            }}
          >
            <Text style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}>{c.icon}</Text>
            {c.name}
          </View>
        ))}
      </View>

      {/* 右侧子分类 */}
      <View style={{ flex: 1, background: '#fff', padding: '16px' }}>
        <View style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>{cur.name}</View>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
          {cur.children.map((k) => (
            <View key={k} onClick={() => go(k)} style={{ width: '31%', textAlign: 'center', padding: '14px 6px', background: '#f7f8fa', borderRadius: '10px', fontSize: '13px' }}>
              🛍️
              <View style={{ marginTop: '6px' }}>{k}</View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
