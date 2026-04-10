import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ExpenseCategory,
  OrderStatus,
  PrismaClient,
  Role,
  StockMovementReason,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import { Pool } from 'pg';

if (!process.env.DIRECT_URL) {
  throw new Error('DIRECT_URL is required to run prisma seed');
}
const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const toDate = (iso: string): Date => new Date(`${iso}T12:00:00.000Z`);
const pad = (n: number) => String(n).padStart(2, '0');
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const between = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── deterministic seed for reproducibility ────────────────────────
let _seed = 2025;
function seededRandom() {
  _seed = (_seed * 16807) % 2147483647;
  return (_seed - 1) / 2147483646;
}
function sPick<T>(arr: T[]): T { return arr[Math.floor(seededRandom() * arr.length)]; }
function sBetween(min: number, max: number) { return Math.floor(seededRandom() * (max - min + 1)) + min; }

const main = async (): Promise<void> => {
  console.log('⏳ Cleaning existing seed data...');
  await prisma.stockMovement.deleteMany();
  await prisma.return.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  console.log('✅ Old data cleared');

  // ─── Users ───────────────────────────────────────────────────────
  const hashOpts = { type: argon2.argon2id as const, memoryCost: 65536, timeCost: 3, parallelism: 4 };

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@planventory.com' },
    update: {},
    create: { email: 'admin@planventory.com', passwordHash: await argon2.hash('SuperAdmin@2025!', hashOpts), name: 'Super Admin', role: Role.SUPER_ADMIN, isActive: true },
  });
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@planventory.com' },
    update: {},
    create: { email: 'manager@planventory.com', passwordHash: await argon2.hash('Manager@2025!', hashOpts), name: 'Warehouse Manager', role: Role.MANAGER, isActive: true },
  });
  const warehouseUser = await prisma.user.upsert({
    where: { email: 'warehouse@planventory.com' },
    update: {},
    create: { email: 'warehouse@planventory.com', passwordHash: await argon2.hash('Warehouse@2025!', hashOpts), name: 'Warehouse Operator', role: Role.WAREHOUSE, isActive: true },
  });
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@planventory.com' },
    update: {},
    create: { email: 'staff@planventory.com', passwordHash: await argon2.hash('Staff@2025!', hashOpts), name: 'Floor Staff', role: Role.WAREHOUSE, isActive: true },
  });
  const operators = [managerUser, warehouseUser, staffUser];
  console.log('✅ 4 users');

  // ─── Settings ────────────────────────────────────────────────────
  for (const s of [
    { key: 'low_stock_threshold', value: 10 },
    { key: 'currency_code', value: 'USD' },
    { key: 'company_name', value: 'Planventory Inc.' },
  ]) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: { key: s.key, value: s.value } });
  }

  // ─── Categories ──────────────────────────────────────────────────
  const catDefs = [
    'Electronics', 'Furniture', 'Office Supplies', 'Packaging',
    'Cleaning', 'Tools & Hardware', 'Safety', 'Storage',
  ];
  const categories: Record<string, { id: string }> = {};
  for (const name of catDefs) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    categories[name] = await prisma.category.create({ data: { name, slug } });
  }
  console.log(`✅ ${catDefs.length} categories`);

  // ─── Brands ──────────────────────────────────────────────────────
  const brandDefs = [
    'Planventory Essentials', 'Northwind Tools', 'Summit Office',
    'CleanPro', 'BoxCraft', 'TechEdge',
  ];
  const brands: Record<string, { id: string }> = {};
  for (const name of brandDefs) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    brands[name] = await prisma.brand.create({ data: { name, slug } });
  }
  console.log(`✅ ${brandDefs.length} brands`);

  // ─── Products with variants ──────────────────────────────────────
  const productDefs: {
    sku: string; name: string; desc: string; brand: string; category: string;
    variants: { sku: string; color?: string; colorHex?: string; size?: string; cost: number; sell: number; stock: number }[];
  }[] = [
    { sku: 'PV-LAP14', name: 'Business Laptop 14"', desc: 'Thin & light 14-inch business laptop', brand: 'TechEdge', category: 'Electronics',
      variants: [
        { sku: 'PV-LAP14-SLV', color: 'Silver', colorHex: '#c0c0c0', cost: 72000, sell: 95000, stock: 40 },
        { sku: 'PV-LAP14-BLK', color: 'Black', colorHex: '#111111', cost: 72000, sell: 95000, stock: 35 },
      ] },
    { sku: 'PV-LAP15', name: 'Business Laptop 15"', desc: 'High-performance 15-inch workstation', brand: 'TechEdge', category: 'Electronics',
      variants: [
        { sku: 'PV-LAP15-BLK', color: 'Black', colorHex: '#111111', cost: 92000, sell: 115000, stock: 25 },
      ] },
    { sku: 'PV-MON27', name: '27" 4K Monitor', desc: 'Ultra-sharp 4K IPS panel', brand: 'TechEdge', category: 'Electronics',
      variants: [
        { sku: 'PV-MON27-BLK', color: 'Black', colorHex: '#1a1a1a', cost: 28000, sell: 42000, stock: 50 },
      ] },
    { sku: 'PV-WEBCAM', name: 'Webcam HD Pro', desc: '1080p autofocus webcam', brand: 'TechEdge', category: 'Electronics',
      variants: [
        { sku: 'PV-WEBCAM-BLK', color: 'Black', colorHex: '#222222', cost: 4500, sell: 8900, stock: 120 },
      ] },
    { sku: 'PV-MOUSE', name: 'Wireless Ergonomic Mouse', desc: 'Bluetooth silent-click mouse', brand: 'TechEdge', category: 'Electronics',
      variants: [
        { sku: 'PV-MOUSE-GRY', color: 'Gray', colorHex: '#808080', cost: 1800, sell: 3500, stock: 200 },
        { sku: 'PV-MOUSE-WHT', color: 'White', colorHex: '#f5f5f5', cost: 1800, sell: 3500, stock: 180 },
      ] },
    { sku: 'PV-HUB', name: 'USB-C 7-in-1 Hub', desc: 'HDMI, USB-A, SD, charging pass-through', brand: 'TechEdge', category: 'Electronics',
      variants: [
        { sku: 'PV-HUB-SLV', color: 'Silver', colorHex: '#c0c0c0', cost: 2200, sell: 5500, stock: 150 },
      ] },
    { sku: 'PV-CHAIR', name: 'Ergo Office Chair', desc: 'Adjustable lumbar, mesh back', brand: 'Summit Office', category: 'Furniture',
      variants: [
        { sku: 'PV-CHAIR-GRY', color: 'Gray', colorHex: '#7a7a7a', cost: 9000, sell: 14500, stock: 60 },
        { sku: 'PV-CHAIR-BLK', color: 'Black', colorHex: '#222222', cost: 9000, sell: 14500, stock: 55 },
      ] },
    { sku: 'PV-DESK', name: 'Adjustable Standing Desk', desc: 'Electric sit-stand desk 60×30', brand: 'Summit Office', category: 'Furniture',
      variants: [
        { sku: 'PV-DESK-OAK', color: 'Oak', colorHex: '#c9a96e', cost: 24000, sell: 38000, stock: 30 },
        { sku: 'PV-DESK-WAL', color: 'Walnut', colorHex: '#5c4033', cost: 24000, sell: 38000, stock: 25 },
      ] },
    { sku: 'PV-MARM', name: 'Dual Monitor Arm', desc: 'Gas-spring desk clamp for two displays', brand: 'Summit Office', category: 'Furniture',
      variants: [
        { sku: 'PV-MARM-BLK', color: 'Black', colorHex: '#1a1a1a', cost: 3500, sell: 6500, stock: 80 },
      ] },
    { sku: 'PV-FCAB', name: '3-Drawer Filing Cabinet', desc: 'Lockable steel cabinet', brand: 'Summit Office', category: 'Furniture',
      variants: [
        { sku: 'PV-FCAB-GRY', color: 'Gray', colorHex: '#999999', cost: 7000, sell: 12000, stock: 35 },
      ] },
    { sku: 'PV-NTBK', name: 'Premium Notebook (5-pack)', desc: 'A5 ruled hardcover notebooks', brand: 'Planventory Essentials', category: 'Office Supplies',
      variants: [
        { sku: 'PV-NTBK-5PK', cost: 900, sell: 1800, stock: 300 },
      ] },
    { sku: 'PV-PENS', name: 'Gel Pen Set (12-pack)', desc: 'Smooth-write black gel pens', brand: 'Planventory Essentials', category: 'Office Supplies',
      variants: [
        { sku: 'PV-PENS-12', cost: 600, sell: 1200, stock: 500 },
      ] },
    { sku: 'PV-ORGZ', name: 'Desktop Organizer', desc: 'Bamboo desk tidy with 5 compartments', brand: 'Planventory Essentials', category: 'Office Supplies',
      variants: [
        { sku: 'PV-ORGZ-BMB', color: 'Natural', colorHex: '#d4b896', cost: 1400, sell: 2800, stock: 100 },
      ] },
    { sku: 'PV-WBMK', name: 'Whiteboard Markers (8-pack)', desc: 'Assorted dry-erase markers', brand: 'Planventory Essentials', category: 'Office Supplies',
      variants: [
        { sku: 'PV-WBMK-8PK', cost: 700, sell: 1500, stock: 250 },
      ] },
    { sku: 'PV-BOXS', name: 'Shipping Box Small (50-pk)', desc: '10×8×6 corrugated boxes', brand: 'BoxCraft', category: 'Packaging',
      variants: [
        { sku: 'PV-BOXS-50', color: 'Brown', colorHex: '#8b5a2b', cost: 800, sell: 1500, stock: 400 },
      ] },
    { sku: 'PV-BOXM', name: 'Shipping Box Medium (50-pk)', desc: '14×12×8 corrugated boxes', brand: 'BoxCraft', category: 'Packaging',
      variants: [
        { sku: 'PV-BOXM-50', color: 'Brown', colorHex: '#8b5a2b', cost: 1100, sell: 2200, stock: 350 },
      ] },
    { sku: 'PV-BOXL', name: 'Shipping Box Large (25-pk)', desc: '20×16×12 double-wall boxes', brand: 'BoxCraft', category: 'Packaging',
      variants: [
        { sku: 'PV-BOXL-25', color: 'Brown', colorHex: '#8b5a2b', cost: 1500, sell: 3000, stock: 200 },
      ] },
    { sku: 'PV-BWRAP', name: 'Bubble Wrap Roll', desc: '12" × 175 ft perforated roll', brand: 'BoxCraft', category: 'Packaging',
      variants: [
        { sku: 'PV-BWRAP-175', cost: 1200, sell: 2500, stock: 150 },
      ] },
    { sku: 'PV-TAPE', name: 'Packing Tape (6-pack)', desc: '2" × 110 yd heavy-duty', brand: 'BoxCraft', category: 'Packaging',
      variants: [
        { sku: 'PV-TAPE-6PK', cost: 500, sell: 1200, stock: 300 },
      ] },
    { sku: 'PV-CLNR', name: 'All-Purpose Cleaner (6-pack)', desc: 'Multi-surface spray 32 oz ea.', brand: 'CleanPro', category: 'Cleaning',
      variants: [
        { sku: 'PV-CLNR-6PK', cost: 1100, sell: 2400, stock: 120 },
      ] },
    { sku: 'PV-MFCL', name: 'Microfiber Cloth Set (12)', desc: 'Lint-free cleaning cloths', brand: 'CleanPro', category: 'Cleaning',
      variants: [
        { sku: 'PV-MFCL-12', cost: 800, sell: 1600, stock: 200 },
      ] },
    { sku: 'PV-EDRL', name: 'Electric Screwdriver Kit', desc: '48-bit precision driver set', brand: 'Northwind Tools', category: 'Tools & Hardware',
      variants: [
        { sku: 'PV-EDRL-48', color: 'Yellow', colorHex: '#f5c518', cost: 3200, sell: 6500, stock: 70 },
      ] },
    { sku: 'PV-LPRN', name: 'Thermal Label Printer', desc: '4×6 direct thermal shipping labels', brand: 'Northwind Tools', category: 'Tools & Hardware',
      variants: [
        { sku: 'PV-LPRN-4X6', color: 'White', colorHex: '#f0f0f0', cost: 10000, sell: 18000, stock: 40 },
      ] },
    { sku: 'PV-FAID', name: 'First Aid Kit (100-piece)', desc: 'OSHA-compliant workplace kit', brand: 'Planventory Essentials', category: 'Safety',
      variants: [
        { sku: 'PV-FAID-100', cost: 2200, sell: 4500, stock: 50 },
      ] },
    { sku: 'PV-GOGL', name: 'Safety Goggles (10-pack)', desc: 'Anti-fog splash-proof goggles', brand: 'Planventory Essentials', category: 'Safety',
      variants: [
        { sku: 'PV-GOGL-10', cost: 1800, sell: 3800, stock: 80 },
      ] },
    { sku: 'PV-BINS', name: 'Stackable Storage Bins (6)', desc: 'Heavy-duty PP bins with lids', brand: 'Planventory Essentials', category: 'Storage',
      variants: [
        { sku: 'PV-BINS-6PK', color: 'Clear', colorHex: '#e8e8e8', cost: 2000, sell: 4200, stock: 90 },
        { sku: 'PV-BINS-6BL', color: 'Blue', colorHex: '#4488cc', cost: 2000, sell: 4200, stock: 60 },
      ] },
  ];

  type VariantRecord = { id: string; sku: string; cost: number; sell: number; productName: string };
  const allVariants: VariantRecord[] = [];

  for (const p of productDefs) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    const product = await prisma.product.create({
      data: {
        sku: p.sku, name: p.name, slug, description: p.desc,
        brandId: brands[p.brand].id, categoryId: categories[p.category].id,
        tags: ['demo', 'seed-2025'],
      },
    });
    for (const v of p.variants) {
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id, sku: v.sku, color: v.color ?? null, colorHex: v.colorHex ?? null,
          size: v.size ?? null, costPrice: v.cost, sellingPrice: v.sell, stock: v.stock, lowStockAlert: 10,
        },
      });
      allVariants.push({ id: variant.id, sku: variant.sku, cost: v.cost, sell: v.sell, productName: p.name });
    }
  }
  console.log(`✅ ${productDefs.length} products, ${allVariants.length} variants`);

  // ─── Suppliers ───────────────────────────────────────────────────
  const supplierDefs = [
    { name: 'Alpha Source Traders', email: 'supply.alpha@demo.com', phone: '+15550001111' },
    { name: 'Beta Distribution House', email: 'supply.beta@demo.com', phone: '+15550002222' },
    { name: 'Gamma Industrial Co.', email: 'supply.gamma@demo.com', phone: '+15550003333' },
    { name: 'Delta Wholesale', email: 'supply.delta@demo.com', phone: '+15550004444' },
    { name: 'Echo Freight Solutions', email: 'supply.echo@demo.com', phone: '+15550005555' },
    { name: 'Foxtrot Materials', email: 'supply.foxtrot@demo.com', phone: '+15550006666' },
  ];
  const suppliers: { id: string; name: string }[] = [];
  for (const s of supplierDefs) {
    const sup = await prisma.supplier.create({ data: s });
    suppliers.push({ id: sup.id, name: sup.name });
  }
  console.log(`✅ ${suppliers.length} suppliers`);

  // ─── Purchase Orders (10 POs spread across 2025) ─────────────────
  const poSpecs = [
    { month: 1, suppIdx: 0, items: [{ vIdx: 0, qty: 20, uc: 70000 }, { vIdx: 1, qty: 20, uc: 70000 }] },
    { month: 1, suppIdx: 1, items: [{ vIdx: 6, qty: 30, uc: 8500 }, { vIdx: 7, qty: 30, uc: 8500 }] },
    { month: 2, suppIdx: 2, items: [{ vIdx: 3, qty: 60, uc: 27000 }, { vIdx: 5, qty: 80, uc: 2100 }] },
    { month: 3, suppIdx: 3, items: [{ vIdx: 14, qty: 200, uc: 750 }, { vIdx: 15, qty: 200, uc: 1050 }, { vIdx: 16, qty: 100, uc: 1400 }] },
    { month: 4, suppIdx: 0, items: [{ vIdx: 2, qty: 15, uc: 90000 }, { vIdx: 4, qty: 100, uc: 4300 }] },
    { month: 5, suppIdx: 4, items: [{ vIdx: 8, qty: 20, uc: 23000 }, { vIdx: 9, qty: 20, uc: 23000 }] },
    { month: 6, suppIdx: 5, items: [{ vIdx: 19, qty: 60, uc: 1050 }, { vIdx: 20, qty: 100, uc: 750 }] },
    { month: 7, suppIdx: 1, items: [{ vIdx: 21, qty: 40, uc: 3000 }, { vIdx: 22, qty: 25, uc: 9500 }] },
    { month: 9, suppIdx: 2, items: [{ vIdx: 10, qty: 40, uc: 3400 }, { vIdx: 11, qty: 50, uc: 1750 }] },
    { month: 11, suppIdx: 3, items: [{ vIdx: 0, qty: 25, uc: 70000 }, { vIdx: 3, qty: 30, uc: 27000 }] },
  ];
  let poCount = 0;
  for (const po of poSpecs) {
    poCount++;
    const total = po.items.reduce((s, i) => s + i.qty * i.uc, 0);
    const d = toDate(`2025-${pad(po.month)}-${pad(sBetween(5, 22))}`);
    await prisma.purchaseOrder.create({
      data: {
        supplierId: suppliers[po.suppIdx].id, status: 'RECEIVED', totalAmount: total,
        notes: `PO-2025-${pad(poCount)}`, orderedAt: d, receivedAt: d,
        items: { create: po.items.map(i => ({ variantId: allVariants[i.vIdx].id, quantity: i.qty, unitCost: i.uc, receivedQty: i.qty })) },
      },
    });
  }
  console.log(`✅ ${poCount} purchase orders`);

  // ─── Orders (100 orders across 12 months) ────────────────────────
  const customerNames = [
    'Ava Johnson', 'Noah Carter', 'Mila Brooks', 'Ethan Rivera', 'Sophia Patel',
    'Liam Nguyen', 'Olivia Kim', 'Mason Chen', 'Emma Flores', 'James Wilson',
    'Charlotte Lee', 'Benjamin Gupta', 'Amelia Sanders', 'Lucas Martinez', 'Harper Davis',
    'Elijah Thompson', 'Aria Walker', 'Logan Mitchell', 'Chloe Robinson', 'Alexander Young',
    'Mia Hernandez', 'Daniel Scott', 'Ella Adams', 'Jack Turner', 'Grace Nelson',
    'Henry Hill', 'Lily Campbell', 'Owen Roberts', 'Zoe Phillips', 'Samuel Evans',
    'Penelope Morgan', 'Ryan Cooper', 'Nora Bailey', 'Nathan Reed', 'Stella Murphy',
    'Leo Price', 'Victoria Howard', 'Caleb Ward', 'Hannah Cox', 'Isaac Foster',
  ];
  const cities = [
    { city: 'Austin', state: 'TX', zip: '73301' }, { city: 'Denver', state: 'CO', zip: '80014' },
    { city: 'Seattle', state: 'WA', zip: '98101' }, { city: 'Portland', state: 'OR', zip: '97201' },
    { city: 'Chicago', state: 'IL', zip: '60601' }, { city: 'Miami', state: 'FL', zip: '33101' },
    { city: 'Nashville', state: 'TN', zip: '37201' }, { city: 'Boston', state: 'MA', zip: '02101' },
    { city: 'Phoenix', state: 'AZ', zip: '85001' }, { city: 'Atlanta', state: 'GA', zip: '30301' },
    { city: 'Minneapolis', state: 'MN', zip: '55401' }, { city: 'Dallas', state: 'TX', zip: '75201' },
    { city: 'San Diego', state: 'CA', zip: '92101' }, { city: 'Charlotte', state: 'NC', zip: '28201' },
    { city: 'Philadelphia', state: 'PA', zip: '19101' },
  ];
  const streets = [
    '12 Green Lane', '88 Horizon Ave', '300 Sunset Rd', '455 Maple St', '72 Oak Blvd',
    '190 Commerce Dr', '1021 Industrial Pkwy', '8 River Walk', '55 Broadway', '340 Pine Terrace',
    '610 Cedar Ct', '27 Willow Way', '83 Birch St', '902 Elm Crossing', '44 Lake View Dr',
  ];
  const orderStatuses: OrderStatus[] = [
    ...Array(70).fill(OrderStatus.DELIVERED),
    ...Array(12).fill(OrderStatus.SHIPPED),
    ...Array(8).fill(OrderStatus.CONFIRMED),
    ...Array(5).fill(OrderStatus.PROCESSING),
    ...Array(3).fill(OrderStatus.PENDING),
    ...Array(2).fill(OrderStatus.CANCELLED),
  ] as OrderStatus[];
  const ordersPerMonth = [6, 7, 8, 8, 9, 10, 9, 10, 9, 10, 8, 6];
  let orderNum = 0;
  let totalRevenue = 0;
  const createdOrderIds: string[] = [];

  for (let m = 1; m <= 12; m++) {
    const count = ordersPerMonth[m - 1];
    for (let i = 0; i < count; i++) {
      orderNum++;
      const custName = sPick(customerNames);
      const custEmail = custName.toLowerCase().replace(/\s+/g, '.') + '@example.com';
      const loc = sPick(cities);
      const st = sPick(streets);
      const day = sBetween(1, 28);
      const numItems = sBetween(1, 4);
      const chosenVariants = new Set<number>();
      while (chosenVariants.size < numItems) chosenVariants.add(sBetween(0, allVariants.length - 1));

      const items = [...chosenVariants].map(vi => {
        const v = allVariants[vi];
        const qty = v.sell > 20000 ? sBetween(1, 3) : sBetween(1, 10);
        return { variantId: v.id, quantity: qty, unitPrice: v.sell, totalPrice: qty * v.sell };
      });

      const subtotal = items.reduce((s, it) => s + it.totalPrice, 0);
      const taxAmount = Math.round(subtotal * 0.08);
      const shippingCost = sBetween(500, 1500);
      const discountAmount = seededRandom() < 0.2 ? sBetween(500, 3000) : 0;
      const totalAmount = subtotal + taxAmount + shippingCost - discountAmount;
      const status = orderStatuses[orderNum % orderStatuses.length];

      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-2025-${String(orderNum).padStart(4, '0')}`,
          status,
          customerName: custName,
          customerEmail: custEmail,
          shippingAddress: { street: st, city: loc.city, state: loc.state, zip: loc.zip, country: 'US' },
          subtotal, taxAmount, discountAmount, shippingCost, totalAmount,
          notes: `Seed order for 2025-${pad(m)}`,
          idempotencyKey: `seed-2025-${String(orderNum).padStart(4, '0')}`,
          processedBy: sPick(operators).id,
          createdAt: toDate(`2025-${pad(m)}-${pad(day)}`),
          items: { create: items },
        },
      });
      createdOrderIds.push(order.id);
      if (status !== OrderStatus.CANCELLED) totalRevenue += totalAmount;
    }
  }
  console.log(`✅ ${orderNum} orders — gross revenue: $${(totalRevenue / 100).toLocaleString()}`);

  // ─── Returns (8 returns from random delivered orders) ────────────
  const deliveredOrders = createdOrderIds.slice(0, 60);
  const returnIndices = [3, 11, 19, 28, 37, 48, 55, 58];
  let totalRefunds = 0;
  for (const ri of returnIndices) {
    if (ri >= deliveredOrders.length) continue;
    const orderId = deliveredOrders[ri];
    const orderItems = await prisma.orderItem.findMany({ where: { orderId }, take: 1 });
    if (!orderItems.length) continue;
    const oi = orderItems[0];
    const refund = oi.unitPrice * Math.min(oi.quantity, 1);
    totalRefunds += refund;
    await prisma.return.create({
      data: {
        orderId,
        reason: sPick(['Defective on arrival', 'Wrong item shipped', 'Customer changed mind', 'Damaged in transit', 'Item not as described']),
        items: [{ variantId: oi.variantId, quantity: 1, reason: 'Returned by customer' }],
        refundAmount: refund, restocked: seededRandom() > 0.3,
        processedBy: sPick(operators).id,
        createdAt: toDate(`2025-${pad(sBetween(2, 12))}-${pad(sBetween(1, 28))}`),
      },
    });
  }
  console.log(`✅ ${returnIndices.length} returns — total refunds: $${(totalRefunds / 100).toLocaleString()}`);

  // ─── Expenses (3-4 per month, realistic for a small warehouse) ───
  const expCategories: { cat: ExpenseCategory; label: string; min: number; max: number }[] = [
    { cat: ExpenseCategory.PAYROLL, label: 'Staff payroll', min: 120000, max: 150000 },
    { cat: ExpenseCategory.OPERATIONAL, label: 'Warehouse rent', min: 55000, max: 55000 },
    { cat: ExpenseCategory.UTILITIES, label: 'Electricity & water', min: 8000, max: 15000 },
    { cat: ExpenseCategory.MARKETING, label: 'Digital marketing', min: 10000, max: 25000 },
  ];
  let expNum = 0;
  let totalExpenses = 0;
  for (let m = 1; m <= 12; m++) {
    for (const ec of expCategories) {
      expNum++;
      const amount = sBetween(ec.min, ec.max);
      totalExpenses += amount;
      await prisma.expense.create({
        data: {
          amount, category: ec.cat,
          description: `${ec.label} — ${new Date(2025, m - 1).toLocaleString('en-US', { month: 'long' })} 2025`,
          reference: `EXP-2025-${String(expNum).padStart(3, '0')}`,
          date: toDate(`2025-${pad(m)}-${pad(sBetween(1, 5))}`),
          createdBy: managerUser.id,
          createdAt: toDate(`2025-${pad(m)}-${pad(sBetween(1, 5))}`),
        },
      });
    }
    if (m % 3 === 0) {
      expNum++;
      const misc = sBetween(3000, 8000);
      totalExpenses += misc;
      await prisma.expense.create({
        data: {
          amount: misc, category: ExpenseCategory.OTHER,
          description: `Quarterly miscellaneous — Q${Math.ceil(m / 3)} 2025`,
          reference: `EXP-2025-${String(expNum).padStart(3, '0')}`,
          date: toDate(`2025-${pad(m)}-25`),
          createdBy: managerUser.id,
          createdAt: toDate(`2025-${pad(m)}-25`),
        },
      });
    }
  }
  console.log(`✅ ${expNum} expenses — total: $${(totalExpenses / 100).toLocaleString()}`);

  // ─── Stock movements ─────────────────────────────────────────────
  let smCount = 0;
  for (const v of allVariants) {
    await prisma.stockMovement.create({
      data: {
        variantId: v.id, quantity: sBetween(30, 200),
        reason: StockMovementReason.INITIAL, notes: 'Initial stock — Jan 2025',
        performedBy: warehouseUser.id, createdAt: toDate('2025-01-02'),
      },
    });
    smCount++;
  }
  for (let m = 2; m <= 12; m += 2) {
    const numAdj = sBetween(2, 5);
    for (let j = 0; j < numAdj; j++) {
      const v = sPick(allVariants);
      await prisma.stockMovement.create({
        data: {
          variantId: v.id, quantity: sBetween(-5, 20),
          reason: sPick([StockMovementReason.ADJUSTMENT, StockMovementReason.RESTOCK, StockMovementReason.DAMAGE]),
          notes: `Periodic adjustment — ${pad(m)}/2025`,
          performedBy: sPick(operators).id,
          createdAt: toDate(`2025-${pad(m)}-${pad(sBetween(10, 25))}`),
        },
      });
      smCount++;
    }
  }
  console.log(`✅ ${smCount} stock movements`);

  // ─── Summary ─────────────────────────────────────────────────────
  const netProfit = totalRevenue - totalExpenses - totalRefunds;
  const summary = {
    seededAt: new Date().toISOString(),
    year: 2025,
    totals: {
      products: productDefs.length,
      variants: allVariants.length,
      orders: orderNum,
      returns: returnIndices.length,
      expenses: expNum,
      purchaseOrders: poCount,
      stockMovements: smCount,
      suppliers: suppliers.length,
      categories: catDefs.length,
      brands: brandDefs.length,
    },
    financials: {
      grossRevenue: `$${(totalRevenue / 100).toLocaleString()}`,
      totalExpenses: `$${(totalExpenses / 100).toLocaleString()}`,
      totalRefunds: `$${(totalRefunds / 100).toLocaleString()}`,
      netProfit: `$${(netProfit / 100).toLocaleString()}`,
    },
    users: ['admin@planventory.com', 'manager@planventory.com', 'warehouse@planventory.com', 'staff@planventory.com'],
    categories: catDefs,
    brands: brandDefs,
  };

  const logPath = join(process.cwd(), 'prisma', 'seed-log-2025.json');
  await writeFile(logPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log('\n════════════════════════════════════════');
  console.log('  Seed completed — 2025 demo dataset');
  console.log('════════════════════════════════════════');
  console.log(`  Products:        ${productDefs.length} (${allVariants.length} variants)`);
  console.log(`  Orders:          ${orderNum}`);
  console.log(`  Expenses:        ${expNum}`);
  console.log(`  Purchase Orders: ${poCount}`);
  console.log(`  Stock Movements: ${smCount}`);
  console.log(`  Returns:         ${returnIndices.length}`);
  console.log('────────────────────────────────────────');
  console.log(`  Revenue:    $${(totalRevenue / 100).toLocaleString()}`);
  console.log(`  Expenses:   $${(totalExpenses / 100).toLocaleString()}`);
  console.log(`  Refunds:    $${(totalRefunds / 100).toLocaleString()}`);
  console.log(`  Net Profit: $${(netProfit / 100).toLocaleString()}`);
  console.log('════════════════════════════════════════');
  console.log(`  Log: ${logPath}`);
};

main()
  .catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
