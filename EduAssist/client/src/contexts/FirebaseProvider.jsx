import { createContext } from "react";
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getDocs, getFirestore, Timestamp } from "firebase/firestore";
import {
  collection,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

const FirebaseContext = createContext(null);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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

  const signInWithGoogle = async () => {
    const googleProvider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log(result);
      const user = result.user;
      const userDetails = await getUserDetailsByUid(user.uid);

      if (Object.keys(userDetails).length === 0) {
        console.log("User not found in Firestore, creating new user document.");
        const userCredentials = {
          photo: user.photoURL,
          name: user.displayName,
          email: user.email,
          role: "student",
          uid: user.uid,
        };

        const docRef = await addDoc(collection(db, "users"), userCredentials);

        return {
          success: true,
          user: userCredentials,
          message: `User successfully signed in with Google!`,
        };
      }

      return {
        success: true,
        user: userDetails,
        message: `User successfully signed in with Google!`,
      };
    } catch (error) {
      console.log(error);
      if (error.code === "auth/popup-closed-by-user") {
        return {
          success: false,
          message: "Popup closed by user!",
        };
      }
      return {
        success: false,
        message: "Error signing in with Google!",
      };
    }
  };

  const signoutUser = () => {
    auth.signOut();
  };

  const addAssignment = async (
    title,
    subject,
    dueDate,
    teacherUid,
    teacherName,
    docUrl,
    answersDocUrl,
    pdfPublicId,
    answersPdfPublicId
  ) => {
    try {
      const docRef = await addDoc(collection(db, "assignments"), {
        createdAt: new Date().toLocaleDateString(),
        title: title,
        subject: subject,
        dueDate: new Date(dueDate).toLocaleDateString(),
        teacherUid: teacherUid,
        teacherName: teacherName,
        docUrl: docUrl,
        answersDocUrl: answersDocUrl,
        pdfPublicId: pdfPublicId,
        answersPdfPublicId: answersPdfPublicId,
      });

      return {
        success: true,
        message: "Assignment added successfully!",
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: "Error adding assignment!",
      };
    }
  };

  const getAssignments = async (teacherUid) => {
    try {
      const q = query(
        collection(db, "assignments"),
        where("teacherUid", "==", teacherUid)
      );
      const querySnapshot = await getDocs(q);
      let assignments = [];

      querySnapshot.forEach((doc) => {
        assignments.push({ ...doc.data(), id: doc.id });
      });

      return assignments;
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  const getAllAssignments = async () => {
    try {
      const q = query(collection(db, "assignments"));
      const querySnapshot = await getDocs(q);
      let assignments = [];

      querySnapshot.forEach((doc) => {
        assignments.push({ ...doc.data(), id: doc.id });
      });

      assignments.sort((a, b) => {
        return new Date(a.dueDate) - new Date(b.dueDate);
      });

      return {
        success: true,
        assignments: assignments,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error fetching assignments!",
      };
    }
  };

  const getAssignmentsBySubject = async (subject) => {
    try {
      const q = query(
        collection(db, "assignments"),
        where("subject", "==", subject)
      );
      const querySnapshot = await getDocs(q);
      let assignments = [];

      querySnapshot.forEach((doc) => {
        assignments.push({ ...doc.data(), id: doc.id });
      });

      return {
        success: true,
        assignments: assignments,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error fetching assignments!",
      };
    }
  };

  const deleteAssignment = async (assignmentId) => {
    try {
      const docRef = doc(db, "assignments", assignmentId);
      await deleteDoc(docRef);

      return {
        success: true,
        message: "Assignment deleted successfully!",
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: "Error deleting assignment!",
      };
    }
  };

  const addSubmission = async (
    subject,
    studentUid,
    studentName,
    assignmentId,
    assignmentTitle,
    teacherUid,
    docUrl,
    answersDocUrl
  ) => {
    try {
      const docRef = await addDoc(collection(db, "submissions"), {
        createdAt: new Date().toLocaleDateString(),
        subject: subject,
        studentUid: studentUid,
        studentName: studentName,
        assignmentId: assignmentId,
        assignmentTitle: assignmentTitle,
        teacherUid: teacherUid,
        docUrl: docUrl,
        answersDocUrl: answersDocUrl,
      });

      // Add a field in the student document with the name of submittedAssignments which will be an array in which we will push the assignmentId and get the student document where the uid field is equal to studentUid
      const q = query(collection(db, "users"), where("uid", "==", studentUid));
      const querySnapshot = await getDocs(q);
      let studentDocRef = null;

      querySnapshot.forEach((doc) => {
        studentDocRef = doc.ref;
      });

      if (!studentDocRef) {
        throw new Error("Student document not found!");
      }

      const studentData = await getUserDetailsByUid(studentUid);

      const submittedAssignments = studentData.submittedAssignments || [];
      submittedAssignments.push(assignmentId);
      await updateDoc(studentDocRef, {
        submittedAssignments: submittedAssignments,
      });

      return {
        success: true,
        message: "Assignment added successfully!",
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: "Error adding assignment!",
      };
    }
  };

  const getStudentSubmissions = async (studentUid) => {
    try {
      const q = query(
        collection(db, "submissions"),
        where("studentUid", "==", studentUid)
      );
      const querySnapshot = await getDocs(q);
      let submissions = [];

      querySnapshot.forEach((doc) => {
        submissions.push({ ...doc.data(), id: doc.id });
      });

      return {
        success: true,
        submissions: submissions,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error fetching submissions!",
      };
    }
  };

  const getStudentSubmissionsByTeacherUid = async (teacherUid) => {
    try {
      const q = query(
        collection(db, "submissions"),
        where("teacherUid", "==", teacherUid)
      );
      const querySnapshot = await getDocs(q);
      let submissions = [];

      querySnapshot.forEach((doc) => {
        submissions.push({ ...doc.data(), id: doc.id });
      });

      return {
        success: true,
        submissions: submissions,
      };
    } catch (error) {
      return {
        success: false,
        message: "Error fetching submissions!",
      };
    }
  };

  const storeMessage = async (messageData) => {
    try {
      const createdAt = new Date();
      const date = createdAt.toISOString().split("T")[0];

      let hours = createdAt.getHours();
      const minutes = createdAt.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const time = `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;

      const docRef = await addDoc(collection(db, "messages"), {
        ...messageData,
        createdAt: createdAt.toISOString(), // Store full timestamp
        date: date, // Store readable date
        time: time, // Store readable time
      });

      console.log("Message stored with ID: ", docRef.id);
      return {
        success: true,
        messageId: docRef.id,
      };
    } catch (error) {
      console.error("Error storing message: ", error);
      return {
        success: false,
        message: "Error storing message!",
      };
    }
  };

  const fetchAllMessages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "messages"));
      const messages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (messages.length === 0) {
        return {
          success: true,
          messages: [],
          message: "Chat not yet created. New messages will appear here.",
        };
      }

      return {
        success: true,
        messages: messages,
      };
    } catch (error) {
      console.error("Error fetching messages: ", error);
      return {
        success: false,
        messages: [],
        message: "Error fetching messages!",
      };
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        signupUserWithEmailAndPassword,
        signinUserWithEmailAndPassword,
        signInWithGoogle,
        getUserDetailsByUid,
        signoutUser,
        addAssignment,
        getAssignments,
        getAllAssignments,
        getAssignmentsBySubject,
        deleteAssignment,
        addSubmission,
        getStudentSubmissions,
        getStudentSubmissionsByTeacherUid,
        storeMessage,
        fetchAllMessages,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export { FirebaseContext, FirebaseProvider };
