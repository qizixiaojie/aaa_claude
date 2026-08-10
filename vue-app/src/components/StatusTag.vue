<script setup>
import { computed } from 'vue'

/**
 * 状态标签（预约 / 处方状态 → el-tag 类型）
 * 待支付→warning、已支付→success、已完成→info、已取消→danger
 * 待取药→primary、已取药→success
 * 用于：我的预约、处方页
 */
const props = defineProps({
  status: { type: String, default: '' },
})

const STATUS_MAP = {
  待支付: 'warning',
  已支付: 'success',
  已完成: 'info',
  已取消: 'danger',
  待取药: 'primary',
  已取药: 'success',
}

const tagType = computed(() => STATUS_MAP[props.status] || 'info')
</script>

<template>
  <el-tag :type="tagType" size="small" effect="light">{{ status }}</el-tag>
</template>
