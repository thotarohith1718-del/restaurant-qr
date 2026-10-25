const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const folder = path.join(__dirname, "qr-codes");

if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
}

async function generateQR() {

    for (let i = 1; i <= 10; i++) {
        const url = `https://restaurant-qr-se02.onrender.com/?table=${i}`;

        await QRCode.toFile(
            path.join(folder, `table-${i}.png`),
            url
        );

        console.log(`Table ${i} QR generated`);
    }

    console.log("All 10 QR codes generated!");
}

generateQR();