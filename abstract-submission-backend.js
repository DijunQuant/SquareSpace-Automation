<script>
(async function() {
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
      containerLogIn.innerHTML =`
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
const netlifyFnUrlForArt = "https://magenta-daifuku-ea2748.netlify.app/.netlify/functions/get-orders-art";

  try {
    // 3️⃣ Fetch orders from Netlify, passing email as query param
    const res = await fetch(`${netlifyFnUrl}?email=${encodeURIComponent(email)}`);
    const resArt = await fetch(`${netlifyFnUrlForArt}?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Error fetching orders: ${res.status}');
if (!resArt.ok) throw new Error('Error fetching orders for artistis: ${resArt.status}');

    const orders = await res.json();
const ordersArt= await resArt.json();

    // 4️⃣ Display orders
    const container = document.getElementById('order-info');
    if (!container) return;

    if ((!orders.length)&&(!ordersArt.length)) {
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
const presenterKey = 'Product Form: Presenter';
const titleKey = 'Product Form: Title';
let html ="";
orders.forEach((order, index) => {    
    // Safely extract the values from the productFormFields object
 const presenterName = order.productFormFields ? order.productFormFields[presenterKey] || '' : '';
const abstractTitle = order.productFormFields ? order.productFormFields[titleKey] || '' : '';

 // Encode values for safe transmission in the URL
    const encodedPresenter = encodeURIComponent(presenterName);
    const encodedTitle = encodeURIComponent(abstractTitle);
  
 html += `<div class="order-details-block" style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 4px;"> <h4 style="margin-top: 0;">Order #${order.orderNumber || (index + 1)}</h4> <div style="margin: 3px 0;"><strong>Tag:</strong> ${order.tag}</div>    <div style="margin: 3px 0;"><strong>Submit Date:</strong> ${order.orderDate}</div>         <hr style="border: 0; border-top: 1px solid #ddd; margin: 15px 0;">                     <h4 style="margin-top: 0; margin-bottom: 10px;">Submission Details:</h4>`;      
formKeys.forEach(key => {         const fullKey = `Product Form: ${key}`;         const value = order.productFormFields ? order.productFormFields[fullKey] || 'N/A' : 'N/A';                
 html += `<p><strong>${key}:</strong> ${value}</p>`;       });                  html += ` <form style="margin-top: 20px;">
        <a href="/abstract-update?SQF_ORDER_NUMBER=${order.orderNumber}&SQF_PRESENTER=${encodedPresenter}&SQF_TITLE=${encodedTitle}"
          style="padding: 10px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block;">
            Update / Withdraw
        </a>
    </form>        </div>         <br>       `;
    });     
//end of regualar order

  // Build table headers dynamically from productFormFields keys
    const allKeysArt = new Set();
    ordersArt.forEach(order => {
      if (order.productFormFields) {
        Object.keys(order.productFormFields).forEach(k => {
          allKeysArt.add(k); 
        });
      }})
console.log(allKeysArt.add);

const formKeysArt = Array.from(allKeysArt);
const presenterKeyArt =  'Name';
const titleKeyArt = 'Title';

ordersArt.forEach((order, index) => {    
    // Safely extract the values from the productFormFields object
 const presenterName = order.productFormFields ? order.productFormFields[presenterKeyArt] || '' : '';
const abstractTitle = order.productFormFields ? order.productFormFields[titleKeyArt] || '' : '';

 // Encode values for safe transmission in the URL
    const encodedPresenter = encodeURIComponent(presenterName);
    const encodedTitle = encodeURIComponent(abstractTitle);
  
 html += `<div class="order-details-block" style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 4px;"><div style="margin: 3px 0;"><strong>Tag:</strong> ${order.tag}</div>    <div style="margin: 3px 0;"><strong>Submit Date:</strong> ${order.Date}</div>  <hr style="border: 0; border-top: 1px solid #ddd; margin: 15px 0;">    <h4 style="margin-top: 0; margin-bottom: 10px;">Submission Details:</h4>`;      
formKeysArt.forEach(key => {        const value = order.productFormFields ? order.productFormFields[key] || 'N/A' : 'N/A';                
 html += `<p><strong>${key}:</strong> ${value}</p>`;       });                  html += ` <form style="margin-top: 20px;">
        <a href="/abstract-update?SQF_ORDER_NUMBER=${order.orderNumber}&SQF_PRESENTER=${encodedPresenter}&SQF_TITLE=${encodedTitle}"
          style="padding: 10px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block;">
            Update / Withdraw
        </a>
    </form>        </div>         <br>  `;
    });    
    ;  
//end of artists order


container.innerHTML = html;

  } catch (err) {
    console.error(err);
    const container = document.getElementById('order-info');
    if (container) container.innerHTML = "<p>Error loading orders. Please try again later.</p>";
  }
})();
</script>
