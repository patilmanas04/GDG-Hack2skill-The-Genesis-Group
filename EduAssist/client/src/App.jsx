import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import { FirebaseProvider } from "./contexts/FirebaseProvider";
import Signin from "./pages/signin";
import SignUp from "./pages/signup";
import { UserProvider } from "./contexts/UserProvider";
import NoDashboardLayout from "./layouts/NoDashboardLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import { CloudinaryProvider } from "./contexts/CloudinaryContext";

function App() {
  return (
    <>
      <UserProvider>
        <FirebaseProvider>
          <CloudinaryProvider>
            <Router>
              <Routes>
                <Route element={<NoDashboardLayout />}>
                  <Route path="/signin" element={<Signin />} />
                  <Route path="/signup" element={<SignUp />} />
                </Route>

                <Route path="/" element={<DashboardLayout />} />
              </Routes>
            </Router>
          </CloudinaryProvider>
        </FirebaseProvider>
      </UserProvider>
    </>
  );
}

export default App;
