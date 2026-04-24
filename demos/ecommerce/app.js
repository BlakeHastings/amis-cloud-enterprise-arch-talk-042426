const API = '/api';

const PRODUCT_EMOJIS = {
  'Books': '📚',
  'Accessories': '🖥️',
  'Hardware': '🔧',
  'Keyboards': '⌨️',
  'default': '📦'
};

let products = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

async function loadProducts() {
  const grid = document.getElementById('productGrid');
  try {
    const res = await fetch(`${API}/products`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    products = await res.json();
    renderProducts();
  } catch (err) {
    grid.innerHTML = `<div class="error">Could not load products: ${err.message}</div>`;
  }
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  document.getElementById('productCount').textContent = `${products.length} items`;

  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-image">${PRODUCT_EMOJIS[p.category] || PRODUCT_EMOJIS.default}</div>
      <div class="product-body">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.description}</div>
        <div class="product-footer">
          <span class="product-price">$${parseFloat(p.price).toFixed(2)}</span>
          <button class="btn-add" onclick="addToCart(${p.id})">Add to Cart</button>
        </div>
      </div>
    </div>
  `).join('');
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.product_id === productId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ product_id: productId, quantity: 1, name: product.name, price: product.price, category: product.category });
  }

  saveCart();
  updateCartUI();
  showToast(`${product.name} added to cart`);
}

function updateQty(productId, delta) {
  const item = cart.find(i => i.product_id === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart = cart.filter(i => i.product_id !== productId);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
  const totalQty = cart.reduce((sum, i) => sum + i.quantity, 0);
  document.getElementById('cartCount').textContent = totalQty;

  const cartItems = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');

  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
    cartFooter.innerHTML = '';
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-emoji">${PRODUCT_EMOJIS[item.category] || PRODUCT_EMOJIS.default}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">$${parseFloat(item.price).toFixed(2)} each</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="updateQty(${item.product_id}, -1)">−</button>
        <span class="qty-display">${item.quantity}</span>
        <button class="qty-btn" onclick="updateQty(${item.product_id}, 1)">+</button>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
  cartFooter.innerHTML = `
    <div class="cart-total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
    <button class="btn-checkout" onclick="openCheckout()">Checkout</button>
  `;
}

function toggleCart() {
  document.getElementById('cartPanel').classList.toggle('open');
  document.getElementById('cartOverlay').classList.toggle('open');
}

function openCheckout() {
  if (cart.length === 0) return;
  toggleCart();

  const total = cart.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
  document.getElementById('orderSummary').innerHTML = `
    <h3>Order Summary</h3>
    ${cart.map(i => `<div class="summary-line"><span>${i.name} × ${i.quantity}</span><span>$${(parseFloat(i.price) * i.quantity).toFixed(2)}</span></div>`).join('')}
    <div class="summary-total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
  `;

  document.getElementById('checkoutModal').classList.add('open');
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('checkoutForm').reset();
  document.getElementById('submitBtn').disabled = false;
  document.getElementById('submitBtn').textContent = 'Place Order';
}

function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
  document.getElementById('modalOverlay').classList.remove('open');
}

async function submitOrder(e) {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = 'Placing order…';

  const payload = {
    customer_name: document.getElementById('customerName').value,
    email: document.getElementById('customerEmail').value,
    items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
  };

  try {
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    document.querySelector('#checkoutModal form').innerHTML = `
      <div class="success-msg">
        <div class="check">✅</div>
        <h3>Order #${data.order_id} confirmed!</h3>
        <p>Thanks, ${payload.customer_name}! We'll send a confirmation to ${payload.email}.</p>
        <p style="margin-top:0.5rem;font-weight:700;">Total: $${parseFloat(data.total).toFixed(2)}</p>
      </div>
    `;

    cart = [];
    saveCart();
    updateCartUI();
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Place Order';
    showToast(`Order failed: ${err.message}`);
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

updateCartUI();
loadProducts();
