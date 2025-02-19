const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const printService = require("./print");

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets", "queue.ico"),
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Optional: Open DevTools for debugging
  mainWindow.webContents.openDevTools();
};

// Handle print requests
ipcMain.handle("print-ticket", async (_, ticketData) => {
  console.log("Main process: Received print request", ticketData);
  try {
    const result = await printService.printTicket(ticketData);
    return { success: true, ...result };
  } catch (error) {
    console.error("Error in print-ticket handler:", error);
    return { success: false, error: error.message };
  }
});

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
