<script setup lang="ts">

// 分类类型
interface Category {
  id: number
  name: string
  code: string
  sort: number
  status: number
}

// 定义props
const props = defineProps({
  categoryList: {
    type: Array as () => Category[],
    required: true,
    default: () => []
  },
  modelValue: {
    type: [Number, String],
    default: ''
  },
  placeholder: {
    type: String,
    default: '选择分类'
  }
})

// 定义emit
const emit = defineEmits<{
  (e: 'update:modelValue', value: number | string): void
}>()

// 处理选择变化
const handleChange = (value: number | string) => {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="category-select">
    <el-select
      :model-value="modelValue"
      :placeholder="placeholder"
      @update:model-value="handleChange"
    >
      <el-option
        v-for="category in categoryList"
        :key="category.id"
        :label="category.name"
        :value="category.id"
      />
      <el-option v-if="categoryList.length === 0" label="暂无分类" :value="''" disabled />
    </el-select>
  </div>
</template>

<style scoped>
.category-select {
  width: 100%;
}
</style>
