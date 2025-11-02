import Order from "../models/Order.js";
import Expense from "../models/Expense.js";

// 📊 Generate financial summary analytics
export const getFinanceSummary = async (req, res) => {
  try {
    const { start, end } = req.query;
    const dateFilter = {};

    if (start && end) {
      dateFilter.createdAt = { $gte: new Date(start), $lte: new Date(end) };
    }

    // ✅ Get orders and expenses
    const orders = await Order.find({ stage: "Delivered", ...dateFilter });
    const expenses = await Expense.find(
      start && end
        ? { date: { $gte: new Date(start), $lte: new Date(end) } }
        : {}
    );

    // 🧮 Calculate totals
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    // 🧾 Count orders
    const ordersCount = orders.length;

    // 📆 Monthly breakdowns
    const monthlyRevenue = {};
    const monthlyExpenses = {};

    orders.forEach((o) => {
      const month = new Date(o.createdAt).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + o.total;
    });

    expenses.forEach((e) => {
      const month = new Date(e.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      monthlyExpenses[month] = (monthlyExpenses[month] || 0) + e.amount;
    });

    res.json({
      totalRevenue,
      totalExpenses,
      netProfit,
      ordersCount,
      monthlyRevenue,
      monthlyExpenses,
    });
  } catch (err) {
    console.error("Error fetching finance summary:", err);
    res.status(500).json({
      message: "Error fetching finance summary",
      error: err.message,
    });
  }
};
