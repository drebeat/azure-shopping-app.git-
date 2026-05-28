const express = require('express');
const path = require('path');
const { CosmosClient } = require('@azure/cosmos');
const { DefaultAzureCredential } = require('@azure/identity');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Cosmos DB configuration
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const databaseId = 'shoppingdb';
const containerId = 'products';

let container;

async function initializeDatabase() {
  if (!endpoint) {
    console.log('Cosmos DB not configured. Using in-memory storage.');
    return;
  }

  try {
    let client;
    if (key) {
      client = new CosmosClient({ endpoint, key });
    } else {
      const credential = new DefaultAzureCredential();
      client = new CosmosClient({ endpoint, aadCredentials: credential });
    }

    const database = client.database(databaseId);
    container = database.container(containerId);
    
    // Test the connection by reading from the container
    await container.items.readAll().fetchNext();
    console.log('Connected to Cosmos DB');
  } catch (error) {
    console.log('Failed to connect to Cosmos DB:', error.message);
    console.log('Falling back to in-memory storage.');
  }
}

// In-memory fallback for local development
let products = [];
let nextId = 1;

// GET all products
app.get('/api/products', async (req, res) => {
  try {
    if (container) {
      const { resources } = await container.items.readAll().fetchAll();
      res.json(resources);
    } else {
      res.json(products);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create a product
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, description } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
    const product = {
      id: Date.now().toString(),
      name,
      price: parseFloat(price),
      description: description || ''
    };
    if (container) {
      const { resource } = await container.items.create(product);
      res.status(201).json(resource);
    } else {
      products.push(product);
      res.status(201).json(product);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update a product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description } = req.body;
    if (container) {
      const { resource } = await container.item(id, id).read();
      if (!resource) {
        return res.status(404).json({ error: 'Product not found' });
      }
      const updated = { ...resource, name, price: parseFloat(price), description };
      const { resource: result } = await container.item(id, id).replace(updated);
      res.json(result);
    } else {
      const index = products.findIndex(p => p.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
      }
      products[index] = { ...products[index], name, price: parseFloat(price), description };
      res.json(products[index]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (container) {
      await container.item(id, id).delete();
      res.status(204).send();
    } else {
      products = products.filter(p => p.id !== id);
      res.status(204).send();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize and start
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});