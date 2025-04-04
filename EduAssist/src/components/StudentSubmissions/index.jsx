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
import { useTheme } from "@mui/material/styles";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const columns = [
  { field: "Subject", width: 200 },
  {
    field: "Submitted on",
    type: "date",
    width: 200,
    valueFormatter: (value) => dateFormatter.format(value),
  },
  {
    field: "Title",
    width: 200,
  },
  {
    field: "Submitted by",
    width: 200,
  },
  {
    field: "Submission",
    width: 220,
    renderCell: (params) => {
      return (
        <a
          href={params.row.docUrl}
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
      );
    },
  },
];

const StudentSubmissions = () => {
  const [filterModel, setFilterModel] = React.useState({
    items: [],
    quickFilterValues: [],
  });
  const [ignoreDiacritics, setIgnoreDiacritics] = React.useState(true);
  const [rows, setRows] = React.useState([]);

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
        console.log(response.submissions);
        setStudentSubmissions(response.submissions);

        const formattedRows = response.submissions.map((submission, index) => {
          return {
            id: index,
            Subject: submission.subject,
            "Submitted on": new Date(submission.createdAt),
            Title: submission.assignmentTitle,
            "Submitted by": submission.studentName,
            docUrl: submission.docUrl,
          };
        });

        setRows(formattedRows);
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
          Student's Submissions
        </Typography>

        <div style={{ width: "100%", height: "fit-content" }}>
          <div style={{ width: "100%", height: "fit-content" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              filterModel={filterModel}
              onFilterModelChange={setFilterModel}
              slots={{ toolbar: GridToolbar }}
              slotProps={{ toolbar: { showQuickFilter: true } }}
              sx={{
                "& .MuiDataGrid-columnHeaders": {
                  borderBottom: "1px solid rgba(224, 224, 224, 1)",
                },
                "& .MuiDataGrid-cell": {
                  borderRight: "1px solid rgba(224, 224, 224, 1)",
                },
              }}
            />
          </div>
        </div>
      </Container>
    </>
  );
};

export default StudentSubmissions;
