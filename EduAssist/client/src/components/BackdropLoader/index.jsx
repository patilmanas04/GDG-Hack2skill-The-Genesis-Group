import React from "react";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

const BackdropLoader = (props) => {
  const { open } = props;

  return (
    <Backdrop
      sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 999 })}
      open={open}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

export default BackdropLoader;
