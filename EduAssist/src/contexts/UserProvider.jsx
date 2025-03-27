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

  return (
    <UserContext.Provider value={{ userCredentials, setUserCredentials }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
