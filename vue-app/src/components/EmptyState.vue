<script setup>
/**
 * 空状态组件（el-empty + 提示文案 + 可选按钮）
 * 用于：预约列表空、医生搜索无结果、药品列表空、处方列表空
 */
defineProps({
  description: { type: String, default: '暂无数据' },
  buttonText: { type: String, default: '' },
})

defineEmits(['action'])
</script>

<template>
  <div class="empty-state">
    <el-empty :description="description" :image-size="110">
      <el-button v-if="buttonText" type="primary" round @click="$emit('action')">
        {{ buttonText }}
      </el-button>
    </el-empty>
  </div>
</template>

<style scoped>
.empty-state {
  padding: 24px 0;
}
</style>
