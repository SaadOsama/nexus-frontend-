import axios from "axios";
import { store } from "../../redux/store";
import { logout } from "../../redux/slices/userSlice";

const BASE_URL =  "https://iccdinternalsystemserver.matzsolutions.com/api";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
  
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("iccd_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // FormData requests (file uploads) must NOT carry a forced
    // "application/json" Content-Type — axios needs to set its own
    // "multipart/form-data; boundary=..." header for the file to be
    // parsed correctly by multer on the backend. Without this, req.body
    // arrives empty/unparsed server-side even though the request "succeeds"
    // on the client — every Joi field then shows up as "required".
    //
    // NOTE: axios v1.x's config.headers is an AxiosHeaders instance, not a
    // plain object — `delete config.headers["Content-Type"]` (bracket
    // notation) doesn't reliably remove it there (case-normalization means
    // the header can survive the delete and axios still force-serializes
    // the FormData as JSON). config.headers.delete(...) is the version that
    // actually works on AxiosHeaders; the bracket-notation delete is kept
    // only as a fallback for older axios (<1.0) where headers is a plain
    // object without a .delete method.
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers && typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type");
      } else {
        delete config.headers["Content-Type"];
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      store.dispatch(logout());
    }

    if (status === 403) {
      console.error("Access Forbidden:", error.response?.data?.message);
    }

    if (status === 500) {
      console.error("Server Error:", error.response?.data?.message);
    }

    return Promise.reject(error?.response?.data || error);
  }
);

export default axiosInstance;