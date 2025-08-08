const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateBtn = document.getElementById("generateRoutine");
const darkToggle = document.getElementById("darkToggle");
const userInput = document.getElementById("userInput");

let selectedProducts = [];

/* API URL */
const workerURL = "https://dry-cherry-e9e9.wongthulani.workers.dev/";

/* Demo: Simple fetch to your API for learning purposes */
fetch(workerURL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ question: "What skincare routine do you recommend?" }),
})
  .then((res) => res.json())
  .then(console.log)
  .catch(console.error);

/* Fetch API helper */
// Sends a question to the Worker API, expects OpenAI Chat completions format
async function fetchFromAPI(query) {
  try {
    // This is where you send the POST request to your API
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful skincare assistant." },
          { role: "user", content: query },
        ],
      }),
    });

    if (!response.ok) {
      console.error(
        "API response error:",
        response.status,
        response.statusText
      );
      return null;
    }

    const data = await response.json();
    console.log("API response data:", data);

    // Defensive parsing: ensure we have choices and expected content
    if (
      data.choices &&
      Array.isArray(data.choices) &&
      data.choices.length > 0 &&
      data.choices[0].message &&
      typeof data.choices[0].message.content === "string"
    ) {
      return { answer: data.choices[0].message.content.trim() };
    } else {
      console.warn("Unexpected API response format", data);
      return null;
    }
  } catch (error) {
    console.error("API fetch error:", error);
    return null;
  }
}

// Beginner-friendly example: How to make a simple POST request to your API using fetch and .then()
// This is just for demonstration and learning purposes. You can remove or comment it out later.

/* Load product data */
async function loadProducts() {
  try {
    const res = await fetch("products.json");
    const data = await res.json();
    return data.products || [];
  } catch (error) {
    console.error("Failed to load products:", error);
    return [];
  }
}

/* Display products */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (p, i) => `
      <div class="product-card" data-index="${i}">
        <img src="${p.image}" alt="${p.name}" />
        <div class="product-info">
          <h3>${p.name}</h3>
          <p>${p.brand}</p>
        </div>
      </div>
    `
    )
    .join("");

  document.querySelectorAll(".product-card").forEach((card, i) => {
    card.addEventListener("click", async () => {
      const selected = products[i];
      if (selectedProducts.find((p) => p.name === selected.name)) return;

      selectedProducts.push(selected);
      addToSelectedList(selected);
      updateGenerateButton();

      chatWindow.innerHTML += `<div class="user-msg">Tell me about ${selected.name}</div>`;
      chatWindow.innerHTML += `<div class="bot-msg typing">Typing...</div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;

      const apiResponse = await fetchFromAPI(`Tell me about ${selected.name}`);

      const typingElem = document.querySelector(".typing");
      if (typingElem) typingElem.remove();

      if (apiResponse && apiResponse.answer) {
        chatWindow.innerHTML += `<div class="bot-msg">${apiResponse.answer}</div>`;
      } else {
        chatWindow.innerHTML += `<div class="bot-msg">Sorry, no info available right now.</div>`;
      }
      chatWindow.scrollTop = chatWindow.scrollHeight;
    });
  });
}

/* Add product to selected list with removal on click */
function addToSelectedList(product) {
  const el = document.createElement("div");
  el.className = "selected-product";
  el.innerHTML = `
    <img src="${product.image}" alt="${product.name}" />
    <div>
      <h4>${product.name}</h4>
      <p>${product.brand}</p>
    </div>
  `;
  el.addEventListener("click", () => {
    selectedProducts = selectedProducts.filter((p) => p.name !== product.name);
    selectedProductsList.removeChild(el);
    updateGenerateButton();
  });

  selectedProductsList.appendChild(el);
}

/* Enable or disable the generate button */
function updateGenerateButton() {
  generateBtn.disabled = selectedProducts.length === 0;
}

/* Handle category change */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const filtered = products.filter((p) => p.category === e.target.value);
  displayProducts(filtered);
});

/* Routine generation with API call */
// Listen for clicks on the "Build My Routine" button
generateBtn.addEventListener("click", async () => {
  // If no products are selected, show a message and stop
  if (!selectedProducts.length) {
    chatWindow.innerHTML += `<div class="bot-msg">Please select products first!</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return;
  }

  // Create a query using the selected product names
  const productNames = selectedProducts.map((p) => p.name).join(", ");
  const query = `Create a skincare routine using these products: ${productNames}`;

  // Show the user's request and a typing indicator
  chatWindow.innerHTML += `<div class="user-msg">${query}</div>`;
  chatWindow.innerHTML += `<div class="bot-msg typing">Typing...</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Call the API and wait for the response
  const apiResponse = await fetchFromAPI(query);

  // Remove the typing indicator
  const typingElem = document.querySelector(".typing");
  if (typingElem) typingElem.remove();

  // Show the answer or an error message
  if (apiResponse && (apiResponse.answer || apiResponse.result)) {
    chatWindow.innerHTML += `<div class="bot-msg">${
      apiResponse.answer || apiResponse.result
    }</div>`;
  } else {
    chatWindow.innerHTML += `<div class="bot-msg">Sorry, I couldn't generate a routine right now.</div>`;
  }
  chatWindow.scrollTop = chatWindow.scrollHeight;
});

/* Chat submission with API integration */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = userInput.value.trim();
  if (!msg) return;

  chatWindow.innerHTML += `<div class="user-msg">${msg}</div>`;
  chatWindow.innerHTML += `<div class="bot-msg typing">Typing...</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  const apiResponse = await fetchFromAPI(msg);

  const typingElem = document.querySelector(".typing");
  if (typingElem) typingElem.remove();

  if (apiResponse && apiResponse.answer) {
    chatWindow.innerHTML += `<div class="bot-msg">${apiResponse.answer}</div>`;
  } else {
    chatWindow.innerHTML += `<div class="bot-msg">Sorry, I couldn’t get an answer right now.</div>`;
  }
  chatWindow.scrollTop = chatWindow.scrollHeight;

  userInput.value = "";
});

/* Dark mode toggle */
darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

/* Initialize */
updateGenerateButton();
