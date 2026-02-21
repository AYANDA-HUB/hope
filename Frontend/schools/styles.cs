/* School form */
.school-form {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.school-form input {
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  flex: 1;
  min-width: 120px;
}

.school-form button {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  background-color: #4caf50;
  color: white;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
}

.school-form button:hover {
  background-color: #45a049;
}

/* Schools list */
.schools-list {
  list-style: none;
  padding: 0;
}

.schools-list li {
  padding: 8px 12px;
  margin-bottom: 6px;
  background-color: #f0f0f0;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.schools-list li:hover {
  background-color: #e0e0e0;
}

/* Delete button */
.schools-list li button {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.schools-list li button:hover {
  background-color: #d32f2f;
}
