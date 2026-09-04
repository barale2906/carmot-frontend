<template>
  <router-view />
  <AppNotifications />
  <ConfirmDialog />
</template>

<script setup>
import AppNotifications from '@/components/AppNotifications.vue'
import ConfirmDialog    from '@/components/ConfirmDialog.vue'
</script>


