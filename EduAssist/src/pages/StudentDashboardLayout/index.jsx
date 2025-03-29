import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import { Stack } from "@mui/material";
import Typography from "@mui/material/Typography";
import { createTheme } from "@mui/material/styles";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ClassIcon from "@mui/icons-material/Class";
import CloudCircleIcon from "@mui/icons-material/CloudCircle";
import { AppProvider } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { useDemoRouter } from "@toolpad/core/internal";
import { FirebaseContext } from "../../contexts/FirebaseProvider";
import BallotIcon from "@mui/icons-material/Ballot";
import ConnectWithoutContactIcon from "@mui/icons-material/ConnectWithoutContact";
import PsychologyIcon from "@mui/icons-material/Psychology";
import CodeIcon from "@mui/icons-material/Code";
import CurrencyBitcoinIcon from "@mui/icons-material/CurrencyBitcoin";
import SensorsIcon from "@mui/icons-material/Sensors";
import StudentDashboard from "../../components/StudentDashboard";
import MySubmissions from "../../components/MySubmissions";
import Communication from "../../components/Communication";
import Subject from "../../components/Subject";

const CustomAppTitle = () => {
  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      <CloudCircleIcon fontSize="large" color="primary" />
      <Typography variant="h6">EduAssist - Student</Typography>
    </Stack>
  );
};

const studentNavigation = [
  {
    segment: "dashboard",
    title: "Dashboard",
    icon: <DashboardIcon />,
  },
  {
    segment: "my-submissions",
    title: "My Submissions",
    icon: <ClassIcon />,
  },
  {
    segment: "communication",
    title: "Communication",
    icon: <ConnectWithoutContactIcon />,
  },
  {
    segment: "subjects",
    title: "Subjects",
    icon: <BallotIcon />,
    children: [
      {
        segment: "deep-learning",
        title: "Deep Learning",
        icon: <PsychologyIcon />,
      },
      {
        segment: "compiler-design",
        title: "Compiler Design",
        icon: <CodeIcon />,
      },
      {
        segment: "blockchain-technologies",
        title: "Blockchain Technologies",
        icon: <CurrencyBitcoinIcon />,
      },
      {
        segment: "internet-of-things",
        title: "Internet of Things",
        icon: <SensorsIcon />,
      },
    ],
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
  if (pathname === "/subjects") {
    pathname = "/subjects/deep-learning";
  }
  if (pathname === "/dashboard") {
    return <StudentDashboard />;
  }
  if (pathname === "/my-submissions") {
    return <MySubmissions />;
  }
  if (pathname === "/communication") {
    return <Communication />;
  }
  if (pathname === "/subjects/deep-learning") {
    return <Subject subjectName="Deep Learning" />;
  }
  if (pathname === "/subjects/compiler-design") {
    return <Subject subjectName="Compiler Design" />;
  }
  if (pathname === "/subjects/blockchain-technologies") {
    return <Subject subjectName="Blockchain Technologies" />;
  }
  if (pathname === "/subjects/internet-of-things") {
    return <Subject subjectName="Internet of Things" />;
  }
}

DemoPageContent.propTypes = {
  pathname: PropTypes.string.isRequired,
};

const StudentDashboardLayout = (props) => {
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

  React.useEffect(() => {
    setSession({
      user: {
        name: userCredentials.name,
        email: userCredentials.email,
        image: userCredentials.photo,
      },
    });
  }, [userCredentials]);

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
      navigation={studentNavigation}
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

export default StudentDashboardLayout;
