document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      // First, check the company type
      const settingsResponse = await fetch(
        "http://localhost:3000/api/settings"
      );
      if (!settingsResponse.ok) {
        throw new Error("Failed to fetch company settings");
      }
      const settings = await settingsResponse.json();
      const companyType = settings.companyType;

      let loginUrl;
      if (companyType === "Hospital") {
        loginUrl = "http://localhost:3000/api/hospital/kiosk-login";
      } else if (companyType === "Bank") {
        loginUrl = "http://localhost:3000/api/bank/kiosk-login";
      } else {
        throw new Error("Invalid company type");
      }

      const loginResponse = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (loginResponse.ok) {
        const responseData = await loginResponse.json();
        console.log(`${companyType} kiosk login successful`);
        errorMessage.textContent = "";

        if (companyType === "Bank" && responseData.branchId) {
          // Store branchId in sessionStorage for bank logins
          sessionStorage.setItem("branchId", responseData.branchId);
        }

        // Redirect to the appropriate dashboard or main page
        window.location.href =
          companyType === "Hospital"
            ? "./pages/hospital/hospital.html"
            : "./pages/bank/menu.html";
      } else {
        // Login failed
        const errorData = await loginResponse.json();
        errorMessage.textContent =
          errorData.error || "Invalid username or password";
      }
    } catch (error) {
      console.error("Login error:", error);
      errorMessage.textContent = "An error occurred. Please try again.";
    }
  });
});

// Simulating the DOM and form submission for demonstration
const mockDocument = {
  getElementById: (id) => ({
    value: id === "username" ? "testuser" : "testpass",
    addEventListener: (event, callback) => {
      if (event === "submit") {
        callback({ preventDefault: () => {} });
      }
    },
  }),
};

global.document = mockDocument;
global.window = {
  location: { href: "" },
  sessionStorage: {
    setItem: (key, value) =>
      console.log(`Setting ${key} to ${value} in sessionStorage`),
  },
};
global.fetch = async (url, options) => {
  if (url.includes("/api/settings")) {
    return {
      ok: true,
      json: async () => ({ companyType: "Bank" }),
    };
  }
  if (url.includes("/api/bank/kiosk-login")) {
    return {
      ok: true,
      json: async () => ({
        message: "Kiosk login successful",
        branchId: "123456",
      }),
    };
  }
  throw new Error("Unexpected URL");
};

// Trigger the DOMContentLoaded event
document.addEventListener("DOMContentLoaded", () => {});

console.log("Final window.location.href:", window.location.href);
