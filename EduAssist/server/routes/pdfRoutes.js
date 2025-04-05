const express = require("express");
const router = express.Router();
const { processGrading } = require("../utils/geminiProcess");
// const { saveToFirebase } = require("../utils/geminiProcess");

router.get("/process", async (req, res) => {
  try {
    const gradedResults = await processGrading();

    // Optional: Save results to Firebase
    // await saveToFirebase(gradedResults);

    res.json({ message: "Processing complete", data: gradedResults });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

module.exports = router;
