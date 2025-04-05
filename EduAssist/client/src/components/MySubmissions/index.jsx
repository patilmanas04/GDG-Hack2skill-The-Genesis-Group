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
                          Assignment Submitted: {submission.assignmentTitle}
                        </Typography>
                        <Typography color="text.secondary">
                          Submitted on:{" "}
                          {new Date(submission.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ marginLeft: 0.5 }}>
                    <Typography color="text.secondary">
                      Subject: {submission.subject}
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
                  </AccordionDetails>
                  {/* <AccordionActions>
                    <a
                      href={submission.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "inherit",
                        textDecoration: "none",
                      }}
                    >
                      <Button variant="outlined" startIcon={<OpenInNewIcon />}>
                        View Assignment
                      </Button>
                    </a>
                  </AccordionActions> */}
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
