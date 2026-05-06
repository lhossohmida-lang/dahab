const geminiApiKey = process.env.GEMINI_API_KEY || '';
const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'deheb-5ac6b';
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
const firestoreBaseUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents`;

const systemPrompt = `
أنت مساعد AI خاص بتطبيق إدارة متجر دهب.
ساعد المستخدم في إدارة المخزون، المنتجات، الفواتير، الزبائن، المصاريف، الأرباح، المبيعات، والطلبات الأونلاين.
أجب باللغة العربية وبأسلوب عملي مختصر.
عند طلب قرارات تجارية، اشرح السبب واقترح خطوات قابلة للتنفيذ.
لديك سياق من قاعدة بيانات التطبيق عندما يكون متاحًا. اعتمد عليه عند السؤال عن المنتجات، المخزون، الطلبات، الزبائن، الفواتير، الأرباح أو المصاريف.
لا تدّع أنك نفذت تغييرات داخل قاعدة البيانات أو التطبيق. إذا احتجت بيانات غير موجودة في السياق، قل ذلك بوضوح واطلبها.
`.trim();

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter((message) => ['user', 'assistant'].includes(message?.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').trim().slice(0, 4000),
    }))
    .filter((message) => message.content)
    .slice(-10);
}

function toGeminiContents(history, message) {
  return [
    ...cleanHistory(history).map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];
}

function extractGeminiReply(data) {
  return (data?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.text || '')
    .join('\n')
    .trim();
}

function readBearerToken(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
}

function decodeFirestoreValue(value) {
  if (!value || typeof value !== 'object') return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeFirestoreValue);
  if ('mapValue' in value) return decodeFirestoreFields(value.mapValue.fields || {});
  return null;
}

function decodeFirestoreFields(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)])
  );
}

function decodeFirestoreDocument(doc) {
  const id = String(doc.name || '').split('/').pop();
  return { id, ...decodeFirestoreFields(doc.fields || {}) };
}

async function fetchFirestoreCollection(token, collectionName, pageSize = 100, maxDocs = 450) {
  const docs = [];
  let pageToken = '';

  while (docs.length < maxDocs) {
    const url = new URL(`${firestoreBaseUrl}/${collectionName}`);
    url.searchParams.set('pageSize', String(Math.min(pageSize, maxDocs - docs.length)));
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      const message = response.status === 403
        ? `لا توجد صلاحية لقراءة ${collectionName}. تأكد أنك داخل بحساب إدارة.`
        : `تعذر قراءة ${collectionName} من قاعدة البيانات.`;
      throw new Error(`${message} ${details.slice(0, 200)}`.trim());
    }

    const data = await response.json();
    docs.push(...(data.documents || []).map(decodeFirestoreDocument));
    pageToken = data.nextPageToken || '';
    if (!pageToken) break;
  }

  return docs;
}

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sum(items, getValue) {
  return items.reduce((total, item) => total + Number(getValue(item) || 0), 0);
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || 'غير محدد';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function sortByDateDesc(items) {
  return [...items].sort((a, b) => {
    const da = toDate(a.createdAt)?.getTime() || 0;
    const db = toDate(b.createdAt)?.getTime() || 0;
    return db - da;
  });
}

function compactProducts(products) {
  return products
    .sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0))
    .slice(0, 120)
    .map((product) => ({
      name: product.name || '',
      category: product.category || '',
      quantity: Number(product.quantity || 0),
      minQuantity: Number(product.minQuantity || 0),
      purchasePrice: Number(product.purchasePrice || 0),
      sellingPrice: Number(product.sellingPrice || 0),
    }));
}

function compactSales(sales) {
  return sortByDateDesc(sales)
    .slice(0, 45)
    .map((sale) => ({
      invoiceNumber: sale.invoiceNumber || '',
      total: Number(sale.total || 0),
      profit: Number(sale.profit || 0),
      customerName: sale.customerName || '',
      paymentMethod: sale.paymentMethod || '',
      createdAt: sale.createdAt || '',
      items: (sale.items || []).slice(0, 8).map((item) => ({
        name: item.name || '',
        quantity: Number(item.quantity || 0),
        total: Number(item.total || 0),
      })),
    }));
}

function compactOrders(orders) {
  return sortByDateDesc(orders)
    .slice(0, 45)
    .map((order) => ({
      orderNumber: order.orderNumber || '',
      customerName: order.customerName || '',
      status: order.status || '',
      totalAmount: Number(order.totalAmount || 0),
      createdAt: order.createdAt || '',
    }));
}

function buildDatabaseContext({ products, sales, expenses, customers, onlineOrders, settings }) {
  const now = new Date();
  const today = startOfDay(now);
  const month = startOfMonth(now);
  const salesThisMonth = sales.filter((sale) => (toDate(sale.createdAt) || new Date(0)) >= month);
  const salesToday = sales.filter((sale) => (toDate(sale.createdAt) || new Date(0)) >= today);
  const expensesThisMonth = expenses.filter((expense) => {
    const date = toDate(expense.createdAt) || toDate(expense.date) || new Date(0);
    return date >= month;
  });
  const lowStock = products.filter((product) =>
    Number(product.quantity || 0) <= Number(product.minQuantity || 0)
  );
  const outOfStock = products.filter((product) => Number(product.quantity || 0) < 1);

  const summary = {
    generatedAt: now.toISOString(),
    storeSettings: settings[0] || {},
    inventory: {
      productsCount: products.length,
      availableProductsCount: products.filter((product) => Number(product.quantity || 0) > 0).length,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      inventoryCostValue: sum(products, (product) => Number(product.purchasePrice || 0) * Number(product.quantity || 0)),
      inventorySalesValue: sum(products, (product) => Number(product.sellingPrice || 0) * Number(product.quantity || 0)),
      categories: countBy(products, 'category'),
      lowStockProducts: compactProducts(lowStock),
      products: compactProducts(products),
    },
    sales: {
      invoicesCount: sales.length,
      todayTotal: sum(salesToday, (sale) => sale.total),
      todayProfit: sum(salesToday, (sale) => sale.profit),
      monthTotal: sum(salesThisMonth, (sale) => sale.total),
      monthProfit: sum(salesThisMonth, (sale) => sale.profit),
      recentInvoices: compactSales(sales),
    },
    expenses: {
      expensesCount: expenses.length,
      monthTotal: sum(expensesThisMonth, (expense) => expense.amount),
    },
    customers: {
      customersCount: customers.length,
      topCustomers: [...customers]
        .sort((a, b) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0))
        .slice(0, 30)
        .map((customer) => ({
          name: customer.name || customer.fullName || '',
          ordersCount: Number(customer.ordersCount || 0),
          totalSpent: Number(customer.totalSpent || 0),
        })),
    },
    onlineOrders: {
      ordersCount: onlineOrders.length,
      statuses: countBy(onlineOrders, 'status'),
      recentOrders: compactOrders(onlineOrders),
    },
  };

  return `سياق قاعدة بيانات التطبيق الحالي بصيغة JSON. استخدمه للإجابة عن أسئلة المستخدم:\n${JSON.stringify(summary, null, 2)}`;
}

async function getDatabaseContext(token) {
  if (!token) throw new Error('لم يصل توكن Firebase. سجل الدخول إلى لوحة الإدارة أولًا.');

  const [products, sales, expenses, customers, onlineOrders, settings] = await Promise.all([
    fetchFirestoreCollection(token, 'products'),
    fetchFirestoreCollection(token, 'sales'),
    fetchFirestoreCollection(token, 'expenses'),
    fetchFirestoreCollection(token, 'customers'),
    fetchFirestoreCollection(token, 'onlineOrders'),
    fetchFirestoreCollection(token, 'settings', 20),
  ]);

  return buildDatabaseContext({ products, sales, expenses, customers, onlineOrders, settings });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'هذا المسار يقبل POST فقط.' });
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    return json(res, 400, { error: 'صيغة الطلب غير صالحة.' });
  }

  const message = String(body?.message || '').trim();
  if (!message) return json(res, 400, { error: 'اكتب سؤالًا قبل الإرسال.' });
  if (!geminiApiKey) {
    return json(res, 500, {
      error: 'لم يتم ضبط مفتاح Gemini API. أضف GEMINI_API_KEY في Vercel Environment Variables.',
    });
  }

  let databaseContext;
  try {
    databaseContext = await getDatabaseContext(readBearerToken(req));
  } catch (error) {
    return json(res, 503, { error: `تعذر ربط مساعد AI بقاعدة البيانات: ${error.message}` });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: `${systemPrompt}\n\n${databaseContext}` }],
        },
        contents: toGeminiContents(body?.history, message),
      }),
    });

    if (!geminiResponse.ok) {
      const details = await geminiResponse.text().catch(() => '');
      return json(res, 502, {
        error: 'تعذر الحصول على رد من Gemini. تأكد من صحة GEMINI_API_KEY واسم الموديل.',
        details: details.slice(0, 500),
      });
    }

    const data = await geminiResponse.json();
    const reply = extractGeminiReply(data);
    if (!reply) return json(res, 502, { error: 'Gemini لم يرجع ردًا صالحًا.' });

    return json(res, 200, { reply });
  } catch (error) {
    return json(res, 503, {
      error: error?.name === 'AbortError'
        ? 'انتهت مهلة انتظار Gemini. حاول مرة أخرى.'
        : 'تعذر الاتصال بـ Gemini API. تأكد من الإنترنت ومفتاح GEMINI_API_KEY.',
    });
  } finally {
    clearTimeout(timeout);
  }
}
