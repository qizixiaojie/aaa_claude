<script setup>
import { ref, onMounted } from 'vue'
import { getAdminStats } from '../../api/admin'

/**
 * 统计概览：核心指标卡片 + 医生工作量 TOP5
 */
const stats = ref(null)
const loading = ref(false)

const cards = [
  { key: 'todayAppointments', label: '今日挂号量', color: '#409eff', suffix: ' 人' },
  { key: 'waitingCount', label: '待就诊人数', color: '#e6a23c', suffix: ' 人' },
  { key: 'totalPaid', label: '累计支付金额', color: '#67c23a', suffix: ' 元' },
  { key: 'totalUsers', label: '注册用户', color: '#909399', suffix: ' 人' },
]

async function fetchStats() {
  loading.value = true
  try {
    stats.value = (await getAdminStats()) || {}
  } catch {
    stats.value = {}
  } finally {
    loading.value = false
  }
}

onMounted(fetchStats)
</script>

<template>
  <div v-loading="loading" class="admin-page">
    <!-- 指标卡片 -->
    <div class="stat-cards">
      <div v-for="c in cards" :key="c.key" class="stat-card">
        <div class="stat-card__label">{{ c.label }}</div>
        <div class="stat-card__value" :style="{ color: c.color }">
          {{ Number(stats?.[c.key] ?? 0).toLocaleString() }}<span class="stat-card__suffix">{{ c.suffix }}</span>
        </div>
      </div>
    </div>

    <!-- 医生工作量 -->
    <div class="card-panel">
      <div class="panel-title">医生接诊量 TOP5（已完成）</div>
      <el-table :data="stats?.doctorLoad || []" stripe>
        <el-table-column prop="doctorName" label="医生" min-width="120" />
        <el-table-column prop="depName" label="科室" min-width="120" />
        <el-table-column prop="count" label="已完成接诊" width="120" align="center">
          <template #default="{ row }">
            <span class="text-price">{{ row.count }}</span> 人次
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!stats?.doctorLoad?.length" class="panel-empty">暂无已完成的就诊记录</div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  min-height: 200px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.stat-card__label {
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-card__value {
  margin-top: 8px;
  font-size: 30px;
  font-weight: 700;
}

.stat-card__suffix {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-left: 2px;
}

.card-panel {
  margin-top: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 14px;
}

.panel-empty {
  padding: 24px 0;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
