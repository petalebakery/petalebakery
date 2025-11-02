// backend/config/preorder.js

export const PREORDER_CONFIG = {
  leadTimeDays: 2,          // 48 hours minimum
  cutoffHour: 18,           // 6 PM cutoff before earliest eligible day
  defaultCapacityPerWindow: 24,

  // Delivery only (pickup disabled)
  delivery: { enabled: true, flatFee: 5 },
  pickup: { enabled: false },

  // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  blackoutWeekdays: [1, 2], // Closed: Monday & Tuesday

  // Windows vary by day (based on your work schedule)
  windowsByWeekday: {
    0: ["17:00-19:00", "19:00-21:00"],                             // Sunday: after 5 PM
    3: ["10:00-12:00", "12:00-14:00", "14:00-16:00"],              // Wednesday: mid-day
    4: ["08:00-10:00", "10:00-12:00", "13:00-15:00"],              // Thursday
    5: ["08:00-10:00", "10:00-12:00", "13:00-15:00"],              // Friday
    6: ["08:00-10:00", "10:00-12:00", "13:00-15:00"],              // Saturday
  },
};
