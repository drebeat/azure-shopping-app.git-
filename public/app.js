const form = document.getElementById('product-form');
const productIdInput = document.getElementById('product-id');
const nameInput = document.getElementById('product-name');
const priceInput = document.getElementById('product-price');
const descriptionInput = document.getElementById('product-description');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const productList = document.getElementById('product-list');

// Fetch all products from the API and display them
async function loadProducts() {
  const response = await fetch('/api/products');
  const products = await response.json();
  renderProducts(products);
}

// Build HTML cards for each product
function renderProducts(products) {
  productList.innerHTML = products.map(product => `
    <div class="product-card">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="price">$${product.price.toFixed(2)}</p>
        <p>${product.description}</p>
      </div>
      <div class="product-actions">
        <button class="edit-btn" onclick="editProduct('${product.id}', '${product.name}', ${product.price}, '${product.description}')">Edit</button>
        <button class="delete-btn" onclick="deleteProduct('${product.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// Handle form submission for both create and update
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = productIdInput.value;
  const product = {
    name: nameInput.value,
    price: priceInput.value,
    description: descriptionInput.value
  };

  if (id) {
    // Update existing product
    await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
  } else {
    // Create new product
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
  }

  resetForm();
  loadProducts();
});

// Populate the form with existing product data for editing
function editProduct(id, name, price, description) {
  productIdInput.value = id;
  nameInput.value = name;
  priceInput.value = price;
  descriptionInput.value = description;
  submitBtn.textContent = 'Update Product';
  cancelBtn.classList.remove('hidden');
}

// Delete a product after confirmation
async function deleteProduct(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    loadProducts();
  }
}

// Reset form back to "Add" mode
cancelBtn.addEventListener('click', resetForm);

function resetForm() {
  productIdInput.value = '';
  nameInput.value = '';
  priceInput.value = '';
  descriptionInput.value = '';
  submitBtn.textContent = 'Add Product';
  cancelBtn.classList.add('hidden');
}

// Load products on page load
loadProducts();