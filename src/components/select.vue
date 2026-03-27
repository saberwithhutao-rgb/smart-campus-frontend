<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Category {
  id: number
  name: string
  code: string
  sort: number
  status: number
}

const props = defineProps({
  categoryList: {
    type: Array as () => Category[],
    required: true,
    default: () => [],
  },
  modelValue: {
    type: [Number, String],
    default: '',
  },
  placeholder: {
    type: String,
    default: '选择话题',
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | string): void
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// 当前选中的分类名称
const selectedName = computed(() => {
  if (!props.modelValue) return props.placeholder
  const selected = props.categoryList.find((c) => c.id === props.modelValue)
  return selected ? selected.name : props.placeholder
})

// 切换下拉框
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

// 选择分类
const selectCategory = (category: Category) => {
  emit('update:modelValue', category.id)
  isOpen.value = false
}

// 点击外部关闭
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

// 监听全局点击
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="custom-select" ref="dropdownRef">
    <div class="select-trigger" @click="toggleDropdown">
      <span class="select-value" :class="{ placeholder: !modelValue }">
        {{ selectedName }}
      </span>
      <span class="select-arrow" :class="{ open: isOpen }">▼</span>
    </div>

    <transition name="dropdown">
      <div v-if="isOpen" class="select-dropdown">
        <div
          v-for="category in categoryList"
          :key="category.id"
          class="dropdown-item"
          :class="{ active: modelValue === category.id }"
          @click="selectCategory(category)"
        >
          #{{ category.name }}
        </div>
        <div v-if="categoryList.length === 0" class="dropdown-empty">暂无分类</div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.custom-select {
  position: relative;
  width: 100%;
  user-select: none;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border: 1px solid #e5e5e5;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-trigger:hover {
  background-color: #eef2f6;
  border-color: #409eff;
}

.select-value {
  font-size: 14px;
  color: #1a1a1a;
}

.select-value.placeholder {
  color: #999;
}

.select-arrow {
  font-size: 12px;
  color: #666;
  transition: transform 0.2s ease;
}

.select-arrow.open {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-item {
  padding: 10px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f5f7fa;
}

.dropdown-item.active {
  background-color: #e6f7ff;
  color: #409eff;
}

.dropdown-empty {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
