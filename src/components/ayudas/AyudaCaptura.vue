<template>
  <!-- Pantallazo real de la aplicación con marcas numeradas y su explicación debajo -->
  <figure class="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
    <div class="relative">
      <img :src="src" :alt="alt" class="block w-full" loading="lazy" />
      <span
        v-for="(marca, idx) in marcas"
        :key="idx"
        class="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shadow-md ring-2 ring-white"
        :style="{ left: `${marca.x}%`, top: `${marca.y}%` }"
        aria-hidden="true"
      >
        {{ idx + 1 }}
      </span>
    </div>

    <figcaption class="space-y-3 border-t border-slate-200 bg-white p-4">
      <p v-if="leyenda" class="text-xs italic text-slate-500">{{ leyenda }}</p>
      <ol v-if="marcas.length" class="space-y-2">
        <li v-for="(marca, idx) in marcas" :key="idx" class="flex gap-3">
          <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
            {{ idx + 1 }}
          </span>
          <p class="pt-0.5">
            <span class="font-medium text-slate-900">{{ marca.titulo }}</span>
            <span v-if="marca.texto" class="text-slate-600"> — {{ marca.texto }}</span>
          </p>
        </li>
      </ol>
    </figcaption>
  </figure>
</template>

<script setup>
defineProps({
  /** Imagen importada desde `@/assets/images/ayudas/...` */
  src:     { type: String, required: true },
  alt:     { type: String, required: true },
  /** [{ x, y, titulo, texto? }] — `x`/`y` en % del ancho/alto de la imagen (centro de la marca) */
  marcas:  { type: Array, default: () => [] },
  leyenda: { type: String, default: '' }
})
</script>
