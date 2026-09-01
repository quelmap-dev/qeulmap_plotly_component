// src/App.jsx
import BarChart from "./BarChart";
import "./plotly-neo.css";

export default function App() {
  return (
    <div className="dark" style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <BarChart />
    </div>
  );
}