const { ipcMain } = require("electron");

function printTicket(ticketData, win) {
  win.webContents.send("print-ticket", ticketData);
}

ipcMain.on("trigger-print", (event) => {
  const win = event.sender;
  const printOptions = {
    silent: true,
    printBackground: true,
    margin: { marginType: "printableArea" },
    landscape: false,
    pagesPerSheet: 1,
    collate: false,
    copies: 1,
  };

  win.print(printOptions, (success, failureReason) => {
    if (!success) console.error("Print failed:", failureReason);
  });
});

module.exports = { printTicket };
