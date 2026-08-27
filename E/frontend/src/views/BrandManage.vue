<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="query.keyword"
            placeholder="搜索品牌名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </div>
        <el-button type="primary" :icon="Plus" @click="openAddDialog">新增品牌</el-button>
      </div>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column label="品牌Logo" width="90" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.logo"
              :src="row.logo"
              fit="cover"
              class="brand-logo"
              :preview-src-list="[row.logo]"
              preview-teleported
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="品牌名称" min-width="140" />
        <el-table-column prop="description" label="品牌描述" min-width="240" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="warning" link @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        background
        layout="total, sizes, prev, pager, next"
        :total="total"
        v-model:current-page="query.page"
        v-model:page-size="query.page_size"
        :page-sizes="[10, 20, 50]"
        @current-change="fetchList"
        @size-change="fetchList"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑品牌' : '新增品牌'" width="480px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="品牌名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入品牌名称" maxlength="50" />
        </el-form-item>
        <el-form-item label="Logo URL">
          <el-input v-model="form.logo" placeholder="请输入品牌Logo图片URL（可选）" maxlength="255" />
        </el-form-item>
        <el-form-item label="品牌描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入品牌描述（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { createBrand, deleteBrand, getBrandList, updateBrand } from '../api/brand'
import { formatTime } from '../utils/format'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()
const editId = ref(null)

const query = reactive({ page: 1, page_size: 10, keyword: '' })
const form = reactive({ name: '', logo: '', description: '', status: 1 })
const rules = {
  name: [{ required: true, message: '请输入品牌名称', trigger: 'blur' }]
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getBrandList({ ...query })
    total.value = res.data.total
    list.value = res.data.list
  } catch {
    /* 错误提示已由拦截器统一处理 */
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  fetchList()
}

function openAddDialog() {
  isEdit.value = false
  editId.value = null
  form.name = ''
  form.logo = ''
  form.description = ''
  form.status = 1
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  editId.value = row.id
  form.name = row.name
  form.logo = row.logo || ''
  form.description = row.description || ''
  form.status = row.status
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateBrand(editId.value, { ...form })
    } else {
      await createBrand({ ...form })
    }
    ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
    dialogVisible.value = false
    fetchList()
  } catch {
    /* 错误提示已由拦截器统一处理 */
  } finally {
    submitting.value = false
  }
}

async function handleStatusChange(row) {
  try {
    await updateBrand(row.id, { status: row.status })
    ElMessage.success('状态已更新')
  } catch {
    row.status = row.status === 1 ? 0 : 1
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除品牌「${row.name}」吗？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteBrand(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch {
    /* 错误提示已由拦截器统一处理 */
  }
}

onMounted(fetchList)
</script>

<style scoped>
.brand-logo {
  width: 48px;
  height: 48px;
  border-radius: 4px;
}
</style>
