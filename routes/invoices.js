const express = require('express');
const router = express.Router();
const Invoice = require('../model/invoice');
const InvoiceService = require('../service/invoice.service');
const invoiceService = new InvoiceService();
const path = require("path");
const fs = require("fs");
const puppeteer = require('puppeteer');

router.get('/:id', async function (req, res) {
    try {
        // Fetch invoice details from the service
        const invoiceDetails = await invoiceService.getInvoiceDetails(req.params.id);

        // Read the HTML template
        const templatePath = path.join(__dirname, '../views/invoice/invoice.html');
        let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

        // Generate table rows for products
        let tableRows = "";
        for (let orderDetails of invoiceDetails.products) {
            tableRows += `<tr>
                <td><a class="cut">-</a><span contenteditable>${orderDetails?.name}</span></td>
                <td><span contenteditable>${orderDetails?.description}</span></td>
                <td><span data-prefix>₹</span><span contenteditable>${orderDetails?.price}</span></td>
                <td><span contenteditable>${orderDetails?.quantity}</span></td>
                <td><span data-prefix>₹</span><span>${orderDetails?.price * orderDetails?.quantity}</span></td>
            </tr>`;
        }
        if (invoiceDetails.isDeliveryCharge) {
          tableRows += `<tr>
                <td colspan="4"><a class="cut">-</a><span contenteditable>Delivery charges</span></td>
                <td style="text-align: right;">
                    <span data-prefix style="display: inline-block;"></span>
                    <span style="display: inline-block;">₹49</span>
                </td>
            </tr>`
        }
        // Replace placeholders with actual data
        let filledHtml = htmlTemplate
            .replace('{{customerName}}', invoiceDetails.address.name || 'N/A')
            .replace('{{address}}', `${invoiceDetails.address.line1},<br> ${invoiceDetails.address.line2},<br> ${invoiceDetails.address.city}-${invoiceDetails.address.zip}` || 'N/A')
            .replace('{{customerPhone}}', invoiceDetails.address.phone || 'N/A')
            .replace('{{number}}', invoiceDetails.invoiceDetails.invoiceNumber || 'N/A')
            .replace('{{Date}}', invoiceDetails.orderDate || 'N/A')
            .replace('{{Amount}}', invoiceDetails.paymentDetails.amount.toFixed(2) || '0.00')
            .replace('{{table}}', tableRows)
            .replace('{{total}}', invoiceDetails.paymentDetails.amount.toFixed(2) || '0.00');

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        // Set content & ensure styles load
        await page.setContent(filledHtml);

        // Generate PDF
        const pdfBuffer = await page.pdf({
            printBackground: true,
            displayHeaderFooter: false,
            format: "letter",
            margin: {"left": "1cm", "right": "1cm", "bottom": "1.5cm"}
        });
        await page.close();
        await browser.close();
        // Set headers for correct PDF download
        res.set("Content-Type", "application/pdf");
        res.write(pdfBuffer);
        return res.end();
    } catch (error) {
        console.log(error);
        console.error('Error generating invoice PDF:', error);
        res.status(500).send('Server Error');
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
