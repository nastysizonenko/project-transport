<script setup>
import axios from 'axios'
import L from 'leaflet'
import { computed, nextTick, onMounted, ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import { getLocalString, getHours, convertDate } from '@/utils/convertDate'
import CryptoJS from 'crypto-js'
import QRCode from 'qrcode'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import Dialog from 'primevue/dialog'

import { useAuthStore } from '@/stores/useAuthStore';
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel';

const authStore = useAuthStore();

const toast = useToast()
const confirm = useConfirm()
onMounted(async () => {
  await fetchTickets()
  await fetchStations()

  await nextTick()
  await nextTick()

  initMap()
})

const emit = defineEmits(['toggleLogin'])

const ticketsList = ref([])
const stationsList = ref([])

const fetchStations = async () => {
  const { data } = await axios.get('http://localhost:8080/api/bus-station')

  stationsList.value = data
}

const ticketsListFiltered = computed(() => {
  if (search.value.from || search.value.to) {
    return ticketsList.value.filter(({data}) => {
      return (search.value.from && data.destination[0].toLowerCase().includes(search.value.from.toLowerCase())) || (search.value.to && data.destination[1].toLowerCase().includes(search.value.to.toLowerCase()))
    })
  }

  return ticketsList.value
})

const fetchTickets = async () => {
  const { data: ticketsListResponse } = await axios.get('http://localhost:8080/api/ticket')

  ticketsList.value = ticketsListResponse.map(
    ({
      date_string,
      sold_count,
      not_sold_count,
      from_station,
      from_station_coords,
      to_station,
      to_station_coords,
      busnumber,
      bus_manufacturer
    }) => {
      const data = {
        date_string,
        soldData: [sold_count, not_sold_count],
        destination: [from_station, to_station],
        busData: [busnumber, bus_manufacturer],
        coords: [JSON.parse(from_station_coords), JSON.parse(to_station_coords)]
      }

      return {
        key: date_string,
        data
      }
    }
  )
}

const markers = ref([])
const selectedTicket = ref(null)
const seatsData = ref(null)

const selectedMapControl = ref(null)
const map = ref({})

const fetchSeatsData = async () => {
  const date = selectedTicket.value.date_string
  const busnumber = selectedTicket.value.busData[0]

  const ticketUniqueData = JSON.stringify({ date, busnumber })

  const words = CryptoJS.enc.Utf8.parse(ticketUniqueData)
  const ticketSifer = CryptoJS.enc.Base64.stringify(words)

  const { data } = await axios.get(`http://localhost:8080/api/ticket/${ticketSifer}`)

  seatsData.value = data
}

const initMap = () => {
  map.value = L.map('main-map').setView([45.031713810137425, 34.76364073905724], 8)

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map.value)

  stationsList.value.forEach((station) => {
    const marker = L.marker(JSON.parse(station.coords))

    markers.value.push(marker)

    marker.addTo(map.value)
  })
}

const selectTicket = async ({ data }) => {
  if (selectedMapControl.value) {
    map.value.removeControl(selectedMapControl.value)
  }

  if (L && L.Routing) {
    selectedMapControl.value = L.Routing.control({
      waypoints: data.coords
    })
  
    selectedMapControl.value.addTo(map.value)
  }


  selectedTicket.value = data
  await fetchSeatsData()
}

const qrDialogToggled = ref(false)

const generateQr = (data) => {
  const stringForQr = `
      Маршрут: 
        ${data.destination[0]}
        ${data.destination[1]}
      Автобус:
        ${data.busData[0]}
        ${data.busData[1]}
      Место:
        ${data.seatnumber}
      Дата:
        ${convertDate(data.date_string)}
    `

    const canvas = document.getElementById('canvas')

    QRCode.toCanvas(canvas, stringForQr, { width: 400, height: 400 }, function (error) {
      if (error) console.error(error)
    })
}

const confirmReservation = (event, seat) => {
  if (!authStore.user) {
    emit('toggleLogin')
    return
  }

  if(seat.issold) {
    return
  }

  confirm.require({
    target: event.currentTarget,
    message: 'Вы уверены, что хотите забронировать именно это место?',
    rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
    acceptClass: 'p-button-success p-button-sm',
    rejectLabel: 'Отменить',
    acceptLabel: 'Да',
    accept: async () => {
      toast.add({
        severity: 'success',
        summary: 'Успех',
        detail: `Место успешно забронировано`,
        life: 5000
      })

      qrDialogToggled.value = true

      await axios.post(`http://localhost:8080/api/ticket/book/${seat.id}`, {
        issold: true
      }, { headers: { 'x-access-token': authStore.token, } })

      await nextTick()

      generateQr({
        destination: [
          selectedTicket.value.destination[0],
          selectedTicket.value.destination[1]
        ],
        busData: [
          selectedTicket.value.busData[0],
          selectedTicket.value.busData[1]
        ],
        seatnumber: seat.seatnumber
      })

      await authStore.reVerify()
      await fetchSeatsData()
    }
  })
}

const isProfileModalToggled = ref(false)

const profileTickets = computed(() => {
  if (!authStore.user || !authStore.user.tickets) {
    return null
  }

  return authStore.user.tickets.map(ticket => {
    const qrData = {
      destination: [
        ticket.from_station,
        ticket.to_station
      ],
      busData: [
        ticket.busnumber,
        ticket.bus_manufacturer
      ],
      seatnumber: ticket.seatnumber
    }

    return {
      route: `${ticket.from_station} -> ${ticket.to_station}`,
      date: `${getHours(ticket.date_string)} ${getLocalString(ticket.date_string, true)}`,
      seat: ticket.seatnumber,
      qrData
    }
  })
})

const handleRowClick = async ({data}) => {
  qrDialogToggled.value = true

  await nextTick()

  generateQr(data.qrData)
}

const logout = () => {
  authStore.logout()
  isProfileModalToggled.value = false
}

const search = ref({
  from: '',
  to: ''
})

</script>

<template>
  <Dialog v-model:visible="isProfileModalToggled" header="Мой профиль" modal :draggable="false" :style="{ width: '45rem' }">
    <div v-if="profileTickets && profileTickets.length" class="card">
      <DataTable class="profile-tickets-list" :value="profileTickets" @row-click="handleRowClick">
        <Column field="route" header="Маршрут"></Column>
        <Column field="date" header="Дата"></Column>
        <Column field="seat" header="Место"></Column>
      </DataTable>
    </div>

    <div v-else>
      У вас пока нет забронированных мест
    </div>

    <template #footer>
      <Button label="Выйти" outlined severity="danger" @click="logout" />
    </template>
  </Dialog>

  <Dialog v-model:visible="qrDialogToggled" modal :draggable="false">
    <template #header>
      <div class="inline-flex align-items-center justify-content-center gap-2">
        <span class="font-bold white-space-nowrap text-lg">Ваш QR</span>
      </div>
    </template>

    <canvas id="canvas"></canvas>

    <template #footer>
      <Button label="ОК" outlined severity="secondary" @click="qrDialogToggled = false" />
    </template>
  </Dialog>

  <main class="home-view-page">
    <div class="tickets-panel">
      <Card class="h-full overflow-auto">
        <template #title>
          <div class="flex gap-3 align-items-center justify-content-between">
            <template v-if="selectedTicket">
              <Button @click="selectedTicket = null" icon="pi pi-arrow-left" severity="secondary" />
              {{ selectedTicket.destination[0] }} -> {{ selectedTicket.destination[1] }}
            </template>
            <template v-else>
              Доступные маршруты
              <Button v-if="authStore.user" :label="authStore.user.email" link @click="isProfileModalToggled = true" />
              <Button v-else :label="'Войти'" link @click="$emit('toggleLogin')" />
            </template>
          </div>
        </template>
        <template #content>
          <div v-if="selectedTicket" class="ticket-details">
            <div>
              Время и дата отбытия: <u>{{ convertDate(selectedTicket.date_string) }}</u>
            </div>
            <div class="mt-3">
              Места в автобусе:

              <div v-if="seatsData && seatsData.seats" class="bus-seats mt-3">
                <div
                  v-for="seat in seatsData.seats"
                  :key="seat.id"
                  class="bus-seats__seat"
                  :class="{ 'bus-seats__seat--sold': seat.issold }"
                  @click="confirmReservation($event, seat)"
                >
                  {{ seat.seatnumber }}
                </div>
              </div>
            </div>
          </div>

          <ul v-else class="tickets-list">
            <div class="search flex gap-3">
              <FloatLabel>
                <InputText v-model="search.from" id="searchfrom" />
                <label for="searchfrom">Отбытие</label>
              </FloatLabel>
              <FloatLabel>
                <InputText v-model="search.to" id="searchto" />
                <label for="searchto">Прибытие</label>
              </FloatLabel>
            </div>

            <li v-for="ticket in ticketsListFiltered" :key="ticket.key" @click="selectTicket(ticket)">
              <div class="tickets-list-item__destination">
                <div>
                  {{ ticket.data.destination[0] }}
                  <div class="tickets-list-item__destination-time">
                    {{ getHours(ticket.data.date_string) }}
                  </div>
                </div>
                <div v-html="getLocalString(ticket.data.date_string)"></div>
                <div>
                  {{ ticket.data.destination[1] }}
                  <div class="tickets-list-item__destination-time text-right w-full">
                    {{
                      getHours(
                        new Date(
                          new Date(ticket.data.date_string).getTime() + 6000000
                        ).toISOString()
                      )
                    }}
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </template>
      </Card>
    </div>
    <div id="main-map"></div>
  </main>
</template>

<style>
.profile-tickets-list .p-row-even:hover, .p-row-odd:hover {
  opacity: 1;
  background: rgb(233, 233, 233);
  cursor: pointer;
}

.tickets-list {
  list-style: none;
  padding: 0;
}

.tickets-list li {
  border-bottom: 1px solid #e4e4e4;
  padding: 15px 0 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.tickets-list li:hover {
  opacity: 0.7;
}

.tickets-list-item__destination {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.tickets-list-item__destination-time {
  font-size: 10px;
  color: #383838;
  margin-top: 4px;
}

.tickets-list-item__destination div {
  width: 30%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.tickets-list-item__destination > div:nth-child(2) {
  text-align: center;
  font-size: 11px;
}
.tickets-list-item__destination > div:last-child {
  text-align: right;
}

.tickets-panel {
  z-index: 2;
  position: absolute;
  right: 0;
  width: 30%;
  height: 100%;
}

#main-map {
  width: 70%;
  height: 100%;
  left: 0;
  top: 0;
  position: absolute !important;
  z-index: 1;
  opacity: 1;
}

.leaflet-top.leaflet-right,
.leaflet-bottom.leaflet-right {
  display: none;
}

.home-view-page {
  overflow: hidden;
}

.bus-seats {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  overflow: hidden;
}

.bus-seats__seat {
  width: 10%;
  background: rgb(201, 201, 201);
  height: 50%;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

.bus-seats__seat--sold {
  background: rgba(204, 224, 205, 0.527);
}
</style>
