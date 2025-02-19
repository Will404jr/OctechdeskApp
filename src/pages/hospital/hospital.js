document.addEventListener("DOMContentLoaded", () => {
  const getTicketBtn = document.getElementById("getTicketBtn");
  getTicketBtn.addEventListener("click", createTicket);
});

async function createTicket() {
  try {
    // const apiUrl = window.env.API_URL;
    const response = await fetch(
      "https://octech-v2.vercel.app/api/hospital/ticket",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create ticket");
    }

    const result = await response.json();
    console.log("Hospital ticket created:", result);

    // Send the ticket data to be printed
    window.electron.sendToPrint({
      ticketNo: result.ticketNo,
      // Add any other relevant data from the result
      issueDescription: "Hospital Visit",
      // You might want to add a hospital-specific field here if available
    });
  } catch (error) {
    console.error("Error creating hospital ticket:", error);
    alert("Failed to create hospital ticket. Please try again.");
  }
}
