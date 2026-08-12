<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, HomeFilled } from '@element-plus/icons-vue'
import DoctorCard from '../components/DoctorCard.vue'
import EmptyState from '../components/EmptyState.vue'
import { listDoctors } from '../api/doctors'
import { getDepartment } from '../api/departments'

/**
 * 科室医生列表页（独立子页：白底 + 返回）
 * 顶部展示科室名，下方为改科室医生列表
 */
const route = useRoute()
const router = useRouter()
const deptId = route.params.deptId

const department = ref(null)
const doctors = ref([])
const loading = ref(false)

onMounted(async () => {
  // 科室信息（用于标题）
  try {
    department.value = await getDepartment(deptId)
  } catch {
    department.value = null
  }
  // 科室下医生列表
  loading.value = true
  try {
    doctors.value = (await listDoctors({ departmentId: deptId })) || []
  } catch {
    doctors.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="sub-page doctor-department">
    <!-- 返回栏：标题为科室名 -->
    <header class="sub-page-header">
      <div class="sub-page-header__back" @click="router.back()">
        <el-icon :size="18"><ArrowLeft /></el-icon>
      </div>
      <span class="sub-page-header__title">{{ department?.name || '科室医生' }}</span>
      <div class="sub-page-header__home" @click="router.push({ name: 'home' })">
        <el-icon :size="18"><HomeFilled /></el-icon>
      </div>
    </header>

    <div class="sub-page-content">
      <div v-loading="loading" class="doctor-department__list">
        <DoctorCard
          v-for="doc in doctors"
          :key="doc.id"
          :doctor="doc"
          class="doctor-department__item"
        />
        <EmptyState
          v-if="!loading && doctors.length === 0"
          description="该科室暂无出诊医生"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.doctor-department__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 200px;
}
</style>
