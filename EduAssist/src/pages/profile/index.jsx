import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Avatar } from "@mui/material";
import { UserContext } from "../../contexts/UserProvider";
import { FirebaseContext } from "../../contexts/FirebaseProvider";
import { useNavigate } from "react-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const auth = getAuth();

const Profile = () => {
  const navigate = useNavigate();
  const userContext = React.useContext(UserContext);
  const { userCredentials, setUserCredentials } = userContext;
  const firebaseContext = React.useContext(FirebaseContext);
  const { signoutUser, getUserDetailsByUid } = firebaseContext;

  React.useEffect(() => {
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

  return (
    <Card sx={{ minWidth: 275, maxWidth: 400, margin: "auto", marginTop: 10 }}>
      <CardContent sx={{ textAlign: "center" }}>
        <Avatar
          alt="Remy Sharp"
          src={userCredentials.photo}
          sx={{ width: 80, height: 80, margin: "auto", marginBottom: 2 }}
        />
        <Typography variant="h5" component="div">
          {userCredentials.name}
        </Typography>
        <Typography sx={{ color: "text.secondary", mb: 1.5 }}>
          {userCredentials.email}
        </Typography>
        <Typography variant="p" component="div" sx={{ marginTop: -1 }}>
          {userCredentials.role === "teacher" ? "Teacher" : "Student"}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: "center", marginTop: -1 }}>
        <Button size="small" onClick={signoutUser}>
          Sign out
        </Button>
        <Button size="small" onClick={() => navigate("/")}>
          Dashboard
        </Button>
      </CardActions>
    </Card>
  );
};

export default Profile;
