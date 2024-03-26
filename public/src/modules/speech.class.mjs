class Speech {
  constructor() {
    this.speech = new p5.Speech();
    this.speech.onLoad = () => {
      console.log("Speech synthesis ready");
    };
  }

  speak(text) {
    this.speech.speak(text);
  }

  setVoice(voice) {
    this.speech.setVoice(voice);
  }

  setLang(lang) {
    this.speech.setLang(lang);
  }
  voices() {
    this.speech.voices;
  }

  logSpeechResult() {
    if (this.speech.resultString) {
      console.log(this.speech.resultString); // Log de gesproken tekst
    }
  }
}

export { Speech };
