<template>
  <span v-if="show" class="badge-dot" :class="{ 'badge-number': showNumber }">
    <template v-if="showNumber && (count ?? 0) > 0">
      {{ (count ?? 0) > 99 ? '99+' : (count ?? 0) }}
    </template>
    <template v-else></template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    show?: boolean
    count?: number
    showNumber?: boolean
  }>(),
  {
    show: false,
    count: 0,
    showNumber: false,
  },
)

const showNumber = computed(() => props.showNumber && (props.count ?? 0) > 0)
</script>

<style scoped>
.badge-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 8px;
  height: 8px;
  background-color: var(--color-danger);
  border-radius: 50%;
  margin-left: 8px;
  vertical-align: middle;
}

.badge-number {
  min-width: 18px;
  height: 18px;
  font-size: 11px;
  font-weight: 500;
  color: white;
  background-color: var(--color-danger);
  border-radius: 9px;
  padding: 0 4px;
  line-height: 18px;
}
</style>
