<script setup>
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'

/**
 * 区块标题（左侧色条 + 标题 + 可选「查看更多」右侧链接）
 * moreTo：命名路由名或路由对象，点击「查看更多」跳转；否则触发 more 事件
 * 用于：首页各区块、科室页、医生详情页
 */
const props = defineProps({
  title: { type: String, required: true },
  moreText: { type: String, default: '' },
  moreTo: { type: [String, Object], default: '' },
})

const emit = defineEmits(['more'])
const router = useRouter()

function handleMore() {
  if (props.moreTo) {
    router.push(typeof props.moreTo === 'string' ? { name: props.moreTo } : props.moreTo)
  } else {
    emit('more')
  }
}
</script>

<template>
  <div class="section-title">
    <span class="section-title__bar"></span>
    <span class="section-title__text">{{ title }}</span>
    <span v-if="moreText" class="section-title__more" @click="handleMore">
      {{ moreText }}
      <el-icon :size="13"><ArrowRight /></el-icon>
    </span>
  </div>
</template>

<style scoped>
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 18px 0 12px;
}

.section-title__bar {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  background-color: var(--color-primary);
}

.section-title__text {
  font-size: 16px;
  font-weight: 600;
}

.section-title__more {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
}

.section-title__more:active {
  color: var(--color-primary);
}
</style>
