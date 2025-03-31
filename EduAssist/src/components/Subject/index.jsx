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
  Modal,
  FormControl,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionActions,
  Avatar,
} from "@mui/material";
import { red } from "@mui/material/colors";
import { styled } from "@mui/material/styles";
import { FirebaseContext } from "../../contexts/FirebaseProvider";
import { UserContext } from "../../contexts/UserProvider";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send";
import { CloudinaryContext } from "../../contexts/CloudinaryContext";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

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

const Subject = (props) => {
  const userContext = useContext(UserContext);
  const {
    userCredentials,
    setUploadedAssignments,
    uploadedAssignments,
    studentSubmissions,
    setStudentSubmissions,
  } = userContext;
  const firebaseContext = useContext(FirebaseContext);
  const { addSubmission, getStudentSubmissions } = firebaseContext;
  const cloudinaryContext = useContext(CloudinaryContext);
  const { uploadFile, uploading } = cloudinaryContext;

  const [subjectWiseAssignments, setSubjectWiseAssignments] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState({});
  const [open, setOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleOpen = (assignment) => {
    setCurrentAssignment(assignment);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

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

    const filteredAssignments = uploadedAssignments.filter((assignment) => {
      return assignment.subject === props.subjectName;
    });

    const filteredSubmissions = filteredAssignments.filter((assignment) => {
      return !studentSubmissions.some(
        (submission) => submission.assignmentId === assignment.id
      );
    });

    setSubjectWiseAssignments(filteredSubmissions);
  }, [props.subjectName, studentSubmissions]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!uploadedFile) {
      alert("Please upload a file for the assignment.");
      return;
    }

    const { pdfUrl } = await uploadFile(uploadedFile, "student");
    if (!pdfUrl) {
      alert("File upload failed. Please try again.");
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
      currentAssignment.docUrl
    );

    if (!result.success) {
      alert(result.message);
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
        answersDocUrl: currentAssignment.docUrl,
      },
    ]);

    handleClose();
    setUploadedFile(null);
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
          {props.subjectName}
        </Typography>
        <List>
          {subjectWiseAssignments.length === 0 ? (
            <Typography variant="h6" component="h2" gutterBottom>
              No assignments available for this subject.
            </Typography>
          ) : (
            subjectWiseAssignments.map((assignment, index) => {
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
                          {new Date(assignment.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ marginLeft: 0.5 }}>
                    <Typography color="text.secondary">
                      Due date:{" "}
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </Typography>
                    <Box>
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
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<CloudUploadIcon />}
                      onClick={() => handleOpen(assignment)}
                      sx={{ marginTop: 2 }}
                      disabled={new Date(assignment.dueDate) < new Date()}
                    >
                      Submit Assignment
                    </Button>
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
      </Container>
    </>
  );
};

export default Subject;
