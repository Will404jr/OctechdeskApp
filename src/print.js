const { BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs").promises;

class PrintService {
  constructor() {
    this.printWindow = null;
  }

  createPrintWindow() {
    if (!this.printWindow) {
      this.printWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
      });
    }
  }

  generateTicketHTML(ticketData) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 600px;
              margin: 0 auto;
            }
            .ticket-header {
              text-align: center;
              margin-bottom: 20px;
            }
            .ticket-number {
              font-size: 24px;
              font-weight: bold;
              margin: 20px 0;
            }
            .ticket-info {
              margin: 15px 0;
            }
            .ticket-footer {
              margin-top: 30px;
              text-align: center;
              font-size: 12px;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="ticket-header">
            <h1>Queue Ticket</h1>
          </div>
          <div class="divider"></div>
          <div class="ticket-number">
            Ticket #: ${ticketData.ticketNo}
          </div>
          <div class="ticket-info">
            <p><strong>Issue:</strong> ${
              ticketData.issueDescription || "N/A"
            }</p>
            <p><strong>Branch:</strong> ${ticketData.branchId || "N/A"}</p>
          </div>
          <div class="divider"></div>
          <div class="ticket-footer">
            <p>Date: ${new Date().toLocaleDateString()}</p>
            <p>Time: ${new Date().toLocaleTimeString()}</p>
          </div>
        </body>
      </html>
    `;
  }

  async printTicket(ticketData) {
    try {
      console.log("Starting print process...", ticketData);
      this.createPrintWindow();

      const ticketHTML = this.generateTicketHTML(ticketData);

      return new Promise((resolve, reject) => {
        this.printWindow.webContents.loadURL(
          `data:text/html;charset=utf-8,${encodeURIComponent(ticketHTML)}`
        );

        this.printWindow.webContents.once("did-finish-load", () => {
          const options = {
            silent: false,
            printBackground: true,
            color: true,
            margin: {
              marginType: "none",
            },
            landscape: false,
          };

          this.printWindow.webContents.print(options, (success, errorType) => {
            if (success) {
              console.log("Print job successful");
              resolve({ success: true });
            } else {
              console.error("Print failed:", errorType);
              reject(new Error(`Print failed: ${errorType}`));
            }
          });
        });

        this.printWindow.webContents.once(
          "did-fail-load",
          (_, __, errorDescription) => {
            console.error("Failed to load content:", errorDescription);
            reject(
              new Error(`Failed to load print content: ${errorDescription}`)
            );
          }
        );
      });
    } catch (error) {
      console.error("Error in printTicket:", error);
      throw error;
    }
  }

  cleanup() {
    if (this.printWindow) {
      this.printWindow.close();
      this.printWindow = null;
    }
  }
}

module.exports = new PrintService();
