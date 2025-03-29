import React, { useContext, useEffect } from "react";
import {
  CssBaseline,
  Container,
  Typography,
  List,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
} from "@mui/material";
import { FirebaseContext } from "../../contexts/FirebaseProvider";
import { UserContext } from "../../contexts/UserProvider";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const StudentDashboard = () => {
  const firebaseContext = useContext(FirebaseContext);
  const { getAllAssignments, getStudentSubmissions } = firebaseContext;
  const userContext = useContext(UserContext);
  const {
    userCredentials,
    setUploadedAssignments,
    uploadedAssignments,
    setStudentSubmissions,
  } = userContext;

  useEffect(() => {
    const fetchSubmissions = async (uploadedAssignments) => {
      const response = await getStudentSubmissions(userCredentials.uid);
      if (response.success) {
        setStudentSubmissions(response.submissions);
      } else {
        alert(response.message);
      }

      const filteredAssignments = uploadedAssignments.filter(
        (assignment) =>
          !response.submissions.some(
            (submission) => submission.assignmentId === assignment.id
          )
      );
      setUploadedAssignments(filteredAssignments);
    };

    const fetchAssignments = async () => {
      const response = await getAllAssignments();
      if (response.success) {
        setUploadedAssignments(response.assignments);
        fetchSubmissions(response.assignments);
      } else {
        alert(response.message);
      }
    };

    fetchAssignments();
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
          Pending Assignments
        </Typography>
        <List>
          {uploadedAssignments.length === 0 ? (
            <Typography variant="h6" component="h2" gutterBottom>
              No pending assignments.
            </Typography>
          ) : (
            uploadedAssignments.map((assignment, index) => {
              return (
                <Box sx={{ minWidth: 275, marginBottom: 2 }} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h5" component="div">
                        {assignment.title}
                      </Typography>
                      <Typography color="text.secondary">
                        Teacher: {assignment.teacherName}
                      </Typography>
                      <Typography color="text.secondary">
                        Subject: {assignment.subject}
                      </Typography>
                      <Typography color="text.secondary">
                        Uploaded on:{" "}
                        {new Date(assignment.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography color="text.secondary">
                        Due date:{" "}
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ padding: 2, marginTop: -2 }}>
                      <a
                        href={assignment.docUrl}
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
                          View Assignment
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

export default StudentDashboard;
