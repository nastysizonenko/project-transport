<template>
  <Menubar :model="items">
  </Menubar>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Menubar from 'primevue/menubar';
import { ref } from 'vue'

const router = useRouter()

const items = ref([
  {
    label: 'Автобусы',
    icon: 'pi pi-car',
    command: () => router.push({ name: 'admin-bus' })
  },
  {
    label: 'Билеты',
    icon: 'pi pi-credit-card',
    command: () => router.push({ name: 'admin-ticket' })
  },
  {
    label: 'Автостанции',
    icon: 'pi pi-flag',
    command: () => router.push({ name: 'admin-bus-station' })
  },
])
</script>

<style scoped>
h1 {
  font-size: 19px;
}
</style>
