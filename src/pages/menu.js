async function createTicket(queueId, subItemId, issueDescription) {
  const ticketData = {
    queueId,
    subItemId,
    issueDescription,
  };

  try {
    const response = await fetch("http://localhost:3000/api/ticket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ticketData),
    });

    if (!response.ok) {
      throw new Error("Failed to create ticket");
    }

    const result = await response.json();

    alert(
      `Ticket Created Successfully!\nTicket Number: ${result.data.ticketNo}\nIssue: ${result.data.issueDescription}`
    );
  } catch (error) {
    console.error("Error creating ticket:", error);
    alert("Failed to create ticket. Please try again.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchMenuData();
});

async function fetchMenuData() {
  try {
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
