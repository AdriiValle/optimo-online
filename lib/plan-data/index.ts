import type { HtmlMatch, Protocol } from "@/lib/types";
import protocols from "./protocols.json";
import {
  ANTERIOR_FUERZA_V2,
  BASE_ONLINE,
  CRESTS,
  MATCHES,
  MD_ONLINE_BLOCKS,
  POSTERIOR_FUERZA_V2,
  SHORT,
  STRENGTH_FROM
} from "./calendar";

export type ParsedPlan = {
  matches: HtmlMatch[];
  crests: Record<string, string>;
  shortNames: Record<string, string>;
  protocols: Record<string, Protocol>;
  baseOnline: string[];
  mdOnlineBlocks: Record<string, { specific?: string[]; activation?: string[]; post?: string[] }>;
  strengthFrom: string;
  anteriorFuerzaV2: string[];
  posteriorFuerzaV2: string[];
};

export const planData: ParsedPlan = {
  matches: MATCHES,
  crests: CRESTS,
  shortNames: SHORT,
  protocols: protocols as Record<string, Protocol>,
  baseOnline: BASE_ONLINE,
  mdOnlineBlocks: MD_ONLINE_BLOCKS,
  strengthFrom: STRENGTH_FROM,
  anteriorFuerzaV2: ANTERIOR_FUERZA_V2,
  posteriorFuerzaV2: POSTERIOR_FUERZA_V2
};
