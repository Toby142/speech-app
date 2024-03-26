const langDropdown = document.getElementById("data-language-code-dropdown");
const voicesDropdown = document.getElementById("data-voices-code-dropdown");
const btn = document.getElementById("btn-dropdown");
const btnvc = document.getElementById("btn-dropdown-vc");
const txt = document.getElementById("alert-txt");
const openBtn = document.getElementById("open-menu");
const profile = document.getElementById("profile");
const uitloggen = document.getElementById("uitloggen");

profile.addEventListener("click", () => {
  uitloggen.classList.toggle("hidden");
});

btn.addEventListener("click", () => {
  langDropdown.classList.toggle("hidden");
});

openBtn.addEventListener("click", () => {
  document.getElementById("mobile-menu").classList.toggle("hidden");
});

btnvc.addEventListener("click", () => {
  voicesDropdown.classList.toggle("hidden");
});

const languageOptions = langDropdown.querySelectorAll("li");
const voicesOptions = voicesDropdown.querySelectorAll("li");

languageOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const selectedLanguageCode =
      option.querySelector("span").dataset.languageCode;
    localStorage.setItem("selectedLanguage", selectedLanguageCode);

    // Console log om te bevestigen dat de taal is opgeslagen
    console.log(`Geselecteerde taalcode: ${selectedLanguageCode}`);
    console.log(
      `localStorage["selectedLanguage"]: ${localStorage.getItem(
        "selectedLanguage"
      )}`
    );

    if (selectedLanguageCode) {
      langDropdown.classList.toggle("hidden");
      document.querySelector("#toast-success").classList.toggle("hidden");
      txt.innerHTML = `Spreek taal is succesvoll veranderd naar ${selectedLanguageCode}.`;
    }
  });
});

voicesOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const selectedVoice = option.querySelector("span").dataset.voices;
    localStorage.setItem("selectedVoice", selectedVoice);

    // Console log om te bevestigen dat de taal is opgeslagen
    console.log(`Geselecteerde spraakstem: ${selectedVoice}`);
    console.log(
      `localStorage["selectedVoice"]: ${localStorage.getItem("selectedVoice")}`
    );

    if (selectedVoice) {
      voicesDropdown.classList.toggle("hidden");
      document.querySelector("#toast-success").classList.toggle("hidden");
      txt.innerHTML = `Spreek stem is succesvoll veranderd naar ${selectedVoice}.`;
    }
  });
});

document.querySelector("#close-btn").addEventListener("click", function () {
  document.querySelector("#toast-success").classList.toggle("hidden");
});

var themeToggleDarkIcon = document.getElementById("theme-toggle-dark-icon");
var themeToggleLightIcon = document.getElementById("theme-toggle-light-icon");

// Change the icons inside the button based on previous settings
if (
  localStorage.getItem("color-theme") === "dark" ||
  (!("color-theme" in localStorage) &&
    window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
  themeToggleLightIcon.classList.remove("hidden");
} else {
  themeToggleDarkIcon.classList.remove("hidden");
}

var themeToggleBtn = document.getElementById("theme-toggle");

themeToggleBtn.addEventListener("click", function () {
  // toggle icons inside button
  themeToggleDarkIcon.classList.toggle("hidden");
  themeToggleLightIcon.classList.toggle("hidden");

  // if set via local storage previously
  if (localStorage.getItem("color-theme")) {
    if (localStorage.getItem("color-theme") === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("color-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("color-theme", "light");
    }

    // if NOT set via local storage previously
  } else {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("color-theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("color-theme", "dark");
    }
  }
});
