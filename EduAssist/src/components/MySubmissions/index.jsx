import React, { useContext, useEffect } from "react";
import {
  CssBaseline,
  Typography,
  Container,
  List,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
} from "@mui/material";
import { UserContext } from "../../contexts/UserProvider";
import { FirebaseContext } from "../../contexts/FirebaseProvider";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const MySubmissions = () => {
  const userContext = useContext(UserContext);
  const { userCredentials, studentSubmissions, setStudentSubmissions } =
    userContext;
  const firebaseContext = useContext(FirebaseContext);
  const { getStudentSubmissions } = firebaseContext;

  useEffect(() => {
    const fetchSubmissions = async () => {
      const response = await getStudentSubmissions(userCredentials.uid);
      if (response.success) {
        setStudentSubmissions(response.submissions);
      } else {
        alert(response.message);
      }
    };

    fetchSubmissions();
  }, []);

  return (
    <>
      <CssBaseline />
      <Container maxWidth="100%" sx={{ padding: 2 }}>
        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          sx={{ fontWeight: "bold", marginBottom: 2 }}
        >
          Your Submissions
        </Typography>
        <List>
          {studentSubmissions.length === 0 ? (
            <Typography variant="h6" component="h2" gutterBottom>
              No submissions found.
            </Typography>
          ) : (
            studentSubmissions.map((submission, index) => {
              return (
                <Box sx={{ minWidth: 275, marginBottom: 2 }} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h5" component="div">
                        {submission.assignmentTitle}
                      </Typography>
                      <Typography color="text.secondary">
                        Subject: {submission.subject}
                      </Typography>
                      <Typography color="text.secondary">
                        Uploaded on:{" "}
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ padding: 2, marginTop: -2 }}>
                      <a
                        href={submission.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "inherit",
                          textDecoration: "none",
                        }}
                      >
                        <Button
                          variant="outlined"
                          startIcon={<OpenInNewIcon />}
                        >
                          View Submission
                        </Button>
                      </a>
                    </CardActions>
                  </Card>
                </Box>
              );
            })
          )}
        </List>
      </Container>
    </>
  );
};

export default MySubmissions;
