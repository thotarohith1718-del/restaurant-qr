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
// Add extra items to an existing order
app.post("/add-items/:id", (req, res) => {
    try {
        const orderId = Number(req.params.id);
        const { items } = req.body;

        const order = orders.find(o => Number(o.id) === orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.paymentStatus === "Paid") {
            return res.status(400).json({
                success: false,
                message: "Payment completed. Cannot add more items."
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please add items first"
            });
        }

        // Merge new items into the existing order
        order.items.push(...items);

        // Recalculate total
        order.total = order.items.reduce(
            (sum, item) => sum + Number(item.price),
            0
        );

        order.updatedAt = new Date();

        // Notify admin and customer
        io.emit("orderUpdated", order);

        res.json({
            success: true,
            message: "Items added successfully!",
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
// Get one order by ID
app.get("/orders/:id", (req, res) => {
    const order = orders.find(
        o => String(o.id) === String(req.params.id)
    );

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    res.json({
        success: true,
        order: order
    });
});
// Add extra items to an existing order
app.post("/add-items/:id", (req, res) => {
    try {
        const order = orders.find(
            o => String(o.id) === req.params.id
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const { items } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please add food items"
            });
        }

        // Record the extra items separately
        const addedAt = new Date();

        const newItems = items.map(item => ({
            ...item,
            addedAt: addedAt
        }));

        if (!order.additionalItems) {
            order.additionalItems = [];
        }

        order.additionalItems.push(...newItems);

        // Add them to the original order
        order.items.push(...newItems);

        // Recalculate total
        order.total = order.items.reduce(
            (sum, item) => sum + Number(item.price || 0),
            0
        );

        order.updatedAt = addedAt;

        // Notify admin without changing order status
        io.emit("orderUpdated", order);

        res.json({
            success: true,
            message: "Extra items added successfully!",
            order: order
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});
// Update order status
app.put("/update-order/:id", (req, res) => {
    const orderId = Number(req.params.id);
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

    const order = orders.find(o => o.id === orderId);

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
        message: "Order status updated",
        order
    });
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
// Remove completed order
app.delete("/remove-order/:id", (req, res) => {
    const index = orders.findIndex(
        order => String(order.id) === req.params.id
    );

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    if (orders[index].status !== "Completed") {
        return res.status(400).json({
            success: false,
            message: "Only completed orders can be removed"
        });
    }

    const removedOrder = orders.splice(index, 1)[0];

    io.emit("orderRemoved", removedOrder.id);

    res.json({
        success: true,
        message: "Order removed successfully"
    });
});
// Start server
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});