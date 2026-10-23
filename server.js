const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(__dirname));

let orders = [];

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Receive customer order
app.post("/place-order", (req, res) => {
    try {
        const { table, items, total } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        const order = {
            id: Date.now(),
            table: table || "Not Assigned",
            items,
            total,
            status: "Pending",
            time: new Date()
        };

        orders.push(order);

        // Notify restaurant dashboard
        io.emit("newOrder", order);

        res.json({
            success: true,
            message: "Order received successfully!",
            order
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

// Get all orders
app.get("/orders", (req, res) => {
    res.json(orders);
});
// Update order status
app.patch("/update-order-status/:id", (req, res) => {
    const { status } = req.body;

    const allowedStatuses = [
        "Accepted",
        "Preparing",
        "Ready",
        "Completed"
    ];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid order status"
        });
    }

    const order = orders.find(
        order => String(order.id) === req.params.id
    );

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    order.status = status;

    io.emit("orderUpdated", order);

    res.json({
        success: true,
        message: "Order status updated successfully",
        order
    });
});

// Start server
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});