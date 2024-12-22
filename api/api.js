const express = require("express");
const { MongoClient } = require("mongodb");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const multer = require('multer');
const sharp = require('sharp');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs'); // For synchronous methods like createWriteStream
const fsPromises = require('fs').promises; // For promise-based methods like fsPromises.access
const qs = require('qs');


const ensureFolderExists = async (folderPath) => {
  try {
    await fsPromises.access(folderPath); // Correct usage of fs.promises
  } catch {
    await fsPromises.mkdir(folderPath, { recursive: true });
  }  
};  

const tempFolder = path.join(__dirname, 'temp');
ensureFolderExists(tempFolder);

const app = express();
app.use(cors());
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.use(bodyParser.json());
app.use((req, res, next) => {
  req.query = qs.parse(req.query);
  next();
});

const mongoURI = "mongodb://localhost:27017"; // replace with your MongoDB URI if different
const dbName = "userDB"; // your database name

const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

let db;
client.connect()
  .then(() => {
    console.log("MongoDB connected!");
    db = client.db(dbName);
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

app.post("/register", async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const usersCollection = db.collection("users");
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = { email, name, password: hashedPassword };
    await usersCollection.insertOne(newUser);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Server error" });
  }
});


app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const sessionId = uuidv4();
    await usersCollection.updateOne(
      { email },
      { $set: { sessionId } }
    );
    res.status(200).json({
      message: "Login successful",
      sessionId,
      user: { email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Server error, please try again later" });
  }
});


app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
      return res.status(400).json({ error: "Email is required" });
  }
  try {
      const usersCollection = db.collection("users");
      const user = await usersCollection.findOne({ email });
      if (user) {
          const resetToken = bcrypt.hashSync(email, 10);
          const expiry = new Date();
          expiry.setHours(expiry.getHours() + 1);
          await usersCollection.updateOne(
              { email },
              { $set: { resetToken, resetTokenExpiry: expiry } }
          );
          const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                  user: "mkannan2104@gmail.com",
                  pass: "faxx nfbx ggel ysfn",
              },
          });
          const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
          const mailOptions = {
              from: "mkannan2104@gmail.com",
              to: email,
              subject: "Password Reset Request",
              html: `
                  <h1>Password Reset</h1>
                  <p>Click the link below to reset your password:</p>
                  <a href="${resetLink}">Reset Password</a>
                  <p>If you didn't request this, please ignore this email.</p>
              `,
          };

          await transporter.sendMail(mailOptions);
      }
      res.status(200).json({ message: "If the email is registered, a reset link has been sent." });
  } catch (error) {
      console.error("Error sending reset email:", error);
      res.status(500).json({ error: "Server error, please try again later." });
  }
});


app.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
      return res.status(400).json({ error: "Token and new password are required" });
  }

  try {
      const usersCollection = db.collection("users");

      const user = await usersCollection.findOne({
          resetToken: token,
          resetTokenExpiry: { $gte: new Date() }, // Token must not be expired
      });

      if (!user) {
          return res.status(400).json({ error: "Invalid or expired token" });
      }
      const hashedPassword = bcrypt.hashSync(password, 10);
      await usersCollection.updateOne(
          { email: user.email },
          { $set: { password: hashedPassword }, $unset: { resetToken: "", resetTokenExpiry: "" } }
      );

      res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Server error, please try again later." });
  }
});


app.get("/user-info", async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  try {
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ sessionId });
    if (!user) {
      return res.status(404).json({ error: "User not found or session expired" });
    }

    res.status(200).json({
      user: { email: user.email, name: user.name },
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: "Server error, please try again later" });
  }
});

app.post("/logout", async (req, res) => {
  const { sessionId } = req.body; // Expect sessionId to be sent in the request body.

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  try {
    const usersCollection = db.collection("users");

    // Find the user with the provided sessionId
    const user = await usersCollection.findOne({ sessionId });
    if (!user) {
      return res.status(400).json({ error: "Invalid session ID or user not found" });
    }

    // Invalidate the session by removing the sessionId from the database
    await usersCollection.updateOne(
      { sessionId },
      { $unset: { sessionId: "" } } // Remove the sessionId field
    );

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Server error, please try again later" });
  }
});



// -------------------------------------------------------------------------------------------------------



function getWidth(selectedOption, category, isFeature) {
  if (selectedOption === 'CDC' && category === 'Articles') {
      return isFeature ? 1270 : 1015;
  } else if (selectedOption === 'TJK' && category === 'Articles') {
      return isFeature ? 1970 : 700;
  } else if (category === 'Webstories') {
      return 1080;
  }
  return null; // Default case
}


async function processImage(fileBuffer, originalName, tempFolder, width) {
  try {
    let formattedFileName = originalName.trim();
    formattedFileName = formattedFileName.replace(/\.(jpeg|png|jpg)$/i, '');
    formattedFileName = formattedFileName.replace(/\s+/g, '-').toLowerCase();
    formattedFileName = `${path.parse(formattedFileName).name}.webp`;
    const outputPath = path.join(tempFolder, formattedFileName);

    let quality = 80;
    let outputBuffer;

    do {
      outputBuffer = await sharp(fileBuffer)
        .resize({ width })
        .webp({ quality })
        .toBuffer();
      if (outputBuffer.length > 200 * 1024) {
        quality -= 10;
      }
    } while (outputBuffer.length > 200 * 1024 && quality > 10);

    // Use fsPromises.writeFile here
    await fsPromises.writeFile(outputPath, outputBuffer);
    return { fileName: formattedFileName, size: outputBuffer.length };
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
}


// Utility function to create ZIP
// function createZip(tempFolder, userId) {
//   return new Promise((resolve, reject) => {
//     const zipFilePath = path.join(tempFolder, `${userId}.zip`);
//     const output = fs.createWriteStream(zipFilePath);
//     const archive = archiver('zip', { zlib: { level: 9 } });

//     output.on('close', resolve);
//     output.on('error', reject);

//     archive.pipe(output);
//     archive.directory(tempFolder, false);
//     archive.finalize();
//   });
// }

function createZip(tempFolder, userId) {
  return new Promise((resolve, reject) => {
    const zipFilePath = path.join(tempFolder, `${userId}.zip`);
    const output = fs.createWriteStream(zipFilePath); // Correctly use fs.createWriteStream
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`ZIP file created successfully: ${zipFilePath}`);
      resolve(zipFilePath);
    });

    output.on('error', (err) => {
      console.error('Error creating ZIP:', err);
      reject(err);
    });

    archive.pipe(output);
    archive.directory(tempFolder, false);
    archive.finalize();
  });
}


// Upload endpoint
app.post('/upload', upload.array('images', 10), async (req, res) => {
  try {
    const { files } = req;
    const { resolution, selectedOption, category } = req.query;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded.' });
    }

    const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;
    const invalidFiles = files.filter(file => !allowedExtensions.test(file.originalname));

    if (invalidFiles.length > 0) {
      return res.status(400).json({
        message: 'Only image files are allowed.',
        invalidFiles: invalidFiles.map(file => file.originalname),
      });
    }

    const userId = uuidv4(); // Generate unique user ID
    const userTempFolder = path.join(tempFolder, userId);
    await ensureFolderExists(userTempFolder); // Ensure folder exists before proceeding

    const parsedResolution = {
      nonFeature: parseInt(resolution.nonFeature, 10),
      feature: parseInt(resolution.feature, 10),
    };

    const results = await Promise.all(files.map(file => {
      const isFeature = file.originalname.toLowerCase().includes('feature');
      const newWidth = isFeature ? parsedResolution.feature : parsedResolution.nonFeature;
      return processImage(file.buffer, file.originalname, userTempFolder, newWidth);
    }));

    res.status(200).json({
      message: 'Images processed successfully.',
      results,
      userId, // Return UUID to the client
      downloadLink: `/download/${userId}`,
    });
  } catch (error) {
    console.error("Error processing images:", error);
    res.status(500).json({ message: 'Error processing images.', error: error.message });
  }
});



app.get('/download/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userTempFolder = path.join(tempFolder, userId);
    const zipFilePath = path.join(userTempFolder, `${userId}.zip`);

    // Check if the user folder exists
    try {
      await fsPromises.access(userTempFolder);
    } catch {
      console.error("User folder does not exist.");
      return res.status(404).send('User folder not found.');
    }

    // Check if ZIP file exists; create it if not
    try {
      await fsPromises.access(zipFilePath);
    } catch {
      console.log("ZIP file not found. Creating ZIP...");
      await createZip(userTempFolder, userId);
    }

    // Send the ZIP file for download
    res.download(zipFilePath, `${userId}.zip`, (err) => {
      if (err) {
        console.error("Error sending the ZIP file:", err);
        res.status(500).send('Error sending the ZIP file.');
      }
    });
  } catch (error) {
    console.error("Unexpected error in /download/:userId endpoint:", error);
    res.status(500).send('Error processing your request.');
  }
});






// Server setup to listen on port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
