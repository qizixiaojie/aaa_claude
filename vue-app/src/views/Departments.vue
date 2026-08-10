<script setup>
import { ref, onMounted } from 'vue'
import SectionTitle from '../components/SectionTitle.vue'
import DepartmentCard from '../components/DepartmentCard.vue'
import EmptyState from '../components/EmptyState.vue'
import { listDepartments } from '../api/departments'

/**
 * 科室大全页：全部科室纵向列表
 */
const departments = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    departments.value = (await listDepartments()) || []
  } catch {
    departments.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page departments">
    <SectionTitle title="全部科室" />

    <div v-loading="loading" class="departments__list">
      <DepartmentCard
        v-for="dept in departments"
        :key="dept.id"
        :department="dept"
        class="departments__item"
      />
      <EmptyState
        v-if="!loading && departments.length === 0"
        description="暂无科室数据"
      />
    </div>
  </div>
</template>

<style scoped>
.departments__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 200px;
}
</style>
