import axios from "axios";
// import { store } from "../../redux/store";

const api = axios.create({
  // baseURL: "https://sefinternalserver.matzsolutions.com/",
    baseURL: "http://localhost:5000/api",

  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, 
});

// Optional: Add interceptors for auth, logging, errors
// api.interceptors.request.use(
//   (config) => {
//     // For example, attach auth token here
//     // const token = store.getState().auth.user?.token; // Add optional chaining
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   },
//   (error) => {
//     console.log("Request error: ", error);
//     return Promise.reject(error); // Add return
//   }
// );

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("Response error: ", error);

    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please try again.';
    } else if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }

    if (error.response?.status === 401) {
      const message = error.response?.data?.message; // Uncomment this line
      window.location.href = "/";
      // if (message === "Token expired") {
      //   store.dispatch(removeUser());
      //   window.location.href = "/";
      // }
    }

    return Promise.reject(error);
  }
);

export default api;