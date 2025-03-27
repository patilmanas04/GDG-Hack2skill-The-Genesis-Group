import { createContext } from "react";
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getDocs, getFirestore } from "firebase/firestore";
import { collection, addDoc, query, where } from "firebase/firestore";

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
const db = getFirestore(app);

const FirebaseProvider = ({ children }) => {
  const getUserDetailsByUid = async (uid) => {
    let userDetails = {};
    const q = query(collection(db, "users"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      userDetails = doc.data();
    });
    return userDetails;
  };

  const signupUserWithEmailAndPassword = async (name, email, password) => {
    try {
      let success = false;
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredentials.user;

      success = true;

      const docRef = await addDoc(collection(db, "users"), {
        photo: "https://cdn-icons-png.flaticon.com/128/847/847969.png",
        name: name,
        email: email,
        role: "student",
        uid: user.uid,
      });

      return {
        success,
        user,
        message: `User successfully created!`,
      };
    } catch (error) {
      return {
        success: false,
        message: "User already exists!",
      };
    }
  };

  const signinUserWithEmailAndPassword = async (email, password) => {
    try {
      let success = false;
      const userCredentials = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredentials.user;

      success = true;

      const userDetails = await getUserDetailsByUid(user.uid);

      return {
        success,
        user: userDetails,
        message: `User successfully signed in!`,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: "Invalid email or password!",
      };
    }
  };

  const signoutUser = () => {
    auth.signOut();
  };

  return (
    <FirebaseContext.Provider
      value={{
        signupUserWithEmailAndPassword,
        signinUserWithEmailAndPassword,
        getUserDetailsByUid,
        signoutUser,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export { FirebaseContext, FirebaseProvider };
