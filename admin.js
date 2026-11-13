
const SUPABASE_URL = "https://saocimccnddfgvsiupug.supabase.co";
const SUPABASE_KEY = "sb_publishable_71lznW6L4LSDESduHfFtaA_4vBxqGUe";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/* =========================================
   PISCO & MAR - INICIO DE SESIÓN
========================================= */

const loginScreen = document.getElementById("loginScreen");
const adminPanel = document.getElementById("adminPanel");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginButton");
const adminEmail = document.getElementById("adminEmail");
const logoutButton = document.getElementById("logoutButton");

function mostrarLogin() {
  loginScreen.hidden = false;
  adminPanel.hidden = true;
  adminEmail.textContent = "";
}

function mostrarPanel(user) {
  loginScreen.hidden = true;
  adminPanel.hidden = false;
  adminEmail.textContent = user.email || "";
  loginMessage.textContent = "";
}

async function verificarAdministrador(user) {
  if (!user) return false;

  const { data, error } = await supabaseClient.rpc("is_admin");

  if (error) {
    console.error("Error al verificar permisos:", error);
    throw new Error("No se pudieron verificar los permisos.");
  }

  return data === true;
}

async function revisarSesion() {
  try {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
      mostrarLogin();
      return;
    }

    const autorizado = await verificarAdministrador(data.user);

    if (!autorizado) {
      await supabaseClient.auth.signOut();
      mostrarLogin();
      loginMessage.textContent =
        "Esta cuenta no tiene permisos de administrador.";
      return;
    }

    mostrarPanel(data.user);
    await cargarProductosAdmin();

  } catch (error) {
    console.error(error);
    mostrarLogin();
    loginMessage.textContent =
      "No fue posible verificar la sesión.";
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  loginButton.disabled = true;
  loginMessage.textContent = "Verificando acceso...";

  try {
    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    const autorizado = await verificarAdministrador(data.user);

    if (!autorizado) {
      await supabaseClient.auth.signOut();
      throw new Error(
        "Esta cuenta no tiene permisos de administrador."
      );
    }

    loginForm.reset();
    mostrarPanel(data.user);
    await cargarProductosAdmin();

  } catch (error) {
    mostrarLogin();

    loginMessage.textContent =
      error.message === "Invalid login credentials"
        ? "Correo o contraseña incorrectos."
        : error.message;

  } finally {
    loginButton.disabled = false;
  }
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;

    mostrarLogin();

  } catch (error) {
    console.error(error);
    alert("No fue posible cerrar sesión. Intenta nuevamente.");

  } finally {
    logoutButton.disabled = false;
  }
});

/* =========================================
   PRODUCTOS DEL ADMINISTRADOR
========================================= */

const adminProductsGrid =
  document.getElementById("adminProductsGrid");

const productDialog =
  document.getElementById("productDialog");

const editProductForm =
  document.getElementById("editProductForm");

let productosAdmin = [];

function formatoPrecio(precio) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(precio);
}

function obtenerImagenProducto(imagen) {
  return imagen || "";
}

async function cargarProductosAdmin() {
  adminProductsGrid.textContent = "Cargando productos...";

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    adminProductsGrid.textContent =
      "No se pudieron cargar los productos.";
    return;
  }

  productosAdmin = data || [];
  adminProductsGrid.replaceChildren();

  productosAdmin.forEach(producto => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "admin-product-card";

    const imagen = document.createElement("img");
    imagen.src = obtenerImagenProducto(producto.image);
    imagen.alt = producto.name;
    imagen.loading = "lazy";

    const contenido = document.createElement("div");
    contenido.className = "admin-product-info";

    const nombre = document.createElement("h3");
    nombre.textContent = producto.name;

    const precio = document.createElement("p");
    precio.textContent = formatoPrecio(producto.price);

    // BOTÓN EDITAR
    const botonEditar = document.createElement("button");
    botonEditar.type = "button";
    botonEditar.textContent = "Editar producto";

    botonEditar.addEventListener("click", () => {
      abrirEditorProducto(producto.id);
    });

    // BOTÓN ELIMINAR
    const botonEliminar = document.createElement("button");
    botonEliminar.type = "button";
    botonEliminar.textContent = "Eliminar producto";
    botonEliminar.className = "delete-product-button";

    botonEliminar.style.marginTop = "8px";
    botonEliminar.style.backgroundColor = "#fff0ef";
    botonEliminar.style.color = "#b42318";
    botonEliminar.style.border = "1px solid #f3b5b0";

    botonEliminar.addEventListener("click", () => {
      eliminarProducto(producto.id);
    });

    contenido.append(
      nombre,
      precio,
      botonEditar,
      botonEliminar
    );

    tarjeta.append(imagen, contenido);
    adminProductsGrid.append(tarjeta);
  });
}

/* =========================================
   ELIMINAR PRODUCTO
========================================= */

async function eliminarProducto(id) {
  const producto = productosAdmin.find(
    item => item.id === id
  );

  if (!producto) return;

  const confirmado = window.confirm(
    `¿Eliminar "${producto.name}" de la carta?\n\n` +
    "Esta acción quitará el plato de los pedidos online " +
    "y no se puede deshacer."
  );

  if (!confirmado) return;

  try {
    const { data: usuario, error: errorUsuario } =
      await supabaseClient.auth.getUser();

    if (
      errorUsuario ||
      !usuario.user ||
      !(await verificarAdministrador(usuario.user))
    ) {
      throw new Error(
        "Tu sesión no tiene permisos de administrador."
      );
    }

    const { data, error } = await supabaseClient
      .from("products")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error(
        "No se eliminó el producto. " +
        "Revisa los permisos DELETE de Supabase."
      );
    }

    await cargarProductosAdmin();

    alert(
      `El producto "${producto.name}" fue eliminado correctamente.`
    );

  } catch (error) {
    console.error("Error al eliminar producto:", error);

    alert(
      error.message || "No se pudo eliminar el producto."
    );
  }
}

/* =========================================
   EDITAR PRODUCTO
========================================= */

function abrirEditorProducto(id) {
  const producto = productosAdmin.find(
    item => item.id === id
  );

  if (!producto) return;

  document.getElementById("editProductId").value =
    producto.id;

  document.getElementById("editProductName").value =
    producto.name;

  document.getElementById("editProductPrice").value =
    producto.price;

  document.getElementById("editProductPreview").src =
    obtenerImagenProducto(producto.image);

  document.getElementById("editProductImage").value = "";

  document.getElementById("editProductMessage").textContent = "";

  productDialog.showModal();
}

document.getElementById("cancelEditButton")
  .addEventListener("click", () => {
    productDialog.close();
  });

/* =========================================
   NAVEGACIÓN DEL PANEL
========================================= */

const seccionesAdmin = {
  products: document.getElementById("productsSection"),
  promotions: document.getElementById("promotionsSection"),
  account: document.getElementById("accountSection")
};

document.querySelectorAll("[data-section]").forEach(boton => {
  boton.addEventListener("click", () => {
    const seleccion = boton.dataset.section;

    Object.entries(seccionesAdmin).forEach(
      ([clave, seccion]) => {
        seccion.hidden = clave !== seleccion;
      }
    );

    document.querySelectorAll("[data-section]").forEach(
      item => {
        item.classList.toggle(
          "active",
          item.dataset.section === seleccion
        );
      }
    );
  });
});

/* =========================================
   GUARDAR CAMBIOS DE PRODUCTOS
========================================= */

const saveProductButton =
  document.getElementById("saveProductButton");

const editProductMessage =
  document.getElementById("editProductMessage");

editProductForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = Number(
    document.getElementById("editProductId").value
  );

  const precio = Number(
    document.getElementById("editProductPrice").value
  );

  const archivo =
    document.getElementById("editProductImage").files[0];

  const producto = productosAdmin.find(
    item => item.id === id
  );

  if (!producto) return;

  if (!Number.isSafeInteger(precio) || precio < 0) {
    editProductMessage.textContent =
      "Ingresa un precio válido.";
    return;
  }

  saveProductButton.disabled = true;
  editProductMessage.textContent = "Guardando cambios...";

  try {
    let nuevaImagen = producto.image;

    if (archivo) {
      const formatos = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];

      if (!formatos.includes(archivo.type)) {
        throw new Error(
          "Selecciona una imagen JPG, PNG o WebP."
        );
      }

      if (archivo.size > 5 * 1024 * 1024) {
        throw new Error(
          "La fotografía no puede superar los 5 MB."
        );
      }

      const extension = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
      }[archivo.type];

      const ruta =
        `productos/${id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabaseClient
        .storage
        .from("productos")
        .upload(ruta, archivo, {
          contentType: archivo.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: imagenPublica } = supabaseClient
        .storage
        .from("productos")
        .getPublicUrl(ruta);

      nuevaImagen = imagenPublica.publicUrl;
    }

    const { error } = await supabaseClient
      .from("products")
      .update({
        price: precio,
        image: nuevaImagen
      })
      .eq("id", id);

    if (error) throw error;

    productDialog.close();
    await cargarProductosAdmin();

  } catch (error) {
    console.error(error);

    editProductMessage.textContent =
      error.message ||
      "No se pudieron guardar los cambios.";

  } finally {
    saveProductButton.disabled = false;
  }
});

/* =========================================
   AGREGAR NUEVOS PLATOS - PISCO & MAR
========================================= */

const addProductButton =
  document.getElementById("addProductButton");

const addProductDialog =
  document.getElementById("addProductDialog");

const addProductForm =
  document.getElementById("addProductForm");

const cancelAddProductButton =
  document.getElementById("cancelAddProductButton");

const saveNewProductButton =
  document.getElementById("saveNewProductButton");

const addProductMessage =
  document.getElementById("addProductMessage");

addProductButton.addEventListener("click", () => {
  addProductForm.reset();
  addProductMessage.textContent = "";
  addProductDialog.showModal();
});

cancelAddProductButton.addEventListener("click", () => {
  addProductDialog.close();
});

addProductForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nombre =
    document.getElementById("newProductName").value.trim();

  const categoria =
    document.getElementById("newProductCategory").value;

  const precio = Number(
    document.getElementById("newProductPrice").value
  );

  const descripcion =
    document.getElementById("newProductDescription").value.trim();

  const archivo =
    document.getElementById("newProductImage").files[0];

  const categorias = [
    "ceviches",
    "entradas",
    "fondos",
    "arroces",
    "carnes",
    "postres",
    "bebidas",
    "combo"
  ];

  if (
    !nombre ||
    nombre.length > 120 ||
    !categorias.includes(categoria)
  ) {
    addProductMessage.textContent =
      "Revisa el nombre y la categoría.";
    return;
  }

  if (!Number.isSafeInteger(precio) || precio < 0) {
    addProductMessage.textContent =
      "Ingresa un precio válido.";
    return;
  }

  if (!archivo) {
    addProductMessage.textContent =
      "Selecciona una fotografía.";
    return;
  }

  const formatos = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };

  if (!formatos[archivo.type]) {
    addProductMessage.textContent =
      "La fotografía debe ser JPG, PNG o WebP.";
    return;
  }

  if (archivo.size > 5 * 1024 * 1024) {
    addProductMessage.textContent =
      "La fotografía no puede superar los 5 MB.";
    return;
  }

  saveNewProductButton.disabled = true;
  addProductMessage.textContent = "Guardando nuevo plato...";

  let rutaSubida = null;

  try {
    const { data: usuario, error: errorUsuario } =
      await supabaseClient.auth.getUser();

    if (
      errorUsuario ||
      !usuario.user ||
      !(await verificarAdministrador(usuario.user))
    ) {
      throw new Error(
        "Tu sesión no tiene permisos de administrador."
      );
    }

    const extension = formatos[archivo.type];

    rutaSubida =
      `productos/nuevos/${crypto.randomUUID()}.${extension}`;

    const { error: errorImagen } = await supabaseClient
      .storage
      .from("productos")
      .upload(rutaSubida, archivo, {
        contentType: archivo.type,
        upsert: false
      });

    if (errorImagen) throw errorImagen;

    const { data: imagenPublica } = supabaseClient
      .storage
      .from("productos")
      .getPublicUrl(rutaSubida);

    const { error: errorProducto } = await supabaseClient
      .from("products")
      .insert({
        name: nombre,
        category: categoria,
        price: precio,
        description: descripcion,
        image: imagenPublica.publicUrl
      });

    if (errorProducto) throw errorProducto;

    rutaSubida = null;

    addProductDialog.close();
    addProductForm.reset();

    await cargarProductosAdmin();

    alert("¡Plato agregado correctamente!");

  } catch (error) {
    console.error("Error al agregar plato:", error);

    addProductMessage.textContent =
      error.message || "No fue posible agregar el plato.";

    // Intenta limpiar la imagen si no se guardó el producto.
    if (rutaSubida) {
      const { error: errorLimpieza } = await supabaseClient
        .storage
        .from("productos")
        .remove([rutaSubida]);

      if (errorLimpieza) {
        console.warn(
          "No se pudo limpiar la imagen:",
          errorLimpieza
        );
      }
    }

  } finally {
    saveNewProductButton.disabled = false;
  }
});

/* =========================================
   INICIAR ADMINISTRACIÓN
========================================= */

revisarSesion();


/* =========================================
   ADMINISTRACIÓN DE PROMOCIONES
========================================= */

const adminPromotions = document.getElementById("adminPromotions");
const promotionDialog = document.getElementById("promotionDialog");
const promotionForm = document.getElementById("promotionForm");
const promotionMessage = document.getElementById("promotionMessage");
const savePromotionButton = document.getElementById("savePromotionButton");

let promocionesAdmin = [];

async function cargarPromocionesAdmin() {
  adminPromotions.textContent = "Cargando promociones...";

  const { data, error } = await supabaseClient
    .from("promotions")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    adminPromotions.textContent = "No se pudieron cargar las promociones.";
    return;
  }

  promocionesAdmin = data || [];
  adminPromotions.replaceChildren();

  if (promocionesAdmin.length === 0) {
    adminPromotions.textContent = "Todavía no hay promociones registradas.";
    return;
  }

  promocionesAdmin.forEach(promocion => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "admin-product-card";

    const imagen = document.createElement("img");
    imagen.src = promocion.image;
    imagen.alt = promocion.name;
    imagen.loading = "lazy";

    const contenido = document.createElement("div");
    contenido.className = "admin-product-info";

    const nombre = document.createElement("h3");
    nombre.textContent = promocion.name;

    const descripcion = document.createElement("p");
    descripcion.textContent = promocion.description || "";

    const precio = document.createElement("p");
    precio.textContent = formatoPrecio(promocion.price);

    const estado = document.createElement("p");
    estado.textContent = promocion.active
      ? "🟢 Promoción activa"
      : "⚪ Promoción inactiva";

    const editar = document.createElement("button");
    editar.type = "button";
    editar.textContent = "Editar promoción";
    editar.addEventListener("click", () => abrirPromocion(promocion));

    const cambiarEstado = document.createElement("button");
    cambiarEstado.type = "button";
    cambiarEstado.textContent = promocion.active
      ? "Desactivar"
      : "Activar";
    cambiarEstado.addEventListener("click", () =>
      cambiarEstadoPromocion(promocion)
    );

    const eliminar = document.createElement("button");
    eliminar.type = "button";
    eliminar.textContent = "Eliminar promoción";
    eliminar.className = "delete-product-button";
    eliminar.addEventListener("click", () =>
      eliminarPromocion(promocion)
    );

    contenido.append(
      nombre, descripcion, precio, estado,
      editar, cambiarEstado, eliminar
    );

    tarjeta.append(imagen, contenido);
    adminPromotions.append(tarjeta);
  });
}

document.getElementById("addPromotionButton")
  .addEventListener("click", () => {
    promotionForm.reset();
    document.getElementById("promotionId").value = "";
    document.getElementById("promotionDialogTitle").textContent =
      "Nueva promoción";
    document.getElementById("promotionImage").required = true;
    promotionMessage.textContent = "";
    promotionDialog.showModal();
  });

document.getElementById("cancelPromotionButton")
  .addEventListener("click", () => promotionDialog.close());

function abrirPromocion(promocion) {
  promotionForm.reset();

  document.getElementById("promotionId").value = promocion.id;
  document.getElementById("promotionName").value = promocion.name;
  document.getElementById("promotionDescription").value =
    promocion.description || "";
  document.getElementById("promotionPrice").value = promocion.price;
  document.getElementById("promotionActive").value =
    String(promocion.active);

  document.getElementById("promotionImage").required = false;
  document.getElementById("promotionDialogTitle").textContent =
    "Editar promoción";

  promotionMessage.textContent = "";
  promotionDialog.showModal();
}

async function subirImagenPromocion(archivo) {
  const formatos = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };

  if (!formatos[archivo.type]) {
    throw new Error("Selecciona una imagen JPG, PNG o WebP.");
  }

  if (archivo.size > 5 * 1024 * 1024) {
    throw new Error("La imagen no puede superar los 5 MB.");
  }

  const ruta = `promociones/${crypto.randomUUID()}.${formatos[archivo.type]}`;

  const { error } = await supabaseClient.storage
    .from("productos")
    .upload(ruta, archivo, {
      contentType: archivo.type,
      upsert: false
    });

  if (error) throw error;

  const { data } = supabaseClient.storage
    .from("productos")
    .getPublicUrl(ruta);

  return { ruta, url: data.publicUrl };
}

promotionForm.addEventListener("submit", async event => {
  event.preventDefault();

  const id = document.getElementById("promotionId").value;
  const name = document.getElementById("promotionName").value.trim();
  const description =
    document.getElementById("promotionDescription").value.trim();
  const price = Number(document.getElementById("promotionPrice").value);
  const active = document.getElementById("promotionActive").value === "true";
  const archivo = document.getElementById("promotionImage").files[0];

  if (!name || !Number.isSafeInteger(price) || price < 0) {
    promotionMessage.textContent = "Revisa el nombre y el precio.";
    return;
  }

  savePromotionButton.disabled = true;
  promotionMessage.textContent = "Guardando promoción...";

  let rutaNueva = null;

  try {
    const { data: usuario, error: errorUsuario } =
      await supabaseClient.auth.getUser();

    if (
      errorUsuario ||
      !usuario.user ||
      !(await verificarAdministrador(usuario.user))
    ) {
      throw new Error("No tienes permisos de administrador.");
    }

    const anterior = id
      ? promocionesAdmin.find(item => String(item.id) === id)
      : null;

    if (id && !anterior) {
      throw new Error("No se encontró la promoción.");
    }

    let image = anterior?.image || "";

    if (archivo) {
      const subida = await subirImagenPromocion(archivo);
      rutaNueva = subida.ruta;
      image = subida.url;
    }

    if (!image) {
      throw new Error("Selecciona una fotografía.");
    }

    const datos = { name, description, price, image, active };

    const resultado = id
      ? await supabaseClient.from("promotions")
          .update(datos).eq("id", id).select("id")
      : await supabaseClient.from("promotions")
          .insert(datos).select("id");

    if (resultado.error) throw resultado.error;

    if (!resultado.data?.length) {
      throw new Error("No se guardaron los cambios.");
    }

    rutaNueva = null;
    promotionDialog.close();
    await cargarPromocionesAdmin();

    alert("¡Promoción guardada correctamente!");

  } catch (error) {
    console.error(error);
    promotionMessage.textContent =
      error.message || "No se pudo guardar la promoción.";

    if (rutaNueva) {
      await supabaseClient.storage
        .from("productos")
        .remove([rutaNueva]);
    }
  } finally {
    savePromotionButton.disabled = false;
  }
});

async function cambiarEstadoPromocion(promocion) {
  const { data, error } = await supabaseClient
    .from("promotions")
    .update({ active: !promocion.active })
    .eq("id", promocion.id)
    .select("id");

  if (error || !data?.length) {
    alert("No se pudo cambiar el estado de la promoción.");
    return;
  }

  await cargarPromocionesAdmin();
}

async function eliminarPromocion(promocion) {
  const confirmado = window.confirm(
    `¿Eliminar "${promocion.name}"?\n\nEsta acción no se puede deshacer.`
  );

  if (!confirmado) return;

  const { data, error } = await supabaseClient
    .from("promotions")
    .delete()
    .eq("id", promocion.id)
    .select("id");

  if (error || !data?.length) {
    alert("No se pudo eliminar la promoción.");
    return;
  }

  await cargarPromocionesAdmin();
  alert("Promoción eliminada correctamente.");
}

// Cargar promociones cuando se abre la sección.
document.querySelector('[data-section="promotions"]')
  .addEventListener("click", cargarPromocionesAdmin);


/* =========================================
   PISCO & MAR - BANNER DE INICIO
========================================= */

const homeBannerForm = document.getElementById("homeBannerForm");
const bannerMessage = document.getElementById("bannerMessage");
const saveBannerButton = document.getElementById("saveBannerButton");

let bannerActual = null;

async function cargarBannerAdmin() {
  bannerMessage.textContent = "Cargando banner...";

  try {
    const { data: usuario, error: errorUsuario } =
      await supabaseClient.auth.getUser();

    if (
      errorUsuario ||
      !usuario.user ||
      !(await verificarAdministrador(usuario.user))
    ) {
      throw new Error("No tienes permisos de administrador.");
    }

    const { data, error } = await supabaseClient
      .from("home_banner")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("No se encontró el banner de Inicio.");

    bannerActual = data;

    document.getElementById("bannerLabel").value =
      data.label || "";

    document.getElementById("bannerTitle").value =
      data.title || "";

    document.getElementById("bannerDiscount").value =
      data.discount_text || "";

    document.getElementById("bannerDescription").value =
      data.description || "";

    document.getElementById("bannerActive").value =
      String(data.active);

    document.getElementById("bannerImage").value = "";

    bannerMessage.textContent = "Banner cargado correctamente.";

  } catch (error) {
    console.error("Error al cargar banner:", error);
    bannerMessage.textContent =
      error.message || "No se pudo cargar el banner.";
  }
}

homeBannerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!bannerActual) {
    bannerMessage.textContent =
      "Primero debes cargar los datos del banner.";
    return;
  }

  const label =
    document.getElementById("bannerLabel").value.trim();

  const title =
    document.getElementById("bannerTitle").value.trim();

  const discount_text =
    document.getElementById("bannerDiscount").value.trim();

  const description =
    document.getElementById("bannerDescription").value.trim();

  const active =
    document.getElementById("bannerActive").value === "true";

  const archivo =
    document.getElementById("bannerImage").files[0];

  if (!label || !title || !discount_text) {
    bannerMessage.textContent =
      "Completa la etiqueta, el título y el texto destacado.";
    return;
  }

  saveBannerButton.disabled = true;
  bannerMessage.textContent = "Guardando cambios...";

  let rutaNueva = null;

  try {
    const { data: usuario, error: errorUsuario } =
      await supabaseClient.auth.getUser();

    if (
      errorUsuario ||
      !usuario.user ||
      !(await verificarAdministrador(usuario.user))
    ) {
      throw new Error("No tienes permisos de administrador.");
    }

    let image = bannerActual.image || null;

    if (archivo) {
      const formatos = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp"
      };

      if (!formatos[archivo.type]) {
        throw new Error("La imagen debe ser JPG, PNG o WebP.");
      }

      if (archivo.size > 5 * 1024 * 1024) {
        throw new Error("La imagen no puede superar los 5 MB.");
      }

      rutaNueva =
        `banners/${crypto.randomUUID()}.${formatos[archivo.type]}`;

      const { error: errorImagen } = await supabaseClient
        .storage
        .from("productos")
        .upload(rutaNueva, archivo, {
          contentType: archivo.type,
          upsert: false
        });

      if (errorImagen) throw errorImagen;

      const { data: imagenPublica } = supabaseClient
        .storage
        .from("productos")
        .getPublicUrl(rutaNueva);

      image = imagenPublica.publicUrl;
    }

    const { data, error } = await supabaseClient
      .from("home_banner")
      .update({
        label,
        title,
        discount_text,
        description,
        image,
        active
      })
      .eq("id", bannerActual.id)
      .select("*");

    if (error) throw error;

    if (!data?.length) {
      throw new Error(
        "No se actualizaron los datos. Revisa los permisos en Supabase."
      );
    }

    rutaNueva = null;
    bannerActual = data[0];

    document.getElementById("bannerImage").value = "";

    bannerMessage.textContent =
      "¡Banner actualizado correctamente!";

  } catch (error) {
    console.error("Error al guardar banner:", error);

    bannerMessage.textContent =
      error.message || "No se pudieron guardar los cambios.";

    if (rutaNueva) {
      const { error: errorLimpieza } = await supabaseClient
        .storage
        .from("productos")
        .remove([rutaNueva]);

      if (errorLimpieza) {
        console.warn("No se pudo limpiar la imagen:", errorLimpieza);
      }
    }

  } finally {
    saveBannerButton.disabled = false;
  }
});

// Cargar el banner cuando se abre Promociones.
document.querySelector('[data-section="promotions"]')
  .addEventListener("click", cargarBannerAdmin);
