import React, { useState, useEffect } from "react";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { Snackbar, Slide } from "@mui/material";
import PropTypes from "prop-types";

const Notification = ({ message, open, onClose }) => {
  const [localOpen, setLocalOpen] = useState(open);


  useEffect(() => {
    if (localOpen && message) {
      const timer = setTimeout(() => {
        setLocalOpen(false);
        if (onClose) {
          onClose();
        }
      }, 1000);
      return () => clearTimeout(timer); // Cleanup the timer if the component unmounts or `open` changes
    }
  }, [localOpen, message, onClose]);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setLocalOpen(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <Snackbar
      open={localOpen && !!message}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      TransitionComponent={Slide}
      message={message}
      action={
        <React.Fragment>
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </React.Fragment>
      }
      sx={{
        position: "absolute",
        top: (theme) => theme.spacing(2),
        right: (theme) => theme.spacing(2),
        zIndex: 1500, // Ensure it's above other elements
      }}
    />
  );
};

Notification.propTypes = {
  message: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
};

export default Notification;
