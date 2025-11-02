import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    // 📂 Category (e.g. Ingredients, Packaging, Equipment, etc.)
    category: {
      type: String,
      required: [true, "Expense category is required"],
      trim: true,
    },

    // 📝 Optional description of the expense
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
      default: "",
    },

    // 💵 Amount spent
    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [0, "Amount cannot be negative"],
    },

    // 📅 Date of expense
    date: {
      type: Date,
      default: Date.now,
    },

    // 💳 Payment method
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "Transfer", "Other"],
      default: "Cash",
    },

    // 🔁 Recurring (for rent, utilities, subscriptions)
    recurring: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
