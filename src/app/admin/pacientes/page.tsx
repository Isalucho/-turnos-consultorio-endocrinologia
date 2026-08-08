import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export default async function PacientesPage(props: PageProps<"/admin/pacientes">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  const where: Prisma.UserWhereInput = {
    role: "PACIENTE",
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { dni: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const patients = await prisma.user.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { appointments: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Pacientes</h1>
        <p className="text-zinc-600">{patients.length} pacientes {q ? "encontrados" : "registrados"}.</p>
      </div>

      <Card>
        <CardContent>
          <form method="get" className="flex gap-2">
            <Input name="q" defaultValue={q} placeholder="Buscar por nombre, DNI o email..." className="max-w-sm" />
            <Button type="submit" variant="outline">
              Buscar
            </Button>
            {q && (
              <Link
                href="/admin/pacientes"
                className="self-center text-sm text-zinc-500 underline underline-offset-2"
              >
                Limpiar
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {patients.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">No se encontraron pacientes.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Obra social</TableHead>
                  <TableHead className="text-right">Turnos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/pacientes/${patient.id}`}
                        className="text-zinc-900 underline-offset-2 hover:underline"
                      >
                        {patient.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      <div>{patient.email}</div>
                      <div>{patient.phone}</div>
                    </TableCell>
                    <TableCell>{patient.dni}</TableCell>
                    <TableCell>{patient.obraSocial ?? "-"}</TableCell>
                    <TableCell className="text-right">{patient._count.appointments}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
