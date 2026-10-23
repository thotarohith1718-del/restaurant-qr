const foods = [
    { name: "Chicken Biryani", price: 250 },
    { name: "Veg Biryani", price: 180 },
    { name: "Paneer Butter Masala", price: 200 },
    { name: "Chicken Fried Rice", price: 190 },
    { name: "Masala Dosa", price: 80 },
    { name: "Chicken 65", price: 220 },
    { name: "Veg Meals", price: 120 },
    { name: "Ice Cream", price: 60 }
];

let cart = [];

const params = new URLSearchParams(window.location.search);
const table = params.get("table") || "Not Assigned";

function showMenu() {
    let  menu = document.getElementById("menu");
    menu.innerHTML = "";

    foods.forEach((food, index) => {
        menu.innerHTML += `
            <div class="food">
                <h3>${food.name}</h3>
                <p>Price: ₹${food.price}</p>
                <button onclick="addToCart(${index})">
                    Add to Cart
                </button>
            </div>
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

    cart.forEach((item, index) => {
        total += item.price;

        cartDiv.innerHTML += `
            <p>
                ${item.name} - ₹${item.price}
                <button onclick="removeItem(${index})">
                    Remove
                </button>
            </p>
        `;
    });

    document.getElementById("total").textContent = total;
}

function removeItem(index) {
    cart.splice(index, 1);
    showCart();
}

async function placeOrder() {
    if (cart.length === 0) {
        alert("Please add food items first!");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const table = params.get("table") || "Not Assigned";

    const order = {
        table: table,
        items: cart,
        total: Number(document.getElementById("total").textContent)
    };

    try {
        const response = await fetch("/place-order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(order)
        });

        const result = await response.json();

        if (result.success) {
            alert("Order placed successfully!");

            cart = [];
            showCart();
        }
    } catch (error) {
        alert("Unable to place order. Please try again.");
        console.error(error);
    }
}
showMenu();