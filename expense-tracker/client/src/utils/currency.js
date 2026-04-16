const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2
});

export const formatCurrency = (value) => inrFormatter.format(value || 0);
