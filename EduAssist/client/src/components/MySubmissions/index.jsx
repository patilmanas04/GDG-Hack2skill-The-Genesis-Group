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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionActions,
  Avatar,
} from "@mui/material";
import { green } from "@mui/material/colors";
import { UserContext } from "../../contexts/UserProvider";
import { FirebaseContext } from "../../contexts/FirebaseProvider";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import Modal from "@mui/material/Modal";
import EvaluationTable from "../EvaluationTable";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import CheckIcon from "@mui/icons-material/Check";
import dateFormatter from "../../utils/DateFormatter";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "fit-content",
  maxWidth: "90%",
  maxHeight: "90%",
  overflowY: "auto",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

const MySubmissions = () => {
  const userContext = useContext(UserContext);
  const { userCredentials, studentSubmissions, setStudentSubmissions } =
    userContext;
  const firebaseContext = useContext(FirebaseContext);
  const { getStudentSubmissions, geminiStatus } = firebaseContext;

  const [currentEvaluation, setCurrentEvaluation] = React.useState(null);

  const [open, setOpen] = React.useState(false);
  const handleOpen = (currentEvaluation) => {
    setCurrentEvaluation(currentEvaluation);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  useEffect(() => {
    const fetchSubmissions = async () => {
      const response = await getStudentSubmissions(userCredentials.uid);
      if (response.success) {
        setStudentSubmissions(response.submissions);
        console.log("Submissions:", response.submissions);
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
                      <Avatar sx={{ bgcolor: green[500] }}>
                        <AssignmentIcon />
                      </Avatar>
                      <Box>
                        <Typography component="span">
                          Assignment Submitted: {submission.assignmentTitle}{" "}
                          {submission.processed ? (
                            <Chip
                              icon={<CheckIcon />}
                              label="Evaluated"
                              color="success"
                              size="small"
                              variant="outlined"
                              sx={{ marginLeft: 0.5 }}
                            />
                          ) : (
                            <Chip
                              icon={
                                <CircularProgress
                                  style={{
                                    marginRight: 0.5,
                                  }}
                                  size={14}
                                />
                              }
                              label="Evaluating..."
                              size="small"
                              sx={{ marginLeft: 0.5, padding: 0.2 }}
                              variant="outlined"
                            />
                          )}
                        </Typography>
                        <Typography color="text.secondary">
                          Submitted on:{" "}
                          {dateFormatter(new Date(submission.createdAt))}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ marginLeft: 0.5 }}>
                    <Typography color="text.secondary">
                      Subject: {submission.subject}
                    </Typography>
                    <Typography color="text.secondary">
                      Grade:{" "}
                      {submission.processed &&
                      submission.overallGrade !== undefined
                        ? submission.overallGrade
                        : "Being calculated....."}
                    </Typography>
                    <Box sx={{ maxWidth: "fit-content", marginTop: 2 }}>
                      <a
                        href={submission.docUrl}
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
                              {submission.assignmentTitle}
                            </Typography>
                          </CardContent>
                        </Card>
                      </a>
                    </Box>
                    {submission.processed && (
                      <Button
                        variant="outlined"
                        sx={{ marginTop: 2 }}
                        onClick={() => handleOpen(submission.evaluatedData)}
                      >
                        View Feedback
                      </Button>
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
                          sx={{ marginBottom: 2 }}
                        >
                          Evaluation Results
                        </Typography>
                        <EvaluationTable evaluatedGrades={currentEvaluation} />
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

export default MySubmissions;
