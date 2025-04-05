const axios = require("axios");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

// required variables
const CLOUDINARY_URL =
  "https://res.cloudinary.com/dr2izxsrr/image/upload/v1743231326/AssignmentAnswers_vb34fr.pdf";
const TEACHER_PDF_URL =
  "https://res.cloudinary.com/dr2izxsrr/image/upload/v1743166781/submissions_m147tz.pdf";
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
    console.error("Download Error:", error);
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
  const regex =
    /(?:Q(?:uestion)?\s*)?(\d+)[).:-]?\s*(.+?)\s*\n\s*(?:A(?:nswer)?\s*\d*[).:-]?\s*)?([\s\S]+?)(?=\n(?:Q(?:uestion)?\s*)?\d+[).:-]|\n*$)/gis;

  let matches,
    qaPairs = [];

  while ((matches = regex.exec(text)) !== null) {
    let question = matches[1].trim();
    let questionText = matches[2].trim();
    let answerText = matches[3].trim();

    // Ensure answer is properly captured
    if (answerText.endsWith("Question") || answerText.endsWith("Q:")) {
      answerText = answerText
        .substring(0, answerText.lastIndexOf("Question"))
        .trim();
    }

    qaPairs.push({
      question: `${question}. ${questionText}`,
      answer: answerText,
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

    const prompt = `
        You are an expert examiner tasked with evaluating a student's answer based on a teacher's model answer. Your goal is to provide **an accurate, fair, and insightful assessment** of the student's response.

### **Inputs:**
1️⃣ **Teacher's Answer (Reference Answer)**:  
"${teacherAnswer}"  
2️⃣ **Student's Answer (Submitted Response)**:  
"${studentAnswer}"  

### **Evaluation Criteria (Score out of 10)**:
- **Accuracy (4 points)**: Does the student's answer correctly convey the intended meaning?  
- **Relevance (3 points)**: Does the response stay on-topic and address the key aspects?  
- **Completeness (3 points)**: Does the answer include all necessary details and explanations?  

### **Your Output Format (JSON)**:
\`\`\`json
{
  "question": "${studentQA[i]?.question}",
  "teacher_answer": "${teacherAnswer}",
  "student_answer": "${studentAnswer}",
  "grade": X, 
  "evaluation": {
    "accuracy": X/4, 
    "relevance": X/3, 
    "completeness": X/3
  },
  "improvement_suggestions": [
    "Suggestion 1",
    "Suggestion 2"
  ]
}
\`\`\`
        `;

    try {
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      // Extract AI Response Text
      let rawFeedback =
        response?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Remove Markdown Code Block Wrapper (```json ... ```)
      let cleanedFeedback = rawFeedback.replace(/```json|```/g, "").trim();

      // Convert Fractions (3/10, 1/4) to Decimals
      cleanedFeedback = cleanedFeedback.replace(
        /(\d+)\/(\d+)/g,
        (match, num, den) => (num / den).toFixed(2)
      );

      // Parse JSON Response
      let feedback = JSON.parse(cleanedFeedback);

      let letterGrade = convertToLetterGrade(feedback?.grade || 0);
      let evaluation = {
        accuracy: Math.min(1, Math.max(0, feedback?.evaluation?.accuracy || 0)),
        relevance: Math.min(
          1,
          Math.max(0, feedback?.evaluation?.relevance || 0)
        ),
        completeness: Math.min(
          1,
          Math.max(0, feedback?.evaluation?.completeness || 0)
        ),
      };
      // Store Processed Data
      results.push({
        question: studentQA[i]?.question,
        teacher_answer: teacherAnswer,
        student_answer: studentAnswer,
        grade: letterGrade,
        evaluation: evaluation,
        improvement_suggestions: feedback?.improvement_suggestions || [],
      });
    } catch (error) {
      console.error("Error generating content:", error);
      results.push({
        question: studentQA[i]?.question,
        teacher_answer: teacherAnswer,
        student_answer: studentAnswer,
        error: "AI processing failed",
      });
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
  console.log("Data saved to Firebase");
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
    console.error("Directory does not exist:", dirPath);
  }
}

// overall Process function which can perform all task related to grading
// async function processGrading(studentPdfUrl, teacherPdfUrl) {
async function processGrading() {
  console.log("Verifying Provided Assignments...");
  // await downloadPDF(studentPdfUrl, PDF_PATH);
  await downloadPDF(CLOUDINARY_URL, PDF_PATH);
  // await downloadPDF(teacherPdfUrl, TEACHER_PDF_PATH);
  await downloadPDF(TEACHER_PDF_URL, TEACHER_PDF_PATH);

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

  // console.log("save to Firebase...");
  // await saveToFirebase(gradedResults);
  console.log(gradedResults);

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
