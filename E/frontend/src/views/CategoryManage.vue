<template>
  <div class="page-container">
    <el-card shadow="never">
      <div class="toolbar">
        <span class="page-desc">平台类目管理（最多三级，支持启用/禁用）</span>
        <el-button type="primary" :icon="Plus" @click="openAddDialog(null)">新增顶级类目</el-button>
      </div>
      <el-table
        :data="treeData"
        row-key="id"
        :tree-props="{ children: 'children' }"
        default-expand-all
        v-loading="loading"
      >
        <el-table-column prop="name" label="类目名称" min-width="220" />
        <el-table-column label="层级" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="levelTagType(row.level)">{{ levelText(row.level) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
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
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.level < 3" size="small" type="primary" link @click="openAddDialog(row)">
              添加子类目
            </el-button>
            <el-button size="small" type="warning" link @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑类目' : '新增类目'" width="480px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item v-if="!isEdit" label="父级类目">
          <el-tree-select
            v-model="form.parent_id"
            :data="parentOptions"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="类目名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入类目名称" maxlength="50" />
        </el-form-item>
        <el-form-item label="排序值">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { createCategory, deleteCategory, getCategoryTree, updateCategory } from '../api/category'
import { formatTime } from '../utils/format'

const loading = ref(false)
const treeData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref()
const editId = ref(null)

const form = reactive({ parent_id: 0, name: '', sort: 0, status: 1 })
const rules = {
  name: [{ required: true, message: '请输入类目名称', trigger: 'blur' }]
}

// 父级类目选择数据：加一个虚拟顶级节点
const parentOptions = computed(() => [
  { id: 0, name: '顶级类目（无父级）', children: treeData.value }
])

function levelText(level) {
  return { 1: '一级', 2: '二级', 3: '三级' }[level] || `${level}级`
}

function levelTagType(level) {
  return { 1: 'danger', 2: 'warning', 3: 'info' }[level] || 'info'
}

async function fetchTree() {
  loading.value = true
  try {
    const res = await getCategoryTree()
    treeData.value = res.data || []
  } catch {
    /* 错误提示已由拦截器统一处理 */
  } finally {
    loading.value = false
  }
}

function openAddDialog(parent) {
  isEdit.value = false
  editId.value = null
  form.parent_id = parent ? parent.id : 0
  form.name = ''
  form.sort = 0
  form.status = 1
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  editId.value = row.id
  form.name = row.name
  form.sort = row.sort
  form.status = row.status
  dialogVisible.value = true
}

async function handleSubmit() {
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateCategory(editId.value, { name: form.name, sort: form.sort, status: form.status })
    } else {
      await createCategory({
        parent_id: form.parent_id,
        name: form.name,
        sort: form.sort,
        status: form.status
      })
    }
    ElMessage.success(isEdit.value ? '修改成功' : '新增成功')
    dialogVisible.value = false
    fetchTree()
  } catch {
    /* 错误提示已由拦截器统一处理 */
  } finally {
    submitting.value = false
  }
}

async function handleStatusChange(row) {
  try {
    await updateCategory(row.id, { status: row.status })
    ElMessage.success('状态已更新')
  } catch {
    row.status = row.status === 1 ? 0 : 1
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除类目「${row.name}」吗？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteCategory(row.id)
    ElMessage.success('删除成功')
    fetchTree()
  } catch {
    /* 错误提示已由拦截器统一处理 */
  }
}

onMounted(fetchTree)
</script>

<style scoped>
.page-desc {
  color: #909399;
  font-size: 13px;
}
</style>
