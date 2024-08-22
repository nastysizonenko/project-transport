<script setup>
import { RouterView, useRoute } from 'vue-router'
import AdminMenu from './components/admin/AdminMenu.vue'
import Toast from 'primevue/toast'
import ConfirmPopup from 'primevue/confirmpopup'
import { computed, onMounted, ref } from 'vue';
import Dialog from 'primevue/dialog'
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useAuthStore } from './stores/useAuthStore';

const authStore = useAuthStore();

onMounted(() => {
  if (authStore.token) {
    authStore.reVerify();
  }
});
const route = useRoute()

const isLoginModalToggled = ref(false)

const loginCredentials = ref({
  email: '',
  password: ''
})

const errorText = ref('')

const login = async () => {
  try {
    await authStore.login(loginCredentials.value)
    isLoginModalToggled.value = false
  } catch (error) {
    errorText.value = error.response.data
  }
}

const isAdmin = computed(() => route.path.includes('admin'))

const isRegister = ref(false)
const startRegister = () => {
  errorText.value = ''
  isRegister.value = true
  isLoginModalToggled.value = false
}

const registerData = ref({
  name: '', email: '', password: ''
})

const register = async () => {
  try {
    await authStore.register(registerData.value)
    isRegister.value = false
  } catch (error) {
    errorText.value = error.response.data
  }
}

</script>

<template>
  <Dialog v-model:visible="isRegister" header="Регистрация" modal :closable="true" :draggable="false">
    <div class="flex flex-column gap-2 mb-3">
        <label for="email">E-mail</label>
        <InputText v-model="registerData.email" id="email" />
    </div>

    <div class="flex flex-column gap-2 mb-3">
        <label for="name">Логин</label>
        <InputText v-model="registerData.name" id="name" />
    </div>

    <div class="flex flex-column gap-2">
        <label for="password">Пароль</label>
        <InputText v-model="registerData.password" type="password" id="password" />
    </div>

    <p class="text-red-600" v-if="errorText" style="margin-bottom: -10px">
      {{ errorText }}
    </p>

    <template #footer>
      <Button label="Отменить" outlined severity="secondary" @click="isRegister = false" />
      <Button label="Зарегистрироваться" outlined severity="primary" @click="register" />
    </template>
  </Dialog>

  <Dialog v-model:visible="isLoginModalToggled" header="Вход в систему" modal :closable="true" :draggable="false">
    <div class="flex flex-column gap-2 mb-3">
        <label for="email">E-mail</label>
        <InputText v-model="loginCredentials.email" id="email" />
    </div>

    <div class="flex flex-column gap-2">
        <label for="password">Пароль</label>
        <InputText v-model="loginCredentials.password" type="password" id="password" />
    </div>

    <p class="text-red-600" v-if="errorText" style="margin-bottom: -10px">
      {{ errorText }}
    </p>

    <template #footer>
      <Button label="Регистрация" outlined severity="secondary" @click="startRegister" />
      <Button label="Войти" outlined severity="primary" @click="login" />
    </template>
  </Dialog>

  <div class="app-wrapper">
    <header v-if="isAdmin">
      <AdminMenu />
    </header>

    <router-view v-slot="{ Component }">
      <component :is="Component" @toggleLogin="isLoginModalToggled = true" />
    </router-view>
    <ConfirmPopup></ConfirmPopup>
    <Toast position="bottom-center" />
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
}

#app {
  height: 100vh;
}

.app-wrapper {
  width: 1100px;
  margin: 0 auto;
  height: 100%;
}

.page {
}
.page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
