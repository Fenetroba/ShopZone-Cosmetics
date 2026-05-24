const PDFDocument = require('pdfkit');

const generateOrderPDF = (order) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(24).fillColor('#6366f1').text('shopZone Cosmetics', 50, 50);
    doc.fontSize(10).fillColor('#666').text('Your one-stop shop', 50, 80);

    // Invoice title
    doc.fontSize(18).fillColor('#333').text('ORDER INVOICE', 350, 50);
    doc.fontSize(10).fillColor('#666').text(`Order #${order.orderNumber}`, 350, 75);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 350, 90);

    // Divider
    doc.moveTo(50, 110).lineTo(550, 110).stroke('#e5e7eb');

    // Shipping address
    doc.fontSize(12).fillColor('#333').text('Ship To:', 50, 125);
    doc.fontSize(10).fillColor('#666');
    doc.text(order.shippingAddress.name || '', 50, 142);
    doc.text(order.shippingAddress.street || '', 50, 157);
    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`, 50, 172);
    doc.text(order.shippingAddress.country || '', 50, 187);

    // Items table header
    doc.moveTo(50, 210).lineTo(550, 210).stroke('#e5e7eb');
    doc.fontSize(10).fillColor('#333');
    doc.text('Item', 50, 220);
    doc.text('Qty', 350, 220);
    doc.text('Price', 420, 220);
    doc.text('Total', 490, 220);
    doc.moveTo(50, 235).lineTo(550, 235).stroke('#e5e7eb');

    // Items
    let y = 245;
    order.items.forEach((item) => {
      doc.fontSize(9).fillColor('#555');
      doc.text(item.title || 'Product', 50, y, { width: 280 });
      doc.text(item.quantity.toString(), 350, y);
      doc.text(`$${item.price.toFixed(2)}`, 420, y);
      doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 490, y);
      y += 20;
    });

    // Totals
    doc.moveTo(350, y + 5).lineTo(550, y + 5).stroke('#e5e7eb');
    y += 15;
    doc.fontSize(10).fillColor('#555');
    doc.text('Subtotal:', 350, y);
    doc.text(`$${order.itemsPrice.toFixed(2)}`, 490, y);
    y += 15;
    if (order.discountAmount > 0) {
      doc.fillColor('#10b981').text('Discount:', 350, y);
      doc.text(`-$${order.discountAmount.toFixed(2)}`, 490, y);
      y += 15;
    }
    doc.fillColor('#555').text('Shipping:', 350, y);
    doc.text(`$${order.shippingPrice.toFixed(2)}`, 490, y);
    y += 15;
    doc.text('Tax:', 350, y);
    doc.text(`$${order.taxPrice.toFixed(2)}`, 490, y);
    y += 15;
    doc.moveTo(350, y).lineTo(550, y).stroke('#333');
    y += 8;
    doc.fontSize(12).fillColor('#333').font('Helvetica-Bold');
    doc.text('Total:', 350, y);
    doc.text(`$${order.totalPrice.toFixed(2)}`, 490, y);

    // Footer
    doc.fontSize(9).fillColor('#999').font('Helvetica');
    doc.text('Thank you for shopping with shopZone Cosmetics!', 50, 720, { align: 'center', width: 500 });

    doc.end();
  });
};

module.exports = { generateOrderPDF };
