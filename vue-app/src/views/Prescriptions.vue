<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import StatusTag from '../components/StatusTag.vue'
import EmptyState from '../components/EmptyState.vue'
import { listPrescriptions, getPrescription, pickupPrescription } from '../api/prescriptions'

/**
 * 我的处方页（独立子页：白底 + 返回）
 * - 处方卡可展开明细（药品名/规格/数量/单价/小计/用法用量）
 * - 状态 = 待取药 显示「模拟取药」按钮，调 pickup 成功刷新
 */
const router = useRouter()

const prescriptions = ref([])
const loading = ref(false)
const expandedId = ref(null)
const detailMap = ref({})

async function fetchList() {
  loading.value = true
  try {
    prescriptions.value = (await listPrescriptions()) || []
  } catch {
    prescriptions.value = []
  } finally {
    loading.value = false
  }
}

// 展开 / 收起处方明细（懒加载详情）
async function toggleExpand(p) {
  if (expandedId.value === p.id) {
    expandedId.value = null
    return
  }
  expandedId.value = p.id
  if (!detailMap.value[p.id]) {
    try {
      detailMap.value[p.id] = await getPrescription(p.id)
    } catch {
      detailMap.value[p.id] = { items: [] }
    }
  }
}

// 模拟取药
async function handlePickup(p) {
  try {
    await pickupPrescription(p.id)
    ElMessage.success('取药成功，请前往药房核对')
    fetchList()
  } catch {
    /* 错误已由拦截器提示 */
  }
}

onMounted(fetchList)
</script>

<template>
  <div class="sub-page prescriptions">
    <!-- 返回栏 -->
    <header class="sub-page-header">
      <div class="sub-page-header__back" @click="router.back()">
        <el-icon :size="18"><ArrowLeft /></el-icon>
      </div>
      <span class="sub-page-header__title">我的处方</span>
    </header>

    <div class="sub-page-content">
      <div v-loading="loading" class="prescriptions__list">
        <div v-for="p in prescriptions" :key="p.id" class="card prescriptions__item">
          <div class="prescriptions__head">
            <div class="prescriptions__no">处方号：{{ p.prescNo }}</div>
            <StatusTag :status="p.status" />
          </div>

          <div class="prescriptions__rows">
            <div class="prescriptions__row">
              <span class="prescriptions__label">开方医生</span>
              <span>{{ p.doctorName || '医生' }}</span>
            </div>
            <div class="prescriptions__row">
              <span class="prescriptions__label">患者</span>
              <span>{{ p.patientName }}</span>
            </div>
            <div class="prescriptions__row">
              <span class="prescriptions__label">总金额</span>
              <span class="text-price">￥{{ Number(p.totalAmount).toFixed(2) }}</span>
            </div>
          </div>

          <!-- 展开明细 -->
          <div class="prescriptions__expand" @click="toggleExpand(p)">
            <span>药品明细</span>
            <el-icon :size="14">
              <ArrowUp v-if="expandedId === p.id" />
              <ArrowDown v-else />
            </el-icon>
          </div>

          <div v-if="expandedId === p.id" class="prescriptions__detail">
            <template v-if="detailMap[p.id]?.items?.length">
              <div
                v-for="(item, idx) in detailMap[p.id].items"
                :key="idx"
                class="prescriptions__detail-item"
              >
                <div class="prescriptions__detail-head">
                  <span>{{ item.medicineName || '药品' }}</span>
                  <span class="text-price">￥{{ Number(item.total).toFixed(2) }}</span>
                </div>
                <div class="prescriptions__detail-sub">
                  规格 {{ item.specification || '—' }} · 数量 {{ item.quantity }} · 单价 ￥{{ Number(item.unitPrice).toFixed(2) }}
                </div>
                <div v-if="item.dosage" class="prescriptions__detail-sub">
                  用法用量：{{ item.dosage }}
                </div>
              </div>
            </template>
            <div v-else class="prescriptions__detail-empty">暂无明细</div>
          </div>

          <!-- 待取药：模拟取药 -->
          <div v-if="p.status === '待取药'" class="prescriptions__actions">
            <el-button type="primary" size="small" @click="handlePickup(p)">模拟取药</el-button>
          </div>
        </div>

        <EmptyState
          v-if="!loading && prescriptions.length === 0"
          description="暂无处方记录"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.prescriptions__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 200px;
}

.prescriptions__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.prescriptions__no {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-regular);
}

.prescriptions__rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 0;
  border-top: 1px dashed var(--color-border);
}

.prescriptions__row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.prescriptions__label {
  color: var(--text-secondary);
}

.prescriptions__expand {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-top: 10px;
  font-size: 13px;
  color: var(--color-primary);
  cursor: pointer;
}

.prescriptions__detail {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--color-border);
}

.prescriptions__detail-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.prescriptions__detail-item:last-child {
  border-bottom: none;
}

.prescriptions__detail-head {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
}

.prescriptions__detail-sub {
  margin-top: 3px;
  font-size: 12px;
  color: var(--text-secondary);
}

.prescriptions__detail-empty {
  padding: 12px 0;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
}

.prescriptions__actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
