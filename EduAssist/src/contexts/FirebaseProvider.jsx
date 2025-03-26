import { createContext } from "react";
import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
const FirebaseContext = createContext(null);

const firebaseConfig = {
  apiKey: "AIzaSyDCPYzthVcI5O5l_msyxG_PrhiTnfi0ojU",
  authDomain: "eduassist-779d0.firebaseapp.com",
  projectId: "eduassist-779d0",
  storageBucket: "eduassist-779d0.firebasestorage.app",
  messagingSenderId: "357320846330",
  appId: "1:357320846330:web:6a8d9fe94509ce31efd243",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const FirebaseProvider = ({ children }) => {
  const signupUserWithEmailAndPassword = async (name, email, password) => {
    try {
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredentials.user;
      console.log(user);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  return (
    <FirebaseContext.Provider value={{ signupUserWithEmailAndPassword }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export { FirebaseContext, FirebaseProvider };
