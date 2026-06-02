import { http } from "@/lib/api/http";
import type { Certificate, CertificateRequest } from "@/lib/types/me-profile";

const BASE = "/api/v1/me/certificates";

export async function fetchCertificates(): Promise<Certificate[]> {
  const res = await http(BASE);
  const data = await res.json();
  return data.certificates; // BE wraps: { certificates: [...] }
}

export async function createCertificate(req: CertificateRequest): Promise<Certificate> {
  const res = await http(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function updateCertificate(id: number, req: CertificateRequest): Promise<Certificate> {
  const res = await http(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return res.json();
}

export async function deleteCertificate(id: number): Promise<void> {
  await http(`${BASE}/${id}`, { method: "DELETE" });
}
