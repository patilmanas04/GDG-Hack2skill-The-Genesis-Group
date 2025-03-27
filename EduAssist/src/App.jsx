import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import { FirebaseProvider } from "./contexts/FirebaseProvider";
import Signin from "./pages/signin";
import SignUp from "./pages/signup";
import { UserProvider } from "./contexts/UserProvider";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/profile";

function App() {
  return (
    <>
      <UserProvider>
        <FirebaseProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/signin" element={<Signin />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Router>
        </FirebaseProvider>
      </UserProvider>
    </>
  );
}

export default App;
