import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('jwt') || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async register(userDetails) {
      try {
        const response = await axios.post('http://localhost:8080/api/user/register', userDetails);
        const { token, user } = response.data;

        // Сохраняем токен в localStorage и обновляем состояние
        localStorage.setItem('jwt', token);
        this.token = token;
        this.user = user;
      } catch (error) {
        console.error('Произошла ошибка при регистрации пользователя:', error.response.data);
        throw error;
      }
    },
    async login(credentials) {
      try {
        const response = await axios.post('http://localhost:8080/api/user/login', credentials);
        const { token } = response.data;

        // Сохраняем токен в localStorage и обновляем состояние
        localStorage.setItem('jwt', token);
        this.token = token;


        const responseProfile = await axios.get('http://localhost:8080/api/user/profile', {
          headers: {
            'x-access-token': token,
          },
        });

        this.user = responseProfile.data;
      } catch (error) {
        console.error('Произошла ошибка при входе в систему:', error.response.data);
        throw error;
      }
    },
    async reVerify() {
      const token = this.token;
      
      if (!token) {
        return;
      }

      try {
        // Устанавливаем токен в заголовке для запроса верификации
        const response = await axios.get('http://localhost:8080/api/user/verify-token', {
          headers: {
            'x-access-token': token,
          },
        });

        // Предполагается, что ответ содержит данные пользователя
        this.user = response.data;
      } catch (error) {
        console.error('Не удалось проверить токен:', error.response.data);
        // Обрабатываем случай с недействительным токеном, например, выходом пользователя из системы
        this.logout();
      }
    },
    logout() {
      // Удаляем токен из localStorage и очищаем состояние
      localStorage.removeItem('jwt');
      this.$reset();
    }
  },
});