// src/layouts/StudentDashboardLayout.jsx

import * as React from "react";
import { useRef, useEffect, useState, useContext, useMemo } from "react";
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
import { toast, Toaster } from "react-hot-toast";
import notificationSound from "../../assets/notification.mp3";
import { Avatar } from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { Link } from "react-router";

const CustomAppTitle = () => (
  <Stack direction="row" alignItems="center" spacing={2}>
    <CloudCircleIcon fontSize="large" color="primary" />
    <Typography variant="h6">EduAssist - Student</Typography>
  </Stack>
);

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

function DemoPageContent({ pathname, receivedMessage }) {
  if (pathname === "/subjects") pathname = "/subjects/deep-learning";

  switch (pathname) {
    case "/dashboard":
      return <StudentDashboard receivedMessage={receivedMessage} />;
    case "/my-submissions":
      return <MySubmissions />;
    case "/communication":
      return <Communication receivedMessage={receivedMessage} />;
    case "/subjects/deep-learning":
      return (
        <Subject
          subjectName="Deep Learning"
          receivedMessage={receivedMessage}
        />
      );
    case "/subjects/compiler-design":
      return (
        <Subject
          subjectName="Compiler Design"
          receivedMessage={receivedMessage}
        />
      );
    case "/subjects/blockchain-technologies":
      return (
        <Subject
          subjectName="Blockchain Technologies"
          receivedMessage={receivedMessage}
        />
      );
    case "/subjects/internet-of-things":
      return (
        <Subject
          subjectName="Internet of Things"
          receivedMessage={receivedMessage}
        />
      );
    default:
      return <StudentDashboard receivedMessage={receivedMessage} />;
  }
}

DemoPageContent.propTypes = {
  pathname: PropTypes.string.isRequired,
  receivedMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};

const StudentDashboardLayout = ({ window, userCredentials }) => {
  const { signoutUser } = useContext(FirebaseContext);
  const [session, setSession] = useState({
    user: {
      name: userCredentials.name,
      email: userCredentials.email,
      image: userCredentials.photo,
    },
  });

  const audioRef = useRef(new Audio(notificationSound));
  const [displayMessage, setDisplayMessage] = useState("");
  const websocket = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;

    audio.addEventListener("canplaythrough", () =>
      console.log("Notification sound ready")
    );
    audio.addEventListener("error", (e) =>
      console.error("Notification sound error:", e)
    );

    return () => {
      audio.removeEventListener("canplaythrough", () => {});
      audio.removeEventListener("error", () => {});
    };
  }, []);

  useEffect(() => {
    websocket.current = new WebSocket("ws://localhost:8080");

    websocket.current.onmessage = (event) => {
      console.log("WebSocket message:", event.data);
      handleMessage(event.data);
    };

    return () => websocket.current?.close();
  }, []);

  const handleMessage = (data) => {
    try {
      if (typeof data === "string") {
        const parsed = JSON.parse(data);
        if (parsed.teacherName && parsed.message) {
          showToast(parsed.teacherName, parsed.message);
          audioRef.current.play();
          setDisplayMessage(JSON.stringify(parsed));
        } else {
          toast.error("Invalid message format.");
          setDisplayMessage(data);
        }
      } else if (data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => handleMessage(reader.result);
        reader.onerror = () => toast.error("Error reading Blob");
        reader.readAsText(data);
      } else if (typeof data === "object") {
        setDisplayMessage(JSON.stringify(data));
        toast("Received object data");
      } else {
        setDisplayMessage(String(data));
        toast("Received non-standard data");
      }
    } catch (err) {
      toast.error("Failed to parse message");
      setDisplayMessage(String(data));
    }
  };

  const showToast = (teacherName, message) => {
    toast.custom(
      () => (
        <Box
          sx={{
            background: "#f9fafb",
            color: "#1f2937",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)",
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 8px 16px rgba(0, 0, 0, 0.12)",
            },
          }}
        >
          <Avatar sx={{ bgcolor: "#3b82f6" }}>
            <NotificationsActiveIcon />
          </Avatar>

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {teacherName}
            </Typography>
            <Typography variant="body2" mt={0.5}>
              {message.length > 60 ? `${message.slice(0, 60)}...` : message}
            </Typography>
          </Box>
        </Box>
      ),
      {
        id: "teacher-message",
        position: "top-center",
        duration: 2000,
      }
    );
  };

  const authentication = useMemo(
    () => ({
      signIn: () => setSession({ user: userCredentials }),
      signOut: () => signoutUser(),
    }),
    [signoutUser, userCredentials]
  );

  const router = useDemoRouter("/dashboard");
  const demoWindow = window ? window() : undefined;

  return (
    <AppProvider
      session={session}
      authentication={authentication}
      navigation={studentNavigation}
      router={router}
      theme={demoTheme}
      window={demoWindow}
    >
      <DashboardLayout slots={{ appTitle: CustomAppTitle }}>
        <Toaster />
        <DemoPageContent
          pathname={router.pathname}
          receivedMessage={displayMessage}
        />
      </DashboardLayout>
    </AppProvider>
  );
};

StudentDashboardLayout.propTypes = {
  window: PropTypes.func,
  userCredentials: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    photo: PropTypes.string,
  }).isRequired,
};

export default StudentDashboardLayout;
