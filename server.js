// Import required modules
const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();

// Initialize Express, set up EJS and serve static files from the "public" directory
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const dataDir = path.join(__dirname, "data"); // Directory where the text files are stored

// Route to display the homepage, which lists all files in the directory
app.get("/", (req, res, next) => {
  fs.readdir(dataDir, (err, files) => {
    if (err) return next(new Error("Failed to read the files directory."));
    res.render("index", { files });
  });
});

// Route to display the content of a specific file
app.get("/files/:filename", (req, res, next) => {
  const filePath = path.join(dataDir, req.params.filename);
  fs.readFile(filePath, "utf8", (err, content) => {
    if (err) return next(new Error("Failed to read the file content."));
    res.render("detail", { filename: req.params.filename, content });
  });
});

// Route to display the "create file" form
app.get("/create", (req, res) => {
  res.render("create");
});

// Route to handle the creation of a new file
app.post("/create", (req, res, next) => {
  const filename = req.body.filename;
  const content = req.body.content;
  const filePath = path.join(dataDir, filename);

  fs.writeFile(filePath, content, { flag: "wx" }, (err) => {
    if (err) {
      if (err.code === "EEXIST") {
        return res.status(403).send("File already exists!");
      }
      return next(
        new Error("Failed to create the file. Please try again later.")
      );
    }
    res.redirect("/");
  });
});

// Route to handle renaming a file
app.post("/update/:filename", (req, res, next) => {
  const oldPath = path.join(dataDir, req.params.filename);
  const newPath = path.join(dataDir, req.body.newFilename);

  if (fs.existsSync(newPath)) {
    return res.status(403).send("File with the new name already exists!");
  }

  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.status(404).send("File to rename not found.");
      }
      return next(new Error("Failed to rename the file."));
    }
    res.redirect("/");
  });
});

// Route to handle deleting a file
app.post("/delete/:filename", (req, res, next) => {
  const filePath = path.join(dataDir, req.params.filename);

  fs.unlink(filePath, (err) => {
    if (err) return next(new Error("Failed to delete the file."));
    res.redirect("/");
  });
});

// Middleware to handle 404 errors for non-existent routes
app.use((req, res) => {
  res.status(404).send("Error 404: Page not found");
});

// Error-handling middleware to handle internal server errors
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  console.error(err.stack);
  res
    .status(500)
    .send(
      "Internal Server Error: Something went wrong. Please try again later."
    );
});

// Start the server on the specified PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
