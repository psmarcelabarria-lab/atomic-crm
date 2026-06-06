import { useMemo, useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import { useNotify, useRecordContext, useTranslate } from "ra-core";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Contact } from "../types";

type FollowUpVariant = {
  key: "direct" | "warm" | "commercial";
  labelKey: string;
  message: string;
};

export const GenerateFollowUpButton = () => {
  const contact = useRecordContext<Contact>();
  const translate = useTranslate();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const variants = useFollowUpVariants(contact);

  if (!contact) return null;

  const handleOpen = () => {
    setOpen(true);
    setIsGenerating(true);
    setHasGenerated(false);
    window.setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
    }, 500);
  };

  const handleCopy = async (message: string) => {
    await navigator.clipboard.writeText(message);
    notify("crm.common.copied");
  };

  return (
    <>
      <Button
        variant="outline"
        className="h-6 cursor-pointer"
        size="sm"
        onClick={handleOpen}
      >
        <Sparkles className="w-4 h-4" />
        {translate("resources.contacts.follow_up.action")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="md:min-w-2xl max-w-3xl max-h-9/10 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {translate("resources.contacts.follow_up.title")}
            </DialogTitle>
            <DialogDescription>
              {translate("resources.contacts.follow_up.description")}
            </DialogDescription>
          </DialogHeader>

          {isGenerating || !hasGenerated ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant) => (
                <section
                  key={variant.key}
                  className="rounded-md border bg-muted/20 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold">
                      {translate(variant.labelKey)}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 cursor-pointer"
                      onClick={() => handleCopy(variant.message)}
                    >
                      <Copy className="size-4" />
                      {translate("crm.common.copy")}
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {variant.message}
                  </p>
                </section>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const useFollowUpVariants = (contact?: Contact): FollowUpVariant[] => {
  const { noteStatuses } = useConfigurationContext();

  return useMemo(() => {
    if (!contact) return [];

    const greeting = contact.first_name ? `Hola ${contact.first_name}` : "Hola";
    const contextSentence = buildContextSentence(contact, noteStatuses);
    const commercialContext = buildCommercialContext(contact, noteStatuses);

    return [
      {
        key: "direct",
        labelKey: "resources.contacts.follow_up.variants.direct",
        message: `${greeting}, ¿cómo estás? Te escribo para dar seguimiento a nuestra conversación.${contextSentence} Si te parece útil, puedo ayudarte a ordenar los próximos pasos y ver si tiene sentido avanzar.`,
      },
      {
        key: "warm",
        labelKey: "resources.contacts.follow_up.variants.warm",
        message: `${greeting}, espero que estés muy bien. Me quedé pensando en lo que conversamos.${contextSentence} Si todavía es relevante para ti, feliz de retomar con calma y ver qué podría servirte ahora, sin compromiso.`,
      },
      {
        key: "commercial",
        labelKey: "resources.contacts.follow_up.variants.commercial",
        message: `${greeting}, ¿cómo estás? Quería retomar el tema${contact.product_interest ? ` de ${contact.product_interest}` : ""}${commercialContext}. Si sigue siendo una prioridad, podemos revisar juntos una forma concreta de avanzar, cuidando que tenga sentido para tu momento actual.`,
      },
    ];
  }, [contact, noteStatuses]);
};

const buildContextDetails = (contact: Contact, noteStatuses: any[]) => {
  const statusLabel = getStatusLabel(contact.status, noteStatuses);
  return [
    contact.lead_source ? `llegaste por ${contact.lead_source}` : null,
    contact.product_interest ? `te interesa ${contact.product_interest}` : null,
    contact.lead_temperature
      ? `el lead está marcado como ${contact.lead_temperature}`
      : null,
    statusLabel ? `estado actual: ${statusLabel}` : null,
    contact.background ? `contexto: ${contact.background}` : null,
  ].filter(Boolean);
};

const buildContextSentence = (contact: Contact, noteStatuses: any[]) => {
  const details = buildContextDetails(contact, noteStatuses);
  if (!details.length) return "";

  return ` Tengo como referencia que ${details.join(", ")}.`;
};

const buildCommercialContext = (contact: Contact, noteStatuses: any[]) => {
  const details = buildContextDetails(contact, noteStatuses).filter(
    (detail) => !detail?.startsWith("te interesa"),
  );
  if (!details.length) return "";

  return ` considerando que ${details.join(", ")}`;
};

const getStatusLabel = (status: string, noteStatuses: any[]) =>
  noteStatuses.find((noteStatus) => noteStatus.value === status)?.label;
