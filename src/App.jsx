import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Kanban from "./pages/Kanban";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import NavBar from "./components/NavBar"; // <-- Import your NavBar

function App() {
  return (
    <>
      {/* Always display NavBar */}
      <NavBar />

      {/* Define your routes */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/register"
          element={
            <ProtectedRoute>
              <Register />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kanban"
          element={
            <ProtectedRoute>
              <Kanban />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;
