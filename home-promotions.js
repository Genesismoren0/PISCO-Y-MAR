
/* =========================================
   PISCO & MAR - BANNER PÚBLICO DE INICIO
========================================= */

const homeSupabase = window.supabase.createClient(
  "https://saocimccnddfgvsiupug.supabase.co",
  "sb_publishable_71lznW6L4LSDESduHfFtaA_4vBxqGUe"
);

async function cargarBannerInicio() {
  const banner = document.getElementById("homePromoBanner");

  if (!banner) return;

  try {
    const { data, error } = await homeSupabase
      .from("home_banner")
      .select(
        "label,title,discount_text,description,image,active"
      )
      .eq("active", true)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    // Si está desactivado, ocultamos únicamente
    // el banner principal, no las otras tarjetas.
    if (!data) {
      banner.hidden = true;
      return;
    }

    banner.hidden = false;

    document.getElementById("homePromoLabel").textContent =
      data.label || "Promo";

    // Conservamos el <span> del descuento.
    const titulo = document.getElementById("homePromoTitle");

    const descuento =
      document.getElementById("homePromoDiscount");

    titulo.replaceChildren(
      document.createTextNode((data.title || "Pedidos online") + " "),
      descuento
    );

    descuento.textContent = data.discount_text || "15% OFF";

    document.getElementById("homePromoDescription").textContent =
      data.description || "";

    // Mantener la imagen original si no se ha
    // seleccionado otra desde el administrador.
  
if (data.image) {
  banner.style.backgroundImage = `
    linear-gradient(
      90deg,
      rgba(255, 250, 241, 0.98) 0%,
      rgba(255, 250, 241, 0.94) 28%,
      rgba(255, 250, 241, 0.50) 48%,
      rgba(255, 250, 241, 0) 75%
    ),
    url("${data.image}")
  `;

  banner.classList.add("home-banner-custom-image");
} else {
  banner.style.removeProperty("background-image");
  banner.classList.remove("home-banner-custom-image");
}


  } catch (error) {
    console.error("No se pudo cargar el banner:", error);
    // Conservamos el banner original si falla la conexión.
  }
}

cargarBannerInicio();
