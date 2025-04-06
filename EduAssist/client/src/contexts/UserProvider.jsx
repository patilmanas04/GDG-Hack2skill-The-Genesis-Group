import { createContext, useState } from "react";

const UserContext = createContext(null);

const UserProvider = ({ children }) => {
  const [userCredentials, setUserCredentials] = useState({
    name: "",
    email: "",
    photo: "",
    role: "",
    uid: "",
  });

  const [uploadedAssignments, setUploadedAssignments] = useState([]);

  const [studentSubmissions, setStudentSubmissions] = useState([]);

  const [evaluatedSubmissions, setEvaluatedSubmissions] = useState([]);

  return (
    <UserContext.Provider
      value={{
        userCredentials,
        setUserCredentials,
        setUploadedAssignments,
        uploadedAssignments,
        studentSubmissions,
        setStudentSubmissions,
        evaluatedSubmissions,
        setEvaluatedSubmissions,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
