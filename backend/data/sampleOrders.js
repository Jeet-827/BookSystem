import Book from '../models/Book.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

export const seedSampleOrdersIfEmpty = async () => {
  try {
    const existingOrdersCount = await Order.countDocuments();
    if (existingOrdersCount > 0) {
      return;
    }

    // Ensure we have at least one user
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        name: 'Demo Reader',
        email: 'customer@bookmart.com',
        password: 'Password@123',
        role: 'user',
      });
    }

    // Fetch existing books
    const books = await Book.find().limit(8);
    if (!books || books.length === 0) {
      return;
    }

    const sampleOrdersData = [
      {
        orderNumber: 'BM-L9Z2A-1042',
        invoiceNumber: 'INV-2026-819201',
        user: user._id,
        items: [
          {
            book: books[0]._id,
            title: books[0].title,
            author: books[0].author,
            image: books[0].image,
            price: books[0].price,
            quantity: 1,
            digitalFileKey: books[0].downloadUrl || '',
            fileFormat: books[0].fileFormat || 'PDF',
            fileSize: books[0].fileSize || '4.2 MB',
          },
        ],
        paymentMethod: 'razorpay',
        paymentDetails: {
          gateway: 'Razorpay',
          razorpayPaymentId: 'pay_rzp_test_10928172',
          razorpayOrderId: 'order_rzp_98127391',
          razorpaySignature: 'sig_valid_demo',
        },
        transactionId: 'pay_rzp_173928192_ABC',
        subtotal: books[0].price,
        discount: 0,
        totalAmount: books[0].price,
        paymentStatus: 'paid',
        orderStatus: 'completed',
        refundStatus: 'none',
        paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        orderNumber: 'BM-L9X8B-4921',
        invoiceNumber: 'INV-2026-928103',
        user: user._id,
        items: [
          {
            book: books[1]._id,
            title: books[1].title,
            author: books[1].author,
            image: books[1].image,
            price: books[1].price,
            quantity: 1,
            digitalFileKey: books[1].downloadUrl || '',
            fileFormat: books[1].fileFormat || 'PDF',
            fileSize: books[1].fileSize || '5.8 MB',
          },
          {
            book: books[2]._id,
            title: books[2].title,
            author: books[2].author,
            image: books[2].image,
            price: books[2].price,
            quantity: 1,
            digitalFileKey: books[2].downloadUrl || '',
            fileFormat: books[2].fileFormat || 'PDF',
            fileSize: books[2].fileSize || '8.4 MB',
          },
        ],
        paymentMethod: 'razorpay',
        paymentDetails: {
          gateway: 'Razorpay',
          razorpayPaymentId: 'pay_rzp_test_58192039',
          razorpayOrderId: 'order_rzp_39201928',
          razorpaySignature: 'sig_valid_demo',
        },
        transactionId: 'pay_rzp_173939102_DEF',
        subtotal: books[1].price + books[2].price,
        discount: 100,
        couponCode: 'READMORE',
        totalAmount: books[1].price + books[2].price - 100,
        paymentStatus: 'paid',
        orderStatus: 'completed',
        refundStatus: 'none',
        paidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        orderNumber: 'BM-M0A3C-9041',
        invoiceNumber: 'INV-2026-104928',
        user: user._id,
        items: [
          {
            book: books[2]._id,
            title: books[2].title,
            author: books[2].author,
            image: books[2].image,
            price: books[2].price,
            quantity: 2,
            digitalFileKey: books[2].downloadUrl || '',
            fileFormat: books[2].fileFormat || 'PDF',
            fileSize: books[2].fileSize || '8.4 MB',
          },
        ],
        paymentMethod: 'razorpay',
        paymentDetails: {
          gateway: 'Razorpay',
          razorpayPaymentId: 'pay_rzp_test_90481920',
          razorpayOrderId: 'order_rzp_48192039',
          razorpaySignature: 'sig_valid_demo',
        },
        transactionId: 'pay_rzp_173948192_GHI',
        subtotal: books[2].price * 2,
        discount: 0,
        totalAmount: books[2].price * 2,
        paymentStatus: 'paid',
        orderStatus: 'completed',
        refundStatus: 'none',
        paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        orderNumber: 'BM-M1B7D-6192',
        invoiceNumber: 'INV-2026-492019',
        user: user._id,
        items: [
          {
            book: books[3] ? books[3]._id : books[0]._id,
            title: books[3] ? books[3].title : books[0].title,
            author: books[3] ? books[3].author : books[0].author,
            image: books[3] ? books[3].image : books[0].image,
            price: books[3] ? books[3].price : books[0].price,
            quantity: 1,
            digitalFileKey: books[3] ? books[3].downloadUrl : books[0].downloadUrl,
            fileFormat: 'PDF',
            fileSize: '6.1 MB',
          },
        ],
        paymentMethod: 'razorpay',
        paymentDetails: {
          gateway: 'Razorpay',
          razorpayPaymentId: 'pay_rzp_test_61920491',
          razorpayOrderId: 'order_rzp_61920491',
          razorpaySignature: 'sig_valid_demo',
        },
        transactionId: 'pay_rzp_173959102_JKL',
        subtotal: books[3] ? books[3].price : books[0].price,
        discount: 0,
        totalAmount: books[3] ? books[3].price : books[0].price,
        paymentStatus: 'paid',
        orderStatus: 'completed',
        refundStatus: 'requested',
        refundReason: 'Accidentally ordered twice, requested refund',
        refundAmount: books[3] ? books[3].price : books[0].price,
        refundRequestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        orderNumber: 'BM-M2C8E-3829',
        invoiceNumber: 'INV-2026-629104',
        user: user._id,
        items: [
          {
            book: books[0]._id,
            title: books[0].title,
            author: books[0].author,
            image: books[0].image,
            price: books[0].price,
            quantity: 1,
            digitalFileKey: books[0].downloadUrl,
            fileFormat: 'EPUB',
            fileSize: '4.2 MB',
          },
          {
            book: books[1]._id,
            title: books[1].title,
            author: books[1].author,
            image: books[1].image,
            price: books[1].price,
            quantity: 1,
            digitalFileKey: books[1].downloadUrl,
            fileFormat: 'PDF',
            fileSize: '5.8 MB',
          },
        ],
        paymentMethod: 'razorpay',
        paymentDetails: {
          gateway: 'Razorpay',
          razorpayPaymentId: 'pay_rzp_test_38291049',
          razorpayOrderId: 'order_rzp_38291049',
          razorpaySignature: 'sig_valid_demo',
        },
        transactionId: 'pay_rzp_173969201_MNO',
        subtotal: books[0].price + books[1].price,
        discount: 50,
        totalAmount: books[0].price + books[1].price - 50,
        paymentStatus: 'paid',
        orderStatus: 'completed',
        refundStatus: 'none',
        paidAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
    ];

    await Order.insertMany(sampleOrdersData);
  } catch (err) {
    console.error('Failed to auto-seed sample orders:', err.message);
  }
};
