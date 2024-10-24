const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const exp = require("constants");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const dataDir = path.join(__dirname, "data");

app.get("/", (req, res, next) => {
  fs.readdir(dataDir, (err, files) => {
    if (err) {
      return next(new Error("Failed to read the files directory"));
    }
    res.render("index", { files });
  });
});

app.get("/files/:filename", (req, res, next) => {
  const filePath = path.join(dataDir, req.params.filename);

  fs.readFile(filePath, "utf8", (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.status(404).send("File not found");
      }
      return next(new Error("Failed to read the file content"));
    }
    res.render("detail", { filename: req.params.filename, content });
  });
});

app.get("/create", (req, res) => {
  res.render("create");
});

app.post("/create", (req, res, next) => {
  const filename = req.body.filename;
  const content = req.body.content;
  const filePath = path.join(dataDir, filename);

  fs.writeFile(filePath, content, (err) => {
    if (err) {
      return next(
        new Error("Failed to create the file. Please try again later.")
      );
    }
    res.redirect("/");
  });
});

app.post("/update/:filename", (req, res, next) => {
  const oldPath = path.join(dataDir, req.params.filename);
  const newPath = path.join(dataDir, req.body.newFilename);

  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.status(404).send("File to rename not found");
      }
      return next(new Error("Failed to rename the file"));
    }
    res.redirect("/");
  });
});

app.post("/delete/:filename", (req, res, next) => {
  const filePath = path.join(dataDir, req.params.filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.status(404).send("File to delete not found.");
      }
      return next(new Error("Failed to delete the file."));
    }
    res.redirect("/");
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong, please try again later.");
});

app.use((req, res) => {
  res.status(404).send("404: Page not found");
});
