import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

export default async function PacientesPage() {
  const patients = await prisma.user.findMany({
    where: { role: "PACIENTE" },
    orderBy: { name: "asc" },
    include: { _count: { select: { appointments: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Pacientes</h1>
        <p className="text-zinc-600">{patients.length} pacientes registrados.</p>
      </div>

      <Card>
        <CardContent>
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
                  <TableCell className="font-medium text-zinc-900">{patient.name}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
