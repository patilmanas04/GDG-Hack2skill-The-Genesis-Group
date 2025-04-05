import React, { useEffect, useContext, useRef } from "react";
import { UserContext } from "./UserProvider";
import { useNotification } from "./NotificationContext";

export const WebSocketContext = React.createContext();

export const WebSocketProvider = ({ children }) => {
  const { userCredentials } = useContext(UserContext);
  const { showNotification } = useNotification();
  const socketRef = useRef(null);
  const websocketUrl = "http://localhost:8080"; // Your backend WebSocket URL

  useEffect(() => {
    if (userCredentials?.uid && !socketRef.current) {
      socketRef.current = new WebSocket(websocketUrl);
      console.log("WebSocket connecting...");

      socketRef.current.onopen = () => {
        console.log("WebSocket connection established.");
        // Send user identification to the server
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(
            JSON.stringify({
              type: "identify",
              userId: userCredentials.uid,
              role: userCredentials.role,
            })
          );
        }
      };

      socketRef.current.onmessage = (event) => {
        try {
          const parsedMessage = JSON.parse(event.data);

          if (parsedMessage.type === "new_message") {
            if (
              userCredentials.role === "student" &&
              parsedMessage.senderId !== userCredentials.uid
            ) {
              showNotification(
                `New message from ${parsedMessage.senderId}: ${parsedMessage.message}`
              );
            }
          } else if (parsedMessage.type === "error") {
            console.error(
              "WebSocket Error from Server:",
              parsedMessage.message
            );
          } else {
            // Handle other message types if your server sends them
            console.log("Received other message type:", parsedMessage);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      socketRef.current.onclose = () => {
        console.log("WebSocket connection closed.");
        socketRef.current = null;
      };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    }

    return () => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.close();
      }
      socketRef.current = null;
    };
  }, [
    userCredentials?.uid,
    userCredentials?.role,
    showNotification,
    websocketUrl,
  ]);

  const sendMessage = (messageContent, recipientType, recipientId) => {
    if (
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN &&
      userCredentials?.uid
    ) {
      socketRef.current.send(
        JSON.stringify({
          type: "send_message",
          senderId: userCredentials.uid,
          messageContent: messageContent,
          recipientType: recipientType,
          recipientId: recipientId,
        })
      );
    } else {
      console.error(
        "WebSocket is not open or user not identified. Cannot send message."
      );
    }
  };

  return (
    <WebSocketContext.Provider value={{ sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
