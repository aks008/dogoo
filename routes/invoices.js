const express = require('express');
const router = express.Router();
const Invoice = require('../model/invoice');
const InvoiceService = require('../service/invoice.service');
const invoiceService = new InvoiceService();
const path = require("path");
const fs = require("fs");
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');


router.get('/:id', async function (req, res) {
    let browser;
    try {
        const invoiceDetails = await invoiceService.getInvoiceDetails(req.params.id);

        const templatePath = path.join(__dirname, '../views/invoice/invoice.html');
        let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

        let tableRows = invoiceDetails.products.map(orderDetails => `
            <tr>
                <td><a class="cut">-</a><span contenteditable>${orderDetails?.name}</span></td>
                <td><span contenteditable>${orderDetails?.description}</span></td>
                <td><span data-prefix>₹</span><span contenteditable>${orderDetails?.price}</span></td>
                <td><span contenteditable>${orderDetails?.quantity}</span></td>
                <td><span data-prefix>₹</span><span>${orderDetails?.price * orderDetails?.quantity}</span></td>
            </tr>`).join('');

        if (invoiceDetails.isDeliveryCharge) {
            tableRows += `<tr>
                <td colspan="4"><a class="cut">-</a><span contenteditable>Delivery charges</span></td>
                <td style="text-align: right;"><span data-prefix></span><span>₹49</span></td>
            </tr>`;
        }

        let filledHtml = htmlTemplate
            .replace('{{customerName}}', invoiceDetails.address.name || 'N/A')
            .replace('{{address}}', `${invoiceDetails.address.line1},<br> ${invoiceDetails.address.line2},<br> ${invoiceDetails.address.city}-${invoiceDetails.address.zip}` || 'N/A')
            .replace('{{customerPhone}}', invoiceDetails.address.phone || 'N/A')
            .replace('{{number}}', invoiceDetails.invoiceDetails.invoiceNumber || 'N/A')
            .replace('{{Date}}', invoiceDetails.orderDate || 'N/A')
            .replace('{{Amount}}', invoiceDetails.paymentDetails.amount.toFixed(2) || '0.00')
            .replace('{{table}}', tableRows)
            .replace('{{total}}', invoiceDetails.paymentDetails.amount.toFixed(2) || '0.00');

        // Launch Puppeteer with Vercel-compatible Chromium
        browser = await puppeteer.launch({
            args: [
                ...chromium.args,
                "--disable-gpu",
                "--single-process",
                "--no-zygote"
            ],
            executablePath: await chromium.executablePath() || "/usr/bin/chromium",
            headless: chromium.headless
        });

        const page = await browser.newPage();
        await page.setContent(filledHtml, { waitUntil: 'load' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { left: '1cm', right: '1cm', bottom: '1.5cm' }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating PDF:', error.message);
        res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    } finally {
        if (browser) await browser.close();
    }
});



router.get('/', async function (req, res) {
    try {
        const invoiceDetails = await Invoice.find();
        if (!invoiceDetails) {
            return res.status(404).json({ message: "Invoice not found" });
        }
        return res.json(invoiceDetails);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', async function (req, res) {
    try {
        const invoiceDetails = await Invoice.find();
        if (!invoiceDetails) {
            return res.status(404).json({ message: "Invoice not found" });
        }
        return res.json(invoiceDetails);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
