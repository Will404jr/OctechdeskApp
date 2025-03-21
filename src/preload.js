const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  print: async (data) => {
    console.log("Preload: Sending print request", data);
    return await ipcRenderer.invoke("print-ticket", data);
  },
  getEnv: async () => {
    return await ipcRenderer.invoke("get-env");
  },
});
