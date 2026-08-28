import Taro from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'

export default function ProductCard({ product, style }) {
  const go = () => Taro.navigateTo({ url: `/pages/product/index?id=${product.id}` })
  return (
    <View className='grid-item' style={style} onClick={go}>
      <Image className='thumb' src={product.image} mode='aspectFill' />
      <View style={{ padding: '10px 10px 12px' }}>
        <View style={{ fontSize: '13px', lineHeight: 1.4, height: '36px', overflow: 'hidden' }}>{product.name}</View>
        <View style={{ display: 'flex', alignItems: 'baseline', marginTop: '6px' }}>
          <Text className='price' style={{ fontSize: '17px' }}>¥{product.price}</Text>
          {product.originalPrice > product.price && (
            <Text style={{ fontSize: '11px', color: '#999', textDecoration: 'line-through', marginLeft: '8px' }}>¥{product.originalPrice}</Text>
          )}
        </View>
        <View style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <Text style={{ fontSize: '10px', color: '#999' }}>已售 {product.sales}</Text>
          <Text style={{ fontSize: '10px', color: '#999' }}>{product.positive}% 好评</Text>
        </View>
      </View>
    </View>
  )
}
