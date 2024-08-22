<script setup>
import { watch, ref, computed, nextTick } from 'vue'
import axios from 'axios'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import L from 'leaflet'

const toast = useToast()
const confirm = useConfirm()

const props = defineProps({
  isDialogToggled: {
    type: Boolean,
    default: false
  },
  busStationToEdit: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['dialogue-was-hidden'])

const save = async () => {
  props.busStationToEdit && props.busStationToEdit.id
      ? await axios.put(
          `http://localhost:8080/api/bus-station/${props.busStationToEdit.id}`,
          busStationValue.value
        )
      : await axios.post('http://localhost:8080/api/bus-station', busStationValue.value)

  const toastMsg =
    props.busStationToEdit && props.busStationToEdit.id
      ? `Автостанция с номером "${props.busStationToEdit.id}" успешно изменена!`
      : 'Автостанция успешно добавлена!'

  toast.add({ severity: 'success', summary: 'Успех', detail: toastMsg, life: 5000 })
  emit('dialogue-was-hidden', {})
}

const confirmDeletion = (event) => {
  confirm.require({
    target: event.currentTarget,
    message: 'Все билеты связанные с этой станцией также будут удалены',
    icon: 'pi pi-exclamation-triangle',
    rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
    acceptClass: 'p-button-danger p-button-sm',
    rejectLabel: 'Отменить',
    acceptLabel: 'Удалить',
    accept: async () => {
      await axios.delete(`http://localhost:8080/api/bus-station/${props.busStationToEdit.id}`)

      toast.add({
        severity: 'success',
        summary: 'Успех',
        detail: `Автостанция с номером ${props.busStationToEdit.id} успешно удалена`,
        life: 5000
      })
      emit('dialogue-was-hidden', busStationValue.value)
    }
  })
}

const busStationValue = ref({})

const stationMarker = ref(null)

watch(
  () => props.isDialogToggled,
  async () => {
    if (props.busStationToEdit) {
      busStationValue.value = { ...props.busStationToEdit }
    } else {
      busStationValue.value = {
        stationname: null,
        coords: null
      }
    }

    if (props.isDialogToggled) {
      await nextTick()
      await nextTick()

      initMap()
    }
  }
)

const initMap = () => {
  const map = L.map('map').setView([45.031713810137425, 34.76364073905724], 7)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map)

  const existingCoords = busStationValue.value.coords

  if (existingCoords) {
    stationMarker.value = L.marker(JSON.parse(busStationValue.value.coords))

    stationMarker.value.addTo(map)
  }

  map.on('click', (e) => {
    if (stationMarker.value) {
      stationMarker.value.remove(map)
    }

    stationMarker.value = L.marker(e.latlng)

    stationMarker.value.addTo(map)

    busStationValue.value.coords = JSON.stringify([e.latlng.lat, e.latlng.lng])
  })
}

const dialogTitle = computed(() => {
  const action = props.busStationToEdit ? 'Изменить' : 'Добавить'

  return `${action} автостанцию`
})
</script>

<template>
  <Dialog
    :visible="props.isDialogToggled"
    modal
    :style="{ width: '35rem' }"
    :closable="false"
    :draggable="false"
  >
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap text-lg">{{ dialogTitle }}</span>
      </div>
    </template>

    <div class="flex flex-column gap-4 mb-3">
      <div class="flex flex-column gap-2">
        <label for="username">Название и адрес автостанции</label>
        <InputText
          v-model="busStationValue.stationname"
          variant="filled"
          autofocus
          placeholder="Введите название и адрес автостанции"
        />
      </div>
      <div class="flex flex-column gap-2">
        <label for="username">Точка на карте</label>
        <div id="map"></div>
        <small id="username-help">Выберите на карте местоположение автостанции.</small>
      </div>
    </div>

    <template #footer>
      <Button
        v-if="busStationToEdit"
        label="Удалить"
        class="mr-auto"
        outlined
        severity="danger"
        @click="confirmDeletion"
      />
      <Button label="Отмена" text severity="secondary" @click="$emit('dialogue-was-hidden')" />
      <Button label="Сохранить" outlined severity="secondary" @click="save" />
    </template>
  </Dialog>
</template>

<style>
#map {
  height: 300px;
  width: 100%;
}

.leaflet-bottom.leaflet-right {
  display: none;
}
</style>
