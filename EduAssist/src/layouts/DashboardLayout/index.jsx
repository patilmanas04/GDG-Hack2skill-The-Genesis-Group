import React, { useContext, useEffect } from "react";
import { UserContext } from "../../contexts/UserProvider";
import TeacherDashboard from "../../pages/TeacherDashboardLayout";
import StudentDashboard from "../../pages/StudentDashboardLayout";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router";
import { FirebaseContext } from "../../contexts/FirebaseProvider";

const auth = getAuth();

const DashboardLayout = () => {
  const navigate = useNavigate();
  const userContext = useContext(UserContext);
  const { userCredentials, setUserCredentials } = userContext;
  const firebaseContext = useContext(FirebaseContext);
  const { getUserDetailsByUid } = firebaseContext;

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;
        const userDetails = await getUserDetailsByUid(uid);

        setUserCredentials({
          name: userDetails.name,
          email: userDetails.email,
          photo: userDetails.photo,
          role: userDetails.role,
          uid: userDetails.uid,
        });
      } else {
        navigate("/signin");
      }
    });
  }, []);

  return userCredentials.role === "teacher" ? (
    <TeacherDashboard userCredentials={userCredentials} />
  ) : (
    <StudentDashboard userCredentials={userCredentials} />
  );
};

export default DashboardLayout;
