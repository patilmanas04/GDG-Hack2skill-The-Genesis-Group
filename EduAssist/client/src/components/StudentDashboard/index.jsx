import React, { useContext, useEffect, useState } from "react";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionActions,
  Avatar,
  Modal,
  FormControl,
  TextField,
  IconButton,
} from "@mui/material";
import { red } from "@mui/material/colors";
import { styled } from "@mui/material/styles";
import { FirebaseContext } from "../../contexts/FirebaseProvider";
import { UserContext } from "../../contexts/UserProvider";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { CloudinaryContext } from "../../contexts/CloudinaryContext";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router";
import SnackbarMessage from "../SnackbarMessage";
import dateFormatter from "../../utils/DateFormatter";
import Alert from "@mui/material/Alert";

const auth = getAuth();

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 3,
};

const StudentDashboard = () => {
  const firebaseContext = useContext(FirebaseContext);
  const {
    getUserDetailsByUid,
    getAllAssignments,
    getStudentSubmissions,
    addSubmission,
    evaluateAssignement,
  } = firebaseContext;
  const userContext = useContext(UserContext);
  const {
    userCredentials,
    setUserCredentials,
    setUploadedAssignments,
    uploadedAssignments,
    studentSubmissions,
    setStudentSubmissions,
  } = userContext;
  const cloudinaryContext = useContext(CloudinaryContext);
  const { uploadFile, uploading } = cloudinaryContext;

  const navigate = useNavigate();

  const [currentAssignment, setCurrentAssignment] = useState({});
  const [open, setOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [alert, setAlert] = useState({
    type: "success",
    message: "",
  });

  const handleOpen = (assignment) => {
    setCurrentAssignment(assignment);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  useEffect(() => {
    const fetchSubmissions = async (uploadedAssignments, studentUid) => {
      const response = await getStudentSubmissions(studentUid);
      if (response.success) {
        setStudentSubmissions(response.submissions);
      } else {
        setAlert({
          type: "error",
          message: response.message,
        });
        setOpenAlert(true);
      }

      const filteredAssignments = uploadedAssignments.filter(
        (assignment) =>
          !response.submissions.some(
            (submission) => submission.assignmentId === assignment.id
          )
      );

      setUploadedAssignments(filteredAssignments);
    };

    const fetchAssignments = async (studentUid) => {
      const response = await getAllAssignments();
      if (response.success) {
        fetchSubmissions(response.assignments, studentUid);
      } else {
        alert(response.message);
      }
    };

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;
        const userDetails = await getUserDetailsByUid(uid);

        fetchAssignments(userDetails.uid);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!uploadedFile) {
      setAlert({
        type: "error",
        message: "Please select a file before submitting.",
      });
      setOpenAlert(true);

      return;
    }

    const { pdfUrl } = await uploadFile(uploadedFile, "student");
    if (!pdfUrl) {
      setAlert({
        type: "error",
        message: "File upload failed. Please try again.",
      });
      setOpenAlert(true);

      return;
    }

    const result = await addSubmission(
      currentAssignment.subject,
      userCredentials.uid,
      userCredentials.name,
      currentAssignment.id,
      currentAssignment.title,
      currentAssignment.teacherUid,
      pdfUrl,
      currentAssignment.answersDocUrl
    );

    if (!result.success) {
      setAlert({
        type: "error",
        message: result.message,
      });
      setOpenAlert(true);

      return;
    }

    setStudentSubmissions((prev) => [
      ...prev,
      {
        createdAt: new Date().toLocaleDateString(),
        subject: currentAssignment.subject,
        studentUid: userCredentials.uid,
        studentName: userCredentials.name,
        assignmentId: currentAssignment.id,
        assignmentTitle: currentAssignment.title,
        teacherId: currentAssignment.teacherUid,
        docUrl: pdfUrl,
        answersDocUrl: currentAssignment.answersDocUrl,
      },
    ]);

    const response = await getAllAssignments();
    if (response.success) {
      const anotherResponse = await getStudentSubmissions(userCredentials.uid);
      if (response.success) {
        setStudentSubmissions(anotherResponse.submissions);
      } else {
        alert(anotherResponse.message);
      }

      const filteredAssignments = response.assignments.filter(
        (assignment) =>
          !anotherResponse.submissions.some(
            (submission) => submission.assignmentId === assignment.id
          )
      );
      setUploadedAssignments(filteredAssignments);
    } else {
      alert(response.message);
    }

    handleClose();
    setUploadedFile(null);

    setAlert({
      type: "success",
      message: "Assignment submitted successfully!",
    });
    setOpenAlert(true);

    // Gemini Evaluation of the assignment
    const evaluateResponse = await evaluateAssignement(
      currentAssignment.id,
      pdfUrl,
      currentAssignment.answersDocUrl
    );

    console.log("5. Evaluated Response: ", evaluateResponse);

    if (evaluateResponse.success) {
      setAlert({
        type: "success",
        message: "Assignment evaluated successfully!",
      });
    } else {
      setAlert({
        type: "error",
        message: evaluateResponse.message,
      });
    }

    setOpenAlert(true);

    setStudentSubmissions((prev) =>
      prev.map((submission) => {
        if (submission.assignmentId === currentAssignment.id) {
          return {
            ...submission,
            evaluatedData: evaluateResponse.gradedResults,
            overallGrade: evaluateResponse.overallGrade,
            processed: evaluateResponse.success,
          };
        }
        return submission;
      })
    );

    console.log("6. Student Submissions: ", studentSubmissions);
    console.log("7. Success Status: ", evaluateResponse.success);
  };

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
                <Accordion sx={{ marginBottom: 2 }} key={index}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    <Box
                      sx={{
                        width: "100%",
                        padding: 0,
                        display: "flex",
                        gap: 2,
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      <Avatar sx={{ bgcolor: red[500] }}>
                        <AssignmentIcon />
                      </Avatar>
                      <Box>
                        <Typography component="span">
                          {assignment.teacherName} posted an assignment:{" "}
                          {assignment.title}
                        </Typography>
                        <Typography color="text.secondary">
                          Posted on:{" "}
                          {dateFormatter(new Date(assignment.createdAt))}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ marginLeft: 0.5 }}>
                    <Typography color="text.secondary">
                      Subject: {assignment.subject}
                    </Typography>
                    <Typography color="text.secondary">
                      Due date: {dateFormatter(new Date(assignment.dueDate))}
                    </Typography>
                    <Box sx={{ maxWidth: "fit-content", marginTop: 2 }}>
                      <a
                        href={assignment.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "inherit",
                          textDecoration: "none",
                        }}
                      >
                        <Card variant="outlined">
                          <CardContent
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1,
                            }}
                          >
                            <PictureAsPdfIcon sx={{ fontSize: 30 }} />
                            <Typography
                              variant="p"
                              component="div"
                              sx={{
                                ":hover": {
                                  textDecoration: "underline",
                                },
                              }}
                            >
                              {assignment.title}
                            </Typography>
                          </CardContent>
                        </Card>
                      </a>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<CloudUploadIcon />}
                      onClick={() => handleOpen(assignment)}
                      sx={{ marginTop: 2 }}
                      disabled={
                        new Date().setHours(0, 0, 0, 0) >
                        new Date(assignment.dueDate).setHours(0, 0, 0, 0)
                      }
                    >
                      Submit Assignment
                    </Button>
                    {new Date().setHours(0, 0, 0, 0) >
                      new Date(assignment.dueDate).setHours(0, 0, 0, 0) && (
                      <Alert severity="error" sx={{ marginTop: 2 }}>
                        This assignment is overdue.
                      </Alert>
                    )}
                    <Modal
                      open={open}
                      onClose={handleClose}
                      aria-labelledby="modal-modal-title"
                      aria-describedby="modal-modal-description"
                    >
                      <Box sx={style}>
                        <Typography
                          id="modal-modal-title"
                          variant="h6"
                          component="h2"
                        >
                          Add New Submission
                        </Typography>
                        <Box
                          component="form"
                          sx={{
                            mt: 2,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                          noValidate
                          autoComplete="off"
                          onSubmit={handleSubmit}
                        >
                          <FormControl>
                            <TextField
                              fullWidth
                              label="Subject"
                              id="fullWidth"
                              value={assignment.subject}
                              required
                              disabled
                            />
                          </FormControl>
                          <FormControl>
                            <Typography
                              variant="body1"
                              component="h2"
                              gutterBottom
                            >
                              Upload Answer File
                            </Typography>
                            <Button
                              component="label"
                              role={undefined}
                              variant="contained"
                              tabIndex={-1}
                              startIcon={<CloudUploadIcon />}
                              onClick={() => setUploadedFile(null)}
                            >
                              Upload files
                              <VisuallyHiddenInput
                                type="file"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    setUploadedFile(file);
                                  }
                                }}
                                required
                                accept=".pdf"
                              />
                            </Button>
                            {uploadedFile && (
                              <Typography variant="body2" sx={{ marginTop: 1 }}>
                                Selected file: {uploadedFile.name}
                              </Typography>
                            )}
                          </FormControl>
                          <Button
                            type="submit"
                            variant="contained"
                            sx={{ marginTop: 2 }}
                            endIcon={<SendIcon />}
                            loading={uploading}
                            loadingPosition="end"
                          >
                            Submit Assignment
                          </Button>
                        </Box>
                      </Box>
                    </Modal>
                  </AccordionDetails>
                </Accordion>
              );
            })
          )}
        </List>
        <SnackbarMessage
          type={alert.type}
          message={alert.message}
          openAlert={openAlert}
          setOpenAlert={setOpenAlert}
        />
      </Container>
    </>
  );
};

export default StudentDashboard;
