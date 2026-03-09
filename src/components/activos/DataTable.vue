<template>
  <div class="overflow-x-auto rounded-xl border border-black/10 bg-white">
    <table class="w-full min-w-[800px] text-left text-sm" :aria-label="ariaLabel">
      <thead class="border-b border-slate-200 bg-slate-50/80">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            scope="col"
            class="px-4 py-3 font-medium text-slate-700"
            :class="col.thClass"
          >
            <span class="flex items-center gap-1">
              {{ col.label }}
              <NavIcon v-if="col.icon" :name="col.icon" class="size-4 text-slate-500" />
            </span>
          </th>
          <th
            v-if="hasActions"
            scope="col"
            class="px-4 py-3 font-medium text-slate-700 text-right"
          >
            Acciones
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr
          v-for="(row, index) in data"
          :key="rowKey ? row[rowKey] : index"
          class="bg-white transition-colors hover:bg-slate-50/50"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 text-slate-900"
            :class="col.tdClass"
          >
            <slot
              name="cell"
              :row="row"
              :column="col"
              :value="row[col.key]"
              :formatted="formatCell(row[col.key], col)"
            >
              {{ formatCell(row[col.key], col) }}
            </slot>
          </td>
          <td v-if="hasActions" class="px-4 py-3 text-right">
            <slot name="actions" :row="row">
              <div class="flex justify-end gap-1" />
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import NavIcon from '@/components/icons/NavIcon.vue'

defineProps({
  columns: {
    type: Array,
    required: true,
    validator: (v) => v.every((c) => c.key && c.label)
  },
  data: { type: Array, default: () => [] },
  rowKey: { type: String, default: '' },
  ariaLabel: { type: String, default: 'Tabla de datos' }
})

const hasActions = true

function formatCell(value, col) {
  if (value === undefined || value === null) return '—'
  if (col.format === 'currency') {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
  }
  if (col.format === 'date' && value) {
    const d = typeof value === 'string' ? new Date(value) : value
    return isNaN(d.getTime()) ? value : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric' })
  }
  return value
}
</script>
