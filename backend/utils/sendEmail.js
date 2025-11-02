import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail", // or "hotmail" / "yahoo" depending on your email
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOrderEmail = async (to, orderData) => {
  const { products, total, deliveryDate, deliveryTime, address } = orderData;

  const productList = products
    .map(
      (p) => `<li>${p.quantity} × ${p.name} — $${p.price.toFixed(2)}</li>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;padding:20px;background:#fff3f7;border-radius:10px;">
      <h2 style="color:#e94b77;">🧁 Thank you for your order, from Petalé Bakery!</h2>
      <p>Your order will be delivered on <b>${new Date(
        deliveryDate
      ).toLocaleDateString()}</b> between <b>${deliveryTime}</b>.</p>
      <h3>Order Details:</h3>
      <ul>${productList}</ul>
      <p><b>Total:</b> $${total.toFixed(2)}</p>
      <p>Delivery Address:</p>
      <p>${address.street}, ${address.city} ${address.zip}</p>
      <p style="margin-top:20px;">With love, <br/>Petalé Bakery Team 💕</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Petalé Bakery" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Petalé Bakery Order Confirmation 💐",
    html,
  });
};
