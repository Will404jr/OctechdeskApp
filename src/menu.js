let selectedLanguage = "";

document.addEventListener("DOMContentLoaded", () => {
  setupLanguageSelection();
  fetchBankSettings();
  fetchMenuData();
});

async function fetchBankSettings() {
  // Get environment variables
  const env = await window.api.getEnv();
  try {
    const response = await fetch(`${env.API_URL}/api/bank/settings`);
    if (!response.ok) {
      throw new Error("Failed to fetch bank settings");
    }

    const settings = await response.json();

    // Set the logo if available
    if (settings && settings.logoImage) {
      const bankLogos = document.querySelectorAll(
        "#bank-logo, #main-bank-logo"
      );
      bankLogos.forEach((logo) => {
        if (settings.logoImage.startsWith("/")) {
          logo.src = `${env.API_URL}${settings.logoImage}`;
        } else {
          logo.src = settings.logoImage;
        }

        if (settings.companyName) {
          logo.alt = `${settings.companyName} Logo`;
        }
      });
    } else {
      // If no logo found, use a fallback
      const bankLogos = document.querySelectorAll(
        "#bank-logo, #main-bank-logo"
      );
      bankLogos.forEach((logo) => {
        logo.src = "../../../public/1732666481406-logo.png";
      });
    }
  } catch (error) {
    console.error("Error fetching bank settings:", error);
    // Use fallback logo on error
    const bankLogos = document.querySelectorAll("#bank-logo, #main-bank-logo");
    bankLogos.forEach((logo) => {
      logo.src = "../../../public/1732666481406-logo.png";
    });
  }
}

async function fetchMenuData() {
  // Get environment variables
  const env = await window.api.getEnv();
  try {
    const response = await fetch(`${env.API_URL}/api/bank/queues`);
    const data = await response.json();
    renderMenu(data);
  } catch (error) {
    console.error("Error fetching menu data:", error);
  }
}

function renderMenu(menuData) {
  const menuContainer = document.getElementById("menu-container");
  menuContainer.innerHTML = "";

  menuData.forEach((item) => {
    const menuItem = document.createElement("div");
    menuItem.className = "w-full flex flex-col";

    const menuButton = document.createElement("button");
    menuButton.className =
      "bg-white text-darkBlue border-2 border-darkBlue py-7 px-8 text-3xl cursor-pointer text-left rounded-2xl transition-all duration-300 w-full relative overflow-hidden hover:bg-[#0e4480] hover:text-white hover:translate-y-[-3px] hover:shadow-lg";
    menuButton.textContent = item.menuItem.name;
    menuButton.setAttribute("data-menu", item.menuItem._id);

    // Create the pseudo-element effect with a div
    const pseudoElement = document.createElement("div");
    pseudoElement.className =
      "absolute top-0 left-[-100%] w-full h-full bg-[#0e4480] opacity-20 transition-all duration-300 z-[1]";
    menuButton.appendChild(pseudoElement);

    // Add event listener to handle the pseudo-element
    menuButton.addEventListener("mouseenter", () => {
      pseudoElement.style.left = "0";
    });

    menuButton.addEventListener("mouseleave", () => {
      if (!menuButton.classList.contains("active")) {
        pseudoElement.style.left = "-100%";
      }
    });

    const treeSubmenu = document.createElement("ul");
    treeSubmenu.className = "hidden mt-4 w-full p-0 list-none flex-wrap gap-4";
    treeSubmenu.id = `submenu-${item.menuItem._id}`;

    item.menuItem.subMenuItems.forEach((subItem) => {
      const treeSubmenuItem = document.createElement("li");
      treeSubmenuItem.className =
        "relative mb-0 w-[calc(50%-8px)] p-0 md:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]";

      const treeSubmenuButton = document.createElement("button");
      treeSubmenuButton.className =
        "bg-lightBlue text-white border-none py-5 px-6 text-2xl cursor-pointer text-left transition-all duration-300 rounded-lg w-full block h-full";
      treeSubmenuButton.textContent = subItem.name;
      treeSubmenuButton.setAttribute("data-id", subItem._id);
      treeSubmenuButton.addEventListener("click", () => {
        createTicket(
          item._id,
          subItem._id,
          `${item.menuItem.name} - ${subItem.name}`
        );
      });

      treeSubmenuItem.appendChild(treeSubmenuButton);
      treeSubmenu.appendChild(treeSubmenuItem);
    });

    menuItem.appendChild(menuButton);
    menuItem.appendChild(treeSubmenu);
    menuContainer.appendChild(menuItem);
  });

  addMenuListeners();
}

function addMenuListeners() {
  const menuButtons = document.querySelectorAll("[data-menu]");

  menuButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const menuId = button.getAttribute("data-menu");
      const submenu = document.getElementById(`submenu-${menuId}`);
      const pseudoElement = button.querySelector("div");

      document.querySelectorAll("ul[id^='submenu-']").forEach((sub) => {
        if (sub !== submenu) {
          sub.classList.remove("flex");
          sub.classList.add("hidden");
        }
      });

      menuButtons.forEach((btn) => {
        btn.classList.remove("active", "bg-[#0e4480]", "text-white");
        const pseudo = btn.querySelector("div");
        if (pseudo && btn !== button) {
          pseudo.style.left = "-100%";
        }
      });

      submenu.classList.toggle("hidden");
      submenu.classList.toggle("flex");
      button.classList.toggle("active");
      button.classList.toggle("bg-[#0e4480]");
      button.classList.toggle("text-white");

      if (pseudoElement) {
        if (button.classList.contains("active")) {
          pseudoElement.style.left = "0";
        } else {
          pseudoElement.style.left = "-100%";
        }
      }
    });
  });
}

// Modified alert function to auto-close for success messages
function showAlert(title, message, callback = null, autoClose = false) {
  const dialog = document.getElementById("alertDialog");
  const titleElement = document.getElementById("alertTitle");
  const messageElement = document.getElementById("alertMessage");
  const confirmBtn = document.getElementById("alertConfirm");

  titleElement.textContent = title;
  messageElement.textContent = message;
  dialog.style.display = "block";

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

function setupLanguageSelection() {
  const languageButtons = document.querySelectorAll(".language-button");
  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedLanguage = button.getAttribute("data-language");
      document.getElementById("language-selection").style.display = "none";
      document.getElementById("main-content").style.display = "flex";
      fetchMenuData();
    });
  });
}

async function createTicket(queueId, subItemId, issueDescription) {
  // Get environment variables
  const env = await window.api.getEnv();
  const branchId = sessionStorage.getItem("branchId");

  if (!branchId) {
    console.error("Branch ID not found in session storage");
    showAlert("Error", "Branch ID not found. Please log in again.");
    return;
  }

  const ticketData = {
    queueId,
    subItemId,
    issueDescription,
    branchId,
    language: selectedLanguage,
  };

  try {
    const response = await fetch(`${env.API_URL}/api/bank/ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ticketData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Ticket created:", result.data);

    // Add debug logging
    console.log("Window API object:", window.api);

    // Print the ticket
    try {
      if (!window.api || !window.api.print) {
        throw new Error("Print API not properly initialized");
      }

      const printResult = await window.api.print(result.data);
      console.log("Print result:", printResult);

      if (printResult.success) {
        console.log("Ticket printed successfully");
        // Use auto-close for success message
        showAlert(
          "Success",
          "Ticket created and printed successfully!",
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
    console.error("Error creating ticket:", error);
    showAlert("Error", "Failed to create ticket. Please try again.");
  }
}
