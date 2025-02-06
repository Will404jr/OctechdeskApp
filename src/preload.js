const { contextBridge, ipcRenderer } = require("electron");
require("dotenv").config(); // Load env file

contextBridge.exposeInMainWorld("env", {
  API_URL: process.env.API_URL,
});

contextBridge.exposeInMainWorld("electron", {
  sendToMain: (channel, data) => ipcRenderer.send(channel, data),
  onPrintRequest: (channel, callback) => ipcRenderer.on(channel, callback),
});
