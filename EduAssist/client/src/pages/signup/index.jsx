import React, { useContext, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import { styled } from "@mui/material/styles";
import { GoogleIcon } from "../../components/signup/CustomIcons";
import { Link, useNavigate } from "react-router";
import { FirebaseContext } from "../../contexts/FirebaseProvider";
import { UserContext } from "../../contexts/UserProvider";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  boxShadow: "0px 5px 15px rgba(0,0,0,0.05)",
  [theme.breakpoints.up("sm")]: { width: "450px" },
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  height: "100vh",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: { padding: theme.spacing(4) },
}));

const SignUp = () => {
  const navigate = useNavigate();
  const firebaseContext = useContext(FirebaseContext);
  const { signupUserWithEmailAndPassword, signInWithGoogle } = firebaseContext;
  const userContext = useContext(UserContext);
  const { setUserCredentials } = userContext;

  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [nameError, setNameError] = useState(false);
  const [nameErrorMessage, setNameErrorMessage] = useState("");

  const validateInputs = () => {
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const name = document.getElementById("name");
    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage("");
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage("Password must be at least 6 characters long.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    if (!name.value) {
      setNameError(true);
      setNameErrorMessage("Name is required.");
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage("");
    }

    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validateInputs()) {
      const data = new FormData(event.currentTarget);

      const result = await signupUserWithEmailAndPassword(
        data.get("name"),
        data.get("email"),
        data.get("password")
      );

      if (result.success) {
        setUserCredentials({
          name: data.get("name"),
          email: data.get("email"),
          photo: "",
          role: "student",
          uid: result.user.uid,
        });

        navigate("/");
      } else {
        alert(result.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await signInWithGoogle();
    if (result.success) {
      setUserCredentials({
        name: result.user.name,
        email: result.user.email,
        photo: result.user.photo,
        role: result.user.role,
        uid: result.user.uid,
      });
      navigate("/");
      console.log("User signed in with Google:", result.user);
    } else {
      alert(result.message);
    }
  };

  return (
    <>
      <CssBaseline enableColorScheme />
      <SignUpContainer direction="column" justifyContent="center">
        <Card variant="outlined">
          <h3>EduAssist</h3>
          <Typography component="h1" variant="h4">
            Sign up
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="name">Full name</FormLabel>
              <TextField
                id="name"
                name="name"
                required
                fullWidth
                error={nameError}
                helperText={nameErrorMessage}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                id="email"
                name="email"
                required
                fullWidth
                error={emailError}
                helperText={emailErrorMessage}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                id="password"
                name="password"
                type="password"
                required
                fullWidth
                error={passwordError}
                helperText={passwordErrorMessage}
              />
            </FormControl>
            <Button type="submit" fullWidth variant="contained">
              Sign up
            </Button>
          </Box>
          <Divider>or</Divider>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
          >
            Sign up with Google
          </Button>
          <Typography sx={{ textAlign: "center" }}>
            Already have an account? <Link to="/signin">Sign in</Link>
          </Typography>
        </Card>
      </SignUpContainer>
    </>
  );
};

export default SignUp;
