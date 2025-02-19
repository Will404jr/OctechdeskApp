document.addEventListener("DOMContentLoaded", () => {
  fetchMenuData();
});

async function fetchMenuData() {
  try {
    // const apiUrl = window.env.API_URL;
    const response = await fetch("http://localhost:3000/api/bank/queues");
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
    menuItem.className = "menu-item";

    const menuButton = document.createElement("button");
    menuButton.className = "menu-button";
    menuButton.textContent = item.menuItem.name;
    menuButton.setAttribute("data-menu", item.menuItem._id);

    const treeSubmenu = document.createElement("ul");
    treeSubmenu.className = "tree-submenu";
    treeSubmenu.id = `submenu-${item.menuItem._id}`;

    item.menuItem.subMenuItems.forEach((subItem) => {
      const treeSubmenuItem = document.createElement("li");
      treeSubmenuItem.className = "tree-submenu-item";

      const treeSubmenuButton = document.createElement("button");
      treeSubmenuButton.className = "tree-submenu-button";
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
  const menuButtons = document.querySelectorAll(".menu-button");

  menuButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const menuId = button.getAttribute("data-menu");
      const submenu = document.getElementById(`submenu-${menuId}`);

      document.querySelectorAll(".tree-submenu").forEach((sub) => {
        if (sub !== submenu) {
          sub.classList.remove("active");
        }
      });

      menuButtons.forEach((btn) => btn.classList.remove("active"));

      submenu.classList.toggle("active");
      button.classList.toggle("active");
    });
  });
}

async function createTicket(queueId, subItemId, issueDescription) {
  const branchId = sessionStorage.getItem("branchId");

  if (!branchId) {
    console.error("Branch ID not found in session storage");
    alert("Error: Branch ID not found. Please log in again.");
    return;
  }

  const ticketData = {
    queueId,
    subItemId,
    issueDescription,
    branchId,
  };

  try {
    const response = await fetch("http://localhost:3000/api/bank/ticket", {
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
        alert("Ticket created and printed successfully!");
        // Add page refresh after successful ticket creation and printing
        setTimeout(() => {
          window.location.reload();
        }, 1500); // Refresh after 1.5 seconds to allow the alert to be seen
      } else {
        throw new Error(printResult.error || "Printing failed");
      }
    } catch (printError) {
      console.error("Error printing ticket:", printError);
      alert(
        `Ticket was created but printing failed. Error: ${printError.message}`
      );
    }
  } catch (error) {
    console.error("Error creating ticket:", error);
    alert("Failed to create ticket. Please try again.");
  }
}
