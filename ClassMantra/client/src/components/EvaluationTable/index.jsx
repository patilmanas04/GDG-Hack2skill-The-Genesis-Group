import * as React from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { Avatar, Box, Button, Typography } from "@mui/material";
import Popover from "@mui/material/Popover";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import InfoOutlineIcon from "@mui/icons-material/InfoOutline";

const columns = [
  {
    field: "Questions",
    width: 150,
    renderCell: (params) => {
      const [anchorEl, setAnchorEl] = React.useState(null);

      const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
      };

      const handleClose = () => {
        setAnchorEl(null);
      };

      const open = Boolean(anchorEl);
      const id = open ? "simple-popover" : undefined;
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            height: "100%",
          }}
        >
          <Typography variant="body2">Question {params.row.id + 1}</Typography>
          <InfoOutlineIcon
            onClick={handleClick}
            sx={{ marginLeft: 1 }}
            style={{
              cursor: "pointer",
            }}
          />
          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
          >
            <Typography sx={{ p: 2 }}>{params.row.question}</Typography>
          </Popover>
        </Box>
      );
    },
  },
  {
    field: "Accuracy",
    width: 100,
  },
  {
    field: "Relevance",
    width: 100,
  },
  {
    field: "Completeness",
    width: 100,
  },
  {
    field: "Suggestions",
    width: 150,
    renderCell: (params) => {
      const [anchorEl, setAnchorEl] = React.useState(null);

      const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
      };

      const handleClose = () => {
        setAnchorEl(null);
      };

      const open = Boolean(anchorEl);
      const id = open ? "simple-popover" : undefined;
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            height: "100%",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<HelpOutlineOutlinedIcon />}
            onClick={handleClick}
          >
            View
          </Button>
          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            sx={{
              "& .MuiPopover-paper": {
                maxWidth: 400,
                overflowY: "auto",
                maxHeight: 300,
                padding: 2,
                paddingLeft: 3,
                borderRadius: 2,
                boxShadow: 3,
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#888",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  backgroundColor: "#555",
                },
                "&::-webkit-scrollbar-track": {
                  background: "#f1f1f1",
                },
              },
            }}
          >
            <ul
              style={{
                display: "flex",
                flexDirection: "column",
                padding: 2,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {params.row.suggestions.map((suggestion, index) => (
                <li key={index} style={{ marginBottom: 8 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      letterSpacing: 0.5,
                      wordSpacing: 0.5,
                    }}
                  >
                    {suggestion}
                  </Typography>
                </li>
              ))}
            </ul>
          </Popover>
        </Box>
      );
    },
  },
  {
    field: "Score",
    width: 100,
  },
];

const EvaluationTable = (props) => {
  const { evaluatedGrades } = props;

  const [filterModel, setFilterModel] = React.useState({
    items: [],
    quickFilterValues: [],
  });
  const [rows, setRows] = React.useState([]);

  React.useEffect(() => {
    const formattedRows = evaluatedGrades.map((grade, index) => {
      return {
        id: index,
        question: grade.question,
        Accuracy: grade.evaluation.accuracy,
        Relevance: grade.evaluation.relevance,
        Completeness: grade.evaluation.completeness,
        suggestions: grade.improvement_suggestions,
        Score: grade.score,
      };
    });
    setRows(formattedRows);

    console.log("Evaluated Grades:", evaluatedGrades);
    console.log("Rows:", formattedRows);
  }, []);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          disableColumnSelector
          disableDensitySelector
          hideFooter
          slots={{ toolbar: GridToolbar }}
        />
      </div>
    </div>
  );
};

export default EvaluationTable;
