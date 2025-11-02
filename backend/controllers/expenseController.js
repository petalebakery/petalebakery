// backend/controllers/expenseController.js
import Expense from "../models/Expense.js";

// 🧾 POST new expense
export const createExpense = async (req, res) => {
  try {
    const { category, description, amount, date, paymentMethod, recurring } = req.body;

    if (!category || !amount)
      return res.status(400).json({ message: "Missing required fields" });

    const expense = new Expense({
      category,
      description,
      amount,
      date: date || new Date(),
      paymentMethod: paymentMethod || "Cash",
      recurring: recurring || false,
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    console.error("Error creating expense:", err);
    res.status(500).json({ message: "Error creating expense", error: err });
  }
};

// 💰 GET all expenses (with optional filters)
export const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (category) query.category = category;

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ message: "Error fetching expenses", error: err });
  }
};

// ✏️ UPDATE expense
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Expense.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated)
      return res.status(404).json({ message: "Expense not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating expense:", err);
    res.status(500).json({ message: "Error updating expense", error: err });
  }
};

// ❌ DELETE expense
export const deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ message: "Error deleting expense", error: err });
  }
};

// 📊 GET monthly expense summary
export const getExpenseSummary = async (_req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id": 1 } },
    ];
    const result = await Expense.aggregate(pipeline);

    res.json(
      result.map((item) => ({
        month: item._id,
        total: item.total,
      }))
    );
  } catch (err) {
    console.error("Error summarizing expenses:", err);
    res.status(500).json({ message: "Error summarizing expenses", error: err });
  }
};
