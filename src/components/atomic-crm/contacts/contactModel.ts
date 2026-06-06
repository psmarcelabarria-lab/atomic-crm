import { Mars, NonBinary, Venus } from "lucide-react";

import type { Company, Contact, ContactGender } from "../types";

export const defaultEmailJsonb = [{ email: null, type: null }];
export const defaultPhoneJsonb = [{ number: null, type: null }];

const cleanContactArrayFields = (data: Contact) => {
  const cleanedEmailJsonb =
    data.email_jsonb?.filter((e) => e.email != null) || [];
  const cleanedPhoneJsonb =
    data.phone_jsonb?.filter((p) => p.number != null) || [];
  return {
    ...data,
    phone_jsonb: cleanedPhoneJsonb.length > 0 ? cleanedPhoneJsonb : null,
    email_jsonb: cleanedEmailJsonb.length > 0 ? cleanedEmailJsonb : null,
  };
};

export const cleanupContactForCreate = (data: Contact) => {
  return cleanContactArrayFields({
    ...data,
    first_seen: new Date().toISOString(),
    last_seen: new Date().toISOString(),
    tags: [],
  });
};

export const cleanupContactForEdit = cleanContactArrayFields;

type TranslateFn = (key: string, options?: { [key: string]: any }) => string;

export const contactGenderDefaultLabels: Record<string, string> = {
  male: "He/Him",
  female: "She/Her",
  nonbinary: "They/Them",
};

const personalInfoTypeMap: Record<string, string> = {
  Work: "work",
  Home: "home",
  Other: "other",
};

export const contactGender: ContactGender[] = [
  {
    value: "male",
    label: "resources.contacts.inputs.genders.male",
    icon: Mars,
  },
  {
    value: "female",
    label: "resources.contacts.inputs.genders.female",
    icon: Venus,
  },
  {
    value: "nonbinary",
    label: "resources.contacts.inputs.genders.nonbinary",
    icon: NonBinary,
  },
];

export const contactLeadSources = [
  { id: "Instagram", name: "resources.contacts.inputs.lead_sources.instagram" },
  { id: "LinkedIn", name: "resources.contacts.inputs.lead_sources.linkedin" },
  { id: "WhatsApp", name: "resources.contacts.inputs.lead_sources.whatsapp" },
  { id: "Comunidad", name: "resources.contacts.inputs.lead_sources.community" },
  { id: "Referido", name: "resources.contacts.inputs.lead_sources.referral" },
  { id: "Web", name: "resources.contacts.inputs.lead_sources.web" },
  { id: "Evento", name: "resources.contacts.inputs.lead_sources.event" },
  { id: "Otro", name: "resources.contacts.inputs.lead_sources.other" },
];

export const contactProductInterests = [
  { id: "VIRA", name: "resources.contacts.inputs.product_interests.vira" },
  {
    id: "IA en Consulta",
    name: "resources.contacts.inputs.product_interests.ai_consultation",
  },
  {
    id: "Asesoría 1:1",
    name: "resources.contacts.inputs.product_interests.one_to_one",
  },
  {
    id: "MentorIA MIC",
    name: "resources.contacts.inputs.product_interests.mentoria_mic",
  },
  {
    id: "Consultoría MIC",
    name: "resources.contacts.inputs.product_interests.consultoria_mic",
  },
  {
    id: "Libro El Algoritmo del Vínculo",
    name: "resources.contacts.inputs.product_interests.book_algorithm",
  },
  {
    id: "MIC B2B",
    name: "resources.contacts.inputs.product_interests.mic_b2b",
  },
  { id: "Otro", name: "resources.contacts.inputs.product_interests.other" },
];

export const translateContactGenderLabel = (
  gender: { value: string; label: string },
  translate: TranslateFn,
) =>
  translate(gender.label, {
    _: contactGenderDefaultLabels[gender.value] ?? gender.label,
  });

export const translatePersonalInfoTypeLabel = (
  type: string,
  translate: TranslateFn,
) =>
  translate(
    `resources.contacts.inputs.personal_info_types.${personalInfoTypeMap[type] ?? type.toLowerCase()}`,
    {
      _: type,
    },
  );

/**
 * Folds a long line according to vCard specification (max 75 chars per line)
 * Continuation lines start with a space
 */
function foldLine(line: string): string {
  const maxLength = 75;
  if (line.length <= maxLength) return line;

  const result: string[] = [];
  let currentLine = line.substring(0, maxLength);
  let remaining = line.substring(maxLength);

  result.push(currentLine);

  while (remaining.length > 0) {
    // Continuation lines start with a space and can have 74 more chars
    const chunkSize = maxLength - 1;
    currentLine = " " + remaining.substring(0, chunkSize);
    remaining = remaining.substring(chunkSize);
    result.push(currentLine);
  }

  return result.join("\r\n");
}

/**
 * Converts a contact and their company to vCard 3.0 format
 */
export function exportToVCard(
  contact: Contact,
  company?: Company,
  photoData?: { base64: string; mimeType: string },
): string {
  const lines: string[] = [];

  // vCard header
  lines.push("BEGIN:VCARD");
  lines.push("VERSION:3.0");

  // Name (N: Family Name;Given Name;Additional Names;Honorific Prefixes;Honorific Suffixes)
  lines.push(`N:${contact.last_name};${contact.first_name};;;`);

  // Formatted name
  lines.push(`FN:${contact.first_name} ${contact.last_name}`);

  // Title/Job position
  if (contact.title) {
    lines.push(`TITLE:${contact.title}`);
  }

  // Organization
  if (company?.name) {
    lines.push(`ORG:${company.name}`);
  }

  // Emails
  if (contact.email_jsonb && contact.email_jsonb.length > 0) {
    contact.email_jsonb.forEach((emailObj) => {
      const type = emailObj.type.toUpperCase();
      lines.push(`EMAIL;TYPE=${type}:${emailObj.email}`);
    });
  }

  // Phone numbers
  if (contact.phone_jsonb && contact.phone_jsonb.length > 0) {
    contact.phone_jsonb.forEach((phoneObj) => {
      const type = phoneObj.type.toUpperCase();
      lines.push(`TEL;TYPE=${type}:${phoneObj.number}`);
    });
  }

  // LinkedIn URL
  if (contact.linkedin_url) {
    lines.push(`URL:${contact.linkedin_url}`);
  }

  // Background/Note
  if (contact.background) {
    // Escape newlines and special characters in notes
    const escapedNote = contact.background
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
    lines.push(`NOTE:${escapedNote}`);
  }

  // Photo/Avatar - vCard 3.0 format with base64 encoding
  if (photoData) {
    // Extract image type from MIME type (e.g., "image/png" -> "PNG")
    const imageType = photoData.mimeType.split("/")[1]?.toUpperCase() || "PNG";

    // vCard 3.0 format: PHOTO;ENCODING=b;TYPE=PNG:
    const photoLine = `PHOTO;ENCODING=b;TYPE=${imageType}:${photoData.base64}`;
    lines.push(foldLine(photoLine));
  }

  // vCard footer
  lines.push("END:VCARD");

  return lines.join("\r\n");
}
