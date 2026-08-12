<script setup>
import { useRouter } from 'vue-router'
import { OfficeBuilding } from '@element-plus/icons-vue'

/**
 * 科室卡片（图标 / 名称 / 医生数 / 一句介绍，点击跳科室医生列表）
 * compact 为 true 时用于首页宫格（纵向布局），否则用于科室大全列表（横向布局）
 * 用于：首页科室宫格、科室大全页
 */
const props = defineProps({
  department: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})

const router = useRouter()

function goList() {
  router.push({ name: 'doctorDepartment', params: { deptId: props.department.id } })
}
</script>

<template>
  <div
    class="department-card"
    :class="{ 'department-card--compact': compact }"
    @click="goList"
  >
    <div class="department-card__icon">
      <el-icon :size="compact ? 22 : 20"><OfficeBuilding /></el-icon>
    </div>
    <div class="department-card__body">
      <div class="department-card__name">{{ department.name }}</div>
      <div v-if="!compact" class="department-card__desc ellipsis">
        {{ department.description || '暂无科室简介' }}
      </div>
    </div>
    <div class="department-card__count">{{ department.doctorCount || 0 }} 位医生</div>
  </div>
</template>

<style scoped>
.department-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background-color: var(--color-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  cursor: pointer;
}

.department-card__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.department-card__body {
  flex: 1;
  min-width: 0;
}

.department-card__name {
  font-size: 15px;
  font-weight: 600;
}

.department-card__desc {
  margin-top: 3px;
  font-size: 12px;
  color: var(--text-secondary);
}

.department-card__count {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

/* 宫格模式：纵向布局，文字居中 */
.department-card--compact {
  flex-direction: column;
  gap: 8px;
  text-align: center;
  padding: 14px 8px;
}

.department-card--compact .department-card__count {
  font-size: 11px;
}
</style>
