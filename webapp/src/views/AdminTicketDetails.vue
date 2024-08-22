<script setup>
import { convertDate } from '@/utils/convertDate'
import axios from 'axios'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Card from 'primevue/card'
import Timeline from 'primevue/timeline'

const route = useRoute()

const ticketData = ref(null)

onMounted(async () => {
  const { ticketSifer } = route.params

  const { data } = await axios.get(`http://localhost:8080/api/ticket/${ticketSifer}`)

  ticketData.value = data
})
</script>

<template>
  <div class="page page-admin-ticket-data">
    <Card v-if="ticketData">
      <template #title>Информация о рейсе</template>
      <template #content>
        <div class="mb-4">
          Автобус: <b>{{ ticketData.bus_manufacturer }}</b
          >, номер - <b>{{ ticketData.busnumber }}</b>
        </div>

        <Timeline
          :value="[
            { station: ticketData.from_station, date: convertDate(ticketData.date_string) },
            {
              station: ticketData.to_station,
              date: convertDate(
                new Date(new Date(ticketData.date_string).getTime() + 6000000).toISOString()
              )
            }
          ]"
        >
          <template #opposite="slotProps">
            <small class="p-text-secondary">{{ slotProps.item.date }}</small>
          </template>
          <template #content="slotProps">
            {{ slotProps.item.station }}
          </template>
        </Timeline>
      </template>
    </Card>

    <Card v-if="ticketData">
      <template #title>Места в автобусе</template>
      <template #content>
        <div class="bus-seats">
          <div
            v-for="seat in ticketData.seats"
            :key="seat.id"
            class="bus-seats__seat"
            :class="{ 'bus-seats__seat--sold': seat.issold }"
            v-tooltip.bottom="
              seat.issold
                ? 'Место куплено или забронировано'
                : 'Место не куплено и не забронировано'
            "
          >
            {{ seat.seatnumber }}
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<style>
h1 {
  font-weight: 400;
}

.bus-seats {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding: 30px;
  padding-left: 100px;
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

.page-admin-ticket-data {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
