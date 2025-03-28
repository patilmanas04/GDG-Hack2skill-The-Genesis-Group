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

  return (
    <UserContext.Provider
      value={{
        userCredentials,
        setUserCredentials,
        setUploadedAssignments,
        uploadedAssignments,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
