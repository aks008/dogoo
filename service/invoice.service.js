const invoice = require("../model/invoice");
const Invoice = require("../model/invoice"); // Import the Invoice model
const Order = require("../model/orders"); // Assuming you have an Order model
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

class InvoiceService {
  async generateInvoice(orderId) {
    try {
      // Check if the order exists
      const order = await Order.findOne({ _id: orderId });
      if (!order) {
        throw new Error("Order not found");
      }

      // Generate a unique invoice number (Example: INV-123456)
      const invoiceNumber = `INV-${Date.now()}`;

      // Create a new invoice
      const invoice = new Invoice({
        invoiceNumber,
        orderId: orderId, 
        invoiceDate: new Date(),
      });

      // Save to database
      const savedInvoice = await invoice.save();

      // Return the saved invoice object
      return savedInvoice;
    } catch (error) {
      console.error("Error generating invoice:", error);
      throw error;  // You can throw more specific errors here if needed
    }
  }

  async getInvoiceDetails(invoiceId) {
    try {     

      const invoice = await Invoice.findOne({ _id: invoiceId });
      const invoiceDetails = await Order.aggregate([
			// Step 1: Match the order by _id or orderNumber
			{
				$match: {
					_id: new ObjectId(invoice.orderId) // Match by Order ID
				}
			},
			{
				$lookup: {
					from: "payments",  // Payment collection
					localField: "_id",  // Field in Order (using _id as order reference)
					foreignField: "orderId",  // orderId in Payment collection
					as: "paymentDetails"  // Alias for merged payment details
				}
			},
			{
				$lookup: {
					from: "invoices",  // Payment collection
					localField: "_id",  // Field in Order (using _id as order reference)
					foreignField: "orderId",  // orderId in Payment collection
					as: "invoiceDetails"  // Alias for merged payment details
				}
			},
			{
				$unwind: {
					path: "$invoiceDetails",  // Flatten the productsDetails array
					preserveNullAndEmptyArrays: true  // Keep documents even if there are no matches
				}
			},
			// Step 9: If no payment found, set to empty array
			{
				$addFields: {
					paymentDetails: { $ifNull: ["$paymentDetails", []] }
				}
			},
			// Step 2: Lookup to join the Address collection
			{
				$lookup: {
					from: "addresses",  // Address collection name
					localField: "address",  // Field in Order (ObjectId of address)
					foreignField: "_id",  // _id field in Address collection
					as: "addressDetails"  // Alias for the merged address details
				}
			},

			// Step 3: If no address found, set to empty array
			{
				$addFields: {
					addressDetails: { $ifNull: ["$addressDetails", []] }
				}
			},
			{
				$unwind: {
					path: "$addressDetails",  // Flatten the productsDetails array
					preserveNullAndEmptyArrays: true  // Keep documents even if there are no matches
				}
			},
			{
				$unwind: {
					path: "$paymentDetails",  // Flatten the productsDetails array
					preserveNullAndEmptyArrays: true  // Keep documents even if there are no matches
				}
			},
			// Step 4: Unwind the products array in the order
			{
				$unwind: "$products"
			},

			// Step 5: Lookup product details from the products collection
			{
				$lookup: {
					from: "products",  // Product collection
					localField: "products.productId",  // Field in Order's products array
					foreignField: "_id",  // _id in the Products collection
					as: "productDetails"  // Alias for merged product details
				}
			},

			// Step 6: Unwind the product details array
			{
				$unwind: {
					path: "$productDetails",  // Flatten the productsDetails array
					preserveNullAndEmptyArrays: true  // Keep documents even if there are no matches
				}
			},

			// Step 7: Match products that are correctly linked to the order's products
			{
				$match: {
					$expr: {
						$eq: ["$products.productId", "$productDetails._id"]
					}
				}
			},

			// Step 8: Group the results by orderNumber and aggregate relevant fields
			{
				$group: {
					_id: "$orderNumber",  // Group by orderNumber
					address: { $first: "$addressDetails" },  // Include the first matched address details
					totalAmount: { $first: "$totalAmount" },
					instructions: { $first: "$instructions" },
					timeSlot: { $first: "$timeSlot" },
					paymentMethod: { $first: "$paymentMethod" },
					paymentDetails: { $first: "$paymentDetails" },
					isDeliveryCharge: { $first: "$isDeliveryCharge" },
					orderDate: {
						$first: {
							$dateToString: {
								format: "%d-%m-%Y",  // Format the order date as dd-mm-yyyy
								date: "$orderDate"
							}
						}
					},
					status: { $first: "$status" },
					orderNumber: { $first: "$orderNumber" },
					invoiceDetails: { $first: "$invoiceDetails" },
					products: {
						$push: {
							productId: "$products.productId",
							quantity: "$products.quantity",
							totalPrice: "$products.totalPrice",
							name: "$productDetails.name",
							description: "$productDetails.description",
							price: "$productDetails.price",
							category: "$productDetails.category",
							stock: "$productDetails.stock",
							imageUrl: "$productDetails.imageUrl",
							discount: "$productDetails.discount",
							createdAt: "$productDetails.createdAt"
						}
					}
				}
			}
      ]);
      return invoiceDetails.length > 0 ? invoiceDetails[0] : null;

    } catch (error) {
      console.log(error);
      console.error("Error fetching invoice details:", error);
      throw error;
    }
  }
}

module.exports = InvoiceService;
