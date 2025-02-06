const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
require("dotenv").config();

let printWindow;

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets", "queue.ico"),
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Print window
  printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  printWindow.loadFile(path.join(__dirname, "print.html"));
};

// Listen for print requests from the renderer process
ipcMain.on("request-print", (event, ticketData) => {
  console.log("Printing ticket:", ticketData); // Debug log

  // Prepare the ticket content as an HTML string
  const ticketContent = `
    <h1>Ticket Number: ${ticketData.ticketNo}</h1>
    <p><strong>Issue:</strong> ${ticketData.issueDescription}</p>
    <p><strong>Branch:</strong> ${ticketData.branchId}</p>
    <footer><small>Generated on ${new Date(
      ticketData.createdAt
    ).toLocaleString()}</small></footer>
  `;

  console.log("Ticket content to print:", ticketContent); // Debugging HTML content

  // Send the HTML content to the print window
  printTicket(ticketContent);
});

// Function to send ticket content to print window
function printTicket(ticketContent) {
  if (!printWindow) {
    console.error("Print window is not available!");
    return;
  }

  // Send the HTML content to the print window
  printWindow.webContents.send("on-print", ticketContent);

  // Trigger the print on the window
  printWindow.webContents.print(
    {
      silent: true,
      show: true,
      printBackground: true,
      margin: { marginType: "printableArea" },
      landscape: false,
      pagesPerSheet: 1,
      collate: false,
      copies: 1,
    },
    (success, failureReason) => {
      if (!success) {
        console.log("Failed to print:", failureReason);
      } else {
        console.log("Printing successful");
      }
    }
  );
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
