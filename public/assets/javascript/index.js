const video = document.getElementById("video");
const snapButton = document.getElementById("snap");
const uploadForm = document.getElementById("uploadForm");

const imageprompt = document.getElementById("imageurl");
function getResponseTest() {
  const urlParams = new URLSearchParams(window.location.search);
  const responseTest = urlParams.get("imageUrl");

  return responseTest;
}
// Functie om toegang te krijgen tot de camera en de video stream op te zetten
async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });
    video.srcObject = stream;
  } catch (error) {
    console.error("Failed to get camera stream:", error);
  }
}

// Functie om een foto te maken
function takeSnapshot() {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg");
}

// Event listener voor het klikken op de knop om een foto te maken
snapButton.addEventListener("click", async () => {
  try {
    const photoUrl = await takeSnapshot();
    const base64Image = photoUrl.split(",")[1];
    const blob = base64ToBlob(base64Image);
    // Op een andere plek, vul de prompt parameter in
    uploadPhoto(blob);
  } catch (error) {
    console.error("Failed to take snapshot:", error);
  }
});

// Functie om de foto te uploaden via het formulier
async function uploadPhoto(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/upload", {
      method: "POST",
      body: formData
    });

    // Check response status before parsing JSON
    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        const imageUrl = data.imageUrl;
        // Redirect naar de pagina met de image URL
        window.location.href = `/generate-prompt?imageUrl=${encodeURIComponent(
          JSON.stringify(imageUrl)
        )}`;
        console.log("Upload response:", data);
      } else {
        console.warn("Unexpected response format. Not JSON.");
      }
    } else {
      console.error("Failed to upload photo:", response.statusText);
    }
  } catch (error) {
    console.error("Failed to upload photo:", error);
  }
}

window.addEventListener("load", (event) => {
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

  setup();

  // Doe iets met de responseTest variabele.
});

// Functie om een base64-string naar een Blob te converteren
function base64ToBlob(base64String) {
  const byteCharacters = atob(base64String);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: "image/jpeg" });
}

// Bel de setupCamera-functie bij het laden van de pagina
window.addEventListener("DOMContentLoaded", setupCamera);

// video.addEventListener("loadedmetadata", () => {
//   video.controls = false;
// });
