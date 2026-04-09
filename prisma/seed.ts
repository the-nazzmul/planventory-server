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

const toDate = (isoDate: string): Date => new Date(`${isoDate}T12:00:00.000Z`);

const main = async (): Promise<void> => {
  const passwordHash = await argon2.hash('SuperAdmin@2025!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  await prisma.user.upsert({
    where: { email: 'admin@planventory.com' },
    update: {},
    create: {
      email: 'admin@planventory.com',
      passwordHash,
      name: 'Super Admin',
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  const managerPasswordHash = await argon2.hash('Manager@2025!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@planventory.com' },
    update: {},
    create: {
      email: 'manager@planventory.com',
      passwordHash: managerPasswordHash,
      name: 'Warehouse Manager',
      role: Role.MANAGER,
      isActive: true,
    },
  });

  const warehousePasswordHash = await argon2.hash('Warehouse@2025!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const warehouseUser = await prisma.user.upsert({
    where: { email: 'warehouse@planventory.com' },
    update: {},
    create: {
      email: 'warehouse@planventory.com',
      passwordHash: warehousePasswordHash,
      name: 'Warehouse Operator',
      role: Role.WAREHOUSE,
      isActive: true,
    },
  });

  const defaultSettings: { key: string; value: string | number }[] = [
    { key: 'low_stock_threshold', value: 10 },
    { key: 'tax_rate', value: 0 },
    { key: 'currency_code', value: 'USD' },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: { key: setting.key, value: setting.value },
    });
  }

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Electronics' },
      update: {},
      create: { name: 'Electronics', slug: 'electronics' },
    }),
    prisma.category.upsert({
      where: { name: 'Office Supplies' },
      update: {},
      create: { name: 'Office Supplies', slug: 'office-supplies' },
    }),
    prisma.category.upsert({
      where: { name: 'Packaging' },
      update: {},
      create: { name: 'Packaging', slug: 'packaging' },
    }),
  ]);

  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { name: 'Planventory Essentials' },
      update: {},
      create: { name: 'Planventory Essentials', slug: 'planventory-essentials' },
    }),
    prisma.brand.upsert({
      where: { name: 'Northwind Tools' },
      update: {},
      create: { name: 'Northwind Tools', slug: 'northwind-tools' },
    }),
  ]);

  const productSeeds = [
    {
      sku: 'PV-LAP-2025-01',
      name: 'Business Laptop 14',
      slug: 'business-laptop-14',
      description: 'High efficiency business laptop',
      brandId: brands[0].id,
      categoryId: categories[0].id,
      variant: {
        sku: 'PV-LAP-2025-01-BLK',
        color: 'Black',
        colorHex: '#111111',
        costPrice: 72000,
        sellingPrice: 95000,
        stock: 42,
      },
    },
    {
      sku: 'PV-CHAIR-2025-01',
      name: 'Ergo Office Chair',
      slug: 'ergo-office-chair',
      description: 'Adjustable ergonomic office chair',
      brandId: brands[1].id,
      categoryId: categories[1].id,
      variant: {
        sku: 'PV-CHAIR-2025-01-GRY',
        color: 'Gray',
        colorHex: '#7a7a7a',
        costPrice: 9000,
        sellingPrice: 14500,
        stock: 75,
      },
    },
    {
      sku: 'PV-BOX-2025-01',
      name: 'Shipping Box Bundle',
      slug: 'shipping-box-bundle',
      description: 'Pack of 100 branded boxes',
      brandId: brands[0].id,
      categoryId: categories[2].id,
      variant: {
        sku: 'PV-BOX-2025-01-M',
        color: 'Brown',
        colorHex: '#8b5a2b',
        costPrice: 1100,
        sellingPrice: 2200,
        stock: 180,
      },
    },
  ];

  const variantRecords: { id: string; sku: string; sellingPrice: number }[] = [];
  for (const productSeed of productSeeds) {
    const product = await prisma.product.upsert({
      where: { sku: productSeed.sku },
      update: {},
      create: {
        sku: productSeed.sku,
        name: productSeed.name,
        slug: productSeed.slug,
        description: productSeed.description,
        brandId: productSeed.brandId,
        categoryId: productSeed.categoryId,
        tags: ['demo', 'seed-2025'],
      },
    });

    const variant = await prisma.productVariant.upsert({
      where: { sku: productSeed.variant.sku },
      update: {},
      create: {
        productId: product.id,
        sku: productSeed.variant.sku,
        color: productSeed.variant.color,
        colorHex: productSeed.variant.colorHex,
        costPrice: productSeed.variant.costPrice,
        sellingPrice: productSeed.variant.sellingPrice,
        stock: productSeed.variant.stock,
        lowStockAlert: 15,
      },
    });

    variantRecords.push({
      id: variant.id,
      sku: variant.sku,
      sellingPrice: variant.sellingPrice,
    });
  }

  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { email: 'supply.alpha@demo.com' },
      update: {},
      create: {
        name: 'Alpha Source Traders',
        email: 'supply.alpha@demo.com',
        phone: '+15550001111',
      },
    }),
    prisma.supplier.upsert({
      where: { email: 'supply.beta@demo.com' },
      update: {},
      create: {
        name: 'Beta Distribution House',
        email: 'supply.beta@demo.com',
        phone: '+15550002222',
      },
    }),
  ]);

  const purchaseOrders = [
    {
      idempotentRef: 'PO-2025-02',
      supplierId: suppliers[0].id,
      orderedAt: toDate('2025-02-14'),
      totalAmount: 420000,
      items: [
        { variantId: variantRecords[0].id, quantity: 10, unitCost: 70000 },
        { variantId: variantRecords[2].id, quantity: 40, unitCost: 1000 },
      ],
    },
    {
      idempotentRef: 'PO-2025-08',
      supplierId: suppliers[1].id,
      orderedAt: toDate('2025-08-03'),
      totalAmount: 355000,
      items: [
        { variantId: variantRecords[1].id, quantity: 20, unitCost: 8500 },
        { variantId: variantRecords[2].id, quantity: 100, unitCost: 950 },
      ],
    },
  ];

  for (const po of purchaseOrders) {
    const existingPo = await prisma.purchaseOrder.findFirst({
      where: { notes: po.idempotentRef },
      select: { id: true },
    });

    if (!existingPo) {
      await prisma.purchaseOrder.create({
        data: {
          supplierId: po.supplierId,
          status: 'RECEIVED',
          totalAmount: po.totalAmount,
          notes: po.idempotentRef,
          orderedAt: po.orderedAt,
          receivedAt: po.orderedAt,
          items: {
            create: po.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              receivedQty: item.quantity,
            })),
          },
        },
      });
    }
  }

  const monthlyExpenseCategories: ExpenseCategory[] = [
    ExpenseCategory.OPERATIONAL,
    ExpenseCategory.INVENTORY,
    ExpenseCategory.MARKETING,
    ExpenseCategory.PAYROLL,
    ExpenseCategory.UTILITIES,
    ExpenseCategory.OTHER,
  ];

  for (let month = 1; month <= 12; month += 1) {
    const monthDate = toDate(`2025-${String(month).padStart(2, '0')}-12`);
    const reference = `EXP-2025-${String(month).padStart(2, '0')}`;
    const existing = await prisma.expense.findFirst({
      where: { reference },
      select: { id: true },
    });
    if (!existing) {
      await prisma.expense.create({
        data: {
          amount: 12000 + month * 750,
          category: monthlyExpenseCategories[(month - 1) % monthlyExpenseCategories.length],
          description: `Monthly mock expense for ${monthDate.toISOString().slice(0, 7)}`,
          reference,
          date: monthDate,
          createdBy: managerUser.id,
          createdAt: monthDate,
        },
      });
    }
  }

  const orderSeeds = [
    {
      idempotencyKey: 'demo-order-2025-03',
      orderNumber: 'ORD-2025-0001',
      status: OrderStatus.DELIVERED,
      customerName: 'Ava Johnson',
      customerEmail: 'ava.johnson@example.com',
      shippingAddress: {
        street: '12 Green Lane',
        city: 'Austin',
        state: 'TX',
        zip: '73301',
        country: 'US',
      },
      createdAt: toDate('2025-03-19'),
      items: [{ variantId: variantRecords[0].id, quantity: 2, unitPrice: variantRecords[0].sellingPrice }],
      taxAmount: 1900,
      discountAmount: 500,
      shippingCost: 700,
      notes: 'Demo order generated from 2025 seeding',
    },
    {
      idempotencyKey: 'demo-order-2025-07',
      orderNumber: 'ORD-2025-0002',
      status: OrderStatus.SHIPPED,
      customerName: 'Noah Carter',
      customerEmail: 'noah.carter@example.com',
      shippingAddress: {
        street: '88 Horizon Ave',
        city: 'Denver',
        state: 'CO',
        zip: '80014',
        country: 'US',
      },
      createdAt: toDate('2025-07-07'),
      items: [
        { variantId: variantRecords[1].id, quantity: 3, unitPrice: variantRecords[1].sellingPrice },
        { variantId: variantRecords[2].id, quantity: 5, unitPrice: variantRecords[2].sellingPrice },
      ],
      taxAmount: 1350,
      discountAmount: 0,
      shippingCost: 800,
      notes: 'Demo order generated from 2025 seeding',
    },
    {
      idempotencyKey: 'demo-order-2025-11',
      orderNumber: 'ORD-2025-0003',
      status: OrderStatus.CONFIRMED,
      customerName: 'Mila Brooks',
      customerEmail: 'mila.brooks@example.com',
      shippingAddress: {
        street: '300 Sunset Rd',
        city: 'Seattle',
        state: 'WA',
        zip: '98101',
        country: 'US',
      },
      createdAt: toDate('2025-11-22'),
      items: [{ variantId: variantRecords[0].id, quantity: 1, unitPrice: variantRecords[0].sellingPrice }],
      taxAmount: 760,
      discountAmount: 1000,
      shippingCost: 650,
      notes: 'Demo order generated from 2025 seeding',
    },
  ];

  const createdOrderIds: string[] = [];
  for (const orderSeed of orderSeeds) {
    const subtotal = orderSeed.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const totalAmount =
      subtotal +
      orderSeed.taxAmount +
      orderSeed.shippingCost -
      orderSeed.discountAmount;

    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey: orderSeed.idempotencyKey },
      select: { id: true },
    });

    if (existingOrder) {
      createdOrderIds.push(existingOrder.id);
      continue;
    }

    const createdOrder = await prisma.order.create({
      data: {
        orderNumber: orderSeed.orderNumber,
        status: orderSeed.status,
        customerName: orderSeed.customerName,
        customerEmail: orderSeed.customerEmail,
        shippingAddress: orderSeed.shippingAddress,
        subtotal,
        taxAmount: orderSeed.taxAmount,
        discountAmount: orderSeed.discountAmount,
        shippingCost: orderSeed.shippingCost,
        totalAmount,
        notes: orderSeed.notes,
        idempotencyKey: orderSeed.idempotencyKey,
        processedBy: managerUser.id,
        createdAt: orderSeed.createdAt,
        items: {
          create: orderSeed.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
    });
    createdOrderIds.push(createdOrder.id);
  }

  const firstOrder = createdOrderIds[0];
  if (firstOrder) {
    const existingReturn = await prisma.return.findFirst({
      where: { orderId: firstOrder, reason: 'Demo damaged unit return' },
      select: { id: true },
    });

    if (!existingReturn) {
      await prisma.return.create({
        data: {
          orderId: firstOrder,
          reason: 'Demo damaged unit return',
          items: [
            {
              variantId: variantRecords[0].id,
              quantity: 1,
              reason: 'Damaged on arrival',
            },
          ],
          refundAmount: 95000,
          restocked: true,
          processedBy: warehouseUser.id,
          createdAt: toDate('2025-04-02'),
        },
      });
    }
  }

  const movementSeeds = [
    {
      variantId: variantRecords[0].id,
      quantity: 42,
      reason: StockMovementReason.INITIAL,
      notes: 'Initial stock for 2025 demo',
      date: toDate('2025-01-03'),
      performedBy: warehouseUser.id,
    },
    {
      variantId: variantRecords[0].id,
      quantity: -2,
      reason: StockMovementReason.SALE,
      notes: 'Sold with demo order ORD-2025-0001',
      date: toDate('2025-03-19'),
      performedBy: managerUser.id,
    },
    {
      variantId: variantRecords[0].id,
      quantity: 1,
      reason: StockMovementReason.RETURN,
      notes: 'Restocked after demo return',
      date: toDate('2025-04-02'),
      performedBy: warehouseUser.id,
    },
  ];

  for (const movement of movementSeeds) {
    const existingMovement = await prisma.stockMovement.findFirst({
      where: {
        variantId: movement.variantId,
        reason: movement.reason,
        notes: movement.notes,
      },
      select: { id: true },
    });
    if (!existingMovement) {
      await prisma.stockMovement.create({
        data: {
          variantId: movement.variantId,
          quantity: movement.quantity,
          reason: movement.reason,
          notes: movement.notes,
          performedBy: movement.performedBy,
          createdAt: movement.date,
        },
      });
    }
  }

  const summary = {
    seededAt: new Date().toISOString(),
    year: 2025,
    users: ['admin@planventory.com', 'manager@planventory.com', 'warehouse@planventory.com'],
    categories: categories.map((category) => category.name),
    brands: brands.map((brand) => brand.name),
    variants: variantRecords.map((variant) => variant.sku),
    suppliers: suppliers.map((supplier) => supplier.name),
    ordersInserted: orderSeeds.map((order) => order.orderNumber),
    expenseRefs: Array.from({ length: 12 }, (_, i) => `EXP-2025-${String(i + 1).padStart(2, '0')}`),
  };

  const logPath = join(process.cwd(), 'prisma', 'seed-log-2025.json');
  await writeFile(logPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log('Seed completed with 2025 demo dataset');
  console.log(`Seed log written to ${logPath}`);
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
