<script setup>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import DoctorCard from '../components/DoctorCard.vue'
import EmptyState from '../components/EmptyState.vue'
import { listDoctors } from '../api/doctors'
import { listDepartments } from '../api/departments'

/**
 * 医生列表页：关键字搜索 + 科室筛选 + 医生卡片列表
 */
const keyword = ref('')
const departmentId = ref('')
const departments = ref([])
const doctors = ref([])
const loading = ref(false)

async function fetchDoctors() {
  loading.value = true
  try {
    doctors.value = (await listDoctors({
      keyword: keyword.value.trim() || undefined,
      departmentId: departmentId.value || undefined,
    })) || []
  } catch {
    doctors.value = []
  } finally {
    loading.value = false
  }
}

// 清空搜索条件
function resetSearch() {
  keyword.value = ''
  departmentId.value = ''
  fetchDoctors()
}

onMounted(async () => {
  // 科室筛选下拉数据
  try {
    departments.value = (await listDepartments()) || []
  } catch {
    departments.value = []
  }
  await fetchDoctors()
})
</script>

<template>
  <div class="page doctors">
    <!-- 搜索栏 + 科室筛选 -->
    <div class="doctors__search">
      <el-input
        v-model="keyword"
        placeholder="搜索医生姓名 / 擅长"
        clearable
        :prefix-icon="Search"
        @keyup.enter="fetchDoctors"
        @clear="fetchDoctors"
      />
      <el-select
        v-model="departmentId"
        placeholder="全科室"
        clearable
        class="doctors__select"
        @change="fetchDoctors"
      >
        <el-option label="全科室" value="" />
        <el-option
          v-for="dept in departments"
          :key="dept.id"
          :label="dept.name"
          :value="String(dept.id)"
        />
      </el-select>
    </div>

    <!-- 医生列表 -->
    <div v-loading="loading" class="doctors__list">
      <DoctorCard
        v-for="doc in doctors"
        :key="doc.id"
        :doctor="doc"
        class="doctors__item"
      />
      <EmptyState
        v-if="!loading && doctors.length === 0"
        description="没有找到符合条件的医生"
        button-text="清空筛选"
        @action="resetSearch"
      />
    </div>
  </div>
</template>

<style scoped>
.doctors__search {
  margin: 12px 0;
  display: flex;
  gap: 10px;
}

.doctors__search .el-input {
  flex: 1;
}

.doctors__select {
  width: 120px;
  flex-shrink: 0;
}

.doctors__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 200px;
}
</style>
