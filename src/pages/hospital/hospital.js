document.addEventListener("DOMContentLoaded", () => {
  const getTicketBtn = document.getElementById("getTicketBtn");
  getTicketBtn.addEventListener("click", createTicket);
});

async function createTicket() {
  try {
    const response = await fetch("http://localhost:3000/api/hospital/ticket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to create ticket");
    }

    const result = await response.json();
    alert(`Ticket Created Successfully!\nTicket Number: ${result.ticketNo}`);
  } catch (error) {
    console.error("Error creating ticket:", error);
    alert("Failed to create ticket. Please try again.");
  }
}
