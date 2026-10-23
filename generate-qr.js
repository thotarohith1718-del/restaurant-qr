const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const folder = path.join(__dirname, "qr-codes");

if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
}

async function generateQR() {

    for (let i = 1; i <= 10; i++) {

        const url = `http://10.46.27.147:3001/?table=${i}`;

        await QRCode.toFile(
            path.join(folder, `table-${i}.png`),
            url
        );

        console.log(`Table ${i} QR generated`);
    }

    console.log("All 10 QR codes generated!");
}

generateQR();