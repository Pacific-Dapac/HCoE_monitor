// script.js (Merged and Updated Version)

document.addEventListener("DOMContentLoaded", () => {
  // ===== BACKGROUND DOTS INITIATION =====
  const backgroundDots = document.getElementById("background-dots");
  const numberOfDots = 100;
  const whiteDotRatio = 0.8; // 80% white, 20% dark green

  function initDots() {
    backgroundDots.innerHTML = ""; // Clear existing dots on re-init
    for (let i = 0; i < numberOfDots; i++) {
      const dot = document.createElement("div");
      dot.classList.add("dot");
      if (Math.random() >= whiteDotRatio) {
        dot.classList.add("dark-green"); // Assign dark green class based on ratio
      }

      // Set initial position randomly within the viewport
      dot.style.left = `${Math.random() * window.innerWidth}px`;
      dot.style.top = `${Math.random() * window.innerHeight}px`;

      // Set random size
      const size = Math.random() * 10 + 5; // Size between 5px and 15px
      dot.style.width = `${size}px`;
      dot.style.height = dot.style.width; // Keep it circular

      // Set random animation duration and delay to stagger
      dot.style.animationDuration = `${Math.random() * 15 + 10}s`; // Duration between 10s and 25s
      dot.style.animationDelay = `${(Math.random() * numberOfDots) / 2}s`; // Stagger delays

      // Set random end position for the animation (using CSS variables defined in style.css)
      dot.style.setProperty(
        "--end-x",
        `${(Math.random() - 0.5) * window.innerWidth * 1.5}px`
      );
      dot.style.setProperty(
        "--end-y",
        `${(Math.random() - 0.5) * window.innerHeight * 1.5}px`
      );

      backgroundDots.appendChild(dot);
    }
  }

  initDots(); // Initialize dots on page load

  // Global variables for main content area and HTML templates
  const mainContent = document.getElementById("main-content");
  const navbar = document.getElementById("navbar"); // Get navbar element [cite: 1, 2]
  const footer = document.getElementById("footer"); // Get footer element [cite: 1, 2]

  const homeTemplate = document.getElementById("home-template");
  const exploreTemplate = document.getElementById("explore-template");
  const supportTemplate = document.getElementById("support-template");
  const reportsTemplate = document.getElementById("reports-template");
  const dashboardTemplate = document.getElementById("dashboard-template");
  const devicesTemplate = document.getElementById("devices-template");
  const notificationsTemplate = document.getElementById(
    "notifications-template"
  );
  const loginTemplate = document.getElementById("login-template");

  // Chart instances to destroy them when navigating away
  let temperatureChartInstance = null;
  let humidityChartInstance = null;

  // Variable to manage the slideshow interval (if active)
  let slideshowInterval = null;
  let unreadNotificationsCount = 0; // Initialize badge count

  // ===== USER DATA (Simulating Excel Sheet) =====
  // In a real application, this would come from a secure server-side database.
  // For client-side demonstration, we use a simple array.
  const USERS = [
    { email: "pacificibyiks@gmail.com", password: "13" },
    { email: "vaillantdavid5@gmail.com", password: "1234" },
    { email: "test@test.com", password: "password" },
  ];

  // MODIFIED: Use sessionStorage for login state (clears on tab/browser close)
  let isLoggedIn = sessionStorage.getItem("loggedIn") === "true"; // Track login status

  // ===== ThingSpeak Configuration =====
  // These should be replaced with your actual ThingSpeak Channel ID and Read API Key
  const TS_CHANNEL_ID = "2924457"; // Your ThingSpeak Channel ID
  const TS_READ_API_KEY = "UTZRMTVCF97GXIE8"; // Your ThingSpeak Read API Key
  const TS_BASE_URL = `https://api.thingspeak.com/channels/${TS_CHANNEL_ID}`;

  // ===== Helper Function to Fetch ThingSpeak Data =====
  async function fetchThingSpeakData(params = "") {
    const url = `${TS_BASE_URL}/feeds.json?api_key=${TS_READ_API_KEY}&${params}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `ThingSpeak API Error: ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();
      return data.feeds;
    } catch (error) {
      console.error("Failed to fetch ThingSpeak data:", error);
      return null;
    }
  }

  // ===== Render Functions (Existing and New) =====

  // Central function to clear content and stop intervals/destroy charts before rendering new content
  function clearMainContentAndIntervals() {
    if (slideshowInterval) {
      clearInterval(slideshowInterval);
      slideshowInterval = null;
    }
    // Destroy chart instances if they exist
    if (temperatureChartInstance) {
      temperatureChartInstance.destroy();
      temperatureChartInstance = null;
    }
    if (humidityChartInstance) {
      humidityChartInstance.destroy();
      humidityChartInstance = null;
    }
    mainContent.innerHTML = ""; // Clear existing content
  }

  // NEW: Function to display or hide the main application UI
  function toggleAppUI(show) {
    // Navbar and footer are hidden/shown based on login status
    if (navbar) navbar.style.display = show ? "flex" : "none";
    if (footer) footer.style.display = show ? "flex" : "none";
    if (mainContent) mainContent.style.display = show ? "block" : "none";
    // Adjust main-content display style only when showing app UI
    if (show && mainContent) {
      mainContent.style.justifyContent = ""; // Reset for block display
      mainContent.style.alignItems = ""; // Reset for block display
      mainContent.style.marginTop = "100px"; // Restore margin for regular content
      mainContent.style.marginBottom = "70px"; // Restore margin for regular content
    }
  }

  // NEW: Render Login Page
  function renderLogin() {
    clearMainContentAndIntervals();
    toggleAppUI(false); // Hide app UI components
    if (loginTemplate) {
      // Set main-content to flex for centering login box
      mainContent.style.display = "flex";
      mainContent.style.justifyContent = "center";
      mainContent.style.alignItems = "center";
      mainContent.style.marginTop = "0"; // Remove top margin for centering
      mainContent.style.marginBottom = "0"; // Remove bottom margin for centering
      mainContent.appendChild(loginTemplate.content.cloneNode(true));

      const loginForm = document.getElementById("login-form");
      const loginMessage = document.getElementById("login-message");

      if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const email = document.getElementById("email").value;
          const password = document.getElementById("password").value;
          handleLogin(email, password, loginMessage);
        });
      }
    } else {
      mainContent.innerHTML = "<p>Login template not found.</p>";
    }
  }

  // NEW: Handle Login Attempt
  function handleLogin(email, password, messageElement) {
    const user = USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (user) {
      isLoggedIn = true;
      sessionStorage.setItem("loggedIn", "true"); // Changed to sessionStorage
      messageElement.textContent = ""; // Clear any previous error
      toggleAppUI(true); // Show app UI
      renderHome(); // Redirect to home on successful login
    } else {
      messageElement.textContent = "Invalid email or password.";
      isLoggedIn = false;
      sessionStorage.removeItem("loggedIn"); // Ensure state is false
    }
  }

  function renderHome() {
    clearMainContentAndIntervals();
    toggleAppUI(true); // Ensure app UI is visible
    if (homeTemplate) {
      const clonedContent = homeTemplate.content.cloneNode(true);
      const wrapperDiv = document.createElement("div");
      wrapperDiv.className = "content-section-layout";
      Array.from(clonedContent.children).forEach((child) =>
        wrapperDiv.appendChild(child)
      );
      mainContent.appendChild(wrapperDiv);
    } else {
      mainContent.innerHTML = "<p>Home content template not found.</p>";
    }
  }

  function renderExplore() {
    clearMainContentAndIntervals();
    if (exploreTemplate) {
      const clonedContent = exploreTemplate.content.cloneNode(true);
      const wrapperDiv = document.createElement("div");
      wrapperDiv.className = "content-section-layout";
      Array.from(clonedContent.children).forEach((child) =>
        wrapperDiv.appendChild(child)
      );
      mainContent.appendChild(wrapperDiv);
      startSlideshow(); // Start slideshow specifically for the explore section
    } else {
      mainContent.innerHTML = "<p>Explore content template not found.</p>";
    }
  }

  function renderSupport() {
    clearMainContentAndIntervals();
    if (supportTemplate) {
      const clonedContent = supportTemplate.content.cloneNode(true);
      const wrapperDiv = document.createElement("div");
      wrapperDiv.className = "content-section-layout";
      Array.from(clonedContent.children).forEach((child) =>
        wrapperDiv.appendChild(child)
      );
      mainContent.appendChild(wrapperDiv);
    } else {
      mainContent.innerHTML = "<p>Support content template not found.</p>";
    }
  }

  function renderReports() {
    clearMainContentAndIntervals();
    if (reportsTemplate) {
      mainContent.appendChild(reportsTemplate.content.cloneNode(true));
      setupDocumentUpload(); // Setup upload logic for reports section
    } else {
      mainContent.innerHTML = "<p>Reports content template not found.</p>";
    }
  }

  async function renderDashboard() {
    clearMainContentAndIntervals();
    if (dashboardTemplate) {
      mainContent.appendChild(dashboardTemplate.content.cloneNode(true));

      const latestFeeds = await fetchThingSpeakData("results=1");
      if (latestFeeds && latestFeeds.length > 0) {
        const latestData = latestFeeds[0];
        document.getElementById("hc-temp").textContent =
          latestData.field1 || "N/A";
        document.getElementById("hc-humidity").textContent =
          latestData.field3 || "N/A";
        document.getElementById("nursery-temp").textContent =
          latestData.field2 || "N/A";
        document.getElementById("nursery-humidity").textContent =
          latestData.field4 || "N/A";
      } else {
        document.getElementById("hc-temp").textContent = "Error";
        document.getElementById("hc-humidity").textContent = "Error";
        document.getElementById("nursery-temp").textContent = "Error";
        document.getElementById("nursery-humidity").textContent = "Error";
      }

      const chartFeeds = await fetchThingSpeakData("minutes=120&timescale=15");
      if (chartFeeds && chartFeeds.length > 0) {
        const labels = chartFeeds.map((feed) =>
          new Date(feed.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );

        const tempCtx = document
          .getElementById("temperatureChart")
          .getContext("2d");
        temperatureChartInstance = new Chart(tempCtx, {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Healing Chamber Temp (°C)",
                data: chartFeeds.map((feed) => parseFloat(feed.field1) || null),
                borderColor: "rgb(0, 150, 136)", // Teal
                backgroundColor: "rgb(0, 150, 136)",
                tension: 0.2,
                fill: false,
                pointRadius: 3,
                pointBackgroundColor: "rgb(0, 150, 136)",
              },
              {
                label: "Nursery Temp (°C)",
                data: chartFeeds.map((feed) => parseFloat(feed.field2) || null),
                borderColor: "rgb(255, 87, 34)", // Deep Orange
                backgroundColor: "rgb(255, 87, 34)",
                tension: 0.2,
                fill: false,
                pointRadius: 3,
                pointBackgroundColor: "rgb(255, 87, 34)",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: false,
                min: 0, // As per PDF [cite: 2]
                max: 35, // As per PDF [cite: 2]
                ticks: { color: "#000000" }, // Changed to black
                grid: { color: "rgba(18, 10, 10, 0.14)" },
              },
              x: {
                ticks: { color: "#000000" }, // Changed to black
                grid: { color: "rgba(233, 227, 227, 0)" },
              },
            },
            plugins: {
              legend: { labels: { color: "#000000" } }, // Changed to black
              annotation: {
                annotations: {
                  recommendedTempArea: {
                    type: "box",
                    yMin: 20, // Recommended Temp Min [cite: 2]
                    yMax: 30, // Recommended Temp Max [cite: 2]
                    backgroundColor: "rgba(144, 238, 144, 0.2)", // Light green, semi-transparent
                    borderColor: "rgba(144, 238, 144, 0.4)",
                    borderWidth: 1,
                  },
                },
              },
            },
            color: "#000000", // Default text color for chart elements
          },
        });

        const humidityCtx = document
          .getElementById("humidityChart")
          .getContext("2d");
        humidityChartInstance = new Chart(humidityCtx, {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Healing Chamber RH (%)",
                data: chartFeeds.map((feed) => parseFloat(feed.field3) || null),
                borderColor: "rgb(0, 150, 136)", // Teal
                backgroundColor: "rgb(0, 150, 136)",
                tension: 0.2,
                fill: false,
                pointRadius: 3,
                pointBackgroundColor: "rgb(0, 150, 136)",
              },
              {
                label: "Nursery RH (%)",
                data: chartFeeds.map((feed) => parseFloat(feed.field4) || null),
                borderColor: "rgb(255, 87, 34)", // Deep Orange
                backgroundColor: "rgb(255, 87, 34)",
                tension: 0.2,
                fill: false,
                pointRadius: 3,
                pointBackgroundColor: "rgb(255, 87, 34)",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: false,
                min: 0, // As per PDF [cite: 3]
                max: 105, // As per PDF [cite: 3]
                ticks: { color: "#000000" }, // Changed to black
                grid: { color: "rgba(30, 26, 26, 0.19)" },
              },
              x: {
                ticks: { color: "#000000" }, // Changed to black
                grid: { color: "rgba(255, 255, 255, 0.13)" },
              },
            },
            plugins: {
              legend: { labels: { color: "#000000" } }, // Changed to black
              annotation: {
                annotations: {
                  recommendedRhArea: {
                    type: "box",
                    yMin: 70, // Interpreted Recommended RH Min
                    yMax: 100, // Interpreted Recommended RH Max (PDF shows a wider range up to 100 for HC)
                    backgroundColor: "rgba(135, 206, 250, 0.2)",
                    borderColor: "rgba(135, 206, 250, 0.4)",
                    borderWidth: 1,
                  },
                },
              },
            },
            color: "#000000", // Default text color for chart elements
          },
        });
      } else {
        console.warn("No ThingSpeak data found for dashboard charts.");
        // Display error messages or empty states for charts if data fetch fails
        const tempChartContainer =
          mainContent.querySelector("#temperatureChart");
        const humidityChartContainer =
          mainContent.querySelector("#humidityChart");
        if (tempChartContainer && tempChartContainer.parentElement)
          tempChartContainer.parentElement.innerHTML =
            "<p style='color:#000000;'>Could not load temperature chart data.</p>";
        if (humidityChartContainer && humidityChartContainer.parentElement)
          humidityChartContainer.parentElement.innerHTML =
            "<p style='color:#000000;'>Could not load humidity chart data.</p>";
      }
    } else {
      mainContent.innerHTML = "<p>Dashboard content template not found.</p>";
    }
  }

  async function renderDevices() {
    clearMainContentAndIntervals();
    if (devicesTemplate) {
      mainContent.appendChild(devicesTemplate.content.cloneNode(true));

      const latestFeeds = await fetchThingSpeakData("results=1");
      const updateDeviceStatus = (elementId, status) => {
        const el = document.getElementById(elementId);
        if (el) {
          el.textContent = status;
          el.className = `device-status-value ${status}`;
        }
      };
      const updateLastUpdate = (elementId, date) => {
        const el = document.getElementById(elementId);
        if (el) el.textContent = date ? date.toLocaleString() : "N/A";
      };

      if (latestFeeds && latestFeeds.length > 0) {
        const latestData = latestFeeds[0];
        const now = new Date();
        const lastUpdateDate = latestData.created_at
          ? new Date(latestData.created_at)
          : null;
        const timeSinceLastUpdate = lastUpdateDate
          ? now.getTime() - lastUpdateDate.getTime()
          : Infinity;

        const isSensorConsideredActive = (value) =>
          parseFloat(value) > 0 && timeSinceLastUpdate <= 60000;

        const hcTempValue = latestData.field1
          ? parseFloat(latestData.field1)
          : null;
        const nurseryTempValue = latestData.field2
          ? parseFloat(latestData.field2)
          : null;
        const hcHumidityValue = latestData.field3
          ? parseFloat(latestData.field3)
          : null;

        updateDeviceStatus(
          "sensor1-status",
          isSensorConsideredActive(hcTempValue) ? "ON" : "OFF"
        );
        updateLastUpdate("sensor1-last-update", lastUpdateDate);
        updateDeviceStatus(
          "sensor2-status",
          isSensorConsideredActive(nurseryTempValue) ? "ON" : "OFF"
        );
        updateLastUpdate("sensor2-last-update", lastUpdateDate);

        updateDeviceStatus(
          "fan-status",
          hcTempValue !== null && hcTempValue > 20 ? "ON" : "OFF"
        );
        updateDeviceStatus(
          "humidifier-status",
          hcHumidityValue !== null && hcHumidityValue < 95 ? "ON" : "OFF"
        );
      } else {
        [
          "sensor1-status",
          "sensor2-status",
          "fan-status",
          "humidifier-status",
        ].forEach((id) => updateDeviceStatus(id, "Error"));
        ["sensor1-last-update", "sensor2-last-update"].forEach((id) =>
          updateLastUpdate(id, null)
        );
      }
    } else {
      mainContent.innerHTML = "<p>Devices content template not found.</p>";
    }
  }

  async function renderNotifications() {
    clearMainContentAndIntervals();
    if (notificationsTemplate) {
      mainContent.appendChild(notificationsTemplate.content.cloneNode(true));
      const notificationsList = document.getElementById("notifications-list");
      const notificationBadge = document.querySelector(".notification-badge");
      notificationsList.innerHTML = "";
      unreadNotificationsCount = 0;

      const latestFeeds = await fetchThingSpeakData("results=1");

      const addNotificationItem = (message, action) => {
        unreadNotificationsCount++;
        const li = document.createElement("li");
        li.className = "notification-item";

        li.innerHTML = `
            <div class="notification-message">
                <span>${message}</span>
                <span class="recommended-action">Action: ${action}</span>
            </div>
            <div class="notification-actions">
                <button class="mark-read-btn">Mark as Read</button>
            </div>
        `;

        li.querySelector(".mark-read-btn").onclick = function () {
          if (!li.classList.contains("read")) {
            unreadNotificationsCount--;
          }
          li.classList.add("read");
          this.disabled = true;
          this.textContent = "Read";
          updateNotificationBadge();
        };
        notificationsList.appendChild(li);
      };

      const updateNotificationBadge = () => {
        if (notificationBadge) {
          notificationBadge.textContent =
            unreadNotificationsCount > 0 ? unreadNotificationsCount : "0";
        }
      };

      if (latestFeeds && latestFeeds.length > 0) {
        const latestData = latestFeeds[0];
        const now = new Date();
        const lastUpdateDate = latestData.created_at
          ? new Date(latestData.created_at)
          : null;
        const timeSinceLastUpdate = lastUpdateDate
          ? now.getTime() - lastUpdateDate.getTime()
          : Infinity;

        const hcTempValue = latestData.field1
          ? parseFloat(latestData.field1)
          : null;
        const nurseryTempValue = latestData.field2
          ? parseFloat(latestData.field2)
          : null;
        const hcHumidityValue = latestData.field3
          ? parseFloat(latestData.field3)
          : null;
        const nurseryHumidityValue = latestData.field4
          ? parseFloat(latestData.field4)
          : null;

        const isSensorConsideredActive = (value) =>
          parseFloat(value) > 0 && timeSinceLastUpdate <= 60000;

        // --- Define Common Actions ---
        const resetNodeMCUAction = "Reset the NodeMCU board.";
        const checkPhysicalConnectionsAction =
          "Close the door or other openings of the Healing chamber and Plug well the Humidifier and Fan adaptors well.";
        const checkConnectivityAction =
          "Check the Wi-Fi connection and check the circuit breakers at the power control panel.";

        // --- Notification Logic (Healing Chamber Only) ---

        // 1. Healing Chamber Sensor OFF/Not Updating/Reading Zero [cite: 3]
        const isHCSensorActive =
          isSensorConsideredActive(hcTempValue) &&
          isSensorConsideredActive(hcHumidityValue);
        if (!isHCSensorActive) {
          addNotificationItem(
            "Healing Chamber Sensor is OFF or not updating.",
            resetNodeMCUAction
          );
        } else {
          // Proceed with temp/humidity checks only if sensor is active and updating
          // 2. Healing Chamber Temperature Alerts [cite: 4]
          if (hcTempValue !== null) {
            if (hcTempValue > 30) {
              addNotificationItem(
                `Alert: Healing Chamber Temp HIGH: ${hcTempValue}°C (>30°C)`,
                checkPhysicalConnectionsAction
              );
            } else if (hcTempValue < 20) {
              addNotificationItem(
                `Alert: Healing Chamber Temp LOW: ${hcTempValue}°C (<20°C)`,
                checkPhysicalConnectionsAction
              );
            }
          } else {
            // Data is null despite sensor being 'active' - indicates a specific issue
            addNotificationItem(
              "Healing Chamber Temperature data not available.",
              checkConnectivityAction
            );
          }

          // 3. Healing Chamber Humidity Alerts [cite: 4]
          if (hcHumidityValue !== null) {
            if (hcHumidityValue < 75) {
              addNotificationItem(
                `Alert: Healing Chamber Humidity LOW: ${hcHumidityValue}% (<75%)`,
                checkPhysicalConnectionsAction
              );
            } else if (hcHumidityValue > 100) {
              addNotificationItem(
                `Alert: Healing Chamber Humidity HIGH: ${hcHumidityValue}% (>100%)`,
                checkPhysicalConnectionsAction
              );
            }
          } else {
            // Data is null despite sensor being 'active'
            addNotificationItem(
              "Healing Chamber Humidity data not available.",
              checkConnectivityAction
            );
          }
        }

        // 4. General connectivity alert if NO data is fetched AT ALL [cite: 4]
        if (!latestFeeds || latestFeeds.length === 0) {
          addNotificationItem(
            "No data received from ThingSpeak. Check device connectivity and power.",
            checkConnectivityAction
          );
        }
      } else {
        // Fallback if initial fetch fails completely or returns empty array
        addNotificationItem(
          "Could not fetch any data from ThingSpeak.",
          checkConnectivityAction
        );
      }

      updateNotificationBadge(); // Initial badge update after processing

      // Display "No current notifications." only if no alerts were added
      if (
        notificationsList.children.length === 0 &&
        unreadNotificationsCount === 0
      ) {
        const li = document.createElement("li");
        li.textContent = "No current notifications.";
        li.style.justifyContent = "center";
        notificationsList.appendChild(li);
      }
    } else {
      mainContent.innerHTML =
        "<p>Notifications content template not found.</p>";
    }
  }

  // ===== Slideshow Logic (Existing Code, ensure it's complete) =====
  function startSlideshow() {
    if (slideshowInterval) {
      clearInterval(slideshowInterval);
      slideshowInterval = null;
    }
    const slides = mainContent.querySelectorAll(".slide");
    let currentSlide = 0;

    if (slides.length === 0) {
      console.warn(
        "Slideshow: No elements with class 'slide' found in the current view."
      );
      return;
    }

    slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === currentSlide);
    });

    slideshowInterval = setInterval(() => {
      if (slides.length > 0) {
        slides[currentSlide].classList.remove("active");
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add("active");
      } else {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
      }
    }, 3000);
  }

  // ===== Document Upload Logic (Existing Code, ensure it's complete) =====
  function setupDocumentUpload() {
    const dropZone = mainContent.querySelector("#drop-zone");
    const fileInput = mainContent.querySelector("#file-input");
    const documentList = mainContent.querySelector("#document-list");

    if (!dropZone || !fileInput || !documentList) {
      console.warn(
        "Document upload elements not found in the current view. Skipping setup."
      );
      return;
    }

    loadDocuments(); // Load documents from localStorage on setup

    dropZone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", handleFiles);

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "#3cb371";
      dropZone.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.style.borderColor = "rgba(255, 255, 255, 0.5)";
      dropZone.style.backgroundColor = "transparent";
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "rgba(255, 255, 255, 0.5)";
      dropZone.style.backgroundColor = "transparent";

      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFiles({ target: fileInput });
      }
    });

    function handleFiles(event) {
      const files = event.target.files;
      if (!files.length) return;

      for (let i = 0; i < files.length; i++) {
        addDocumentToList(files[i]);
      }
      saveDocuments();
    }

    function addDocumentToList(file) {
      const documentItem = document.createElement("div");
      documentItem.className = "document-item";

      const fileType = getFileType(file.name);
      const iconClass = getIconClass(fileType);

      documentItem.innerHTML = `
            <div class="document-info">
                <i class="document-icon ${iconClass}"></i>
                <span class="document-name">${file.name}</span>
                <span class="document-size">${formatFileSize(file.size)}</span>
            </div>
            <div class="document-actions">
                <button class="download-btn">Download</button>
                <button class="delete-btn">Delete.</button>
            </div>
        `;

      documentItem
        .querySelector(".download-btn")
        .addEventListener("click", () => {
          downloadFile(file);
        });

      documentItem
        .querySelector(".delete-btn")
        .addEventListener("click", function () {
          this.closest(".document-item").remove();
          saveDocuments();
        });

      if (documentList) {
        documentList.insertBefore(documentItem, documentList.firstChild);
      } else {
        console.warn("Document list element not found for adding document.");
      }
    }

    function getFileType(filename) {
      const extension = filename.split(".").pop().toLowerCase();
      if (["doc", "docx"].includes(extension)) return "word";
      if (["xls", "xlsx"].includes(extension)) return "excel";
      if (["jpg", "jpeg", "png", "gif"].includes(extension)) return "image";
      if (extension === "pdf") return "pdf";
      return "file";
    }

    function getIconClass(fileType) {
      switch (fileType) {
        case "word":
          return "fas fa-file-word";
        case "excel":
          return "fas fa-file-excel";
        case "image":
          return "fas fa-file-image";
        case "pdf":
          return "fas fa-file-pdf";
        default:
          return "fas fa-file";
      }
    }

    function formatFileSize(bytes) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    function downloadFile(file) {
      const a = document.createElement("a");
      const url = URL.createObjectURL(file);
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    }

    function saveDocuments() {
      if (!documentList) return;
      const items = Array.from(documentList.children).map((item) => {
        const nameElement = item.querySelector(".document-name");
        const sizeElement = item.querySelector(".document-size");
        const iconElement = item.querySelector(".document-icon");

        return {
          name: nameElement ? nameElement.textContent : "",
          size: sizeElement ? sizeElement.textContent : "",
          type: iconElement
            ? (iconElement.className.split(" ")[2] || "fa-file").replace(
                "fa-file-",
                ""
              )
            : "file",
        };
      });
      localStorage.setItem("documents", JSON.stringify(items));
    }

    function loadDocuments() {
      if (!documentList) return;
      const savedDocuments =
        JSON.parse(localStorage.getItem("documents")) || [];
      documentList.innerHTML = "";
      savedDocuments.forEach((doc) => {
        const fileSizeInBytes = parseFileSize(doc.size);
        const mockFile = new File([""], doc.name, {
          type: "application/octet-stream",
          lastModified: Date.now(),
        });
        Object.defineProperty(mockFile, "size", {
          value: fileSizeInBytes,
          writable: false,
        });
        addDocumentToList(mockFile);
      });
    }

    function parseFileSize(sizeString) {
      if (!sizeString) return 0;
      const parts = sizeString.match(/([\d.]+)\s*(Bytes|KB|MB|GB)/i);
      if (!parts) return 0;

      const value = parseFloat(parts[1]);
      const unit = parts[2].toUpperCase();

      const units = {
        BYTES: 1,
        KB: 1024,
        MB: 1024 * 1024,
        GB: 1024 * 1024 * 1024,
      };
      return Math.round(parseFloat(value) * (units[unit] || 0)); // Round to nearest byte
    }
  }

  // ===== Navigation Event Listener (Updated to include new sections and login check) =====
  document.addEventListener("click", (e) => {
    const target = e.target;
    const navButton = target.closest(".nav-btn");

    // Only allow navigation if logged in, or if it's the "Explore more" button which is allowed on home
    if (!isLoggedIn && !target.closest(".explore-btn")) {
      // If not logged in, prevent navigation unless it's a specific allowed action (e.g., initial render)
      return;
    }

    if (target.closest(".explore-btn")) {
      e.preventDefault();
      renderExplore();
    } else if (
      target.closest(".support-btn") ||
      (navButton && navButton.textContent.includes("Support"))
    ) {
      e.preventDefault();
      renderSupport();
    } else if (navButton && navButton.textContent.includes("Report")) {
      e.preventDefault();
      renderReports();
    } else if (
      target.closest(".back-btn") ||
      (navButton && navButton.textContent.includes("Home"))
    ) {
      e.preventDefault();
      renderHome();
    } else if (navButton && navButton.textContent.includes("Dashboard")) {
      e.preventDefault();
      renderDashboard();
    } else if (navButton && navButton.textContent.includes("Devices")) {
      e.preventDefault();
      renderDevices();
    } else if (navButton && navButton.textContent.includes("Notifications")) {
      e.preventDefault();
      renderNotifications();
    }
  });

  // Initial page load: Check login status and render appropriate page
  const checkLoginStatus = () => {
    // Check if a 'loggedIn' flag exists in sessionStorage (simple persistence)
    if (sessionStorage.getItem("loggedIn") === "true") {
      // Changed to sessionStorage
      isLoggedIn = true;
      toggleAppUI(true); // Show the UI
      renderHome(); // Render the home page
    } else {
      isLoggedIn = false;
      renderLogin(); // Render the login page
    }
  };

  checkLoginStatus(); // Call on initial load
});
