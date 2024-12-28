document.addEventListener("DOMContentLoaded", () => {
  const getTicketBtn = document.getElementById("getTicketBtn");
  getTicketBtn.addEventListener("click", createTicket);
});

async function createTicket() {
  const ticketData = {
    queueId: "67606ddad170da1e94ad1923", // Replace with actual queue ID
    subItemId: "67606ddad170da1e94ad1925", // Replace with actual sub-item ID
    issueDescription: "Receptionist - General Inquiry",
  };

  try {
    const response = await fetch("http://localhost:3000/api/ticket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ticketData),
    });

    if (!response.ok) {
      throw new Error("Failed to create ticket");
    }

    const result = await response.json();

    alert(
      `Ticket Created Successfully!\nTicket Number: ${result.data.ticketNo}\nIssue: ${result.data.issueDescription}`
    );
  } catch (error) {
    console.error("Error creating ticket:", error);
    alert("Failed to create ticket. Please try again.");
  }
}
