<script setup>
import { watch, ref, computed } from 'vue'
import axios from 'axios'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import ColorPicker from 'primevue/colorpicker'

import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast';
import { useConfirm } from "primevue/useconfirm";

const toast = useToast();
const confirm = useConfirm();

const props = defineProps({
  isDialogToggled: {
    type: Boolean,
    default: false
  },
  busToEdit: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['dialogue-was-hidden'])

const save = async () => {
  const { data } = props.busToEdit && props.busToEdit.busnumber
    ? await axios.put(`http://localhost:8080/api/bus/${props.busToEdit.busnumber}`, busValue.value)
    : await axios.post('http://localhost:8080/api/bus', busValue.value)

  const toastMsg = props.busToEdit && props.busToEdit.busnumber ? `Автобус с номером "${props.busToEdit.busnumber}" успешно изменён!` : "Автобус успешно добавлен!"

  toast.add({ severity: 'success', summary: 'Успех', detail: toastMsg, life: 5000 });
  emit('dialogue-was-hidden', data)
}

const confirmDeletion = (event) => {
    confirm.require({
        target: event.currentTarget,
        message: 'Все билеты этого автобуса также будут удалены',
        icon: 'pi pi-exclamation-triangle',
        rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
        acceptClass: 'p-button-danger p-button-sm',
        rejectLabel: 'Отменить',
        acceptLabel: 'Удалить',
        accept: async () => {
          await axios.delete(`http://localhost:8080/api/bus/${props.busToEdit.busnumber}`)

          toast.add({ severity: 'success', summary: 'Успех', detail: `Автобус с номером ${props.busToEdit.busnumber} успешно удалён`, life: 5000 });
          emit('dialogue-was-hidden', busValue.value)
        }
    });
};

const busValue = ref({})

watch(
  () => props.isDialogToggled,
  () => {
    if (props.busToEdit) {
      busValue.value = { ...props.busToEdit }
    } else {
      busValue.value = {
        busnumber: null,
        manufacturer: null,
        capacity: null,
        color: '000000'
      }
    }
  }
)

const busModels = ref([
  { name: 'ЛиАЗ-5256' },
  { name: 'ЛиАЗ-5293' },
  { name: 'ЛиАЗ-6213' },
  { name: 'ГАЗ Газель Next A64R42' },
  { name: 'Богдан А-06909' },
  { name: 'Богдан А-70190' },
  { name: 'Богдан А-30251' }
])

const dialogTitle = computed(() => {
  const action = props.busToEdit ? 'Изменить' : 'Добавить'

  return `${action} автобус`
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
        <label for="username">Номер автобуса</label>
        <InputText
          v-model="busValue.busnumber"
          variant="filled"
          autofocus
          :disabled="busToEdit && busToEdit.busnumber"
          placeholder="Введите номер автобуса"
        />
        <small v-if="!busToEdit" id="username-help"
          >Введите корректный номер автобуса — поменять его в дальнейшем будеть нельзя!</small
        >
      </div>

      <div class="flex flex-column gap-2">
        <label for="username">Модель автобуса</label>
        <Dropdown
          v-model="busValue.manufacturer"
          :options="busModels"
          optionLabel="name"
          optionValue="name"
          class="w-full"
          placeholder="Выберите модель автобуса"
        />
      </div>

      <div class="flex flex-row gap-2">
        <div class="flex flex-column gap-2">
          <label for="username">Количество мест</label>
          <InputNumber v-model="busValue.capacity" inputId="minmax" :min="1" :max="40" />
        </div>

        <div class="flex flex-column gap-2">
          <label for="username">Цвет</label>
          <ColorPicker v-model="busValue.color" class="colorpicker" />
        </div>
      </div>
    </div>

    <template #footer>
      <Button v-if="busToEdit" label="Удалить" class="mr-auto" outlined severity="danger" @click="confirmDeletion" />
      <Button label="Отмена" text severity="secondary" @click="$emit('dialogue-was-hidden')" />
      <Button label="Сохранить" outlined severity="secondary" @click="save" />
    </template>
  </Dialog>
</template>

<style scoped>
.colorpicker {
  height: 100%;
}

.colorpicker :deep(.p-colorpicker-preview) {
  height: 100%;
  width: 100%;
}
</style>
