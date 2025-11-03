<script>
document.addEventListener("DOMContentLoaded", async () => {
  function parseCookies() {
    return document.cookie.split(';')
      .map(kv => kv.split('='))
      .reduce((acc, [k, v]) => {
        acc[k.trim()] = decodeURIComponent(v || '');
        return acc;
      }, {});
  }
  
  // 🧠 Try to extract user email from Squarespace cookies + profile API
  async function getSquarespaceEmail() {
    const cookies = parseCookies();
    if (!cookies["SiteUserInfo"]) return null;

    try {
      const userSiteInfo = JSON.parse(cookies["SiteUserInfo"]);
      const xsrf1 = cookies["crumb"];
      const xsrf2 = cookies["siteUserCrumb"];
      const profileURL = "/api/site-users/account/profile";

      const headers = {
        "x-csrf-token": xsrf1,
        "x-siteuser-xsrf-token": xsrf2
      };

      const res = await fetch(profileURL, { headers });
      if (!res.ok) return null;
      const profile = await res.json();
      return profile.email || null;
    } catch (err) {
      console.error("Error fetching Squarespace email:", err);
      return null;
    }
  }
   // 📨 Get the user’s email — either from Squarespace or fallback to prompt
  let email = await getSquarespaceEmail();
  // 🧱 If not logged in, show friendly message
  const containerLogIn =  document.getElementById("log-in");
  if (!email) {
    console.log("no email");
    if (containerLogIn) {
      console.log("found container");
      containerLogIn.innerHTML = `
        <div style="text-align:center; padding:2em; border:1px solid #ddd; border-radius:8px;">
          <p style="font-size:1.2em;">You need to log in to view your abstracts.</p>
          <a href="/account/login" 
             style="display:inline-block; margin-top:1em; padding:0.6em 1.2em; background:#333; color:#fff; border-radius:5px; text-decoration:none;">
             Log in
          </a>
        </div>
      `;
    }
    else {console.log("no container");}
  }
// 🖋️ Update the visible email on the page (if element exists)
  const emailSpan = document.getElementById('email');
  if (emailSpan) emailSpan.textContent = email;

  // 2️⃣ Your Netlify function URL
  const netlifyFnUrl = "https://magenta-daifuku-ea2748.netlify.app/.netlify/functions/get-orders";

  try {
    // 3️⃣ Fetch orders from Netlify, passing email as query param
    const res = await fetch(`${netlifyFnUrl}?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error(`Error fetching orders: ${res.status}`);

    const orders = await res.json();

    // 4️⃣ Display orders
    const container = document.getElementById('order-info');
    if (!container) return;

    if (!orders.length) {
      container.innerHTML = "<p>No orders found for this email.</p>";
      return;
    }

    // Build table headers dynamically from productFormFields keys
    const allKeys = new Set();
    orders.forEach(order => {
      if (order.productFormFields) {
        Object.keys(order.productFormFields).forEach(k => {
          allKeys.add(k.replace(/^Product Form:\s*/, '')); // strip "Product Form: "
        });
      }
    });
    const formKeys = Array.from(allKeys);

    // Table header
    let html = "<table border='1' style='border-collapse: collapse; padding: 5px;'>";
    html += "<thead><tr>";
    html += "<th>Tag</th>";
    html += "<th>Submit Date</th>";
    formKeys.forEach(key => html += `<th>${key}</th>`);
    html += "<th>Action</th></tr></thead><tbody>";

    // Table rows
    orders.forEach(order => {
      html += "<tr>";
      html += `<td>${order.tag}</td>`;
      html += `<td>${order.orderDate}</td>`;

      formKeys.forEach(key => {
        const value = order.productFormFields 
                      ? order.productFormFields[`Product Form: ${key}`] || ''
                      : '';
        html += `<td>${value}</td>`;
      });
        // Action button column
  html += `<td>
    <form method="POST" action="/your-form-handler-url">
      <input type="hidden" name="orderNumber" value="${order.orderNumber}">
      <button type="submit">Update / Withdraw</button>
    </form>
  </td>`

      html += "</tr>";
    });

    html += "</tbody></table>";
    container.innerHTML = html;

  } catch (err) {
    console.error(err);
    const container = document.getElementById('order-info');
    if (container) container.innerHTML = "<p>Error loading orders. Please try again later.</p>";
  }
})();
</script>