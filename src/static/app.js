document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const userIconBtn = document.getElementById("user-icon-btn");
  const authPanel = document.getElementById("auth-panel");
  const showLoginBtn = document.getElementById("show-login-btn");
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const authLoggedOut = document.getElementById("auth-logged-out");
  const authLoggedIn = document.getElementById("auth-logged-in");
  const teacherName = document.getElementById("teacher-name");

  const TOKEN_KEY = "teacherAuthToken";
  let authToken = localStorage.getItem(TOKEN_KEY);
  let isTeacherLoggedIn = false;

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function updateTeacherActionsUI() {
    signupForm.querySelector("button[type='submit']").disabled = !isTeacherLoggedIn;
    signupForm.querySelectorAll("input, select").forEach((field) => {
      field.disabled = !isTeacherLoggedIn;
    });

    if (!isTeacherLoggedIn) {
      signupForm.setAttribute("title", "Teacher login required");
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.disabled = true;
        button.setAttribute("title", "Teacher login required");
      });
      return;
    }

    signupForm.removeAttribute("title");
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.disabled = false;
      button.removeAttribute("title");
    });
  }

  function showLoggedOutPanel() {
    authLoggedOut.classList.remove("hidden");
    authLoggedIn.classList.add("hidden");
    loginForm.classList.add("hidden");
  }

  function showLoggedInPanel(username) {
    teacherName.textContent = `Logged in as ${username}`;
    authLoggedOut.classList.add("hidden");
    loginForm.classList.add("hidden");
    authLoggedIn.classList.remove("hidden");
  }

  async function refreshAuthState() {
    if (!authToken) {
      isTeacherLoggedIn = false;
      showLoggedOutPanel();
      updateTeacherActionsUI();
      return;
    }

    try {
      const response = await fetch("/auth/status", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const status = await response.json();

      if (status.is_teacher) {
        isTeacherLoggedIn = true;
        showLoggedInPanel(status.username);
      } else {
        isTeacherLoggedIn = false;
        authToken = null;
        localStorage.removeItem(TOKEN_KEY);
        showLoggedOutPanel();
      }
    } catch (error) {
      isTeacherLoggedIn = false;
      showLoggedOutPanel();
      console.error("Error checking auth status:", error);
    }

    updateTeacherActionsUI();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      updateTeacherActionsUI();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    if (!isTeacherLoggedIn) {
      showMessage("Only teachers can unregister students.", "error");
      return;
    }

    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isTeacherLoggedIn) {
      showMessage("Only teachers can register students.", "error");
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  userIconBtn.addEventListener("click", () => {
    authPanel.classList.toggle("hidden");
  });

  showLoginBtn.addEventListener("click", () => {
    loginForm.classList.remove("hidden");
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    try {
      const response = await fetch(
        `/auth/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        {
          method: "POST",
        }
      );
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail || "Login failed.", "error");
        return;
      }

      authToken = result.token;
      localStorage.setItem(TOKEN_KEY, authToken);
      isTeacherLoggedIn = true;
      showLoggedInPanel(result.username);
      loginForm.reset();
      updateTeacherActionsUI();
      showMessage(`Welcome, ${result.username}.`, "success");
    } catch (error) {
      showMessage("Failed to login. Please try again.", "error");
      console.error("Error logging in:", error);
    }
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        headers: authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : {},
      });
    } catch (error) {
      console.error("Error logging out:", error);
    }

    authToken = null;
    localStorage.removeItem(TOKEN_KEY);
    isTeacherLoggedIn = false;
    showLoggedOutPanel();
    updateTeacherActionsUI();
    showMessage("Logged out.", "info");
  });

  document.addEventListener("click", (event) => {
    if (!authPanel.contains(event.target) && !userIconBtn.contains(event.target)) {
      authPanel.classList.add("hidden");
    }
  });

  // Initialize app
  refreshAuthState();
  fetchActivities();
});
