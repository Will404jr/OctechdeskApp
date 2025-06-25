document.addEventListener("DOMContentLoaded", () => {
  fetchHospitalSettings()
  initializeQueueDisplay()

  // Add event listener for the get ticket button
  const getTicketBtn = document.getElementById("getTicketBtn")
  if (getTicketBtn) {
    getTicketBtn.addEventListener("click", createTicket)
  }
})

// Queue display variables
let currentTab = "active"
let activeTickets = []
let waitingTickets = []
let heldTickets = []

async function fetchHospitalSettings() {
  try {
    // Get environment variables
    const env = await window.api.getEnv()

    const response = await fetch(`${env.API_URL}/api/bank/settings`)
    if (!response.ok) {
      throw new Error("Failed to fetch hospital settings")
    }

    const settings = await response.json()

    // Set the logo if available
    if (settings && settings.logoImage) {
      const logoElement = document.getElementById("main-bank-logo")
      if (logoElement) {
        // Add base URL to the relative path
        if (settings.logoImage.startsWith("/")) {
          // This is a relative path, add the base URL
          logoElement.src = `${env.API_URL}${settings.logoImage}`
        } else {
          // This is already a full URL
          logoElement.src = settings.logoImage
        }

        // Set alt text to company name if available
        if (settings.companyName) {
          logoElement.alt = `${settings.companyName} Logo`
        }
      }
    } else {
      // If no logo found, use a fallback
      const logoElement = document.getElementById("main-bank-logo")
      if (logoElement) {
        logoElement.src = "../../../public/1732666481406-logo.png"
      }
    }
  } catch (error) {
    console.error("Error fetching hospital settings:", error)
    // Use fallback logo on error
    const logoElement = document.getElementById("main-bank-logo")
    if (logoElement) {
      logoElement.src = "../../../public/1732666481406-logo.png"
    }
  }
}

// Initialize queue display functionality
function initializeQueueDisplay() {
  fetchQueueData()

  // Update queue data every 5 seconds
  setInterval(fetchQueueData, 5000)
}

// Fetch queue data from API
async function fetchQueueData() {
  try {
    const env = await window.api.getEnv()

    // Fetch departments and tickets
    const [departmentsRes, ticketsRes] = await Promise.all([
      fetch(`${env.API_URL}/api/hospital/department`),
      fetch(`${env.API_URL}/api/hospital/ticket?date=${new Date().toISOString().split("T")[0]}`),
    ])

    if (departmentsRes.ok && ticketsRes.ok) {
      const departments = await departmentsRes.json()
      const tickets = await ticketsRes.json()

      processQueueData(departments, tickets)
      updateQueueDisplay()
    }
  } catch (error) {
    console.error("Error fetching queue data:", error)
  }
}

// Process raw data into display format
function processQueueData(departments, tickets) {
  activeTickets = []
  waitingTickets = []
  heldTickets = []

  // Process active tickets (currently being served)
  departments.forEach((department) => {
    department.rooms.forEach((room) => {
      if (room.currentTicket) {
        const ticket = tickets.find((t) => t._id === room.currentTicket)
        if (ticket) {
          activeTickets.push({
            ticketNo: ticket.ticketNo,
            department: department.title,
            departmentIcon: department.icon || "🏥",
            roomNumber: room.roomNumber,
          })
        }
      }
    })
  })

  // Process waiting and held tickets
  tickets.forEach((ticket) => {
    if (ticket.completed) return

    const currentDept = ticket.departmentHistory?.find((history) => !history.completed)
    if (!currentDept) return

    if (ticket.held) {
      // Held tickets
      heldTickets.push({
        ticketNo: ticket.ticketNo,
        department: currentDept.department,
        departmentIcon: currentDept.icon || "🏥",
        roomNumber: currentDept.roomId ? getRoomNumber(departments, currentDept.department, currentDept.roomId) : null,
      })
    } else {
      // Waiting tickets (not being served and not held)
      const isBeingServed = currentDept.roomId && currentDept.startedAt && currentDept.actuallyStarted !== false

      if (!isBeingServed) {
        // Skip cash tickets that haven't been cleared for payment (except Reception)
        if (ticket.userType === "Cash" && currentDept.department !== "Reception") {
          if (currentDept.cashCleared !== "Cleared") {
            return
          }
        }

        waitingTickets.push({
          ticketNo: ticket.ticketNo,
          department: currentDept.department,
          departmentIcon: currentDept.icon || "🏥",
          createdAt: ticket.createdAt,
          emergency: ticket.emergency,
        })
      }
    }
  })

  // Sort waiting tickets by creation time within each department
  waitingTickets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

// Helper function to get room number
function getRoomNumber(departments, departmentName, roomId) {
  const department = departments.find((d) => d.title === departmentName)
  if (department) {
    const room = department.rooms.find((r) => r._id === roomId)
    return room ? room.roomNumber : null
  }
  return null
}

// Update the display with current data
function updateQueueDisplay() {
  // Update counters
  document.getElementById("active-count").textContent = activeTickets.length
  document.getElementById("waiting-count").textContent = waitingTickets.length
  document.getElementById("held-count").textContent = heldTickets.length

  // Update current tab display
  switch (currentTab) {
    case "active":
      displayActiveTickets()
      break
    case "waiting":
      displayWaitingTickets()
      break
    case "held":
      displayHeldTickets()
      break
  }
}

// Display active tickets
function displayActiveTickets() {
  const container = document.getElementById("active-tickets-grid")

  if (activeTickets.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-500 col-span-full">
        <div class="text-6xl mb-4">🏥</div>
        <p class="text-xl font-medium">No patients currently being served</p>
        <p class="text-sm">All service counters are available</p>
      </div>
    `
    return
  }

  container.innerHTML = activeTickets
    .map(
      (ticket) => `
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
      <div class="flex items-center justify-between mb-4">
        <div class="text-3xl font-bold text-blue-800">${ticket.ticketNo}</div>
        <div class="text-2xl">${ticket.departmentIcon}</div>
      </div>
      <div class="space-y-2">
        <div class="text-lg font-semibold text-blue-700">${ticket.department}</div>
        <div class="text-blue-600">Room ${ticket.roomNumber}</div>
      </div>
    </div>
  `,
    )
    .join("")
}

// Display waiting tickets grouped by department
function displayWaitingTickets() {
  const container = document.getElementById("waiting-tickets-grid")

  if (waitingTickets.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-500 col-span-full">
        <div class="text-6xl mb-4">⏳</div>
        <p class="text-xl font-medium">No patients waiting</p>
        <p class="text-sm">Queue is empty</p>
      </div>
    `
    return
  }

  // Group by department
  const groupedTickets = waitingTickets.reduce((acc, ticket) => {
    if (!acc[ticket.department]) {
      acc[ticket.department] = []
    }
    acc[ticket.department].push(ticket)
    return acc
  }, {})

  container.innerHTML = Object.entries(groupedTickets)
    .map(
      ([department, tickets]) => `
    <div class="bg-green-50 border border-green-200 rounded-lg p-6">
      <div class="flex items-center gap-3 mb-4 pb-3 border-b border-green-200">
        <span class="text-2xl">${tickets[0].departmentIcon}</span>
        <h3 class="text-lg font-semibold text-green-800">${department}</h3>
        <span class="ml-auto bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
          ${tickets.length} waiting
        </span>
      </div>
      
      <div class="space-y-2 max-h-64 overflow-y-auto">
        ${tickets
          .slice(0, 6)
          .map(
            (ticket, index) => `
          <div class="flex items-center justify-between p-3 rounded-md ${
            ticket.emergency
              ? "bg-red-100 border border-red-200"
              : index === 0
                ? "bg-green-100 border border-green-300"
                : "bg-white border border-green-100"
          }">
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                ticket.emergency
                  ? "bg-red-500 text-white"
                  : index === 0
                    ? "bg-green-500 text-white"
                    : "bg-gray-400 text-white"
              }">
                ${index + 1}
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xl font-bold text-gray-800">${ticket.ticketNo}</span>
                ${ticket.emergency ? '<span class="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">EMG</span>' : ""}
                ${index === 0 ? '<span class="next-badge">NEXT</span>' : ""}
              </div>
            </div>
          </div>
        `,
          )
          .join("")}
        
        ${
          tickets.length > 6
            ? `
          <div class="text-center py-2 text-gray-500">
            <p class="text-xs">+ ${tickets.length - 6} more</p>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `,
    )
    .join("")
}

// Display held tickets
function displayHeldTickets() {
  const container = document.getElementById("held-tickets-grid")

  if (heldTickets.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-500 col-span-full">
        <div class="text-6xl mb-4">⏸️</div>
        <p class="text-xl font-medium">No tickets on hold</p>
        <p class="text-sm">All patients are in normal flow</p>
      </div>
    `
    return
  }

  container.innerHTML = heldTickets
    .map(
      (ticket) => `
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
      <div class="flex items-center justify-between mb-4">
        <div class="text-3xl font-bold text-yellow-800">${ticket.ticketNo}</div>
        <div class="text-2xl">${ticket.departmentIcon}</div>
      </div>
      <div class="space-y-2">
        <div class="text-lg font-semibold text-yellow-700">${ticket.department}</div>
        ${ticket.roomNumber ? `<div class="text-yellow-600">Room ${ticket.roomNumber}</div>` : ""}
      </div>
    </div>
  `,
    )
    .join("")
}

// Tab switching functionality
function switchTab(tab) {
  currentTab = tab

  // Update tab buttons
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.className = "tab-button px-6 py-3 font-semibold text-gray-600 hover:text-gray-800"
  })

  // Hide all content
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.add("hidden")
  })

  // Show selected tab and update button
  switch (tab) {
    case "active":
      document.getElementById("tab-active").className =
        "tab-button px-6 py-3 font-semibold text-blue-600 border-b-2 border-blue-600 bg-blue-50"
      document.getElementById("content-active").classList.remove("hidden")
      displayActiveTickets()
      break
    case "waiting":
      document.getElementById("tab-waiting").className =
        "tab-button px-6 py-3 font-semibold text-green-600 border-b-2 border-green-600 bg-green-50"
      document.getElementById("content-waiting").classList.remove("hidden")
      displayWaitingTickets()
      break
    case "held":
      document.getElementById("tab-held").className =
        "tab-button px-6 py-3 font-semibold text-yellow-600 border-b-2 border-yellow-600 bg-yellow-50"
      document.getElementById("content-held").classList.remove("hidden")
      displayHeldTickets()
      break
  }
}

// Modified alert function to auto-close for success messages
function showAlert(title, message, callback = null, autoClose = false) {
  const dialog = document.getElementById("alertDialog")
  const titleElement = document.getElementById("alertTitle")
  const messageElement = document.getElementById("alertMessage")
  const confirmBtn = document.getElementById("alertConfirm")

  titleElement.textContent = title
  messageElement.textContent = message
  dialog.style.display = "flex"

  // Auto-close after 2 seconds if autoClose is true
  if (autoClose) {
    setTimeout(() => {
      dialog.style.display = "none"
      if (callback) callback()
    }, 2000)
  }

  confirmBtn.onclick = () => {
    dialog.style.display = "none"
    if (callback) callback()
  }
}

async function createTicket() {
  // Show loading state
  const getTicketBtn = document.getElementById("getTicketBtn")
  const buttonText = document.getElementById("buttonText")
  const loadingSpinner = document.getElementById("loadingSpinner")

  if (getTicketBtn && buttonText && loadingSpinner) {
    getTicketBtn.disabled = true
    buttonText.textContent = "Processing..."
    loadingSpinner.classList.remove("hidden")
  }

  try {
    // Get environment variables
    const env = await window.api.getEnv()

    const response = await fetch(`${env.API_URL}/api/hospital/ticket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      throw new Error("Failed to create ticket")
    }

    const result = await response.json()
    console.log("Hospital ticket created:", result)

    // Add debug logging
    console.log("Window API object:", window.api)

    // Print the ticket using the window.api approach
    try {
      if (!window.api || !window.api.print) {
        throw new Error("Print API not properly initialized")
      }

      const printResult = await window.api.print(result)
      console.log("Print result:", printResult)

      if (printResult.success) {
        console.log("Ticket printed successfully")
        // Use auto-close for success message
        showAlert(
          "Success",
          "Hospital ticket created and printed successfully!",
          () => {
            // Refresh queue data after creating ticket
            fetchQueueData()
          },
          true, // Added true for autoClose
        )
      } else {
        throw new Error(printResult.error || "Printing failed")
      }
    } catch (printError) {
      console.error("Error printing ticket:", printError)
      showAlert("Printing Failed", `Ticket was created but printing failed. Error: ${printError.message}`)
    }
  } catch (error) {
    console.error("Error creating hospital ticket:", error)
    showAlert("Error", "Failed to create hospital ticket. Please try again.")
  } finally {
    // Reset button state
    if (getTicketBtn && buttonText && loadingSpinner) {
      getTicketBtn.disabled = false
      buttonText.textContent = "Get Ticket"
      loadingSpinner.classList.add("hidden")
    }
  }
}
