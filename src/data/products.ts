import type { Product } from '../types';

export const products: Product[] = [
  {
    id: '1',
    title: "Premium Wireless Headphones",
    price: 149.99,
    description: "Experience premium sound quality with active noise cancellation. Features 30-hour battery life, comfortable over-ear design, and seamless Bluetooth 5.0 connectivity. Perfect for audiophiles and professionals.",
    category: "electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
    rating: { rate: 4.6, count: 234 }
  },
  {
    id: '2',
    title: "Slim Fit Cotton T-Shirt",
    price: 29.99,
    description: "Classic slim-fit cotton t-shirt crafted from 100% premium organic cotton. Features reinforced stitching, pre-shrunk fabric, and a modern silhouette that pairs perfectly with any outfit.",
    category: "clothing",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
    rating: { rate: 4.1, count: 189 }
  },
  {
    id: '3',
    title: "Leather Crossbody Bag",
    price: 89.99,
    description: "Handcrafted genuine leather crossbody bag with adjustable strap. Features multiple compartments, magnetic closure, and RFID-blocking pocket. Perfect for everyday elegance.",
    category: "accessories",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=60",
    rating: { rate: 4.4, count: 156 }
  },
  {
    id: '4',
    title: "Smart Watch Pro",
    price: 299.99,
    description: "Advanced smartwatch with AMOLED display, GPS tracking, heart rate monitoring, and 7-day battery life. Water-resistant to 50m with over 100 workout modes.",
    category: "electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60",
    rating: { rate: 4.8, count: 312 }
  },
  {
    id: '5',
    title: "Casual Denim Jacket",
    price: 79.99,
    description: "Classic denim jacket with a modern twist. Features premium washed denim, metal button closures, and adjustable waist tabs. Versatile layering piece for any season.",
    category: "clothing",
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop&q=60",
    rating: { rate: 4.3, count: 142 }
  },
  {
    id: '6',
    title: "Minimalist Watch",
    price: 199.99,
    description: "Elegant minimalist watch with sapphire crystal glass, Japanese quartz movement, and genuine Italian leather strap. A timeless accessory for the modern professional.",
    category: "accessories",
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&auto=format&fit=crop&q=60",
    rating: { rate: 4.5, count: 167 }
  },
  {
    id: '7',
    title: "Portable Bluetooth Speaker",
    price: 59.99,
    description: "Compact yet powerful Bluetooth speaker with 360° sound, IPX7 waterproof rating, and 12-hour battery life. Perfect companion for outdoor adventures and pool parties.",
    category: "electronics",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=60",
    rating: { rate: 4.2, count: 198 }
  },
  {
    id: '8',
    title: "Premium Hoodie",
    price: 64.99,
    description: "Ultra-soft premium hoodie made from a cotton-polyester blend. Features double-lined hood, kangaroo pocket, and ribbed cuffs. Comfortable enough for lounging, stylish enough for going out.",
    category: "clothing",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=60",
    rating: { rate: 4.0, count: 221 }
  },
  {
    id: '9',
    title: "Gold Pendant Necklace",
    price: 129.99,
    description: "18K gold-plated pendant necklace with cubic zirconia stone. Hypoallergenic, tarnish-resistant chain with adjustable length. Comes in elegant gift box packaging.",
    category: "accessories",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=60",
    rating: { rate: 4.7, count: 89 }
  },
  {
    id: '10',
    title: "Noise-Cancelling Earbuds",
    price: 119.99,
    description: "True wireless earbuds with hybrid active noise cancellation. Features transparency mode, touch controls, and wireless charging case with 24-hour total battery life.",
    category: "electronics",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=60",
    rating: { rate: 4.5, count: 276 }
  },
  {
    id: '11',
    title: "Wool Blend Overcoat",
    price: 189.99,
    description: "Sophisticated wool-blend overcoat with notch lapels and single-breasted design. Features satin-lined interior, welt pockets, and a tailored fit that exudes elegance.",
    category: "clothing",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=60",
    rating: { rate: 4.6, count: 95 }
  },
  {
    id: '12',
    title: "Titanium Sunglasses",
    price: 159.99,
    description: "Lightweight titanium frame sunglasses with polarized UV400 lenses. Scratch-resistant coating, spring hinges, and includes premium leather carrying case.",
    category: "accessories",
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&auto=format&fit=crop&q=60",
    rating: { rate: 4.3, count: 134 }
  }
];

export const categories: string[] = ["all", "electronics", "clothing", "accessories"];
