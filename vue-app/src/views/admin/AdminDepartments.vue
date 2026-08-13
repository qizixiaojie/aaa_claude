<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import {
  listAdminDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../../api/admin'

/**
 * 科室管理：列表 + 搜索 + 新增/编辑弹窗 + 删除确认
 */
const list = ref([])
const loading = ref(false)
const keyword = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const emptyForm = { id: null, name: '', code: '', description: '', location: '', icon: '' }
const form = reactive({ ...emptyForm })

const rules = {
  name: [{ required: true, message: '请输入科室名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入科室编码', trigger: 'blur' }],
}

async function fetchList() {
  loading.value = true
  try {
    list.value = (await listAdminDepartments({ keyword: keyword.value })) || []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

// 打开新增
function openCreate() {
  isEdit.value = false
  Object.assign(form, emptyForm)
  dialogVisible.value = true
}

// 打开编辑
function openEdit(row) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    location: row.location,
    icon: row.icon,
  })
  dialogVisible.value = true
}

// 保存
async function handleSave() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const payload = { ...form }
  try {
    if (isEdit.value) {
      await updateDepartment(form.id, payload)
      ElMessage.success('科室已更新')
    } else {
      await createDepartment(payload)
      ElMessage.success('科室已创建')
    }
    dialogVisible.value = false
    fetchList()
  } catch {
    /* 拦截器已提示 */
  }
}

// 删除
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除科室「${row.name}」吗？该科室下有医生时无法删除。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  try {
    await deleteDepartment(row.id)
    ElMessage.success('科室已删除')
    fetchList()
  } catch {
    /* 拦截器已提示 */
  }
}

onMounted(fetchList)
</script>

<template>
  <div class="admin-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索科室名称 / 编码"
        clearable
        style="width: 240px"
        @keyup.enter="fetchList"
        @clear="fetchList"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" @click="fetchList">查询</el-button>
      <div class="toolbar__right">
        <el-button @click="fetchList"><el-icon><Refresh /></el-icon>刷新</el-button>
        <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>新增科室</el-button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="card-panel">
      <el-table v-loading="loading" :data="list" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="科室名称" min-width="120" />
        <el-table-column prop="code" label="编码" min-width="100" />
        <el-table-column prop="description" label="简介" min-width="220" show-overflow-tooltip />
        <el-table-column prop="location" label="位置" min-width="120" />
        <el-table-column prop="doctorCount" label="医生数" width="90" align="center" />
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无科室数据" />
        </template>
      </el-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑科室' : '新增科室'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="科室名称" prop="name">
          <el-input v-model="form.name" placeholder="如：内科" />
        </el-form-item>
        <el-form-item label="科室编码" prop="code">
          <el-input v-model="form.code" placeholder="如：NK" />
        </el-form-item>
        <el-form-item label="科室简介">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="科室介绍" />
        </el-form-item>
        <el-form-item label="楼层位置">
          <el-input v-model="form.location" placeholder="如：门诊楼 3 层" />
        </el-form-item>
        <el-form-item label="图标名">
          <el-input v-model="form.icon" placeholder="Element Plus 图标名（可空）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.toolbar__right {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.card-panel {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}
</style>
