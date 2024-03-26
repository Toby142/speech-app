import {
  addDetection,
  detections
} from "../../src/modules/detection.class.mjs";

import { Speech } from "../../src/modules/speech.class.mjs";

const speech = new Speech();

function getResponseTest() {
  const urlParams = new URLSearchParams(window.location.search);
  const responseTest = urlParams.get("response");

  return responseTest;
}

window.addEventListener("load", (event) => {
  const responseTest = getResponseTest();
  speech.setVoice("Google Nederlands");
  speech.setLang("nl-NL");
  speech.speak(responseTest);
  console.log(responseTest);

  // Doe iets met de responseTest variabele.
});

// const speakButton = createButton("Speak");
// speakButton.position(20, 100);
// speakButton.mousePressed(doSpeak);

// function doSpeak() {
//   speech.setVoice("Google Nederlands");
//   speech.setLang("nl-NL");
//   speech.speak("Hey, mijn naam is Judeska van FC Kip");
// }

const video = document.getElementById("webcam");
const liveView = document.getElementById("liveView");
const demosSection = document.getElementById("demos");
const enableWebcamButton = document.getElementById("webcamButton");

// Check if webcam access is supported.
function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it to call enableCam function which we will
// define in the next step.
if (getUserMediaSupported()) {
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start classification.
function enableCam(event) {
  // Only continue if the COCO-SSD has finished loading.
  if (!model) {
    return;
  }

  // Hide the button once clicked.
  event.target.classList.add("removed");

  // getUsermedia parameters to force video but not audio.
  const constraints = {
    video: true
  };

  // Activate the webcam stream.

  navigator.mediaDevices
    .getUserMedia({
      video: { facingMode: "environment" } // Request rear camera
    })
    .then(function (stream) {
      video.srcObject = stream;
      video.addEventListener("loadeddata", predictWebcam);
    });
}

// Pretend model has loaded so we can try out the webcam code.
var model = true;
demosSection.classList.remove("invisible");

// Store the resulting model in the global scope of our app.
var model = undefined;

// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment
// to get everything needed to run.
// Note: cocoSsd is an external object loaded from our index.html
// script tag import so ignore any warning in Glitch.
cocoSsd.load().then(function (loadedModel) {
  model = loadedModel;
  // Show demo section now model is ready to use.
  demosSection.classList.remove("invisible");
});

var children = [];

let lastDetectionTime = 0;

function startDetectionTimer() {
  const currentTime = Date.now();
  if (currentTime - lastDetectionTime >= 15000) {
    detections.length = 0; // Leeg de lijst met gedetecteerde objecten
    console.log(
      "Lijst met gedetecteerde objecten is geleegd." + lastDetectionTime
    );
    lastDetectionTime = currentTime;
  }
}

function speakAndAddDetection(classification, score, detections) {
  const specialWords = ["knife", "scissors"]; // Woorden waarvoor een speciale boodschap moet worden uitgevoerd

  if (!detections.includes(classification)) {
    detections.push(classification);
    let message =
      "Ik detecteer een " + classification + " met een zekerheid van ";

    if (specialWords.includes(classification)) {
      message = "Ik heb een gevaar item gedetecteerd " + classification;
      +" moet ik een hulp instantie bellen?";
    }

    // Speak the detection
    speech.setVoice("Google Nederlands");
    speech.setLang("nl-NL");
    speech.speak(message + Math.round(parseFloat(score)) + " procent");
  } else {
    console.log(classification + " is al gedetecteerd.");
  }
}

function predictWebcam() {
  // Stel een timer in om de functie na 10 seconden opnieuw uit te voeren
  setInterval(startDetectionTimer, 15000);
  model.detect(video).then(function (predictions) {
    // Remove any highlighting we did previous frame.
    for (let i = 0; i < children.length; i++) {
      liveView.removeChild(children[i]);
    }
    children.splice(0);

    // Now lets loop through predictions and draw them to the live view if
    // they have a high confidence score.
    for (let n = 0; n < predictions.length; n++) {
      // If we are over 66% sure we are sure we classified it right, draw it!
      if (predictions[n].score > 0.66) {
        addDetection(
          predictions[n].class,
          Math.round(parseFloat(predictions[n].score) * 100)
        );

        // speech.setVoice("Google Nederlands");
        // speech.setLang("nl-NL");
        // speech.speak(
        //   "Ik decteer een" +
        //     predictions[n].class +
        //     "met een zekerheid van" +
        //     Math.round(parseFloat(predictions[n].score) * 100) +
        //     "procent"
        // );
        speakAndAddDetection(
          predictions[n].class,
          Math.round(parseFloat(predictions[n].score) * 100),
          detections
        ); // Call the new function here

        console.log(detections);
        const p = document.createElement("p");
        p.innerText =
          predictions[n].class +
          " - with " +
          Math.round(parseFloat(predictions[n].score) * 100) +
          "% confidence.";
        p.style =
          "margin-left: " +
          predictions[n].bbox[0] +
          "px; margin-top: " +
          (predictions[n].bbox[1] - 10) +
          "px; width: " +
          (predictions[n].bbox[2] - 10) +
          "px; top: 0; left: 0;";

        const highlighter = document.createElement("div");
        highlighter.setAttribute("class", "highlighter");
        highlighter.style =
          "left: " +
          predictions[n].bbox[0] +
          "px; top: " +
          predictions[n].bbox[1] +
          "px; width: " +
          predictions[n].bbox[2] +
          "px; height: " +
          predictions[n].bbox[3] +
          "px;";

        liveView.appendChild(highlighter);
        liveView.appendChild(p);
        children.push(highlighter);
        children.push(p);
      }
    }

    // Call this function again to keep predicting when the browser is ready.
    window.requestAnimationFrame(predictWebcam);
  });
}
