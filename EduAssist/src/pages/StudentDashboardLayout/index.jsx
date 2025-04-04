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
import { toast, Toaster } from "react-hot-toast"; // Import toast and Toaster
import notificationSound from "../../assets/notification.mp3"; // Import your sound file

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

function DemoPageContent({ pathname, receivedMessage }) {
  if (pathname === "/subjects") {
    pathname = "/subjects/deep-learning";
  }
  if (pathname === "/dashboard") {
    return <StudentDashboard receivedMessage={receivedMessage} />;
  }
  if (pathname === "/my-submissions") {
    return <MySubmissions />;
  }
  if (pathname === "/communication") {
    return <Communication receivedMessage={receivedMessage} />;
  }
  if (pathname === "/subjects/deep-learning") {
    return (
      <Subject subjectName="Deep Learning" receivedMessage={receivedMessage} />
    );
  }
  if (pathname === "/subjects/compiler-design") {
    return (
      <Subject
        subjectName="Compiler Design"
        receivedMessage={receivedMessage}
      />
    );
  }
  if (pathname === "/subjects/blockchain-technologies") {
    return (
      <Subject
        subjectName="Blockchain Technologies"
        receivedMessage={receivedMessage}
      />
    );
  }
  if (pathname === "/subjects/internet-of-things") {
    return (
      <Subject
        subjectName="Internet of Things"
        receivedMessage={receivedMessage}
      />
    );
  }
}

DemoPageContent.propTypes = {
  pathname: PropTypes.string.isRequired,
  receivedMessage: PropTypes.oneOfType([PropTypes.string, PropTypes.object]), // Allow string or object
};

const StudentDashboardLayout = (props) => {
  const firebaseContext = useContext(FirebaseContext);
  const { signoutUser } = firebaseContext;
  const { window, userCredentials } = props;

  const audioRef = useRef(new Audio(notificationSound));
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => {
    const currentAudio = audioRef.current; // Store current audio object

    const handleCanPlayThrough = () => {
      setAudioReady(true);
      console.log("Notification sound is ready to play.");
    };

    const handleError = (error) => {
      console.error("Error loading notification sound:", error);
    };

    currentAudio.addEventListener("canplaythrough", handleCanPlayThrough);
    currentAudio.addEventListener("error", handleError);

    return () => {
      currentAudio.removeEventListener("canplaythrough", handleCanPlayThrough);
      currentAudio.removeEventListener("error", handleError);
    };
  }, []);

  const [session, setSession] = useState({
    user: {
      name: userCredentials.name,
      email: userCredentials.email,
      image: userCredentials.photo,
    },
  });

  const [rawReceivedMessage, setRawReceivedMessage] = useState(null); // Store the raw data
  const [displayMessage, setDisplayMessage] = useState("");
  const websocket = useRef(null);

  useEffect(() => {
    setSession({
      user: {
        name: userCredentials.name,
        email: userCredentials.email,
        image: userCredentials.photo,
      },
    });
  }, [userCredentials]);

  useEffect(() => {
    websocket.current = new WebSocket("ws://localhost:8080");

    websocket.current.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    websocket.current.onmessage = (event) => {
      console.log("Received raw data from server:", event.data);
      setRawReceivedMessage(event.data); // Store the raw event data
      processMessage(event.data);
    };

    websocket.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    websocket.current.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, []);

  const showToast = (teacherName, message) => {
    const truncatedMessage =
      message.length > 50 ? message.substring(0, 50) + "..." : message; // Adjust length as needed

    toast.custom(
      (t) => (
        <div
          style={{
            background: "#fff",
            color: "#333",
            borderRadius: "8px",
            padding: "12px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {teacherName}
          </Typography>
          <Typography variant="body2" style={{ marginTop: "4px" }}>
            {truncatedMessage}
          </Typography>
        </div>
      ),
      {
        id: "teacher-message", // Important: Add an ID to prevent duplicates!
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: demoTheme.palette.mode,
        onMount: () => {
          audioRef.current.play();
        },
      }
    );
  };

  const processMessage = (data) => {
    if (typeof data === "string") {
      try {
        const parsedMessage = JSON.parse(data);
        if (
          parsedMessage &&
          parsedMessage.message &&
          parsedMessage.teacherName
        ) {
          showToast(parsedMessage.teacherName, parsedMessage.message);
          audioRef.current.play();
          setDisplayMessage(JSON.stringify(parsedMessage));
        } else {
          setDisplayMessage(data);
          toast.error("Invalid message format received.", {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: demoTheme.palette.mode,
          });
        }
      } catch (error) {
        console.error("Error parsing JSON string:", error);
        setDisplayMessage(data);
        toast.error("Received a non-JSON string.", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: demoTheme.palette.mode,
        });
      }
    } else if (data instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        const blobText = reader.result;
        console.log("Blob content:", blobText);
        try {
          const parsedBlobData = JSON.parse(blobText);
          if (
            parsedBlobData &&
            parsedBlobData.message &&
            parsedBlobData.teacherName
          ) {
            showToast(parsedBlobData.teacherName, parsedBlobData.message);
            setDisplayMessage(blobText); // Or JSON.stringify(parsedBlobData)
          } else {
            setDisplayMessage(blobText);
            toast.info("Received Blob data.", {
              // Use info as it's not an error necessarily
              position: "top-right",
              autoClose: 2000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: demoTheme.palette.mode,
            });
          }
        } catch (parseError) {
          console.error("Error parsing Blob content as JSON:", parseError);
          setDisplayMessage(blobText);
          toast.info("Received Blob data (non-JSON).", {
            // Indicate it's Blob, not necessarily an error
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: demoTheme.palette.mode,
          });
        }
      };
      reader.onerror = (error) => {
        console.error("Error reading Blob:", error);
        setDisplayMessage("[Error reading Blob]");
        toast.error("Error reading received data.", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: demoTheme.palette.mode,
        });
      };
      reader.readAsText(data); // Try to read Blob as text
      return; // Important: Exit here as Blob processing is asynchronous
    } else if (typeof data === "object") {
      try {
        setDisplayMessage(JSON.stringify(data));
        toast.info("Received an object.", {
          // Use info as it's not JSON string
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: demoTheme.palette.mode,
        });
      } catch (error) {
        console.error("Error stringifying object:", error);
        setDisplayMessage("[Object received]");
        toast.error("Received an unexpected object format.", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: demoTheme.palette.mode,
        });
      }
    } else {
      setDisplayMessage(String(data));
      toast("Received data.", {
        // Generic toast for other types
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: demoTheme.palette.mode,
      });
    }
  };

  const authentication = useMemo(() => {
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
  }, [signoutUser, userCredentials]);

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
        <Toaster />
        <DemoPageContent
          pathname={router.pathname}
          receivedMessage={displayMessage}
        />
      </DashboardLayout>
    </AppProvider>
    // preview-end
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
