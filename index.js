const express = require('express'); // Import Express framework
const app = express(); // Create an Express application

app.use(express.json()); // Middleware to parse JSON request bodies

// Data Structures
let ordersQueue = []; // A list (queue) to store orders
const graph = {}; // A dictionary to represent delivery locations and routes

// Helper Functions

// Function to add a route between two locations
function addRoute(from, to, distance) {
  if (!graph[from]) graph[from] = [];
  graph[from].push({ to, distance });
}

// Function to find the shortest distance between two locations using Dijkstra's algorithm
function findShortestRoute(start, end) {
  const distances = {}; // To keep track of shortest distances from the start
  const visited = new Set(); // To avoid re-visiting locations
  const priorityQueue = []; // To prioritize locations with shorter distances

  // Initialize distances (all infinity except the starting point)
  for (let location in graph) {
    distances[location] = Infinity;
  }
  distances[start] = 0;

  priorityQueue.push({ location: start, distance: 0 });

  while (priorityQueue.length > 0) {
    // Sort the queue by distance and pick the closest location
    priorityQueue.sort((a, b) => a.distance - b.distance);
    const { location: current, distance } = priorityQueue.shift();

    // Skip if we've already visited this location
    if (visited.has(current)) continue;
    visited.add(current);

    // Stop if we reach the destination
    if (current === end) break;

    // Update distances for neighboring locations
    for (let neighbor of graph[current] || []) {
      const newDistance = distance + neighbor.distance;
      if (newDistance < distances[neighbor.to]) {
        distances[neighbor.to] = newDistance;
        priorityQueue.push({ location: neighbor.to, distance: newDistance });
      }
    }
  }

  // Return the shortest distance to the destination
  return distances[end] === Infinity ? -1 : distances[end];
}

// API Endpoints

// Add an order to the queue
app.post('/add-order', (req, res) => {
  const { orderId, customerLocation } = req.body; // Extract data from the request
  ordersQueue.push({ orderId, customerLocation }); // Add the order to the queue
  res.json({ message: 'Order added successfully', ordersQueue });
});

// Process the next order in the queue
app.post('/process-order', (req, res) => {
  if (ordersQueue.length === 0) {
    return res.json({ message: 'No orders to process' });
  }

  const nextOrder = ordersQueue.shift(); // Remove the first order from the queue
  res.json({ message: 'Processing order', order: nextOrder });
});

// Add a route between two locations
app.post('/add-route', (req, res) => {
  const { from, to, distance } = req.body; // Extract route details from the request
  addRoute(from, to, distance);
  res.json({ message: 'Route added successfully', graph });
});

// Get the shortest delivery route between two locations
app.get('/shortest-route', (req, res) => {
  const { start, end } = req.query; // Extract start and end locations from the query
  const shortestDistance = findShortestRoute(start, end);

  if (shortestDistance === -1) {
    return res.json({ message: 'No route available between these locations' });
  }

  res.json({ message: 'Shortest route calculated', distance: shortestDistance });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
