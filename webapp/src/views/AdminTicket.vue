<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import TreeTable from 'primevue/treetable'
import Card from 'primevue/card'
import Column from 'primevue/column'
import Button from 'primevue/button'
import router from '@/router'
import { convertDate } from '@/utils/convertDate'

import CryptoJS from 'crypto-js'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'

const isLoading = ref(false)
const ticketsList = ref([])

onMounted(async () => {
  await fetchTickets()
  await fetchStations()
  await fetchBuses()
})

const fetchTickets = async () => {
  isLoading.value = true

  const { data: ticketsListResponse } = await axios.get('http://localhost:8080/api/ticket')

  ticketsList.value = ticketsListResponse.map(
    ({
      date_string,
      sold_count,
      not_sold_count,
      from_station,
      to_station,
      busnumber,
      bus_manufacturer
    }) => {
      const data = {
        date_string,
        soldData: [sold_count, not_sold_count],
        destination: [from_station, to_station],
        busData: [busnumber, bus_manufacturer]
      }

      return {
        key: date_string,
        data
      }
    }
  )

  isLoading.value = false
}

const fetchStations = async () => {
  const { data } = await axios.get('http://localhost:8080/api/bus-station')

  stationsList.value = data
}

const fetchBuses = async () => {
  const { data } = await axios.get('http://localhost:8080/api/bus')

  busList.value = data
}

const stationsList = ref([])
const busList = ref([])

const addTicketsForm = ref({
  fromstationid: null,
  tostationid: null,
  busnumber: null,
  price: 0,
  date: new Date()
})

const submitTicketData = async () => {

  const payload = {
    ...addTicketsForm.value,
    date: new Date(addTicketsForm.value.date).toISOString()
  }

  await axios.post('http://localhost:8080/api/ticket', payload)

  addTicketsForm.value = {
    fromstationid: null,
    tostationid: null,
    busnumber: null,
    price: 0,
    date: new Date()
  }

  await fetchTickets()
}

const navigateToTicketDetails = ({ date_string, busData }) => {
  const date = date_string
  const busnumber = busData[0]

  const ticketUniqueData = JSON.stringify({ date, busnumber })

  const words = CryptoJS.enc.Utf8.parse(ticketUniqueData)
  const ticketSifer = CryptoJS.enc.Base64.stringify(words)

  router.push({ name: 'admin-ticket-details', params: { ticketSifer } })
}
</script>

<template>
  <div class="page bus-list" :class="{ 'opacity-60': isLoading }">
    <div class="page__header">
      <h1>Список билетов</h1>
    </div>

    <Card>
      <template #content>
        <div class="flex gap-4 mb-3">
          <div class="flex flex-column gap-2 w-4">
            <label for="username">Место отбытия</label>
            <Dropdown
              v-model="addTicketsForm.fromstationid"
              :options="stationsList"
              filter
              optionLabel="stationname"
              optionValue="id"
              class="w-full"
            >
            </Dropdown>
          </div>
          <div class="flex flex-column gap-2 w-4">
            <label for="username">Место прибытия</label>
            <Dropdown
              v-model="addTicketsForm.tostationid"
              :options="stationsList"
              filter
              optionLabel="stationname"
              optionValue="id"
              class="w-full"
            >
            </Dropdown>
          </div>
          <div class="flex flex-column gap-2 w-4">
            <label for="username">Автобус</label>
            <Dropdown
              v-model="addTicketsForm.busnumber"
              :options="busList"
              filter
              optionLabel="busnumber"
              optionValue="busnumber"
              class="w-full"
            >
            </Dropdown>
          </div>
        </div>

        <div class="flex gap-4 mb-3">
          <div class="flex flex-column gap-2">
            <label for="username">Дата отбытия</label>
            <Calendar showTime  v-model="addTicketsForm.date" />
          </div>
          <div class="flex flex-column gap-2">
            <label for="username">Стоимость билета</label>
            <InputNumber v-model="addTicketsForm.price" inputId="stacked-buttons" mode="currency" currency="RUB" />
          </div>
          <div class="flex flex-column gap-2 justify-content-end ml-auto">
            <Button @click="submitTicketData" label="Создать" />
          </div>
        </div>
      </template>
    </Card>
    <div class="card">
      <TreeTable :value="ticketsList">
        <Column field="date_string" sortable header="Дата (отбытие)">
          <template #body="{ node }">
            {{ convertDate(node.data.date_string) }}
          </template>
        </Column>
        <Column field="soldData" sortable header="Места">
          <template #body="{ node }">
            <div>
              <span v-tooltip="'Продано'" class="text-primary">
                {{ node.data.soldData[0] }}
              </span>
              /
              <span v-tooltip="'Не продано (доступные билеты)'" class="text-orange-500">
                {{ node.data.soldData[1] }}
              </span>
            </div>
          </template>
        </Column>
        <Column field="destination" sortable header="Путь">
          <template #body="{ node }">
            <div>
              <span>
                {{ node.data.destination[0] }}
              </span>
              <br />
              <br />
              <span>
                {{ node.data.destination[1] }}
              </span>
            </div>
          </template>
        </Column>
        <Column field="busData" sortable header="Автобус">
          <template #body="{ node }">
            <div>
              <span>
                {{ node.data.busData[1] }} <br />
                ({{ node.data.busData[0] }})
              </span>
            </div>
          </template>
        </Column>
        <Column header="Действия" headerStyle="width: 10rem">
          <template #body="{ node }">
            <div class="flex flex-wrap gap-2">
              <Button
                type="button"
                icon="pi pi-eye"
                rounded
                @click="navigateToTicketDetails(node.data)"
              />
              <!-- <Button type="button" icon="pi pi-trash" rounded severity="danger" /> -->
            </div>
          </template>
        </Column>
      </TreeTable>
    </div>
  </div>
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
