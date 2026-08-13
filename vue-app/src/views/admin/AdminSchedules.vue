<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Calendar } from '@element-plus/icons-vue'
import { generateSchedules } from '../../api/admin'

/**
 * 排班管理：手动生成未来 7 天排班（幂等，只补缺不重建）
 * - 系统已在后端启动时自动补排班；此处提供手动按钮，随时刷新
 */
const generating = ref(false)
const lastResult = ref(null)

async function handleGenerate() {
  generating.value = true
  try {
    const data = (await generateSchedules()) || {}
    lastResult.value = data.added
    ElMessage.success(data.added > 0 ? `已补齐 ${data.added} 条排班` : '未来 7 天排班已完整，无需补充')
  } catch {
    /* 拦截器已提示 */
  } finally {
    generating.value = false
  }
}
</script>

<template>
  <div class="admin-page">
    <div class="card-panel sched-panel">
      <el-icon :size="40" color="#409eff"><Calendar /></el-icon>
      <div class="sched-panel__title">排班自动生成</div>
      <div class="sched-panel__desc">
        系统会按排班规则为所有医生自动生成「今天起未来 7 天」的排班（每位医生每天上午必出，下午轮换）。
        <br />
        操作是<strong>幂等</strong>的：只补齐缺失的排班，不会重置已有号源，可随时重复点击。
      </div>
      <el-button
        type="primary"
        size="large"
        :loading="generating"
        @click="handleGenerate"
      >
        <el-icon v-if="!generating"><Refresh /></el-icon>
        {{ generating ? '生成中...' : '立即生成排班' }}
      </el-button>
      <div v-if="lastResult !== null" class="sched-panel__result">
        上次结果：{{ lastResult > 0 ? `补齐 ${lastResult} 条排班` : '排班已完整' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.sched-panel {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 24px;
}

.sched-panel__title {
  margin-top: 12px;
  font-size: 18px;
  font-weight: 600;
}

.sched-panel__desc {
  margin: 12px 0 20px;
  font-size: 13px;
  color: var(--text-regular);
  line-height: 1.8;
}

.sched-panel__result {
  margin-top: 16px;
  font-size: 13px;
  color: #67c23a;
}
</style>
