import { useEffect, useState } from "react";
import axios from "../../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function FinancesPage() {
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: "",
    category: "",
    notes: "",
    date: new Date().toISOString().substring(0, 10),
  });
  const [toast, setToast] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(true);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, expensesRes] = await Promise.all([
          axios.get("/orders"),
          axios.get("/expenses"),
        ]);
        setOrders(ordersRes.data);
        setExpenses(
          expensesRes.data.sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          )
        );
      } catch {
        showToast("Failed to load financial data.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.name.trim() || !newExpense.amount) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    const expenseData = {
      name: newExpense.name.trim(),
      amount: Number(newExpense.amount),
      date: newExpense.date,
      category: newExpense.category || "General",
      notes: newExpense.notes || "",
    };

    try {
      const res = await axios.post("/expenses", expenseData);
      setExpenses([res.data, ...expenses]);
      setNewExpense({
        name: "",
        amount: "",
        category: "",
        notes: "",
        date: new Date().toISOString().substring(0, 10),
      });
      showToast("Expense added successfully!", "success");
    } catch (err) {
      console.error("❌ Expense POST failed:", err.response?.data || err.message);
      showToast("Failed to add expense. Please check your input.", "error");
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await axios.delete(`/expenses/${id}`);
      setExpenses(expenses.filter((e) => e._id !== id));
      showToast("Expense deleted.", "success");
    } catch {
      showToast("Failed to delete expense.", "error");
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-cream text-chocolate animate-fade-in">
        <div className="animate-spin h-10 w-10 border-4 border-rose border-t-transparent rounded-full mb-4"></div>
        <p className="text-lg font-medium">Loading finances...</p>
      </div>
    );

  // Totals
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalTips = orders.reduce((sum, o) => sum + (o.tip || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const grandRevenue = totalSales + totalTips;
  const netProfit = grandRevenue - totalExpenses;

  // Monthly Chart Data
  const monthlyData = {};
  orders.forEach((o) => {
    const month = new Date(o.createdAt).toLocaleString("default", { month: "short", year: "numeric" });
    const revenue = o.total + (o.tip || 0);
    monthlyData[month] = monthlyData[month] || { month, revenue: 0, expense: 0 };
    monthlyData[month].revenue += revenue;
  });
  expenses.forEach((e) => {
    const month = new Date(e.date).toLocaleString("default", { month: "short", year: "numeric" });
    monthlyData[month] = monthlyData[month] || { month, revenue: 0, expense: 0 };
    monthlyData[month].expense += e.amount;
  });
  const chartData = Object.values(monthlyData).map((d) => ({
    ...d,
    profit: d.revenue - d.expense,
  }));

  return (
    <div className="min-h-screen bg-cream p-8 sm:p-12">
      <h1 className="text-4xl font-bold text-center text-darkbrown mb-10 tracking-wide">
        Financial Overview
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
        <Card title="Sales" value={`$${totalSales.toFixed(2)}`} color="text-green-600" />
        <Card title="Tips" value={`$${totalTips.toFixed(2)}`} color="text-pink-500" />
        <Card title="Expenses" value={`-$${totalExpenses.toFixed(2)}`} color="text-red-500" />
        <Card title="Net Profit" value={`$${netProfit.toFixed(2)}`} color="text-chocolate" />
      </div>

      {/* Chart Section */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl p-8 mb-12 transition hover:shadow-2xl">
        <h2 className="text-2xl font-semibold text-rose mb-6 text-center">
          Monthly Revenue vs Expenses
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="month" stroke="#a67c68" />
            <YAxis stroke="#a67c68" />
            <Tooltip contentStyle={{ borderRadius: "12px" }} />
            <Legend />
            <Bar dataKey="revenue" fill="#e88983" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="expense" fill="#d3a386" radius={[4, 4, 0, 0]} name="Expenses" />
            <Bar dataKey="profit" fill="#9c6a56" radius={[4, 4, 0, 0]} name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Log */}
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-lg transition hover:shadow-2xl">
        <h2 className="text-2xl font-semibold text-chocolate mb-6 text-center">
          Expense Management
        </h2>

        <form
          onSubmit={addExpense}
          className="flex flex-col md:grid md:grid-cols-5 gap-4 mb-6"
        >
          <input
            type="text"
            placeholder="Expense Name"
            value={newExpense.name}
            onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-rose col-span-2"
            required
          />
          <input
            type="number"
            placeholder="Amount"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-rose"
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={newExpense.category}
            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-rose"
          />
          <input
            type="date"
            value={newExpense.date}
            onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-rose"
          />
          <button
            type="submit"
            className="bg-darkbrown text-cream px-6 py-2 rounded-lg hover:bg-[#3a2416] transition"
          >
            Add
          </button>
        </form>

        <textarea
          placeholder="Notes (optional)"
          value={newExpense.notes}
          onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
          className="border border-gray-300 rounded-lg p-2 w-full mb-6 h-20 focus:outline-none focus:ring-2 focus:ring-rose"
        ></textarea>

        {expenses.length === 0 ? (
          <p className="text-center text-gray-600 italic">No expenses logged yet.</p>
        ) : (
          <table className="w-full border-collapse text-sm overflow-hidden rounded-lg">
            <thead>
              <tr className="bg-darkbrown text-cream text-left">
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">Category</th>
                <th className="py-2 px-4">Notes</th>
                <th className="py-2 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, i) => (
                <tr
                  key={e._id}
                  className={`border-b border-gray-200 ${
                    i % 2 === 0 ? "bg-cream/40" : "bg-white"
                  } hover:bg-rose/10 transition`}
                >
                  <td className="py-2 px-4">
                    {new Date(e.date).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4">{e.name}</td>
                  <td className="py-2 px-4 text-gray-700">
                    {e.category || "—"}
                  </td>
                  <td className="py-2 px-4 text-gray-500 truncate max-w-[150px]">
                    {e.notes || "—"}
                  </td>
                  <td className="py-2 px-4 text-right text-red-500 font-medium">
                    -${e.amount.toFixed(2)}
                    <button
                      onClick={() => deleteExpense(e._id)}
                      className="ml-3 text-gray-400 hover:text-red-700 text-sm transition"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Toast Notification */}
      {toast.message && (
        <div
          className={`fixed bottom-6 right-6 text-white px-5 py-3 rounded-lg shadow-lg animate-fade-in-up ${
            toast.type === "error"
              ? "bg-red-600"
              : toast.type === "success"
              ? "bg-green-600"
              : "bg-rose"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function Card({ title, value, color = "text-rose" }) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-6 text-center hover:shadow-lg transition-transform hover:-translate-y-1">
      <h2 className="text-lg font-semibold text-gray-600">{title}</h2>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
  );
}
