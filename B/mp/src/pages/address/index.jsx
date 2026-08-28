import Taro, { useRouter, useLoad } from '@tarojs/taro'
import { View, Text, Input } from '@tarojs/components'
import { useState } from 'react'
import { load, save, uid } from '../../utils/store'

const emptyForm = { id: '', name: '', phone: '', region: '', detail: '', isDefault: false }

export default function Address() {
  const router = useRouter()
  const selectMode = router.params.select === '1'
  const [list, setList] = useState([])
  const [editing, setEditing] = useState(null)

  useLoad(() => setList(load('address', [])))

  const persist = (next) => { setList(next); save('address', next) }
  const startAdd = () => setEditing({ ...emptyForm, id: uid() })
  const startEdit = (a) => setEditing({ ...a })
  const del = (id) => {
    Taro.showModal({ title: '删除地址', content: '确认删除该地址？', success: (r) => { if (r.confirm) persist(list.filter((a) => a.id !== id)) } })
  }
  const choose = (a) => {
    if (selectMode) { Taro.setStorageSync('selectedAddress', a); Taro.navigateBack() }
  }
  const saveForm = () => {
    if (!editing.name || !editing.phone || !editing.region || !editing.detail) { Taro.showToast({ title: '请填写完整', icon: 'none' }); return }
    let next
    if (list.some((a) => a.id === editing.id)) {
      next = list.map((a) => (a.id === editing.id ? editing : a))
    } else {
      next = [editing, ...list]
    }
    if (editing.isDefault) next = next.map((a) => ({ ...a, isDefault: a.id === editing.id }))
    persist(next)
    setEditing(null)
  }

  return (
    <View style={{ padding: '16px', paddingBottom: '20px' }}>
      {list.length === 0 ? (
        <View className='empty'><View className='icon'>📍</View>暂无收货地址</View>
      ) : (
        list.map((a) => (
          <View key={a.id} className='card' onClick={() => choose(a)} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <View style={{ flex: 1 }}>
              <View>
                <Text style={{ fontSize: '15px', fontWeight: 600 }}>{a.name}</Text>
                <Text style={{ fontSize: '13px', color: '#666', marginLeft: '10px' }}>{a.phone}</Text>
                {a.isDefault && <Text className='tag' style={{ marginLeft: '8px' }}>默认</Text>}
              </View>
              <View style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>{a.region} {a.detail}</View>
            </View>
            {!selectMode && (
              <View style={{ display: 'flex', gap: '14px' }}>
                <Text style={{ fontSize: '13px', color: '#ff5000' }} onClick={() => startEdit(a)}>编辑</Text>
                <Text style={{ fontSize: '13px', color: '#ff4d4f' }} onClick={() => del(a.id)}>删除</Text>
              </View>
            )}
          </View>
        ))
      )}

      {!selectMode && (
        <View className='btn' style={{ marginTop: '20px', padding: '14px', textAlign: 'center', fontSize: '16px' }} onClick={startAdd}>+ 新增收货地址</View>
      )}

      {/* 编辑弹层 */}
      {editing && (
        <View style={{ position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ background: '#fff', width: '86%', borderRadius: '12px', padding: '20px' }}>
            <View style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', textAlign: 'center' }}>{list.some((a) => a.id === editing.id) ? '编辑地址' : '新增地址'}</View>
            <FormRow label='收货人' value={editing.name} onInput={(v) => setEditing({ ...editing, name: v })} placeholder='姓名' />
            <FormRow label='手机号' value={editing.phone} onInput={(v) => setEditing({ ...editing, phone: v })} placeholder='手机号' />
            <FormRow label='地区' value={editing.region} onInput={(v) => setEditing({ ...editing, region: v })} placeholder='省市区' />
            <FormRow label='详细地址' value={editing.detail} onInput={(v) => setEditing({ ...editing, detail: v })} placeholder='街道门牌号' />
            <View style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
              <Text style={{ fontSize: '13px', color: '#666', width: '70px' }}>设为默认</Text>
              <View style={{ fontSize: '16px' }} onClick={() => setEditing({ ...editing, isDefault: !editing.isDefault })}>{editing.isDefault ? '⭕' : '⚪'}</View>
            </View>
            <View style={{ display: 'flex', gap: '12px', marginTop: '18px' }}>
              <View className='btn-secondary' style={{ flex: 1, textAlign: 'center', padding: '10px' }} onClick={() => setEditing(null)}>取消</View>
              <View className='btn' style={{ flex: 1, textAlign: 'center', padding: '10px' }} onClick={saveForm}>保存</View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

function FormRow({ label, value, onInput, placeholder }) {
  return (
    <View style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
      <Text style={{ fontSize: '13px', color: '#666', width: '70px' }}>{label}</Text>
      <Input
        style={{ flex: 1, border: '1px solid #eee', borderRadius: '8px', padding: '10px', fontSize: '14px' }}
        value={value}
        onInput={(e) => onInput(e.detail.value)}
        placeholder={placeholder}
      />
    </View>
  )
}
