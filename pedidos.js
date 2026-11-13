
"use strict";

/* =========================================
   PISCO & MAR - PEDIDOS ONLINE
========================================= */

const whatsappNumber = "56956783197";

const WEB_DISCOUNT = 0.15;
const DEPOSIT_PERCENTAGE = 0.50;

const DELIVERY_PRICES = {
  copiapo: 3990,
  bahia: 2000
};

const BANK_DETAILS = {
  beneficiary: "Pisco y Mar SpA",
  rut: "18.091.793-4",
  bank: "Banco Santander",
  accountType: "Cuenta Corriente",
  accountNumber: "0 000 89 64670 7",
  email: "Restaurantpiscoymar@gmail.com"
};

const pedidosSupabase = window.supabase.createClient(
  "https://saocimccnddfgvsiupug.supabase.co",
  "sb_publishable_71lznW6L4LSDESduHfFtaA_4vBxqGUe"
);

let products = [];
let promotions = [];
let cart = [];
let currentCategory = "todos";
let orderType = "Delivery";
let catalogoDisponible = false;

/* =========================================
   ELEMENTOS DEL HTML
========================================= */

const productsGrid = document.getElementById("productsGrid");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");

const subtotalElement = document.getElementById("subtotal");
const discountElement = document.getElementById("discount");
const deliveryElement = document.getElementById("delivery");
const totalElement = document.getElementById("total");
const depositElement = document.getElementById("deposit");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const customerName = document.getElementById("customerName");
const branch = document.getElementById("branch");
const address = document.getElementById("address");
const comments = document.getElementById("comments");
const addressWrap = document.getElementById("addressWrap");

const sendOrderButton = document.getElementById("sendOrder");
const cartJump = document.getElementById("cartJump");
const cartPanel = document.getElementById("cartPanel");

const ordersMenuButton =
  document.getElementById("ordersMenuButton");

const ordersNav =
  document.getElementById("ordersNav");

/* =========================================
   FUNCIONES GENERALES
========================================= */

function formatPrice(price) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(price);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function getCategoryName(category) {
  const names = {
    ceviches: "Ceviches",
    entradas: "Entradas",
    fondos: "Fondos",
    arroces: "Arroces",
    carnes: "Carnes",
    postres: "Postres",
    bebidas: "Bebidas",
    combo: "Combo"
  };

  return names[category] || category;
}

function getBranchKey() {
  const selected = branch?.value || "";

  if (selected.includes("Copiapó")) return "copiapo";
  if (selected.includes("Bahía Inglesa")) return "bahia";

  return "";
}

function getDeliveryPrice() {
  if (orderType !== "Delivery" || cart.length === 0) {
    return 0;
  }

  return DELIVERY_PRICES[getBranchKey()] || 0;
}

function getCartKey(item) {
  return item.isPromotion
    ? `promotion-${item.id}`
    : `product-${item.id}`;
}

function findCartItem(key) {
  return cart.find(item => getCartKey(item) === key);
}

/* =========================================
   CONEXIÓN CON SUPABASE
========================================= */

async function sincronizarProductos() {
  // Ambos catálogos deben cargarse correctamente.
  // Si falla uno, no se permiten pedidos con precios
  // que podrían estar desactualizados.

  const [productosResultado, promocionesResultado] =
    await Promise.all([
      pedidosSupabase
        .from("products")
        .select("id, name, category, price, image, description")
        .order("id", { ascending: true }),

      pedidosSupabase
        .from("promotions")
        .select("id, name, description, price, image, active")
        .eq("active", true)
        .order("id", { ascending: true })
    ]);

  if (productosResultado.error) {
    throw productosResultado.error;
  }

  if (promocionesResultado.error) {
    throw promocionesResultado.error;
  }

  const nuevosProductos = (productosResultado.data || [])
    .map(item => ({
      ...item,
      id: Number(item.id),
      price: Number(item.price),
      isPromotion: false
    }));

  const nuevasPromociones = (promocionesResultado.data || [])
    .map(item => ({
      ...item,
      id: Number(item.id),
      price: Number(item.price),
      category: "promociones",
      isPromotion: true
    }));

  const todos = [...nuevosProductos, ...nuevasPromociones];

  if (nuevosProductos.length === 0) {
    throw new Error("La carta no tiene productos disponibles.");
  }

  if (todos.some(item =>
    !Number.isSafeInteger(item.id) ||
    !Number.isSafeInteger(item.price) ||
    item.price < 0
  )) {
    throw new Error("Hay datos o precios inválidos en la carta.");
  }

  products = nuevosProductos;
  promotions = nuevasPromociones;
  catalogoDisponible = true;

  // Actualizar los productos del carrito con los
  // precios y estados actuales de Supabase.
  cart = cart.map(item => {
    const actualizado = todos.find(producto =>
      getCartKey(producto) === getCartKey(item)
    );

    if (!actualizado) return null;

    return {
      ...actualizado,
      quantity: item.quantity,
      notes: item.notes || ""
    };
  }).filter(Boolean);

  renderProducts();
  renderPromotions();
  renderCart();
}

/* =========================================
   SECCIÓN DE PROMOCIONES
========================================= */

function obtenerContenedorPromociones() {
  let section = document.getElementById("webPromotionsSection");

  if (!section && productsGrid) {
    section = document.createElement("section");
    section.id = "webPromotionsSection";
    section.className = "web-promotions-section";

    section.style.marginBottom = "36px";

    const heading = document.createElement("div");
    heading.className = "section-heading";

    const title = document.createElement("h2");
    title.textContent = "Promociones especiales";
    title.style.marginBottom = "8px";

    const description = document.createElement("p");
    description.textContent =
      "Aprovecha nuestras promociones exclusivas.";

    heading.append(title, description);

    const grid = document.createElement("div");
    grid.id = "webPromotionsGrid";
    grid.className = "products-grid";

    // Diseño adaptable sin modificar pedidos.css.
    grid.style.display = "grid";
    grid.style.gridTemplateColumns =
      "repeat(auto-fill, minmax(min(100%, 240px), 1fr))";
    grid.style.gap = "20px";
    grid.style.marginTop = "20px";

    section.append(heading, grid);

    productsGrid.parentNode.insertBefore(section, productsGrid);
  }

  return section;
}

function renderPromotions() {
  const section = obtenerContenedorPromociones();

  if (!section) return;

  const grid = document.getElementById("webPromotionsGrid");

  if (promotions.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;

  grid.innerHTML = promotions.map(item => `
    <article class="product-card">

      <div class="product-image">

        <img
          src="${escapeHTML(item.image)}"
          alt="${escapeHTML(item.name)}"
          loading="lazy"
        >

        <button
          type="button"
          class="add-promotion"
          data-promotion-id="${item.id}"
          aria-label="Agregar ${escapeHTML(item.name)} al carrito"
        >
          +
        </button>

      </div>

      <div class="product-info">

        <span class="product-category">
          Promoción especial
        </span>

        <h3>${escapeHTML(item.name)}</h3>

        <p>${escapeHTML(item.description)}</p>

        <span class="product-price">
          ${formatPrice(item.price)}
        </span>

        <p style="font-size:12px; margin-top:8px;">
          Precio promocional. No acumula descuento web.
        </p>

      </div>

    </article>
  `).join("");
}

/* =========================================
   RENDERIZAR PRODUCTOS
========================================= */

function renderProducts() {
  if (!productsGrid) return;

  let filteredProducts = products.filter(
    item => item.category !== "combo"
  );

  if (currentCategory !== "todos") {
    filteredProducts = filteredProducts.filter(
      item => item.category === currentCategory
    );
  }

  const searchTerm =
    searchInput?.value.trim().toLowerCase() || "";

  if (searchTerm) {
    filteredProducts = filteredProducts.filter(item => {
      const searchable = [
        item.name,
        item.category,
        item.description
      ].join(" ").toLowerCase();

      return searchable.includes(searchTerm);
    });
  }

  const sortValue = sortSelect?.value || "default";

  if (sortValue === "low") {
    filteredProducts.sort((a, b) => a.price - b.price);
  }

  if (sortValue === "high") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  if (filteredProducts.length === 0) {
    productsGrid.innerHTML = `
      <div class="products-empty">
        <h3>No encontramos productos</h3>
        <p>Prueba con otra categoría o búsqueda.</p>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = filteredProducts.map(item => `
    <article class="product-card">

      <div class="product-image">

        <img
          src="${escapeHTML(item.image)}"
          alt="${escapeHTML(item.name)}"
          loading="lazy"
        >

        <button
          type="button"
          class="add-product"
          data-product-id="${item.id}"
          aria-label="Agregar ${escapeHTML(item.name)} al carrito"
        >
          +
        </button>

      </div>

      <div class="product-info">

        <span class="product-category">
          ${escapeHTML(getCategoryName(item.category))}
        </span>

        <h3>${escapeHTML(item.name)}</h3>

        <p>${escapeHTML(item.description)}</p>

        <span class="product-price">
          ${formatPrice(item.price)}
        </span>

      </div>

    </article>
  `).join("");
}

/* =========================================
   ADMINISTRACIÓN DEL CARRITO
========================================= */

function addToCart(id, isPromotion = false) {
  if (!catalogoDisponible) {
    alert("Estamos actualizando la carta. Intenta nuevamente.");
    return;
  }

  const catalogo = isPromotion ? promotions : products;

  const producto = catalogo.find(
    item => item.id === Number(id)
  );

  if (!producto) {
    alert("Este producto ya no está disponible.");
    return;
  }

  const key = getCartKey(producto);
  const existente = findCartItem(key);

  if (existente) {
    existente.quantity += 1;
  } else {
    cart.push({
      ...producto,
      quantity: 1,
      notes: ""
    });
  }

  renderCart();
}

function increaseQuantity(key) {
  const item = findCartItem(key);

  if (!item) return;

  item.quantity += 1;
  renderCart();
}

function decreaseQuantity(key) {
  const item = findCartItem(key);

  if (!item) return;

  item.quantity -= 1;

  if (item.quantity <= 0) {
    cart = cart.filter(
      producto => getCartKey(producto) !== key
    );
  }

  renderCart();
}

function removeFromCart(key) {
  cart = cart.filter(
    item => getCartKey(item) !== key
  );

  renderCart();
}

function updateItemNotes(key, notes) {
  const item = findCartItem(key);

  if (item) {
    item.notes = notes;
  }
}

/* =========================================
   CÁLCULO DEL PEDIDO
========================================= */

function calculateOrder() {
  const subtotal = cart.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  // Solo platos normales y combos reciben el 15%.
  // Las promociones NO reciben descuento adicional.
  const subtotalDescontable = cart.reduce((sum, item) => {
    if (item.isPromotion === true) {
      return sum;
    }

    return sum + item.price * item.quantity;
  }, 0);

  const discount = Math.round(
    subtotalDescontable * WEB_DISCOUNT
  );

  const discountedSubtotal = subtotal - discount;
  const delivery = getDeliveryPrice();
  const total = discountedSubtotal + delivery;

  const deposit = Math.round(
    total * DEPOSIT_PERCENTAGE
  );

  const remaining = total - deposit;

  return {
    subtotal,
    discount,
    discountedSubtotal,
    delivery,
    total,
    deposit,
    remaining
  };
}

/* =========================================
   MOSTRAR CARRITO
========================================= */

function renderCart() {
  if (!cartItems || !cartCount) return;

  const quantity = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <span aria-hidden="true">🛒</span>
        <h3>Tu carrito está vacío</h3>
        <p>Agrega tus platos favoritos para comenzar.</p>
      </div>
    `;
  } else {
    cartItems.innerHTML = cart.map(item => {
      const key = getCartKey(item);
      const totalItem = item.price * item.quantity;

      return `
        <article class="cart-item">

          <div>

            <h4>${escapeHTML(item.name)}</h4>

            ${item.isPromotion ? `
              <small style="display:block;">
                Promoción: sin descuento web adicional
              </small>
            ` : ""}

            <small>
              ${formatPrice(item.price)} cada uno
            </small>

            <div class="cart-controls">

              <button
                type="button"
                data-action="decrease"
                data-cart-key="${key}"
                aria-label="Disminuir cantidad"
              >−</button>

              <span>${item.quantity}</span>

              <button
                type="button"
                data-action="increase"
                data-cart-key="${key}"
                aria-label="Aumentar cantidad"
              >+</button>

            </div>

            <label
              class="cart-item-notes-label"
              for="notes-${key}"
            >
              Indicaciones para este producto
            </label>

            <textarea
              class="cart-item-notes"
              id="notes-${key}"
              data-notes-cart-key="${key}"
              rows="2"
              maxlength="500"
              placeholder="Ej.: sin cebolla, poco picante..."
            >${escapeHTML(item.notes || "")}</textarea>

            <button
              type="button"
              class="remove-item"
              data-action="remove"
              data-cart-key="${key}"
            >
              Eliminar
            </button>

          </div>

          <strong class="cart-item-total">
            ${formatPrice(totalItem)}
          </strong>

        </article>
      `;
    }).join("");
  }

  const totals = calculateOrder();

  cartCount.textContent = quantity;

  if (subtotalElement) {
    subtotalElement.textContent =
      formatPrice(totals.subtotal);
  }

  if (discountElement) {
    discountElement.textContent =
      `-${formatPrice(totals.discount)}`;
  }

  if (deliveryElement) {
    deliveryElement.textContent =
      formatPrice(totals.delivery);
  }

  if (totalElement) {
    totalElement.textContent =
      formatPrice(totals.total);
  }

  if (depositElement) {
    depositElement.textContent =
      formatPrice(totals.deposit);
  }
}

/* =========================================
   TIPO DE PEDIDO
========================================= */

function updateOrderType(selectedButton) {
  document.querySelectorAll(".order-type button")
    .forEach(button => button.classList.remove("active"));

  selectedButton.classList.add("active");

  orderType = selectedButton.dataset.type;

  if (addressWrap) {
    const isDelivery = orderType === "Delivery";

    addressWrap.style.display =
      isDelivery ? "block" : "none";

    if (!isDelivery && address) {
      address.value = "";
    }
  }

  renderCart();
}

/* =========================================
   VALIDAR PEDIDO
========================================= */

function validateOrder() {
  if (!catalogoDisponible) {
    alert("No se pudo actualizar la carta. Intenta nuevamente.");
    return false;
  }

  if (cart.length === 0) {
    alert("Agrega al menos un producto al carrito.");
    return false;
  }

  if (!customerName?.value.trim()) {
    alert("Escribe tu nombre.");
    customerName?.focus();
    return false;
  }

  if (!branch?.value || !getBranchKey()) {
    alert("Selecciona una sucursal disponible.");
    branch?.focus();
    return false;
  }

  if (
    orderType === "Delivery" &&
    !address?.value.trim()
  ) {
    alert("Escribe la dirección de entrega.");
    address?.focus();
    return false;
  }

  return true;
}

/* =========================================
   REFERENCIA DEL PEDIDO
========================================= */

function generateOrderReference() {
  const now = new Date();

  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");

  let randomPart;

  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);

    randomPart = values[0]
      .toString(36)
      .toUpperCase()
      .padStart(7, "0")
      .slice(-7);
  } else {
    randomPart = Math.random()
      .toString(36)
      .slice(2, 9)
      .toUpperCase();
  }

  return `PM-${datePart}-${randomPart}`;
}

/* =========================================
   MENSAJE DE WHATSAPP
========================================= */

function buildWhatsAppMessage(reference) {
  const totals = calculateOrder();

  const productLines = cart.map(item => {
    const itemTotal = item.price * item.quantity;

    const lines = [
      `${item.quantity} x ${item.name}`,
      item.isPromotion
        ? "PROMOCIÓN - Sin descuento web adicional"
        : "Producto de la carta",
      `Precio: ${formatPrice(itemTotal)}`
    ];

    if (item.notes?.trim()) {
      lines.push(
        `Indicaciones: ${item.notes.trim()}`
      );
    }

    return lines.join("\n");
  }).join("\n\n");

  const addressText = orderType === "Delivery"
    ? address.value.trim()
    : "Retiro en local";

  const commentsText =
    comments?.value.trim() || "Sin comentarios";

  return [
    "*NUEVO PEDIDO - PISCO & MAR*",
    "",
    `Referencia: ${reference}`,
    "",
    "*DATOS DEL CLIENTE*",
    `Nombre: ${customerName.value.trim()}`,
    `Sucursal: ${branch.value}`,
    `Tipo de pedido: ${orderType}`,
    `Dirección: ${addressText}`,
    "",
    "*DETALLE DEL PEDIDO*",
    "",
    productLines,
    "",
    "*RESUMEN DE PAGO*",
    `Subtotal: ${formatPrice(totals.subtotal)}`,
    `Descuento web (15%, excluye promociones): -${formatPrice(totals.discount)}`,
    `Subtotal con descuento: ${formatPrice(totals.discountedSubtotal)}`,
    `Delivery: ${formatPrice(totals.delivery)}`,
    `*TOTAL: ${formatPrice(totals.total)}*`,
    "",
    "*ABONO PARA CONFIRMAR EL PEDIDO*",
    `Abono requerido (50%): ${formatPrice(totals.deposit)}`,
    `Saldo pendiente: ${formatPrice(totals.remaining)}`,
    "",
    "*DATOS PARA TRANSFERENCIA*",
    `Titular: ${BANK_DETAILS.beneficiary}`,
    `RUT: ${BANK_DETAILS.rut}`,
    `Banco: ${BANK_DETAILS.bank}`,
    `Tipo de cuenta: ${BANK_DETAILS.accountType}`,
    `Número de cuenta: ${BANK_DETAILS.accountNumber}`,
    `Correo: ${BANK_DETAILS.email}`,
    "",
    "*COMENTARIOS GENERALES*",
    commentsText,
    "",
    "El pedido queda sujeto a confirmación del restaurante y verificación del abono.",
    "",
    `Referencia del pedido: ${reference}`
  ].join("\n");
}

/* =========================================
   ENVIAR PEDIDO POR WHATSAPP
========================================= */

async function sendWhatsApp() {
  if (!validateOrder()) return;

  const whatsappWindow = window.open(
    "about:blank",
    "_blank"
  );

  if (whatsappWindow) {
    whatsappWindow.opener = null;
  }

  if (sendOrderButton) {
    sendOrderButton.disabled = true;
  }

  try {
    // Comprobar productos y promociones vigentes.
    await sincronizarProductos();

    if (!validateOrder()) {
      whatsappWindow?.close();
      return;
    }

    const reference = generateOrderReference();
    const message = buildWhatsAppMessage(reference);

    const whatsappUrl =
      `https://wa.me/${whatsappNumber}` +
      `?text=${encodeURIComponent(message)}`;

    if (whatsappWindow && !whatsappWindow.closed) {
      whatsappWindow.location.replace(whatsappUrl);
    } else {
      alert(
        "El navegador bloqueó WhatsApp. Permite las ventanas emergentes e inténtalo nuevamente."
      );
    }

  } catch (error) {
    whatsappWindow?.close();
    console.error("Error al verificar el pedido:", error);

    alert(
      "No pudimos verificar los precios y promociones actuales. " +
      "Por seguridad, no se enviará el pedido. " +
      "Actualiza la página e inténtalo nuevamente."
    );

  } finally {
    if (sendOrderButton) {
      sendOrderButton.disabled = false;
    }
  }
}

/* =========================================
   MENÚ MÓVIL
========================================= */

if (ordersMenuButton && ordersNav) {
  ordersMenuButton.addEventListener("click", () => {
    const isOpen = ordersNav.classList.toggle("open");

    ordersMenuButton.setAttribute(
      "aria-expanded",
      String(isOpen)
    );
  });

  ordersNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      ordersNav.classList.remove("open");
      ordersMenuButton.setAttribute("aria-expanded", "false");
    });
  });
}

/* =========================================
   EVENTOS DE CATEGORÍAS
========================================= */

document.querySelectorAll(".category").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".category").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    currentCategory = button.dataset.filter || "todos";

    renderProducts();
  });
});

/* =========================================
   BÚSQUEDA Y ORDENAMIENTO
========================================= */

searchInput?.addEventListener("input", renderProducts);

sortSelect?.addEventListener("change", renderProducts);

/* =========================================
   AGREGAR PLATOS AL CARRITO
========================================= */

productsGrid?.addEventListener("click", event => {
  const button = event.target.closest(".add-product");

  if (!button) return;

  addToCart(button.dataset.productId, false);
});

/* =========================================
   AGREGAR PROMOCIONES AL CARRITO
========================================= */

document.addEventListener("click", event => {
  const button = event.target.closest(".add-promotion");

  if (!button) return;

  addToCart(button.dataset.promotionId, true);
});

/* =========================================
   AGREGAR COMBOS
========================================= */

document.querySelectorAll(".combo-add").forEach(button => {
  button.addEventListener("click", () => {
    addToCart(button.dataset.comboId, false);
  });
});

/* =========================================
   CONTROLES DEL CARRITO
========================================= */

cartItems?.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");

  if (!button) return;

  const key = button.dataset.cartKey;
  const action = button.dataset.action;

  if (action === "increase") {
    increaseQuantity(key);
  }

  if (action === "decrease") {
    decreaseQuantity(key);
  }

  if (action === "remove") {
    removeFromCart(key);
  }
});

/* =========================================
   INDICACIONES DE PRODUCTOS
========================================= */

cartItems?.addEventListener("input", event => {
  const field = event.target.closest(
    "[data-notes-cart-key]"
  );

  if (!field) return;

  updateItemNotes(
    field.dataset.notesCartKey,
    field.value
  );
});

/* =========================================
   CAMBIO DE SUCURSAL
========================================= */

branch?.addEventListener("change", renderCart);

/* =========================================
   CAMBIO DE TIPO DE PEDIDO
========================================= */

document.querySelectorAll(".order-type button")
  .forEach(button => {
    button.addEventListener("click", () => {
      updateOrderType(button);
    });
  });

/* =========================================
   ENVÍO POR WHATSAPP
========================================= */

sendOrderButton?.addEventListener(
  "click",
  sendWhatsApp
);

/* =========================================
   ACCESO RÁPIDO AL CARRITO
========================================= */

cartJump?.addEventListener("click", () => {
  cartPanel?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

/* =========================================
   INICIALIZACIÓN
========================================= */

if (productsGrid) {
  productsGrid.textContent = "Cargando carta...";
}

if (sendOrderButton) {
  sendOrderButton.disabled = true;
}

renderCart();

sincronizarProductos()
  .catch(error => {
    catalogoDisponible = false;

    console.error("Error al cargar la carta:", error);

    if (productsGrid) {
      productsGrid.textContent =
        "No pudimos cargar la carta. Actualiza la página.";
    }
  })
  .finally(() => {
    if (sendOrderButton) {
      sendOrderButton.disabled = !catalogoDisponible;
    }
  });
