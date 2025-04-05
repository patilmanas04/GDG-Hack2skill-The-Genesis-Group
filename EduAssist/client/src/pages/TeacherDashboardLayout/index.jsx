import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import { Stack } from "@mui/material";
import Typography from "@mui/material/Typography";
import { createTheme } from "@mui/material/styles";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CloudCircleIcon from "@mui/icons-material/CloudCircle";
import { AppProvider } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { useDemoRouter } from "@toolpad/core/internal";
import { FirebaseContext } from "../../contexts/FirebaseProvider";
import ConnectWithoutContactIcon from "@mui/icons-material/ConnectWithoutContact";
import TeacherDashboard from "../../components/TeacherDashboard";
import StudentSubmissions from "../../components/StudentSubmissions";
import CampaignIcon from "@mui/icons-material/Campaign";
import Communication from "../../components/Communication";

const CustomAppTitle = () => {
  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <CloudCircleIcon fontSize="large" color="primary" />
      <Typography variant="h6">EduAssist - Teacher</Typography>
    </Stack>
  );
};

const teacherNavigation = [
  {
    segment: "dashboard",
    title: "Dashboard",
    icon: <DashboardIcon />,
  },
  {
    segment: "student-submissions",
    title: "Student Submissions",
    icon: <AssignmentIcon />,
  },
  {
    segment: "announcements",
    title: "Announcements",
    icon: <CampaignIcon />,
  },
];

const demoTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data-toolpad-color-scheme",
  },
  colorSchemes: { light: true, dark: true },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 600,
      lg: 1200,
      xl: 1536,
    },
  },
});

function DemoPageContent({ pathname }) {
  if (pathname === "/dashboard") {
    return <TeacherDashboard />;
  } else if (pathname === "/student-submissions") {
    return <StudentSubmissions />;
  } else if (pathname === "/announcements") {
    return <Communication />;
  }
}

DemoPageContent.propTypes = {
  pathname: PropTypes.string.isRequired,
};

const TeacherDashboardLayout = (props) => {
  const firebaseContext = React.useContext(FirebaseContext);
  const { signoutUser } = firebaseContext;
  const { window, userCredentials } = props;

  const [session, setSession] = React.useState({
    user: {
      name: userCredentials.name,
      email: userCredentials.email,
      image: userCredentials.photo,
    },
  });

  const authentication = React.useMemo(() => {
    return {
      signIn: () => {
        setSession({
          user: {
            name: userCredentials.name,
            email: userCredentials.email,
            image: userCredentials.photo,
          },
        });
      },
      signOut: () => {
        signoutUser();
      },
    };
  }, []);

  const router = useDemoRouter("/dashboard");

  // Remove this const when copying and pasting into your project.
  const demoWindow = window !== undefined ? window() : undefined;

  return (
    // preview-start
    <AppProvider
      session={session}
      authentication={authentication}
      navigation={teacherNavigation}
      router={router}
      theme={demoTheme}
      window={demoWindow}
    >
      <DashboardLayout
        slots={{
          appTitle: CustomAppTitle,
        }}
      >
        <DemoPageContent pathname={router.pathname} />
      </DashboardLayout>
    </AppProvider>
    // preview-end
  );
};

export default TeacherDashboardLayout;
