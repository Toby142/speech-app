// Definieer een klasse voor een detectie
class Detection {
  constructor(objectName, objectConfidence) {
    this.objectName = objectName;
    this.objectConfidence = objectConfidence;
  }
}

// Maak een array om detecties op te slaan
let detections = [];

// Voeg een nieuwe detectie toe aan de array
function addDetection(objectName, objectConfidence) {
  let detection = new Detection(objectName, objectConfidence + "%");
  detections.push(detection);
}

// // Exporteer de Detection-klasse, de addDetection-functie en de detections-array
export { Detection, addDetection, detections };
