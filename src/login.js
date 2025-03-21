document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");
  const loginButton = document.getElementById("loginButton");
  const loginText = document.getElementById("loginText");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  // Password visibility toggle
  togglePassword.addEventListener("click", () => {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);
    togglePassword.querySelector("i").classList.toggle("fa-eye");
    togglePassword.querySelector("i").classList.toggle("fa-eye-slash");
  });

  // Get environment variables
  let env;
  try {
    env = await window.api.getEnv();
    console.log("Renderer received env:", env); // Debug
  } catch (error) {
    console.error("Failed to fetch env:", error);
    errorMessage.textContent =
      "Configuration error: Unable to load environment";
    return;
  }

  // Validate env.API_URL
  if (!env || !env.API_URL) {
    console.error("API_URL is missing or undefined");
    errorMessage.textContent = "Configuration error: API URL not set";
    return;
  }

  // Define endpoints as constants
  const SETTINGS_ENDPOINT = "/api/settings";
  const HOSPITAL_LOGIN_ENDPOINT = "/api/hospital/kiosk-login";
  const BANK_LOGIN_ENDPOINT = "/api/bank/kiosk-login";

  // Function to show loading state
  function showLoading() {
    loginText.textContent = "Logging in...";
    loadingSpinner.classList.remove("hidden");
    loginButton.disabled = true;
    loginButton.classList.add("opacity-75");
  }

  // Function to hide loading state
  function hideLoading() {
    loginText.textContent = "Log In";
    loadingSpinner.classList.add("hidden");
    loginButton.disabled = false;
    loginButton.classList.remove("opacity-75");
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    showLoading();
    errorMessage.textContent = "";

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const settingsUrl = `${env.API_URL}${SETTINGS_ENDPOINT}`;
      console.log("Fetching settings from:", settingsUrl); // Debug
      const settingsResponse = await fetch(settingsUrl);

      if (!settingsResponse.ok) {
        const errorText = await settingsResponse.text();
        throw new Error(
          `Failed to fetch company settings: ${settingsResponse.status} - ${errorText}`
        );
      }

      const settings = await settingsResponse.json();
      console.log("Settings received:", settings); // Debug
      const companyType = settings.companyType;

      let loginUrl;
      if (companyType === "Hospital") {
        loginUrl = `${env.API_URL}${HOSPITAL_LOGIN_ENDPOINT}`;
      } else if (companyType === "Bank") {
        loginUrl = `${env.API_URL}${BANK_LOGIN_ENDPOINT}`;
      } else {
        throw new Error("Invalid company type");
      }

      console.log("Logging in at:", loginUrl); // Debug
      const loginResponse = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (loginResponse.ok) {
        const responseData = await loginResponse.json();
        console.log(`${companyType} kiosk login successful:`, responseData); // Debug
        errorMessage.textContent = "";

        if (companyType === "Bank" && responseData.branchId) {
          sessionStorage.setItem("branchId", responseData.branchId);
        }

        window.location.href =
          companyType === "Hospital"
            ? "./pages/hospital/hospital.html"
            : "./pages/bank/menu.html";
      } else {
        const errorData = await loginResponse.json();
        console.error("Login failed:", errorData); // Debug
        errorMessage.textContent =
          errorData.error || "Invalid username or password";
        hideLoading();
      }
    } catch (error) {
      console.error("Login error:", error);
      errorMessage.textContent = "An error occurred. Please try again.";
      hideLoading();
    }
  });
});
