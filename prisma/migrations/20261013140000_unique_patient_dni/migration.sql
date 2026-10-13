-- Un DNI no puede repetirse entre pacientes. Índice parcial (Prisma no lo soporta en el schema):
-- excluye al admin, que usa "-" como DNI.
CREATE UNIQUE INDEX "User_dni_paciente_key" ON "User"("dni") WHERE "role" = 'PACIENTE';
