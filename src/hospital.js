document.addEventListener("DOMContentLoaded", () => {
  fetchHospitalSettings();

  // Add event listener for the get ticket button
  const getTicketBtn = document.getElementById("getTicketBtn");
  if (getTicketBtn) {
    getTicketBtn.addEventListener("click", createTicket);
  }
});

async function fetchHospitalSettings() {
  try {
    // Get environment variables
    const env = await window.api.getEnv();

    const response = await fetch(`${env.API_URL}/api/bank/settings`);
    if (!response.ok) {
      throw new Error("Failed to fetch hospital settings");
    }

    const settings = await response.json();

    // Set the logo if available
    if (settings && settings.logoImage) {
      const logoElement = document.getElementById("main-bank-logo");
      if (logoElement) {
        // Add base URL to the relative path
        if (settings.logoImage.startsWith("/")) {
          // This is a relative path, add the base URL
          logoElement.src = `${env.API_URL}${settings.logoImage}`;
        } else {
          // This is already a full URL
          logoElement.src = settings.logoImage;
        }

        // Set alt text to company name if available
        if (settings.companyName) {
          logoElement.alt = `${settings.companyName} Logo`;
        }
      }
    } else {
      // If no logo found, use a fallback
      const logoElement = document.getElementById("main-bank-logo");
      if (logoElement) {
        logoElement.src = "../../../public/1732666481406-logo.png";
      }
    }
  } catch (error) {
    console.error("Error fetching hospital settings:", error);
    // Use fallback logo on error
    const logoElement = document.getElementById("main-bank-logo");
    if (logoElement) {
      logoElement.src = "../../../public/1732666481406-logo.png";
    }
  }
}

// Modified alert function to auto-close for success messages
function showAlert(title, message, callback = null, autoClose = false) {
  const dialog = document.getElementById("alertDialog");
  const titleElement = document.getElementById("alertTitle");
  const messageElement = document.getElementById("alertMessage");
  const confirmBtn = document.getElementById("alertConfirm");

  titleElement.textContent = title;
  messageElement.textContent = message;
  dialog.style.display = "flex";

  // Auto-close after 2 seconds if autoClose is true
  if (autoClose) {
    setTimeout(() => {
      dialog.style.display = "none";
      if (callback) callback();
    }, 2000);
  }

  confirmBtn.onclick = () => {
    dialog.style.display = "none";
    if (callback) callback();
  };
}

async function createTicket() {
  // Show loading state
  const getTicketBtn = document.getElementById("getTicketBtn");
  const buttonText = document.getElementById("buttonText");
  const loadingSpinner = document.getElementById("loadingSpinner");

  if (getTicketBtn && buttonText && loadingSpinner) {
    getTicketBtn.disabled = true;
    buttonText.textContent = "Processing...";
    loadingSpinner.classList.remove("hidden");
  }

  try {
    // Get environment variables
    const env = await window.api.getEnv();

    const response = await fetch(`${env.API_URL}/api/hospital/ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error("Failed to create ticket");
    }

    const result = await response.json();
    console.log("Hospital ticket created:", result);

    // Add debug logging
    console.log("Window API object:", window.api);

    // Print the ticket using the window.api approach
    try {
      if (!window.api || !window.api.print) {
        throw new Error("Print API not properly initialized");
      }

      const printResult = await window.api.print(result);
      console.log("Print result:", printResult);

      if (printResult.success) {
        console.log("Ticket printed successfully");
        // Use auto-close for success message
        showAlert(
          "Success",
          "Hospital ticket created and printed successfully!",
          () => {
            window.location.reload();
          },
          true // Added true for autoClose
        );
      } else {
        throw new Error(printResult.error || "Printing failed");
      }
    } catch (printError) {
      console.error("Error printing ticket:", printError);
      showAlert(
        "Printing Failed",
        `Ticket was created but printing failed. Error: ${printError.message}`
      );
    }
  } catch (error) {
    console.error("Error creating hospital ticket:", error);
    showAlert("Error", "Failed to create hospital ticket. Please try again.");
  } finally {
    // Reset button state
    if (getTicketBtn && buttonText && loadingSpinner) {
      getTicketBtn.disabled = false;
      buttonText.textContent = "Get Ticket";
      loadingSpinner.classList.add("hidden");
    }
  }
}