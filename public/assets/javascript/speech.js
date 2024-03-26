import { Speech } from "../../src/modules/speech.class.mjs";

const speech = new Speech();

const language = localStorage.getItem("selectedLanguage");
const voice = localStorage.getItem("selectedVoice");

const imageprompt = document.getElementById("imageurl");
function getResponseTest() {
  const urlParams = new URLSearchParams(window.location.search);
  const responseTest = urlParams.get("imageUrl");

  return responseTest;
}

function setup() {
  // Create a Speech Recognition object with callback
  const speechRec = new p5.SpeechRec("nl-NL", gotSpeech);

  // "Continuous recognition" (as opposed to one time only)
  let continuous = true;
  // If you want to try partial recognition (faster, less accurate)
  let interimResults = false;
  // This must come after setting the properties
  speechRec.start(continuous, interimResults);

  // DOM element to display results
  let output = document.querySelector("#output");
  let outputBot = document.querySelector("#bot-output");

  // Speech recognized event
  function gotSpeech() {
    // Something is there

    // Get it as a string, you can also get JSON with more info
    console.log(speechRec);

    if (speechRec.resultValue) {
      let said = speechRec.resultString;
      // Show user
      output.innerHTML = said;
      const responseTest = getResponseTest();

      if (said !== "") {
        output.innerHTML = said;
        sendPrompt(responseTest, said, language);
      } else {
        outputBot.innerHTML = "ik luister naar je.....";
      }
    }
  }
}

async function sendPrompt(file, prompt, language) {
  try {
    // Remove leading '\"' and trailing '"' from the file URL
    file = file.replace(/^\"|\"$/g, '');

    const datasend = { file, prompt, language };
    const jsonData = JSON.stringify(datasend);

    const response = await fetch("/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: jsonData
    });

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        const text = data.text;

        // Speak the text using the p5.js library
        speech.speak(text);

        console.log("Upload response:", data);
      } else {
        console.warn("Unexpected response format. Not JSON.");
      }
    } else {
      console.error("Failed to upload photo:", response.statusText);
    }
  } catch (err) {
    console.log(err);
  }
}



window.addEventListener("load", (event) => {
  const speak = new p5.Speech(); //callback, speech synthesis object
  speak.listVoices();
  const responseTest = getResponseTest();
  console.log(responseTest);
  // Controleer op dubbele quotes
  if (responseTest.includes('"')) {
    // Verwijder dubbele quotes
    const safeImageUrl = responseTest.replace(/"/g, "");
    console.log("Verwijderde dubbele quotes:", safeImageUrl);
    imageprompt.src = safeImageUrl;
  } else {
    imageprompt.src = responseTest;
  }

  if (voice) {
    speech.setVoice(voice);
  } else {
    speech.setVoice("Google Nederlands"); // Google Nederlands
  }

  if (language) {
    speech.setLang(language);
  } else {
    speech.setLang("nl-NL");
  }
  //   speech.speak("Hallo, waar kan ik je mee helpen? ");
  setup();

  // Doe iets met de responseTest variabele.
});
