const axios = require("axios");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

// required variables

const PDF_DIR = "./uploads";
const PDF_PATH = "./uploads/student_answers.pdf";
const TEACHER_PDF_PATH = "./uploads/teacher_answers.pdf";

// Initialize Firebase
admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Download PDF
async function downloadPDF(url, path) {
  try {
    // Ensure directory exists
    if (!fs.existsSync(PDF_DIR)) {
      fs.mkdirSync(PDF_DIR, { recursive: true });
    }

    if (fs.existsSync(path) && fs.lstatSync(path).isFile()) {
      fs.unlinkSync(path);
    }

    const response = await axios({ url, responseType: "stream" });
    const writer = fs.createWriteStream(path);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    throw new Error(`Failed to download PDF: ${error.message}`);
  }
}

// Extract Text from PDF
async function extractTextFromPDF(pdfPath) {
  if (!fs.existsSync(pdfPath) || !fs.lstatSync(pdfPath).isFile()) return "";
  const dataBuffer = fs.readFileSync(pdfPath);
  const parsedData = await pdfParse(dataBuffer);
  return parsedData.text;
}

// Process Text into Q&A Format
function extractQA(text) {
  const qaPairs = [];
  const lines = text.split("\n");
  let currentQuestion = null;
  let currentAnswer = [];
  const questionRegex =
    /^\s*(Q(?:uestion)?[\s.:]*)?(\d+)[).:\s-]*\s*(.+?)\s*$/i;
  const answerStartRegex = /^\s*Answer[\s.:]*\s*/i;
  let isAnswering = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (line === "") continue;

    // Detect start of new question
    const qMatch = line.match(questionRegex);
    if (qMatch && !line.match(answerStartRegex)) {
      if (currentQuestion && currentAnswer.length > 0) {
        qaPairs.push({
          question: currentQuestion,
          answer: currentAnswer.join("\n").trim(),
        });
      }
      currentQuestion = `${qMatch[2]}. ${qMatch[3].trim()}`;
      currentAnswer = [];
      isAnswering = false;
      continue;
    }

    // Detect explicit answer line
    if (answerStartRegex.test(line)) {
      isAnswering = true;
      const cleanLine = line.replace(answerStartRegex, "").trim();
      if (cleanLine) currentAnswer.push(cleanLine);
      continue;
    }

    // Accumulate answer if we are in answer mode or if no explicit "Answer:" but still reading answer
    if (currentQuestion) {
      currentAnswer.push(line);
    }
  }

  // Push the last pair if exists
  if (currentQuestion && currentAnswer.length > 0) {
    qaPairs.push({
      question: currentQuestion,
      answer: currentAnswer.join("\n").trim(),
    });
  }

  return qaPairs;
}

// Compare Answers with Gemini AI
async function gradeAnswers(studentQA, teacherQA) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const results = [];

  for (let i = 0; i < studentQA.length; i++) {
    const studentAnswer = studentQA[i]?.answer || "";
    const teacherAnswer = teacherQA[i]?.answer || "";
    const question = studentQA[i]?.question || `Question ${i + 1}`;

    const prompt = `
You are an expert examiner tasked with evaluating a student's answer based on a teacher's model answer.

## Inputs:
1. Teacher's Answer (Reference Answer):
"${teacherAnswer}"

2. Student's Answer (Submitted Response):
"${studentAnswer}"

## Evaluation Criteria (Score out of 10):
- Accuracy (4 points)
- Relevance (3 points)
- Completeness (3 points)

## Output Instructions:
- Return only valid JSON (no markdown or explanations)
- All string values must be quoted properly
- Decimal scores only (e.g., 2.5, 3.33)
- Provide a grade out of 10 and breakdown of each category
- Provide 2 improvement suggestions

## JSON Output Format:
{
  "question": "${question}",
  "teacher_answer": "${teacherAnswer}",
  "student_answer": "${studentAnswer}",
  "grade": X,
  "evaluation": {
    "accuracy": X,
    "relevance": X,
    "completeness": X
  },
  "improvement_suggestions": [
    "Suggestion 1",
    "Suggestion 2"
  ]
}

# after analyzing all content give them overall score out of 100. 
    `;

    try {
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      let raw =
        response?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // 🧹 Clean up and sanitize the Gemini output
      let cleaned = raw
        .replace(/```json|```/g, "") // Remove markdown fences
        .replace(/[“”]/g, '"') // Replace fancy quotes
        .replace(/[‘’]/g, "'") // Replace fancy single quotes
        .replace(/(\d+)\/(\d+)/g, (_, a, b) =>
          (parseFloat(a) / parseFloat(b)).toFixed(2)
        ) // Convert fractions
        .trim();

      let feedback;

      try {
        feedback = JSON.parse(cleaned);
      } catch (jsonErr) {
        continue;
      }

      const gradeValue = feedback?.grade || 0;
      const evaluation = {
        accuracy: Math.min(
          1,
          (feedback?.evaluation?.accuracy || 0) / 4
        ).toFixed(2),
        relevance: Math.min(
          1,
          (feedback?.evaluation?.relevance || 0) / 3
        ).toFixed(2),
        completeness: Math.min(
          1,
          (feedback?.evaluation?.completeness || 0) / 3
        ).toFixed(2),
      };

      results.push({
        question,
        teacher_answer: teacherAnswer,
        student_answer: studentAnswer,
        grade: convertToLetterGrade(gradeValue),
        evaluation,
        improvement_suggestions: feedback?.improvement_suggestions || [],
      });
    } catch (error) {
      continue; // Skip to the next question if there's an error
    }
  }

  return results;
}

//  Function to Convert Numeric Grades to Letter Grades
function convertToLetterGrade(score) {
  if (score >= 9) return "A+";
  if (score >= 8) return "A";
  if (score >= 7) return "B";
  if (score >= 6) return "C";
  if (score >= 5) return "D";
  if (score >= 4) return "E";
  return "F";
}

// Save to Firebase
async function saveToFirebase(data) {
  const batch = db.batch();
  const collectionRef = db.collection("graded_answers");
  data.forEach((item) => {
    const docRef = collectionRef.doc();
    batch.set(docRef, item);
  });
  await batch.commit();
}

// Function to delete all PDF files in a directory
function deleteAllPDFFilesInDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);

      if (
        fs.lstatSync(filePath).isFile() &&
        path.extname(file).toLowerCase() === ".pdf"
      ) {
        fs.unlinkSync(filePath);
      }
    });
    return true;
  } else {
    throw new Error(`Directory ${dirPath} does not exist`);
  }
}

// overall Process function which can perform all task related to grading
async function processGrading(studentPdfUrl, teacherPdfUrl) {
  console.log("Verifying Provided Assignments...");
  await downloadPDF(studentPdfUrl, PDF_PATH);
  await downloadPDF(teacherPdfUrl, TEACHER_PDF_PATH);

  console.log("Checking your Assignments...");
  const studentText = await extractTextFromPDF(PDF_PATH);
  const teacherText = await extractTextFromPDF(TEACHER_PDF_PATH);

  if (!studentText)
    throw new res.status(400).json({ error: "Empty Student PDF" });
  if (!teacherText)
    throw new res.status(400).json({ error: "Empty Teacher PDF" });

  const studentQA = extractQA(studentText);
  const teacherQA = extractQA(teacherText);

  console.log("Analzing your Answers...");
  const gradedResults = await gradeAnswers(studentQA, teacherQA);

  // res.json({ message: "Processing complete", data: gradedResults });

  console.log("Almost there...");
  deleteAllPDFFilesInDirectory(PDF_DIR);
  console.log("completed");
  return gradedResults;
}

module.exports = {
  processGrading,
  downloadPDF,
  extractTextFromPDF,
  extractQA,
  gradeAnswers,
  saveToFirebase,
};
