const express = require("express");
const router = express.Router();
const { processGrading } = require("../utils/geminiProcess");

router.post("/process", async (req, res) => {
  const { studentPdfUrl, teacherPdfUrl } = req.body || {};

  if (!studentPdfUrl || !teacherPdfUrl) {
    return res
      .status(400)
      .json({ error: "Both studentPdfUrl and teacherPdfUrl are required" });
  }

  try {
    const gradedResults = await processGrading(studentPdfUrl, teacherPdfUrl);
    res.json({ message: "Processing complete", data: gradedResults });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

module.exports = router;
