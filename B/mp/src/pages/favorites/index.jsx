import Taro, { useLoad, useDidShow } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { useState } from 'react'
import { load, save } from '../../utils/store'
import ProductCard from '../../components/ProductCard'

export default function Favorites() {
  const [list, setList] = useState([])
  useLoad(() => { setList(load('favorites', [])); Taro.setNavigationBarTitle({ title: '我的收藏' }) })
  useDidShow(() => setList(load('favorites', [])))

  const goProduct = (id) => Taro.navigateTo({ url: `/pages/product/index?id=${id}` })

  return (
    <View style={{ padding: '16px', paddingBottom: '20px' }}>
      {list.length === 0 ? (
        <View className='empty'><View className='icon'>❤️</View>暂无收藏</View>
      ) : (
        <View className='grid-2'>
          {list.map((f) => (
            <View key={f.id} className='grid-item' style={{ marginBottom: '10px' }}>
              <Image className='thumb' src={f.product.image} mode='aspectFill' onClick={() => goProduct(f.id)} />
              <View style={{ padding: '10px' }}>
                <View style={{ fontSize: '13px', lineHeight: 1.4, height: '36px', overflow: 'hidden' }} onClick={() => goProduct(f.id)}>{f.product.name}</View>
                <View style={{ display: 'flex', alignItems: 'center', marginTop: '6px' }}>
                  <Text className='price' style={{ fontSize: '16px' }}>¥{f.product.price}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
