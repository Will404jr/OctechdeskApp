const { BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const http = require("http");
const https = require("https");

class PrintService {
  constructor() {
    this.printWindow = null;
  }

  createPrintWindow() {
    if (!this.printWindow) {
      this.printWindow = new BrowserWindow({
        width: 350, // Keeping your preferred width for preview
        height: 600,
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
      });
    }
  }

  fetchBankSettings() {
    return new Promise((resolve, reject) => {
      const apiUrl = "http://localhost:3001/api/bank/settings";
      const requester = apiUrl.startsWith("https") ? https : http;

      const req = requester.get(apiUrl, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch bank settings: ${res.statusCode}`));
          return;
        }

        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const settings = JSON.parse(data);
            resolve(settings);
          } catch (error) {
            reject(
              new Error(`Failed to parse bank settings: ${error.message}`)
            );
          }
        });
      });

      req.on("error", (error) => {
        reject(new Error(`Request error: ${error.message}`));
      });

      req.end();
    });
  }

  async getLogoUrl() {
    try {
      const settings = await this.fetchBankSettings();

      if (settings && settings.logoImage) {
        if (settings.logoImage.startsWith("/")) {
          return `http://localhost:3001${settings.logoImage}`;
        } else {
          return settings.logoImage;
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching bank settings:", error);
      return null;
    }
  }

  async generateTicketHTML(ticketData) {
    const logoUrl = await this.getLogoUrl();

    const headerHTML = logoUrl
      ? `<div class="logo-container">
          <img src="${logoUrl}" alt="Bank Logo" class="logo" />
        </div>`
      : `<div class="ticket-header">
          QUEUE TICKET
        </div>`;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0mm;
              }
              html, body {
                width: 80mm !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .ticket {
                width: 60mm !important; /* Match content width to tropical.jpg */
                margin-left: 8mm !important; /* Space from left margin to center contents */
                display: block; /* Use block layout */
                text-align: left; /* Keep content left-aligned within the offset */
              }
              .logo-container {
                width: 100%;
                text-align: left;
              }
              .logo {
                max-width: 60mm !important; /* Match ticket width */
                margin: 0;
                display: block;
              }
            }
            @media screen {
              html, body {
                width: 350px !important;
                margin: 0 auto !important;
                padding: 5px !important;
              }
              .ticket {
                width: 100 !important;
              }
              .logo {
                max-width: 280px !important;
              }
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body {
              font-family: Arial, sans-serif;
              font-size: 16px;
            }
            .ticket {
              min-height: 50mm;
              display: flex;
              flex-direction: column;
              align-items: flex-start; /* Left-aligned in preview */
              justify-content: flex-start;
            }
            .logo-container {
              width: 100%;
              text-align: left;
              margin-bottom: 5mm;
            }
            .logo {
              max-height: 20mm;
              width: auto;
              height: auto;
            }
            .ticket-header {
              width: 100%;
              text-align: left;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5mm;
            }
            .ticket-number {
              width: 100%;
              text-align: left;
              font-size: 24px;
              font-weight: bold;
              margin: 5mm 0;
            }
            .ticket-info {
              width: 100%;
              text-align: left;
              margin: 5mm 0;
            }
            .ticket-info p {
              margin: 3mm 0;
              font-size: 16px;
            }
            .ticket-footer {
              width: 100%;
              text-align: left;
              margin-top: 5mm;
            }
            .ticket-footer p {
              margin: 2mm 0;
              font-size: 14px;
            }
            .bold {
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            ${headerHTML}
            <div class="ticket-number">
              Ticket #: ${ticketData.ticketNo}
            </div>
            <div class="ticket-info">
              <p>${
                ticketData.issueDescription ||
                "Please take a seat you will be served soon!"
              }</p>
            </div>
            <div class="ticket-footer">
              <p class="bold">Date: ${new Date().toLocaleDateString()}</p>
              <p class="bold">Time: ${new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async printTicket(ticketData) {
    try {
      console.log("Starting print process...", ticketData);
      this.createPrintWindow();

      const ticketHTML = await this.generateTicketHTML(ticketData);

      return new Promise((resolve, reject) => {
        this.printWindow.webContents.loadURL(
          `data:text/html;charset=utf-8,${encodeURIComponent(ticketHTML)}`
        );

        this.printWindow.webContents.once("did-finish-load", () => {
          try {
            // Uncomment for debugging
            // this.printWindow.show();

            setTimeout(() => {
              const options = {
                silent: true,
                printBackground: true,
                color: false,
                margins: {
                  marginType: "none",
                },
                pageSize: {
                  width: 80000, // 80mm in microns
                  height: 150000, // 150mm in microns as a safe maximum
                },
                deviceName: "POS80 Printer",
                scaleFactor: 100,
                landscape: false,
              };

              console.log("Printing to POS80 Printer with options:", options);

              this.printWindow.webContents.print(
                options,
                (success, errorType) => {
                  if (success) {
                    console.log("Print job successful");
                    resolve({ success: true });
                  } else {
                    console.error("Print failed:", errorType);
                    reject(new Error(`Print failed: ${errorType}`));
                  }
                  // this.cleanup();
                }
              );
            }, 1000);
          } catch (err) {
            console.error("Error during printing:", err);
            reject(err);
          }
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
