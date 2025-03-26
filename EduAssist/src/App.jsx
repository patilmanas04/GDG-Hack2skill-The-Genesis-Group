import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import { FirebaseProvider } from "./contexts/FirebaseProvider";
import Signin from "./pages/signin";
import SignUp from "./pages/signup";

function App() {
  return (
    <>
      <FirebaseProvider>
        <Router>
          <Routes>
            <Route path="/" element={<h1>Welcome to EduAssist</h1>} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<SignUp />} />
          </Routes>
        </Router>
      </FirebaseProvider>
    </>
  );
}

export default App;
