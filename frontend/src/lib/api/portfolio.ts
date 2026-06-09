import { http } from "@/lib/api/http";
import type { PortfolioLink, PortfolioLinkRequest } from "@/lib/types/me-portfolio";

const BASE = "/api/v1/me/portfolio-links";

export async function fetchPortfolioLinks(): Promise<PortfolioLink[]> {
  const res = await http(BASE);
  const data = await res.json();
  return data.links; // BE 래핑: { links: [...] }
}

export async function createPortfolioLink(req: PortfolioLinkRequest): Promise<PortfolioLink> {
  const res = await http(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function updatePortfolioLink(id: number, req: PortfolioLinkRequest): Promise<PortfolioLink> {
  const res = await http(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function deletePortfolioLink(id: number): Promise<void> {
  await http(`${BASE}/${id}`, { method: "DELETE" });
}
