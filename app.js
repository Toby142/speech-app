const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const { getJson } = require("serpapi");
const mobilenet = require("@tensorflow-models/mobilenet");
const serpapi = require("serpapi");
const app = express();
const axios = require("axios");
const geoip = require("geoip-lite");
const bcrypt = require("bcrypt");
require("dotenv").config();

const session = require("express-session");
const { MongoClient } = require("mongodb");
const url =
  "mongodb+srv://giojs:neQM619EWPVgNoVi@cluster0.76in5wx.mongodb.net/?retryWrites=true&w=majority"; // Vervang door je eigen MongoDB-URL
const dbName = "ObjectDetection"; // Vervang door de naam van je database
// Body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "./public")));
app.use(express.static(path.join(__dirname, "./lib")));
app.use(express.static(path.join(__dirname, "./models")));

app.use(cors());

app.use(express.json());

// get api key
const apiKey = process.env.API_KEY;
const port = process.env.PORT || 3000;

app.use(
  session({
    secret: "secrey_katje_miauw", // Geheime sleutel voor sessies, vervang dit met een sterkere sleutel in productie
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Zet dit op true als je HTTPS gebruikt
  })
);

// View Engine Setup
app.set("views", path.join(__dirname, "./public/views"));
app.set("view engine", "ejs");

const saltRounds = 10;

async function connectToDatabase() {
  const client = new MongoClient(url, { useUnifiedTopology: true });

  try {
    await client.connect();
    console.log("Verbonden met MongoDB");
    return client.db(dbName);
  } catch (error) {
    console.error("Fout bij verbinden met MongoDB:", error);
    throw error;
  }
}

// Map voor het opslaan van afbeeldingen
const uploadDir = path.join(__dirname, "./public/assets/uploads");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + ".jpg");
  }
});
const upload = multer({ storage: storage });

// Stel de map met statische bestanden in
app.use(express.static("public"));

app.get("/register", (req, res) => {
  res.render("register", { error: req.query.error });
});

app.get("/settings", (req, res) => {
  if (req.session.username) {
    const name = req.session.username;
    const email = req.session.email;
    res.render("settingsPanel", {
      error: req.query.error,
      name: name,
      email: email
    });
  } else {
    res.redirect("/");
  }
});

function checkForScripts(input) {
  // Regex om scripttags te detecteren
  const regex = /<script\b[^>]*>(.*?)<\/script>/gm;

  // Check of de input scripttags bevat
  const hasScriptTags = input.match(regex);

  // Retourneer true of false based op de matches
  if (hasScriptTags) {
    return true;
  } else {
    return false;
  }
}

app.post("/register", async function (req, res) {
  const userName = req.body.username;
  const password = req.body.password;
  const password2 = req.body.password2;
  const email = req.body.email;

  const db = await connectToDatabase();
  const usersCollection = db.collection("Users");

  // Sanitize user input to remove potential script tags
  const hasScriptName = checkForScripts(userName);
  const hasScriptPassword = checkForScripts(password);
  const hasScriptPassword2 = checkForScripts(password2);
  const HasScriptEmail = checkForScripts(email);

  // om te kijken of de naam of email al voor komt in de databse
  const user = await usersCollection.findOne({
    $or: [{ username: userName }, { email: email }]
  });

  if (
    !hasScriptName &&
    !hasScriptPassword &&
    !hasScriptPassword2 &&
    !HasScriptEmail
  ) {
    if (!user) {
      if (
        password === password2 &&
        password !== null &&
        password2 !== null &&
        email !== null
      ) {
        bcrypt.genSalt(saltRounds, function (err, salt) {
          bcrypt.hash(password, salt, async function (err, hash) {
            // returns hash
            try {
              const NewUser = {
                username: userName,
                password: hash,
                email: email,
                lastLogin: Date.now(),
                LoginAttempts: 0,
                FailedLoginAttempts: 0
              };

              console.log(
                "er is een nieuwe gebruiker gestuurd naar de database " +
                  userName +
                  "" +
                  password
              );

              const result = await usersCollection.insertOne(NewUser);

              if (result.insertedId) {
                const user = await usersCollection.findOne({
                  _id: result.insertedId
                });
                console.log(
                  "user succesvol toegevoegd aan de database; ",
                  user
                );
                res.redirect("/");
              } else {
                console.error("user toevoegen aan de database mislukt.");
              }
            } catch (error) {
              console.error(
                "Fout bij toevoegen van de user aan de database:",
                error
              );
            }
          });
        });
      } else {
        console.log("");
        res.redirect(
          "/register/?error=het wachtwoord en het herhaalde wachtwoord zijn niet gelijk of een van de 2 is niet ingevuld"
        );
      }
    } else {
      res.redirect(
        "/register/?error=de naam of email die je hebt ingegeven bestaat al gebruik een andere of login"
      );
    }
  } else {
    console.error("Error: Missing required fields or script tags detected.");
    res.redirect(
      "/register/?error=Please fill in all fields and avoid using script tags."
    );
    return; // Exit the function early to prevent further processing
  }

  console.log(userName, password);
});

async function savePrompt(prompt, file, language, id, text) {
  // Maak een connectie met de database
  const db = await connectToDatabase();
  const usersCollection = db.collection("Users");

  var ip = "193.186.4.58";
  var location = geoip.lookup(ip);

  const user = await usersCollection.findOne({
    _id: id
  });
  // Maak een document voor de prompt
  const document = {
    userid: id,
    prompt,
    response: text,
    file,
    language,
    timestamp: new Date(),
    location: {}
  };

  if (location) {
    document.location = {
      country: location.country,
      region: location.region,
      city: location.city
    };
  } else {
    console.log("No location found");
  }

  // Voeg het document toe aan de "prompts" collectie
  await db.collection("Prompts").insertOne(document);
}

async function getUserIdFromSession(session) {
  if (!session.username) {
    return null; // No user logged in
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection("Users");
    const user = await usersCollection.findOne({
      username: session.username
    }); // Use sessionName here

    if (user) {
      return user._id.toString(); // Return the user ID as a string
    } else {
      return null; // User not found with the session name
    }
  } catch (error) {
    console.error("Error fetching user ID from session:", error);
    return null;
  }
}

const fileObject = {};

app.post("/addcontact", async (req, res) => {
  const tel = req.body.tel;
  const name = req.body.name;
  const db = await connectToDatabase();

  if (tel !== null && name !== null) {
    const userId = await getUserIdFromSession(req.session);
    const document = {
      tel,
      name,
      owner: userId
    };

    // Voeg het document toe aan de "prompts" collectie
    await db.collection("contacts").insertOne(document);
  } else {
    res.redirect(
      "/settings/?error=Niet alle velden zijn ingevuld, vull alle velden in"
    );
  }
});

app.post("/speech", async (req, res) => {
  const prompt = req.body.prompt;
  const file = req.body.file;
  const language = req.body.language;
  console.log(prompt, file, language);

  if (prompt) {
    const userId = await getUserIdFromSession(req.session);
    // Call the new function
    console.log("userId", userId);
    const options = {
      method: "POST",
      url: "https://gemini-pro-vision-ai1.p.rapidapi.com/",
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "gemini-pro-vision-ai1.p.rapidapi.com"
      },
      data: {
        contents: [ 
          {
            parts: [
              {
                inline_data: {
                  mime_type: "image/png",
                  data: file
                }
              },
              {
                text:
                  "gedraag je als een hulp assistent voor een blind persoon" +
                  prompt +
                  "in de volgende taal" +
                  language
              }
            ]
          }
        ]
      }
    };

    try {
      const response = await axios.request(options);
      const jsonData = response.data;
      console.log(jsonData);

      if (jsonData && jsonData.candidates && jsonData.candidates.length > 0) {
        const text = jsonData.candidates[0].content.parts[0].text;
        console.log(text); // Log de volledige respons
        await savePrompt(prompt, file, language, userId, text);
        res.json({ text, file });
      } else if (jsonData === null) {
        console.error("API did not return a valid response. (JSON null)");
        // Add fallback logic here (optional)
        res.status(500).json({ error: "API error: null response" }); // Example error response
      } else {
        console.error("Invalid JSON response:", jsonData);
        // Handle unexpected response format here (optional)
        res.status(500).json({ error: "API error: invalid response format" }); // Example error response
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" }); // Generic error for unexpected issues
    }
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    res.redirect("/"); // will always fire after session is destroyed
  });
});

// POST-route voor het verwerken van geüploade afbeeldingen
app.post("/upload", upload.single("file"), async (req, res) => {
  if (req.file) {
    fileObject.filename = req.file.filename; // Voeg de bestandsnaam toe als property
    fileObject.path = req.file.path;

    const now = new Date();
    const formattedTime = `${now.getHours()}:${now.getMinutes()} / ${now.getDate()}-${
      now.getMonth() + 1
    }-${now.getFullYear()}`;

    // Voeg de geformatteerde datum- en tijdstring toe aan het object
    fileObject.date = formattedTime;

    var ip = "193.186.4.58";
    var location = geoip.lookup(ip);

    if (location) {
      fileObject.location = {
        country: location.country,
        region: location.region,
        city: location.city
      };
    } else {
      console.log("No location found");
    }
    console.log("Received photo:", fileObject);

    const imageUrl = `http://speech-app-production.up.railway.app/uploads/${req.file.filename}`;

    res.json({ imageUrl }); // Send the image URL as JSON

    // res.redirect("/?imageurl=" + encodeURIComponent(JSON.stringify(imageUrl)));
  } else {
    return res.status(400).json({ message: "No file uploaded" });
  }
});

app.post("/login-users", async (req, res) => {
  // Implementeer je inloglogica hier

  try {
    const username = req.body.username; // Ensure username is a string
    const password = req.body.password; // Ensure password is a string

    // checkt of de input velden geen script tags bevatten
    const hasScriptName = checkForScripts(username);
    const hasScriptPassword = checkForScripts(password);

    const db = await connectToDatabase();
    const usersCollection = db.collection("Users");

    const user = await usersCollection.findOne({ username: username });

    if (!hasScriptName && !hasScriptPassword) {
      if (user && (await bcrypt.compare(password, user.password))) {
        // Inloggen gelukt
        req.session.username = username; //bij succes opslaan in sessie
        req.session.email = user.email; //bij succes opslaan in sessie

        const date = new Date();

        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        let currentDate = `${day}-${month}-${year}`;

        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        const currentTime = `${hours}:${minutes}:${seconds}`;

        const result = await usersCollection.updateOne(
          { username },
          {
            $inc: { LoginAttempts: 1 }, // Verhoog het aantal_logins met 1
            $set: { lastLogin: currentDate + " " + currentTime } // Stel lastLogin in op het huidige tijdstip
          }
        );
        if (result.modifiedCount > 0) {
          console.log("Gebruikersinformatie bijgewerkt.");
          res.redirect("/welcome");
        } else {
          console.log("Gebruiker niet bijgewerkt.");
          res.redirect("/?error=Er is iets misgegaan bij het inloggen.");
        }
      } else {
        // Inloggen mislukt, stuur foutmelding terug naar de login-pagina
        res.redirect("/?error=Ongeldige gebruikersnaam of wachtwoord");
        var ip = "193.186.4.58";
        const location = geoip.lookup(ip);
        const result = await usersCollection.updateOne(
          { username },
          {
            $inc: { FailedLoginAttempts: 1 } // Verhoog het aantal_logins met 1
          }
        );
      }
    } else {
      res.redirect("/?error=Invalid input. Script tags are not allowed.");
      console.log("script tags gedetecteerd in het input veld");
    }
  } catch (err) {
    console.error("Fout bij het inloggen:", err);

    res.status(500).json({ message: "Serverfout bij het inloggen" });
  }
});

// GET-route voor het ophalen van geüploade afbeeldingen
app.get("/uploads/:filename", (req, res) => {
  const fileName = req.params.filename;
  res.sendFile(path.join(__dirname, `./public/assets/uploads/${fileName}`));
});
app.get("/images/:filename", (req, res) => {
  const fileName = req.params.filename;
  res.sendFile(path.join(__dirname, `./public/assets/images/${fileName}`));
});

app.get("/images/icons/:filename", (req, res) => {
  const fileName = req.params.filename;
  res.sendFile(
    path.join(__dirname, `./public/assets/images/icons/${fileName}`)
  );
});

app.get("/", (req, res) => {
  if (req.session.username) {
    res.redirect("/welcome");
  } else {
    res.render("login", { error: req.query.error });
  }
  // res.sendFile(path.join(__dirname, `./public/assets/pages/index.html`));
});

app.get("/welcome", (req, res) => {
  // Controleren of de gebruiker is ingelogd
  if (req.session.username) {
    res.render("index", { username: req.session.username });
  } else {
    res.redirect("/");
  }
});

app.get("/generate-prompt", (req, res) => {
  if (req.session.username) {
    res.render("speech", { username: req.session.username });
  } else {
    res.redirect("/");
  }
});

app.get("/styles/:filename", (req, res) => {
  const fileName = req.params.filename;
  res.sendFile(path.join(__dirname, `./public/assets/styles/${fileName}`));
});

app.get("/fonts/:filename", (req, res) => {
  const fileName = req.params.filename;
  res.sendFile(path.join(__dirname, `./public/assets/fonts/${fileName}`));
});

// Start de server
app.listen(port, () => {
  console.log(`Server gestart op port ${port}`);

});
