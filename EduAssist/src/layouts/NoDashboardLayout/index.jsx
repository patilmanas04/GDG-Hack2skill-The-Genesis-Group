import React from "react";
import { Outlet } from "react-router";

const NoDashboardLayout = () => {
  return (
    <main>
      <Outlet />
    </main>
  );
};

export default NoDashboardLayout;
