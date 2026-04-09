import React from "react";

export default function ExpenseList({ items, onDelete }) {
  if (!items.length) {
    return <div className="empty">No expenses yet. Add your first one!</div>;
  }

  return (
    <div className="expense-list">
      {items.map((expense) => (
        <div className="expense-card" key={expense._id}>
          <div>
            <h4>{expense.title}</h4>
            <p className="meta">{expense.category} · {new Date(expense.date).toLocaleDateString()}</p>
            {expense.note ? <p className="note">{expense.note}</p> : null}
          </div>
          <div className="amount">
            <span>${expense.amount.toFixed(2)}</span>
            <button className="ghost" onClick={() => onDelete(expense._id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
