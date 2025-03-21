const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const printService = require("./print");

// Load .env file
const envPath = path.join(
  process.env.NODE_ENV === "development"
    ? path.join(__dirname, "..") // Project root in development
    : path.join(path.dirname(process.execPath), "resources", "app"), // Production: resources/app/
  ".env"
);

const dotenv = require("dotenv");
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("Failed to load .env at", envPath, "Error:", result.error);
} else {
  console.log(
    "Loaded .env successfully from",
    envPath,
    "API_URL:",
    process.env.API_URL
  );
}

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets", "queue.ico"),
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  mainWindow.webContents.openDevTools();
};

ipcMain.handle("get-env", async () => {
  console.log("Sending API_URL to renderer:", process.env.API_URL);
  return { API_URL: process.env.API_URL };
});

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
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
