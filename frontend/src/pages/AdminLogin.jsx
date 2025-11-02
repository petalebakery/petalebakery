import { useState } from "react";
import axios from "../api";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/admin/login", { username, password });
      localStorage.setItem("adminToken", res.data.token);
      setMessage("✅ Login successful!");
      setTimeout(() => navigate("/admin/dashboard"), 1000);
    } catch (err) {
      setMessage("❌ Invalid credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-rose mb-6">Admin Login 🧁</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border rounded-lg px-4 py-2"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-lg px-4 py-2"
            required
          />
          <button
            type="submit"
            className="bg-rose text-white py-2 px-6 rounded-md hover:bg-softpink hover:text-rose transition"
          >
            Log In
          </button>
        </form>
        {message && <p className="mt-4 text-gray-700">{message}</p>}
      </div>
    </div>
  );
}
