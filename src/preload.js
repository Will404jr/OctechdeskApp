const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld("api", {
  print: async (data) => {
    console.log("Preload: Sending print request", data);
    return await ipcRenderer.invoke("print-ticket", data);
  },
});
