
"use strict";

/* =========================================================
   CONFIGURACIÓN
========================================================= */

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

let cart = [];
let currentCategory = "todos";
let orderType = "Delivery";

/* =========================================================
   PRODUCTOS ORIGINALES
========================================================= */

const products = [
  {
    id: 1,
    name: "Ceviche Clásico",
    category: "ceviches",
    price: 12990,
    image: "imagen6.png",
    description: "Pescado fresco, leche de tigre, cebolla morada y camote."
  },
  {
    id: 2,
    name: "Pulpo a la Parrilla",
    category: "fondos",
    price: 15990,
    image: "imagen1.png",
    description: "Pulpo grillado acompañado de papas doradas."
  },
  {
    id: 3,
    name: "Arroz con Mariscos",
    category: "arroces",
    price: 13990,
    image: "imagen5.png",
    description: "Arroz cremoso con una selección de mariscos."
  },
  {
    id: 4,
    name: "Lomo Saltado",
    category: "carnes",
    price: 11990,
    image: "imagen2.png",
    description: "Carne salteada con cebolla, tomate y papas fritas."
  },
  {
    id: 5,
    name: "Ceviche Mixto",
    category: "ceviches",
    price: 14990,
    image: "imagen10.png",
    description: "Pescado fresco y mariscos marinados en leche de tigre."
  },
  {
    id: 6,
    name: "Arroz Chaufa",
    category: "arroces",
    price: 11990,
    image: "imagen14.png",
    description: "Arroz salteado al wok con sazón peruana."
  },
  {
    id: 7,
    name: "Tiradito de Atún",
    category: "entradas",
    price: 13990,
    image: "imagen11.png",
    description: "Láminas de atún fresco con salsa especial de la casa."
  },
  {
    id: 8,
    name: "Tallarín Saltado",
    category: "fondos",
    price: 12990,
    image: "imagen7.png",
    description: "Tallarines salteados al wok con verduras y sazón peruana."
  },
  {
    id: 9,
    name: "Jalea Mixta",
    category: "entradas",
    price: 13990,
    image: "imagen8.png",
    description: "Pescados y mariscos crocantes acompañados de salsa criolla."
  },
  {
    id: 10,
    name: "Suspiro Limeño",
    category: "postres",
    price: 5990,
    image: "imagen15.png",
    description: "Postre tradicional peruano con merengue suave."
  },
  {
    id: 11,
    name: "Pisco Sour",
    category: "bebidas",
    price: 5990,
    image: "imagen16.png",
    description: "Pisco sour preparado al estilo clásico peruano."
  },
  {
    id: 12,
    name: "Ají de Gallina",
    category: "fondos",
    price: 11990,
    image: "imagen12.png",
    description: "Pollo desmenuzado en una cremosa salsa de ají amarillo."
  },
  {
    id: 101,
    name: "Combo Marino",
    category: "combo",
    price: 24990,
    image: "imagen9.png",
    description: "Ceviche, jalea mixta y dos bebidas."
  },
  {
    id: 102,
    name: "Combo Familiar",
    category: "combo",
    price: 34990,
    image: "imagen8.png",
    description: "Dos fondos, dos entradas y dos bebidas."
  },
  {
    id: 103,
    name: "Combo Pareja",
    category: "combo",
    price: 22990,
    image: "imagen10.png",
    description: "Un fondo, una entrada y dos pisco sour."
  }
];

/* =========================================================
   ELEMENTOS DEL HTML
========================================================= */

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

/* =========================================================
   FUNCIONES GENERALES
========================================================= */

function formatPrice(price) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(price);
}

function getCategoryName(category) {
  const categoryNames = {
    ceviches: "Ceviches",
    entradas: "Entradas",
    fondos: "Fondos",
    arroces: "Arroces",
    carnes: "Carnes",
    postres: "Postres",
    bebidas: "Bebidas",
    combo: "Combo"
  };

  return categoryNames[category] || category;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => {
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

function getBranchKey() {
  const selectedBranch = branch?.value || "";

  if (selectedBranch.includes("Copiapó")) {
    return "copiapo";
  }

  if (selectedBranch.includes("Bahía Inglesa")) {
    return "bahia";
  }

  return "";
}

function getDeliveryPrice() {
  if (orderType !== "Delivery" || cart.length === 0) {
    return 0;
  }

  const branchKey = getBranchKey();

  return DELIVERY_PRICES[branchKey] || 0;
}

/* =========================================================
   REFERENCIA DEL PEDIDO
========================================================= */

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

/*
  La referencia se genera localmente.
  No garantiza unicidad global sin una base de datos.
*/

/* =========================================================
   RENDERIZADO DE PRODUCTOS
========================================================= */

function renderProducts() {
  if (!productsGrid) {
    return;
  }

  let filteredProducts = products.filter(
    product => product.category !== "combo"
  );

  if (currentCategory !== "todos") {
    filteredProducts = filteredProducts.filter(
      product => product.category === currentCategory
    );
  }

  const searchTerm =
    searchInput?.value.trim().toLowerCase() || "";

  if (searchTerm) {
    filteredProducts = filteredProducts.filter(product => {
      const searchableText = [
        product.name,
        product.category,
        product.description
      ].join(" ").toLowerCase();

      return searchableText.includes(searchTerm);
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

  productsGrid.innerHTML = filteredProducts
    .map(product => `
      <article class="product-card">

        <div class="product-image">

          <img
            src="${escapeHTML(product.image)}"
            alt="${escapeHTML(product.name)}"
            loading="lazy"
          >

          <button
            type="button"
            class="add-product"
            data-product-id="${product.id}"
            aria-label="Agregar ${escapeHTML(product.name)} al carrito"
          >
            +
          </button>

        </div>

        <div class="product-info">

          <span class="product-category">
            ${escapeHTML(getCategoryName(product.category))}
          </span>

          <h3>${escapeHTML(product.name)}</h3>

          <p>${escapeHTML(product.description)}</p>

          <span class="product-price">
            ${formatPrice(product.price)}
          </span>

        </div>

      </article>
    `)
    .join("");
}

/* =========================================================
   CARRITO
========================================================= */

function addToCart(productId) {
  const product = products.find(
    item => item.id === Number(productId)
  );

  if (!product) {
    return;
  }

  const existingItem = cart.find(
    item => item.id === product.id
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1,
      notes: ""
    });
  }

  renderCart();
}

function increaseQuantity(productId) {
  const item = cart.find(
    product => product.id === Number(productId)
  );

  if (!item) {
    return;
  }

  item.quantity += 1;
  renderCart();
}

function decreaseQuantity(productId) {
  const item = cart.find(
    product => product.id === Number(productId)
  );

  if (!item) {
    return;
  }

  item.quantity -= 1;

  if (item.quantity <= 0) {
    cart = cart.filter(
      product => product.id !== item.id
    );
  }

  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(
    product => product.id !== Number(productId)
  );

  renderCart();
}

function updateItemNotes(productId, notes) {
  const item = cart.find(
    product => product.id === Number(productId)
  );

  if (item) {
    item.notes = notes;
  }
}

/* =========================================================
   CÁLCULO DEL PEDIDO
========================================================= */

function calculateOrder() {
  const subtotal = cart.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  const discount = Math.round(
    subtotal * WEB_DISCOUNT
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

/* =========================================================
   RENDERIZADO DEL CARRITO
========================================================= */

function renderCart() {
  if (!cartItems || !cartCount) {
    return;
  }

  const quantity = cart.reduce((sum, item) => {
    return sum + item.quantity;
  }, 0);

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="empty-cart">

        <span aria-hidden="true">🛒</span>

        <h3>Tu carrito está vacío</h3>

        <p>
          Agrega tus platos favoritos para comenzar.
        </p>

      </div>
    `;
  } else {
    cartItems.innerHTML = cart
      .map(item => {
        const itemTotal = item.price * item.quantity;

        return `
          <article class="cart-item">

            <div>

              <h4>${escapeHTML(item.name)}</h4>

              <small>
                ${formatPrice(item.price)} cada uno
              </small>

              <div class="cart-controls">

                <button
                  type="button"
                  data-action="decrease"
                  data-product-id="${item.id}"
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>

                <span>${item.quantity}</span>

                <button
                  type="button"
                  data-action="increase"
                  data-product-id="${item.id}"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>

              </div>

              <label
                class="cart-item-notes-label"
                for="notes-${item.id}"
              >
                Indicaciones para este producto
              </label>

              <textarea
                class="cart-item-notes"
                id="notes-${item.id}"
                data-notes-product-id="${item.id}"
                rows="2"
                maxlength="500"
                placeholder="Ej.: sin cebolla, poco picante..."
              >${escapeHTML(item.notes || "")}</textarea>

              <button
                type="button"
                class="remove-item"
                data-action="remove"
                data-product-id="${item.id}"
              >
                Eliminar
              </button>

            </div>

            <strong class="cart-item-total">
              ${formatPrice(itemTotal)}
            </strong>

          </article>
        `;
      })
      .join("");
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

/* =========================================================
   TIPO DE PEDIDO
========================================================= */

function updateOrderType(selectedButton) {
  document
    .querySelectorAll(".order-type button")
    .forEach(button => {
      button.classList.remove("active");
    });

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

/* =========================================================
   VALIDACIÓN DEL PEDIDO
========================================================= */

function validateOrder() {
  if (cart.length === 0) {
    alert("Agrega al menos un producto al carrito.");
    return false;
  }

  if (!customerName?.value.trim()) {
    alert("Escribe tu nombre.");
    customerName?.focus();
    return false;
  }

  if (!branch?.value) {
    alert("Selecciona una sucursal.");
    branch?.focus();
    return false;
  }

  if (!getBranchKey()) {
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

/* =========================================================
   MENSAJE DE WHATSAPP
========================================================= */


function buildWhatsAppMessage(reference) {
  const totals = calculateOrder();

  const productLines = cart
    .map(item => {
      const itemTotal = item.price * item.quantity;

      const lines = [
        `${item.quantity} x ${item.name}`,
        `Precio: ${formatPrice(itemTotal)}`
      ];

      if (item.notes?.trim()) {
        lines.push(
          `Indicaciones: ${item.notes.trim()}`
        );
      }

      return lines.join("\n");
    })
    .join("\n\n");

  const addressText =
    orderType === "Delivery"
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
    `Descuento web (15%): -${formatPrice(totals.discount)}`,
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


/* =========================================================
   ENVÍO DEL PEDIDO
========================================================= */

function sendWhatsApp() {
  if (!validateOrder()) {
    return;
  }

  const reference = generateOrderReference();

  const message = buildWhatsAppMessage(reference);

  const whatsappUrl =
    `https://wa.me/${whatsappNumber}` +
    `?text=${encodeURIComponent(message)}`;

  const newWindow = window.open(
    whatsappUrl,
    "_blank"
  );

  if (newWindow) {
    newWindow.opener = null;
  } else {
    alert(
      "Tu navegador bloqueó la apertura de WhatsApp. Permite las ventanas emergentes e inténtalo nuevamente."
    );
  }
}

/* =========================================================
   MENÚ MÓVIL
========================================================= */

if (ordersMenuButton && ordersNav) {
  ordersMenuButton.addEventListener("click", () => {
    const isOpen =
      ordersNav.classList.toggle("open");

    ordersMenuButton.setAttribute(
      "aria-expanded",
      String(isOpen)
    );
  });

  ordersNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      ordersNav.classList.remove("open");

      ordersMenuButton.setAttribute(
        "aria-expanded",
        "false"
      );
    });
  });
}

/* =========================================================
   EVENTOS DE CATEGORÍAS
========================================================= */

document
  .querySelectorAll(".category")
  .forEach(button => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll(".category")
        .forEach(categoryButton => {
          categoryButton.classList.remove("active");
        });

      button.classList.add("active");

      currentCategory =
        button.dataset.filter || "todos";

      renderProducts();
    });
  });

/* =========================================================
   BÚSQUEDA Y ORDENAMIENTO
========================================================= */

searchInput?.addEventListener(
  "input",
  renderProducts
);

sortSelect?.addEventListener(
  "change",
  renderProducts
);

/* =========================================================
   AGREGAR PRODUCTOS
========================================================= */

productsGrid?.addEventListener("click", event => {
  const addButton =
    event.target.closest(".add-product");

  if (!addButton) {
    return;
  }

  addToCart(addButton.dataset.productId);
});

/* =========================================================
   AGREGAR COMBOS
========================================================= */

document
  .querySelectorAll(".combo-add")
  .forEach(button => {
    button.addEventListener("click", () => {
      addToCart(button.dataset.comboId);
    });
  });

/* =========================================================
   CONTROLES DEL CARRITO
========================================================= */

cartItems?.addEventListener("click", event => {
  const actionButton =
    event.target.closest("[data-action]");

  if (!actionButton) {
    return;
  }

  const productId =
    Number(actionButton.dataset.productId);

  const action =
    actionButton.dataset.action;

  if (action === "increase") {
    increaseQuantity(productId);
  }

  if (action === "decrease") {
    decreaseQuantity(productId);
  }

  if (action === "remove") {
    removeFromCart(productId);
  }
});

/* =========================================================
   OBSERVACIONES INDIVIDUALES
========================================================= */

cartItems?.addEventListener("input", event => {
  const notesField =
    event.target.closest("[data-notes-product-id]");

  if (!notesField) {
    return;
  }

  updateItemNotes(
    notesField.dataset.notesProductId,
    notesField.value
  );
});

/* =========================================================
   CAMBIO DE SUCURSAL
========================================================= */

branch?.addEventListener("change", () => {
  renderCart();
});

/* =========================================================
   CAMBIO DE TIPO DE PEDIDO
========================================================= */

document
  .querySelectorAll(".order-type button")
  .forEach(button => {
    button.addEventListener("click", () => {
      updateOrderType(button);
    });
  });

/* =========================================================
   ENVÍO POR WHATSAPP
========================================================= */

sendOrderButton?.addEventListener(
  "click",
  sendWhatsApp
);

/* =========================================================
   ACCESO RÁPIDO AL CARRITO
========================================================= */

cartJump?.addEventListener("click", () => {
  cartPanel?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

/* =========================================================
   INICIALIZACIÓN
========================================================= */

renderProducts();
renderCart();
