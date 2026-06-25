import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.review.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash passwords
  const customerPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // Seed test user
  const testUser = await prisma.user.create({
    data: {
      email: 'test@luxestore.com',
      name: 'Test User',
      password: customerPassword,
      role: 'USER',
    },
  });
  console.log('Created test user:', testUser.email);

  // Seed admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@luxestore.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Created admin user:', adminUser.email);

  const productsData = [
    // Electronics
    {
      title: "Premium Wireless Headphones",
      price: 149.99,
      description: "Experience premium sound quality with active noise cancellation. Features 30-hour battery life, comfortable over-ear design, and seamless Bluetooth 5.0 connectivity.",
      category: "electronics",
      brand: "Sony",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
      rating: 4.6,
      stock: 50,
    },
    {
      title: "Smart Watch Pro",
      price: 299.99,
      description: "Advanced smartwatch with AMOLED display, GPS tracking, heart rate monitoring, and 7-day battery life. Water-resistant to 50m with over 100 workout modes.",
      category: "electronics",
      brand: "Apple",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60",
      rating: 4.8,
      stock: 30,
    },
    {
      title: "Portable Bluetooth Speaker",
      price: 59.99,
      description: "Compact yet powerful Bluetooth speaker with 360° sound, IPX7 waterproof rating, and 12-hour battery life. Perfect companion for outdoor adventures.",
      category: "electronics",
      brand: "JBL",
      image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=60",
      rating: 4.2,
      stock: 100,
    },
    {
      title: "Noise-Cancelling Earbuds",
      price: 119.99,
      description: "True wireless earbuds with hybrid active noise cancellation. Features transparency mode, touch controls, and wireless charging case.",
      category: "electronics",
      brand: "Bose",
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60",
      rating: 4.5,
      stock: 75,
    },

    // Clothing
    {
      title: "Slim Fit Cotton T-Shirt",
      price: 29.99,
      description: "Classic slim-fit cotton t-shirt crafted from 100% premium organic cotton. Features reinforced stitching, pre-shrunk fabric, and a modern silhouette.",
      category: "clothing",
      brand: "Uniqlo",
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
      rating: 4.1,
      stock: 150,
    },
    {
      title: "Casual Denim Jacket",
      price: 79.99,
      description: "Classic denim jacket with a modern twist. Features premium washed denim, metal button closures, and adjustable waist tabs. Versatile layering piece.",
      category: "clothing",
      brand: "Levi's",
      image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop&q=60",
      rating: 4.3,
      stock: 45,
    },
    {
      title: "Premium Hoodie",
      price: 64.99,
      description: "Ultra-soft premium hoodie made from a cotton-polyester blend. Features double-lined hood, kangaroo pocket, and ribbed cuffs.",
      category: "clothing",
      brand: "Nike",
      image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=60",
      rating: 4.0,
      stock: 80,
    },
    {
      title: "Wool Blend Overcoat",
      price: 189.99,
      description: "Sophisticated wool-blend overcoat with notch lapels and single-breasted design. Features satin-lined interior, welt pockets, and a tailored fit.",
      category: "clothing",
      brand: "Zara",
      image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=60",
      rating: 4.6,
      stock: 25,
    },

    // Home
    {
      title: "Minimalist Desk Lamp",
      price: 49.99,
      description: "Sleek and minimalist LED desk lamp with adjustable brightness and color temperature. Includes a built-in wireless charging pad for your phone.",
      category: "home",
      brand: "Philips",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=60",
      rating: 4.4,
      stock: 60,
    },
    {
      title: "Ceramic Coffee Mug Set",
      price: 34.99,
      description: "Set of 4 hand-thrown ceramic mugs with a speckled glaze finish. Microwave and dishwasher safe, perfect for your morning brew.",
      category: "home",
      brand: "Anthropologie",
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60",
      rating: 4.7,
      stock: 120,
    },
    {
      title: "Scented Soy Candle Set",
      price: 24.99,
      description: "Trio of natural soy wax candles infused with lavender, sandalwood, and eucalyptus essential oils. Eco-friendly with a 40-hour burn time per candle.",
      category: "home",
      brand: "Yankee Candle",
      image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&auto=format&fit=crop&q=60",
      rating: 4.5,
      stock: 90,
    },
    {
      title: "Ergonomic Office Chair",
      price: 249.99,
      description: "High-back ergonomic chair with breathable mesh back, adjustable lumbar support, and 3D armrests. Designed for maximum comfort during long work hours.",
      category: "home",
      brand: "Herman Miller",
      image: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=500&auto=format&fit=crop&q=60",
      rating: 4.9,
      stock: 20,
    },
  ];

  const reviewComments = [
    "Amazing product, absolutely love it!",
    "Decent quality, but shipping was a bit slow.",
    "Very premium feel, highly recommended!",
    "Great value for money.",
    "Exactly what I was looking for.",
    "Not bad, but could be improved."
  ];

  console.log('Creating products and reviews...');
  for (const product of productsData) {
    const createdProduct = await prisma.product.create({
      data: {
        title: product.title,
        price: product.price,
        description: product.description,
        category: product.category,
        brand: product.brand,
        image: product.image,
        stock: product.stock,
      },
    });

    const rating1 = Math.floor(Math.random() * 2) + 4; // 4 or 5
    const rating2 = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
    const avgRating = Number(((rating1 + rating2) / 2).toFixed(1));

    await prisma.review.createMany({
      data: [
        {
          userId: testUser.id,
          productId: createdProduct.id,
          rating: rating1,
          comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
        },
        {
          userId: adminUser.id,
          productId: createdProduct.id,
          rating: rating2,
          comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
        }
      ]
    });

    await prisma.product.update({
      where: { id: createdProduct.id },
      data: { rating: avgRating }
    });

    console.log(`Created product: ${createdProduct.title} (Rating: ${avgRating})`);
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
