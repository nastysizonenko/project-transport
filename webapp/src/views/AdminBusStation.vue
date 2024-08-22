<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'
import Button from 'primevue/button'

import AdminBusStationDialog from '@/components/admin/AdminBusStationDialog.vue'

const isLoading = ref(false)
const busList = ref([])
const busStationToEdit = ref({})

const isDialogToggled = ref(false)

onMounted(async () => {
  await fetchBusData()
})

const fetchBusData = async () => {
  isLoading.value = true

  const { data: busListResponse } = await axios.get('http://localhost:8080/api/bus-station')

  busList.value = busListResponse.map((busElement) => ({
    key: busElement.busnumber,
    data: busElement
  }))

  isLoading.value = false
}

const toggleDialog = async (truthy, bus) => {
  isDialogToggled.value = truthy

  if (truthy) {
    busStationToEdit.value = bus
  } else {
    busStationToEdit.value = null
  }

  if (!truthy && bus) {
    await fetchBusData()
  }
}
</script>

<template>
  <div class="page bus-list" :class="{'opacity-60': isLoading}">
    <div class="page__header">
      <h1>Список автостанций</h1>
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
        <Column field="id" sortable header="Id"></Column>
        <Column field="stationname" sortable header="Название/адрес"></Column>
        <Column field="coords" sortable header="Координаты"></Column>
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

  <AdminBusStationDialog :isDialogToggled="isDialogToggled" :busStationToEdit="busStationToEdit" @dialogue-was-hidden="toggleDialog(false, $event)" />
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
