import axios from "axios";

// 🌷 Automatically use the correct backend URL
const api = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? "http://localhost:10000/api" // when running locally with npm run dev
      : "https://petalebakery.onrender.com/api", // when deployed on Render
});

export default api;
