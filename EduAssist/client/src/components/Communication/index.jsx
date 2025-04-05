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
} from "@mui/material";
import { ArrowDownward } from "@mui/icons-material";
import { useEffect, useRef, useState, useContext, useCallback } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { socket } from "../../services/websocketServices";
import { v4 as uuidv4 } from "uuid";
import { UserContext } from "../../contexts/UserProvider";
import { FirebaseContext } from "../../contexts/FirebaseProvider";

const Chat = () => {
  const { userCredentials, setUserCredentials } = useContext(UserContext);
  const { getUserDetailsByUid, storeMessage, fetchAllMessages } =
    useContext(FirebaseContext);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Set User on Auth
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const res = await getUserDetailsByUid(user.uid);
        if (res.success) setUserCredentials(res.userDetails);
      }
    });
    return unsubscribe;
  }, []);

  // Fetch Messages
  const loadMessages = useCallback(async () => {
    const res = await fetchAllMessages();
    if (res.success) {
      let msgs = res.messages;
      if (userCredentials.role === "teacher") {
        msgs = msgs.filter((m) => m.senderId === userCredentials.uid);
      }
      msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(groupMessagesByDate(msgs));
    }
  }, [userCredentials]);

  useEffect(() => {
    if (!userCredentials.uid) return;
    loadMessages(); // initial fetch
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // Group by Date
  const groupMessagesByDate = (messages) => {
    const grouped = [];
    let currentDate = null;

    messages.forEach((msg) => {
      const msgDate = msg.createdAt.split("T")[0];

      if (msgDate !== currentDate) {
        currentDate = msgDate;

        // Convert to readable format (e.g., "April 4, 2025")
        const formattedDate = new Date(msgDate).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        grouped.push({ type: "header", text: formattedDate });
      }

      grouped.push({ type: "message", ...msg });
    });

    return grouped;
  };

  // Send Message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const now = new Date().toISOString();
    const msg = {
      messageUid: uuidv4(),
      teacherName: userCredentials.name,
      teacherPhoto: userCredentials.photo || "", // ✅ Add teacher photo here
      senderId: userCredentials.uid,
      createdAt: now,
      message: newMessage,
    };

    socket.send(JSON.stringify(msg));
    setNewMessage("");
    await storeMessage(msg);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Track Scroll Position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 20);
    };

    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Container sx={{ padding: 2 }}>
      <Box textAlign="center" m={1}>
        <Typography variant="h5" fontWeight="bold">
          Academic Advisories
        </Typography>
      </Box>

      <Paper
        ref={messagesContainerRef}
        elevation={3}
        sx={{
          height: "80vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflowY: "auto",
          borderRadius: 2,
          backgroundColor: "transparent",
          position: "relative",
        }}
      >
        <List sx={{ display: "flex", flexDirection: "column" }}>
          {messages.length === 0 ? (
            <ListItem sx={{ justifyContent: "center" }}>
              <Typography
                variant="body2"
                fontStyle="italic"
                color="text.secondary"
              >
                💬 No messages yet — New messages are displayed here...
              </Typography>
            </ListItem>
          ) : (
            messages.map((item, index) =>
              item.type === "header" ? (
                <ListItem
                  key={`header-${index}`}
                  sx={{ justifyContent: "center" }}
                >
                  <Typography variant="caption" fontWeight="bold">
                    {item.text}
                  </Typography>
                </ListItem>
              ) : (
                <ListItem
                  key={item.messageUid}
                  sx={{ alignItems: "flex-start" }}
                >
                  <Avatar
                    src={item.teacherPhoto}
                    sx={{ mr: 2, width: 40, height: 40 }}
                  >
                    {!item.teacherPhoto && item.teacherName?.charAt(0)}
                  </Avatar>

                  <Paper sx={{ padding: 2, borderRadius: 2, maxWidth: "90%" }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      color="#33c6dc"
                    >
                      {item.teacherName}
                    </Typography>
                    <Typography variant="body2">{item.message}</Typography>
                    <Typography
                      variant="caption"
                      textAlign="right"
                      sx={{ display: "block", mt: 1 }}
                    >
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Typography>
                  </Paper>
                </ListItem>
              )
            )
          )}
          <div ref={messagesEndRef} />
        </List>
        {showScrollButton && (
          <IconButton
            onClick={scrollToBottom}
            sx={{
              height: 25,
              width: 25,
              position: "sticky",
              left: "50%",
              bottom: "15%",
              transform: "translateX(-50%)",
              backdropFilter: "blur(5px)",
              border: "1px solid",
              zIndex: 1000,
            }}
          >
            <ArrowDownward
              sx={{
                height: 15,
                width: 15,
              }}
            />
          </IconButton>
        )}
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            padding: 2,
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(0, 0, 0, 0.196)",
            zIndex: 100,
          }}
        >
          {userCredentials.role === "teacher" ? (
            <Box display="flex">
              <TextField
                fullWidth
                multiline
                variant="standard"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message . . .  ( Press Enter to send )"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                maxRows={6}
                sx={{
                  flexGrow: 1,
                  "& .MuiInputBase-root": {
                    paddingY: 1,
                  },
                  "& .MuiInputBase-input": {
                    overflow: "scroll",
                  },
                }}
              />

              <Button
                variant="contained"
                color="primary"
                onClick={sendMessage}
                sx={{ ml: 5, width: "120px" }}
              >
                Send
              </Button>
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center">
              <Typography variant="body2" fontStyle="italic">
                Only teachers can send messages.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Chat;
