import {
  Container,
  CssBaseline,
  Typography,
  List,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
} from "@mui/material";
import {
  MaterialReactTable,
  useMaterialReactTable,
  createMRTColumnHelper,
} from "material-react-table";
import React, { useContext, useEffect } from "react";
import { UserContext } from "../../contexts/UserProvider";
import { FirebaseContext } from "../../contexts/FirebaseProvider";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const columnHelper = createMRTColumnHelper();

const columns = [
  columnHelper.accessor("subject", {
    header: "Subject",
  }),
  columnHelper.accessor("assignmentTitle", {
    header: "Assignment Title",
  }),
  columnHelper.accessor("studentName", {
    header: "Submitted by",
  }),
  columnHelper.accessor("createdAt", {
    header: "Submitted on",
  }),
  columnHelper.accessor("docUrl", {
    header: "Submission",
    Cell: ({ cell }) => {
      return (
        <a
          href={cell.getValue()}
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
            sx={{ width: 200 }}
          >
            View Submission
          </Button>
        </a>
      );
    },
  }),
];

const StudentSubmissions = () => {
  const userContext = useContext(UserContext);
  const { userCredentials, studentSubmissions, setStudentSubmissions } =
    userContext;
  const firebaseContext = useContext(FirebaseContext);
  const { getStudentSubmissionsByTeacherUid } = firebaseContext;

  useEffect(() => {
    const fetchSubmissions = async () => {
      const response = await getStudentSubmissionsByTeacherUid(
        userContext.userCredentials.uid
      );
      if (response.success) {
        setStudentSubmissions(response.submissions);
      } else {
        alert(response.message);
      }
    };

    fetchSubmissions();
  }, []);

  const handleExportRows = (rows) => {
    const doc = new jsPDF();
    const data = rows.map((row) => {
      return {
        Subject: row.getValue("subject"),
        "Assignment Title": row.getValue("assignmentTitle"),
        "Submitted by": row.getValue("studentName"),
        "Submitted on": new Date(
          row.getValue("createdAt")
        ).toLocaleDateString(),
      };
    });

    autoTable(doc, {
      head: [["Subject", "Assignment Title", "Submitted by", "Submitted on"]],
      body: data.map((row) => [
        row["Subject"],
        row["Assignment Title"],
        row["Submitted by"],
        row["Submitted on"],
      ]),
    });

    doc.save("student_submissions.pdf");
  };

  const table = useMaterialReactTable({
    columns,
    data: studentSubmissions,
    columnFilterDisplayMode: "popover",
    paginationDisplayMode: "pages",
    positionToolbarAlertBanner: "bottom",
    renderTopToolbarCustomActions: ({ table }) => (
      <Box
        sx={{
          display: "flex",
          gap: "16px",
          padding: "8px",
          flexWrap: "wrap",
        }}
      >
        <Button
          disabled={table.getPrePaginationRowModel().rows.length === 0}
          //export all rows, including from the next page, (still respects filtering and sorting)
          onClick={() =>
            handleExportRows(table.getPrePaginationRowModel().rows)
          }
          startIcon={<FileDownloadIcon />}
        >
          Export All Rows
        </Button>
      </Box>
    ),
  });

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
          Student's Submissions
        </Typography>
        {/* <List>
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
                        Submitted by: {submission.studentName}
                      </Typography>
                      <Typography color="text.secondary">
                        Subject: {submission.subject}
                      </Typography>
                      <Typography color="text.secondary">
                        Submitted on:{" "}
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
        </List> */}
        <MaterialReactTable table={table} />
      </Container>
    </>
  );
};

export default StudentSubmissions;
