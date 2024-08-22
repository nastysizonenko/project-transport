<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'
import Button from 'primevue/button'

import AdminBusDialog from '@/components/admin/AdminBusDialog.vue'

const isLoading = ref(false)
const busList = ref([])
const busToEdit = ref({})

const isDialogToggled = ref(false)

onMounted(async () => {
  await fetchBusData()
})

const fetchBusData = async () => {
  isLoading.value = true

  const { data: busListResponse } = await axios.get('http://localhost:8080/api/bus')

  busList.value = busListResponse.map((busElement) => ({
    key: busElement.busnumber,
    data: busElement
  }))

  isLoading.value = false
}

const toggleDialog = async (truthy, bus) => {
  isDialogToggled.value = truthy

  if (truthy) {
    busToEdit.value = bus
  } else {
    busToEdit.value = null
  }

  if (!truthy && bus) {
    await fetchBusData()
  }
}
</script>

<template>
  <div class="page bus-list" :class="{'opacity-60': isLoading}">
    <div class="page__header">
      <h1>Список автобусов</h1>
      <Button
        type="button"
        icon="pi pi-plus"
        severity="success"
        label="Создать"
        @click="toggleDialog(true)"
      />
    </div>
    <div class="card">
      <TreeTable :value="busList">
        <Column field="busnumber" sortable header="Номер автобуса"></Column>
        <Column field="manufacturer" sortable header="Модель"></Column>
        <Column field="color" sortable header="Цвет">
          <template #body="{ node }">
            <div class="bus-list__color-box" :style="{ background: '#'+node.data.color }" />
          </template>
        </Column>
        <Column field="capacity" sortable header="Количество мест"></Column>
        <Column header="Действия" headerStyle="width: 10rem">
          <template #body="{ node }">
            <div class="flex flex-wrap gap-2">
              <Button type="button" icon="pi pi-pencil" rounded severity="success" @click="toggleDialog(true, node.data)" />
              <!-- <Button type="button" icon="pi pi-trash" rounded severity="danger" /> -->
            </div>
          </template>
        </Column>
      </TreeTable>
    </div>
  </div>

  <AdminBusDialog :isDialogToggled="isDialogToggled" :busToEdit="busToEdit" @dialogue-was-hidden="toggleDialog(false, $event)" />
</template>

<style scoped>
.bus-list {
}
.bus-list__color-box {
  width: 35px;
  height: 35px;
  border: 2px solid rgb(141, 141, 141);
  border-radius: 10px;
}
.bus-list__table-actions {
  /* display: flex;
  gap: 5px; */
}
</style>
