import { useEffect, useState, useRef, useContext } from "react";
import { socket } from "../../services/websocketServices";
import {
  Container,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  Box,
  Typography,
  Avatar,
  IconButton,
  Snackbar, // Import Snackbar for notification display
  Alert, // Import Alert for styling the notification
} from "@mui/material";
import { ArrowDownward } from "@mui/icons-material";
import { UserContext } from "../../contexts/UserProvider";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FirebaseContext } from "../../contexts/FirebaseProvider";
import { v4 as uuidv4 } from "uuid";

const Chat = () => {
  // State to manage the list of messages, new message input, and scroll button visibility.
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Refs to access the message container and the end of the message list for scrolling.
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Contexts for user credentials and Firebase operations.
  const { userCredentials, setUserCredentials } = useContext(UserContext);
  const { getUserDetailsByUid, storeMessage, fetchAllMessages } =
    useContext(FirebaseContext);

  // Ref to store the previous length of the messages array for detecting new messages.
  const prevMessagesLength = useRef(0);

  // Fetch user details on authentication state change.
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDetailsResult = await getUserDetailsByUid(user.uid);
        if (userDetailsResult.success) {
          setUserCredentials({
            name: userDetailsResult.userDetails.name,
            email: userDetailsResult.userDetails.email,
            photo: userDetailsResult.userDetails.photo,
            role: userDetailsResult.userDetails.role,
            uid: userDetailsResult.userDetails.uid,
          });
        } else {
          console.error(
            "Error getting user details:",
            userDetailsResult.message
          );
        }
      }
    });
    return () => unsubscribe(); // Cleanup the listener.
  }, []);

  // Fetch messages from Firebase and update the message list.
  useEffect(() => {
    const fetchMessages = async () => {
      const messagesResult = await fetchAllMessages();
      if (messagesResult.success) {
        let filteredMessages = messagesResult.messages;
        if (userCredentials.role === "teacher") {
          filteredMessages = filteredMessages.filter(
            (msg) => msg.senderId === userCredentials.uid
          );
        }

        // Sort messages by time.
        filteredMessages.sort((a, b) => {
          const timeA = parseTimeString(a.time);
          const timeB = parseTimeString(b.time);
          return timeA - timeB;
        });

        // Group messages by date.
        const grouped = groupMessagesByDate(filteredMessages);
        setMessages([...grouped]); // Reverse the order to show the latest messages at the bottom.
      } else {
        console.error("Error fetching messages:", messagesResult.message);
      }
    };
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 5000); // Auto-reload messages every 5 seconds.
    return () => clearInterval(intervalId); // Cleanup the interval.
  }, [userCredentials.role, userCredentials.uid]);

  // Process incoming socket messages and update the message list.
  const processMessage = (message) => {
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch {
      parsedMessage = {
        message,
        teacherName: "Unknown",
        createdAt: new Date().toISOString(),
        senderId: "unknown",
      };
    }

    const isNewMessage =
      messages.findIndex(
        (msg) => msg.messageUid === parsedMessage.messageUid
      ) === -1;

    if (
      userCredentials.role === "student" ||
      parsedMessage.senderId === userCredentials.uid
    ) {
      setMessages((prev) => [...prev, parsedMessage]);
    }

    // Show browser notification if the user is a student and notifications are granted.
    if (
      userCredentials.role === "student" &&
      Notification.permission === "granted" &&
      isNewMessage &&
      parsedMessage.senderId !== userCredentials.uid
    ) {
      new Notification("New Message", {
        body: parsedMessage.message,
        icon: "/chat-icon.png",
      }).onclick = () => window.focus();
    }
  };

  // Listen for socket messages.
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => processMessage(reader.result);
        reader.readAsText(event.data);
      } else {
        processMessage(event.data);
      }
    };

    socket.onmessage = handleMessage;
    return () => {
      socket.onmessage = null; // Cleanup the listener.
    };
  }, [userCredentials.role, userCredentials.uid, messages]); // Added messages to dependency array

  // Send a new message.
  const sendMessage = async () => {
    if (newMessage.trim()) {
      const messageObject = {
        messageUid: uuidv4(),
        teacherName: userCredentials.name,
        message: newMessage,
        senderId: userCredentials.uid,
      };
      socket.send(JSON.stringify(messageObject));
      setNewMessage("");
      await storeMessage(messageObject);
    }
  };

  // Scroll to the bottom when a new message is added.
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLength.current = messages.length; // Update the previous length.
  }, [messages]);

  // Parse time string into a Date object for sorting.
  const parseTimeString = (timeString) => {
    const [time, period] = timeString.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let date = new Date();
    date.setHours(period === "PM" && hours !== 12 ? hours + 12 : hours);
    date.setMinutes(minutes);
    return date;
  };

  // Group messages by date.
  const groupMessagesByDate = (messages) => {
    const groupedMessages = [];
    let currentDate = null;

    messages.forEach((msg) => {
      const messageDate = msg.date;

      if (messageDate !== currentDate) {
        currentDate = messageDate;

        let headerText = messageDate;
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
          .toISOString()
          .split("T")[0];

        if (messageDate === today) {
          headerText = "Today";
        } else if (messageDate === yesterday) {
          headerText = "Yesterday";
        }

        groupedMessages.push({
          type: "header",
          date: messageDate,
          text: headerText,
        });
      }

      groupedMessages.push({ type: "message", ...msg });
    });

    return groupedMessages;
  };

  // Handle scroll event to show/hide and reposition the scroll-to-bottom button.
  useEffect(() => {
    const handleScroll = () => {
      if (messagesContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          messagesContainerRef.current;

        // Show button when scrolled up, hide when at the bottom
        setShowScrollButton(scrollTop + clientHeight < scrollHeight - 50);
      }
    };

    if (messagesContainerRef.current) {
      messagesContainerRef.current.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.removeEventListener(
          "scroll",
          handleScroll
        );
      }
    };
  }, []);

  // Scroll to the bottom of the message list.
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Container sx={{ padding: "20px" }}>
      <Box>
        <Typography variant="h5" fontWeight="bold" mb={2} textAlign={"center"}>
          Academic Advisories
          {/* add description */}
          <Typography
            variant="body2"
            color="gray"
            fontStyle="italic"
            sx={{ mt: 1 }}
          >
            Welcome to Academic Advisories! Find crucial updates and information
            here to help you succeed in our class. Check often to stay on track.
          </Typography>
        </Typography>
      </Box>

      <Paper
        elevation={3}
        sx={{
          height: "60vh",
          overflowY: "auto",
          padding: 2,
          borderRadius: 2,
          backgroundColor: "transparent",
          position: "relative",
        }}
        ref={messagesContainerRef}
      >
        <List
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "flex-end",
          }}
        >
          {messages.map((item, index) => {
            if (item.type === "header") {
              return (
                <ListItem
                  key={`header-${index}`}
                  sx={{ width: "100%", justifyContent: "center" }}
                >
                  <Typography variant="caption" sx={{ fontWeight: "bold" }}>
                    {item.text} ({item.date})
                  </Typography>
                </ListItem>
              );
            } else {
              return (
                <ListItem
                  key={item.messageUid}
                  sx={{ display: "flex", alignItems: "start", marginBottom: 1 }}
                >
                  <Avatar
                    src={userCredentials.photo}
                    sx={{ width: 40, height: 40, marginRight: 2 }}
                  >
                    {!userCredentials.photo &&
                      item.teacherName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Paper
                    sx={{
                      padding: 2,
                      borderTopLeftRadius: 2,
                      borderTopRightRadius: 15,
                      borderBottomLeftRadius: 15,
                      borderBottomRightRadius: 15,
                      width: "auto",
                      maxWidth: "90%",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      color="#33c6dc"
                    >
                      {item.teacherName}
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: "justify" }}>
                      {item.message}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      textAlign="right"
                      margin={"10px 0 -5px 0"}
                    >
                      {item.time}
                    </Typography>
                  </Paper>
                </ListItem>
              );
            }
          })}
          <div ref={messagesEndRef} />
        </List>

        {/* Scroll-to-bottom button. */}
        {showScrollButton && (
          <IconButton
            onClick={scrollToBottom}
            sx={{
              height: "30px",
              width: "30px",
              position: "sticky",
              bottom: showScrollButton ? "10px" : "0",
              borderRadius: "50%",
              zIndex: 1000,
              float: "right",
              transition: "bottom 0.3s ease",
              border: "1px solid ",
              backdropFilter: "blur(5px)",
              backgroundColor: "rgba(255, 255, 255, 0.17)",
              opacity: 0.5,
            }}
          >
            <ArrowDownward
              sx={{
                height: "20px",
                width: "20px",
              }}
            />
          </IconButton>
        )}
      </Paper>

      {/* Input area for teachers. */}
      {userCredentials.role === "teacher" ? (
        <Box display="flex" mt={2}>
          <TextField
            fullWidth
            variant="outlined"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={sendMessage}
            sx={{ marginLeft: 2 }}
          >
            Send
          </Button>
        </Box>
      ) : (
        <Typography
          variant="body2"
          color="gray"
          textAlign="center"
          mt={2}
          fontStyle="italic"
          cursor="default"
        >
          Only teachers can send messages.
        </Typography>
      )}
    </Container>
  );
};

export default Chat;
