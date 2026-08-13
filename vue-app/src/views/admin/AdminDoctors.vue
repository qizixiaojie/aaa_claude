<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import {
  listAdminDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../../api/admin'
import { listDepartments } from '../../api/departments'

/**
 * 医生管理：列表 + 搜索 + 新增/编辑弹窗（科室下拉）+ 删除确认
 */
const list = ref([])
const departments = ref([])
const loading = ref(false)
const filters = reactive({ departmentId: '', keyword: '' })
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const emptyForm = {
  id: null, departmentId: '', name: '', gender: '男', title: '',
  specialty: '', introduction: '', regFee: '', yearsExperience: '',
}
const form = reactive({ ...emptyForm })

const rules = {
  departmentId: [{ required: true, message: '请选择科室', trigger: 'change' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  title: [{ required: true, message: '请输入职称', trigger: 'blur' }],
  regFee: [{ required: true, message: '请输入挂号费', trigger: 'blur' }],
}

async function fetchList() {
  loading.value = true
  try {
    const params = {}
    if (filters.departmentId) params.departmentId = filters.departmentId
    if (filters.keyword) params.keyword = filters.keyword
    list.value = (await listAdminDoctors(params)) || []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

async function fetchDepartments() {
  departments.value = (await listDepartments()) || []
}

function openCreate() {
  isEdit.value = false
  Object.assign(form, emptyForm)
  dialogVisible.value = true
}

function openEdit(row) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    departmentId: row.departmentId,
    name: row.name,
    gender: row.gender,
    title: row.title,
    specialty: row.specialty,
    introduction: row.introduction,
    regFee: row.regFee,
    yearsExperience: row.yearsExperience,
  })
  dialogVisible.value = true
}

async function handleSave() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const payload = {
    departmentId: form.departmentId,
    name: form.name,
    gender: form.gender,
    title: form.title,
    specialty: form.specialty,
    introduction: form.introduction,
    avatar: '',
    regFee: Number(form.regFee) || 0,
    yearsExperience: Number(form.yearsExperience) || 0,
  }
  try {
    if (isEdit.value) {
      await updateDoctor(form.id, payload)
      ElMessage.success('医生信息已更新')
    } else {
      await createDoctor(payload)
      ElMessage.success('医生已添加')
    }
    dialogVisible.value = false
    fetchList()
  } catch {
    /* 拦截器已提示 */
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除医生「${row.name}」吗？已有预约记录的医生无法删除。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  try {
    await deleteDoctor(row.id)
    ElMessage.success('医生已删除')
    fetchList()
  } catch {
    /* 拦截器已提示 */
  }
}

onMounted(() => {
  fetchDepartments()
  fetchList()
})
</script>

<template>
  <div class="admin-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-select v-model="filters.departmentId" placeholder="全部科室" clearable style="width: 160px">
        <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
      </el-select>
      <el-input
        v-model="filters.keyword"
        placeholder="搜索姓名 / 职称 / 擅长"
        clearable
        style="width: 220px"
        @keyup.enter="fetchList"
        @clear="fetchList"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" @click="fetchList">查询</el-button>
      <div class="toolbar__right">
        <el-button @click="fetchList"><el-icon><Refresh /></el-icon>刷新</el-button>
        <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon>新增医生</el-button>
      </div>
    </div>

    <!-- 列表 -->
    <div class="card-panel">
      <el-table v-loading="loading" :data="list" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="姓名" min-width="90" />
        <el-table-column prop="gender" label="性别" width="70" align="center" />
        <el-table-column prop="title" label="职称" min-width="100" />
        <el-table-column prop="departmentName" label="科室" min-width="110" />
        <el-table-column prop="specialty" label="擅长" min-width="200" show-overflow-tooltip />
        <el-table-column label="挂号费" width="90" align="center">
          <template #default="{ row }">
            <span class="text-price">￥{{ Number(row.regFee).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="yearsExperience" label="年限" width="70" align="center">
          <template #default="{ row }">{{ row.yearsExperience }} 年</template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无医生数据" />
        </template>
      </el-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑医生' : '新增医生'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="所属科室" prop="departmentId">
          <el-select v-model="form.departmentId" placeholder="请选择科室" style="width: 100%">
            <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="医生姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="职称" prop="title">
          <el-select v-model="form.title" placeholder="请选择职称" style="width: 100%">
            <el-option v-for="t in ['主任医师', '副主任医师', '主治医师', '住院医师']" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="挂号费" prop="regFee">
          <el-input-number v-model="form.regFee" :min="0" :precision="2" :step="5" style="width: 180px" />
        </el-form-item>
        <el-form-item label="从业年限">
          <el-input-number v-model="form.yearsExperience" :min="0" :max="60" style="width: 180px" />
        </el-form-item>
        <el-form-item label="擅长">
          <el-input v-model="form.specialty" type="textarea" :rows="2" placeholder="擅长领域" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.introduction" type="textarea" :rows="3" placeholder="医生简介（可空，前端自动补齐）" />
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
  flex-wrap: wrap;
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
