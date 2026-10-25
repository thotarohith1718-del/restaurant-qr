const foods = [
    {
        name: "Chicken Biryani",
        price: 250,
        category: "Biryani",
        image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=700",
        description: "Aromatic rice with delicious chicken."
    },
    {
        name: "Veg Biryani",
        price: 180,
        category: "Biryani",
        image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=700",
        description: "Flavourful rice with fresh vegetables."
    },
    {
        name: "Paneer Butter Masala",
        price: 200,
        category: "Main Course",
        image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=700",
        description: "Creamy paneer in rich tomato gravy."
    },
    {
        name: "Chicken Fried Rice",
        price: 190,
        category: "Main Course",
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=700",
        description: "Delicious fried rice with chicken."
    },
    {
        name: "Masala Dosa",
        price: 80,
        category: "Snacks",
        image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=700",
        description: "Crispy dosa with potato masala."
    },
    {
        name: "Chicken 65",
        price: 220,
        category: "Starters",
        image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=700",
        description: "Spicy and crispy chicken starter."
    },
    {
        name: "Veg Meals",
        price: 120,
        category: "Main Course",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=700",
        description: "A satisfying traditional vegetarian meal."
    },
    {
        name: "Ice Cream",
        price: 60,
        category: "Desserts",
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=700",
        description: "A sweet and creamy dessert."
    },

    {
        name: "Dum Biryani",
        price: 220,
        category: "Biryani",
        image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=700",
        description: "Delicious traditional Dum Biryani."
    },

];

let cart = [];
let selectedCategory = "All";

const params = new URLSearchParams(window.location.search);
const table = params.get("table") || "Not Assigned";

function showMenu() {
    const menu = document.getElementById("menu");
    const search = document.getElementById("foodSearch").value.toLowerCase();

    menu.innerHTML = "";

    const filteredFoods = foods.filter(food =>
        (selectedCategory === "All" || food.category === selectedCategory) &&
        food.name.toLowerCase().includes(search)
    );

    if (filteredFoods.length === 0) {
        menu.innerHTML = "<p>No food items found.</p>";
        return;
    }

    filteredFoods.forEach(food => {
        const index = foods.indexOf(food);

        menu.innerHTML += `
            <article class="food">
                <div class="food-image">
                    <img src="${food.image}"
                         alt="${food.name}"
                         loading="lazy"
                         onerror="this.style.display='none'">
                </div>
                <div class="food-info">
                    <span class="food-description">${food.category}</span>
                    <h3>${food.name}</h3>
                    <p class="food-description">${food.description}</p>
                    <div class="food-bottom">
                        <strong class="food-price">₹${food.price}</strong>
                        <button class="add-btn" onclick="addToCart(${index})">
                            + Add
                        </button>
                    </div>
                </div>
            </article>
        `;
    });
}

function addToCart(index) {
    cart.push(foods[index]);
    showCart();
}

function showCart() {
    const cartDiv = document.getElementById("cart");
    let total = 0;

    cartDiv.innerHTML = "";

    const groupedCart = {};

    cart.forEach(item => {
        if (!groupedCart[item.name]) {
            groupedCart[item.name] = { ...item, quantity: 0 };
        }

        groupedCart[item.name].quantity++;
        total += item.price;
    });

    Object.values(groupedCart).forEach(item => {
        const row = document.createElement("div");
        row.className = "cart-item";

        row.innerHTML = `
            <div>
                <strong>${item.name}</strong>
                <p>₹${item.price} × ${item.quantity}</p>
            </div>
            <div>
                <button onclick="changeQuantity('${item.name}', -1)">−</button>
                <strong>${item.quantity}</strong>
                <button onclick="changeQuantity('${item.name}', 1)">+</button>
            </div>
        `;

        cartDiv.appendChild(row);
    });

    if (cart.length === 0) {
        cartDiv.innerHTML = `
            <div class="empty-cart">
                <span>♧</span>
                <p>Your cart is waiting for something delicious.</p>
            </div>
        `;
    }

    document.getElementById("total").textContent = total;
    document.getElementById("cartCount").textContent =
        `${cart.length} ITEMS`;
}

function changeQuantity(name, change) {
    if (change > 0) {
        const food = foods.find(item => item.name === name);
        cart.push(food);
    } else {
        const index = cart.findIndex(item => item.name === name);
        if (index !== -1) cart.splice(index, 1);
    }

    showCart();
}

document.getElementById("foodSearch").addEventListener("input", showMenu);

document.querySelectorAll(".category").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelector(".category.active")?.classList.remove("active");
        button.classList.add("active");
        selectedCategory = button.dataset.category;
        showMenu();
    });
});
const customerSocket = io();
let currentOrderId = null;
customerSocket.on("orderUpdated", (updatedOrder) => {
    if (String(updatedOrder.id) !== String(currentOrderId)) {
        return;
    }

    const statusElement =
        document.getElementById("customerOrderStatus");

    const messages = {
        Accepted: "✅ Your order has been accepted!",
        Preparing: "👨‍🍳 Your food is being prepared.",
        Ready: "🟢 Your order is ready!",
        Completed: "✅ Your order is completed."
    };

    statusElement.textContent =
        messages[updatedOrder.status] || updatedOrder.status;
});

async function placeOrder() {
    if (cart.length === 0) {
        alert("Please add food items first!");
        return;
    }

    const order = {
        table: table,
        items: cart,
        total: cart.reduce((sum, item) => sum + item.price, 0)
    };

    try {
        const response = await fetch("/place-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(order)
        });

        if (!response.ok) {
            throw new Error("Server error");
        }

        const result = await response.json();

        if (result.success) {
            currentOrderId = result.order.id;
            document.getElementById("customerOrderStatus").textContent =
                "🟡 Pending — Waiting for restaurant confirmation";
            document.getElementById("successTable").textContent =
                "TABLE " + table;

            const details = document.getElementById("successOrderDetails");

            details.innerHTML = cart.map(item => `
    <div class="success-item">
        <span>${item.name}</span>
        <strong>₹${item.price}</strong>
    </div>
`).join("");

            details.innerHTML += `
    <div class="success-item success-total">
        <span>Total Amount</span>
        <strong>₹${order.total}</strong>
    </div>
`;

            document.getElementById("successModal").classList.add("show");

            cart = [];
            showCart();
        } else {
            alert("Order could not be placed. Please try again.");
        }
    } catch (error) {
        alert("Unable to place order. Please try again.");
        console.error(error);
    }
}
function closeSuccessModal() {
    document.getElementById("successModal").classList.remove("show");
}

showMenu();
showCart();