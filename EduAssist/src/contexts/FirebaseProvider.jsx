import { createContext } from "react";
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
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
    pdfPublicId
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
        pdfPublicId: pdfPublicId,
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
      await deleteDoc(doc(db, "assignments", assignmentId));
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
    docUrl
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

  return (
    <FirebaseContext.Provider
      value={{
        signupUserWithEmailAndPassword,
        signinUserWithEmailAndPassword,
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
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export { FirebaseContext, FirebaseProvider };
