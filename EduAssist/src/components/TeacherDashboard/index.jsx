import React, { useContext, useEffect } from "react";
import {
  Typography,
  CssBaseline,
  Container,
  Button,
  Modal,
  Box,
  FormControl,
  TextField,
  InputLabel,
  Select,
  MenuItem,
  List,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { CloudinaryContext } from "../../contexts/CloudinaryContext";
import AddIcon from "@mui/icons-material/Add";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { FirebaseContext } from "../../contexts/FirebaseProvider";
import { UserContext } from "../../contexts/UserProvider";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CryptoJS from "crypto-js";

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

const TeacherDashboard = () => {
  const cloudinaryContext = React.useContext(CloudinaryContext);
  const { uploadFile, uploading, deleteFile } = cloudinaryContext;
  const firebaseContext = useContext(FirebaseContext);
  const { addAssignment, getAssignments, deleteAssignment } = firebaseContext;
  const userContext = useContext(UserContext);
  const { userCredentials, setUploadedAssignments, uploadedAssignments } =
    userContext;

  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [title, setTitle] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [dueDate, setDueDate] = React.useState(null);
  const [uploadedFile, setUploadedFile] = React.useState(null);

  const [openDialog, setOpenDialog] = React.useState(false);

  const handleClickOpen = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDelete = async (assignmentId, pdfPublicId) => {
    const deleteResult = await deleteFile(pdfPublicId);
    if (!deleteResult.success) {
      alert("Error deleting file. Please try again.");
      return;
    }

    const result = await deleteAssignment(assignmentId);
    if (!result.success) {
      alert("Error deleting assignment. Please try again.");
      return;
    }

    setUploadedAssignments((prevAssignments) =>
      prevAssignments.filter((assignment) => assignment.id !== assignmentId)
    );

    handleCloseDialog();
  };

  useEffect(() => {
    const fetchAssignments = async () => {
      const assignments = await getAssignments(userCredentials.uid);
      setUploadedAssignments(assignments);
    };

    fetchAssignments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title) {
      alert("Please enter a title for the assignment.");
      return;
    }
    if (!subject) {
      alert("Please select a subject for the assignment.");
      return;
    }
    if (!uploadedFile) {
      alert("Please upload a file for the assignment.");
      return;
    }

    setTitle("");
    setSubject("");
    setUploadedFile(null);

    const { pdfUrl, pdfPublicId } = await uploadFile(uploadedFile);
    if (!pdfUrl) {
      alert("File upload failed. Please try again.");
      return;
    }

    const result = await addAssignment(
      title,
      subject,
      dueDate,
      userCredentials.uid,
      userCredentials.name,
      pdfUrl,
      pdfPublicId
    );

    if (!result.success) {
      alert("Error adding assignment. Please try again.");
      return;
    }

    setUploadedAssignments((prevAssignments) => [
      ...prevAssignments,
      {
        createdAt: new Date(),
        title: title,
        subject: subject,
        dueDate: dueDate,
        teacherUid: userCredentials.uid,
        teacherName: userCredentials.name,
        docUrl: pdfUrl,
        pdfPublicId: pdfPublicId,
      },
    ]);

    handleClose();
  };

  const handleChange = (e) => {
    setSubject(e.target.value);
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
          Add Assignment
        </Typography>
        <Button variant="contained" onClick={handleOpen}>
          Click here to add assignment
        </Button>
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Add New Assignment
            </Typography>
            <Box
              component="form"
              sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}
              noValidate
              autoComplete="off"
              onSubmit={handleSubmit}
            >
              <FormControl>
                <TextField
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                  label="Title"
                  id="fullWidth"
                  value={title}
                  required
                />
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">Subject</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={subject}
                  label="Age"
                  onChange={handleChange}
                >
                  <MenuItem value="Deep Learning">Deep Learning</MenuItem>
                  <MenuItem value="Compiler Design">Compiler Design</MenuItem>
                  <MenuItem value="Blockchain Technologies">
                    Blockchain Technologies
                  </MenuItem>
                  <MenuItem value="Internet of Things">
                    Internet of Things
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DemoContainer components={["DatePicker"]}>
                    <DatePicker
                      value={dueDate}
                      label="Due date"
                      sx={{ width: "100%" }}
                      onChange={(newValue) => setDueDate(newValue)}
                    />
                  </DemoContainer>
                </LocalizationProvider>
              </FormControl>
              <FormControl>
                <Typography variant="body1" component="h2" gutterBottom>
                  Upload Assignment Files
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
              {uploading}
              <Button
                type="submit"
                variant="contained"
                sx={{ marginTop: 2 }}
                endIcon={<AddIcon />}
                loading={uploading}
                loadingPosition="end"
              >
                Add assignment
              </Button>
            </Box>
          </Box>
        </Modal>

        <Typography
          variant="h5"
          component="h1"
          gutterBottom
          sx={{ fontWeight: "bold", marginTop: 4 }}
        >
          Uploaded Assignments
        </Typography>
        <List>
          {uploadedAssignments.length === 0 ? (
            <Typography variant="body1" sx={{ marginTop: 2 }}>
              No assignments uploaded yet.
            </Typography>
          ) : (
            uploadedAssignments.map((assignment, index) => (
              <Box sx={{ minWidth: 275, marginBottom: 2 }} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h5" component="div">
                      {assignment.title}
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
                      <Button variant="outlined" startIcon={<OpenInNewIcon />}>
                        View Assignment
                      </Button>
                    </a>
                    <Button
                      variant="contained"
                      onClick={handleClickOpen}
                      endIcon={<DeleteIcon />}
                    >
                      Delete
                    </Button>
                    <Dialog
                      open={openDialog}
                      onClose={handleCloseDialog}
                      aria-labelledby="alert-dialog-title"
                      aria-describedby="alert-dialog-description"
                    >
                      <DialogTitle id="alert-dialog-title">
                        Do you want to delete this assignment?
                      </DialogTitle>
                      <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                          Are you sure you want to delete this assignment? This
                          action cannot be undone.
                        </DialogContentText>
                      </DialogContent>
                      <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                        <Button
                          onClick={() =>
                            handleDelete(assignment.id, assignment.pdfPublicId)
                          }
                          autoFocus
                        >
                          Delete
                        </Button>
                      </DialogActions>
                    </Dialog>
                  </CardActions>
                </Card>
              </Box>
            ))
          )}
        </List>
      </Container>
    </>
  );
};

export default TeacherDashboard;
