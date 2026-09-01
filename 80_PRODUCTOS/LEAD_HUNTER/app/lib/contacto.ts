import type { Lead } from "./types";

/**
 * El @ de Instagram del lead. Los leads de IG no traen teléfono: su contacto
 * es el perfil, así que la app tiene que mostrarlo y poder abrirlo.
 * El scraper guarda el usuario en `headline` ("@zaint") y la URL en `perfilUrl`.
 */
export function arrobaInstagram(lead: Lead): string | null {
  if (lead.origen !== "instagram") return null;
  const delHeadline = lead.headline?.trim().match(/^@([A-Za-z0-9._]+)/)?.[1];
  if (delHeadline) return delHeadline;
  return lead.perfilUrl?.match(/instagram\.com\/([A-Za-z0-9._]+)/i)?.[1] ?? null;
}

/** Link abrible al perfil de Instagram del lead (null si no es de IG). */
export function urlInstagram(lead: Lead): string | null {
  const arroba = arrobaInstagram(lead);
  if (arroba) return `https://instagram.com/${arroba}`;
  return lead.perfilUrl?.includes("instagram.com") ? lead.perfilUrl : null;
}

/** Deja solo dígitos para el link de WhatsApp (wa.me/<numero>). */
export function soloDigitos(tel: string): string {
  return tel.replace(/[^0-9]/g, "");
}

/** ¿El contacto guardado es un correo? (ecommerce suele traer email, maps teléfono). */
function esEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export type TipoAccion =
  | "linkedin"
  | "whatsapp"
  | "llamada"
  | "instagram"
  | "email"
  | "web"
  | "maps";

export interface AccionContacto {
  etiqueta: string;
  url: string;
  tipo: TipoAccion;
  /** La que de verdad sirve para hablarle hoy: se muestra destacada. */
  principal?: boolean;
}

/**
 * Por dónde se contacta ESTE lead, según de dónde salió.
 *
 * Antes la ficha ofrecía siempre "Ver perfil en LinkedIn", aunque el lead
 * viniera de Google Maps (donde `perfilUrl` es la web del negocio) o de
 * Instagram (donde el contacto es el DM). El canal de contacto lo manda el
 * origen, no la plantilla.
 */
export function accionesDeContacto(lead: Lead, mensaje?: string): AccionContacto[] {
  const acciones: AccionContacto[] = [];
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : "";
  const contacto = lead.contacto?.trim() ?? "";
  const origen = lead.origen ?? "linkedin_busqueda";

  // 1. Instagram: el contacto es el perfil.
  const urlIg = urlInstagram(lead);
  if (urlIg) {
    acciones.push({
      etiqueta: `@${arrobaInstagram(lead)}`,
      url: urlIg,
      tipo: "instagram",
      principal: true,
    });
  }

  // 2. Teléfono (típico de Google Maps): WhatsApp primero, que es como se
  //    contacta de verdad en Colombia, y la llamada al lado.
  if (contacto && !esEmail(contacto)) {
    const wa = soloDigitos(contacto);
    if (wa) {
      acciones.push({
        etiqueta: "Escribir por WhatsApp",
        url: `https://wa.me/${wa}${texto}`,
        tipo: "whatsapp",
        principal: true,
      });
    }
    acciones.push({ etiqueta: contacto, url: `tel:${contacto}`, tipo: "llamada" });
  }

  // 3. Correo (ecommerce).
  if (contacto && esEmail(contacto)) {
    acciones.push({
      etiqueta: contacto,
      url: `mailto:${contacto}`,
      tipo: "email",
      principal: true,
    });
  }

  // 4. El enlace del perfil, con el nombre correcto según de dónde vino.
  const perfil = lead.perfilUrl?.trim();
  if (perfil && !urlIg) {
    if (origen === "linkedin_busqueda" || perfil.includes("linkedin.com")) {
      acciones.push({
        etiqueta: "Ver perfil en LinkedIn",
        url: perfil,
        tipo: "linkedin",
        principal: acciones.length === 0,
      });
    } else if (perfil.includes("google.com/maps") || perfil.includes("goo.gl/maps")) {
      acciones.push({ etiqueta: "Ver en Google Maps", url: perfil, tipo: "maps" });
    } else {
      acciones.push({ etiqueta: "Ver su sitio web", url: perfil, tipo: "web" });
    }
  }

  return acciones;
}
