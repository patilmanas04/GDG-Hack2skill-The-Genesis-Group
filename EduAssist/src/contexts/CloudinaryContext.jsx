import { createContext, useState } from "react";
import CryptoJS from "crypto-js";

const CloudinaryContext = createContext(null);

const CloudinaryProvider = ({ children }) => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file, role) => {
    if (!file) {
      alert("Please select a file before uploading.");
      return null;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      role === "teacher"
        ? "assignment_pdf_upload_preset"
        : "submission_pdf_upload_preset"
    );

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/raw/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      return { pdfUrl: data.secure_url, pdfPublicId: data.public_id };
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("File upload failed. Try again.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (pdfPublicId) => {
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
      const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

      const timestamp = Math.floor(Date.now() / 1000);
      const stringToSign = `public_id=${pdfPublicId}&timestamp=${timestamp}${apiSecret}`;
      const signature = CryptoJS.SHA1(stringToSign).toString();

      const formData = new FormData();
      formData.append("public_id", pdfPublicId);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/raw/destroy`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      return {
        success: data.result === "ok",
        message:
          data.result === "ok"
            ? "File deleted successfully!"
            : "File deletion failed.",
      };
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("File deletion failed. Try again.");
    }
  };

  return (
    <CloudinaryContext.Provider value={{ uploadFile, uploading, deleteFile }}>
      {children}
    </CloudinaryContext.Provider>
  );
};

export { CloudinaryContext, CloudinaryProvider };
