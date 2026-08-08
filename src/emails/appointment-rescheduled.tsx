import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

import { CLINIC_NAME, emailStyles } from "./components";

type Props = {
  patientName: string;
  previousDateLabel: string;
  previousStartTime: string;
  newDateLabel: string;
  newStartTime: string;
  newEndTime: string;
};

export default function AppointmentRescheduledEmail({
  patientName,
  previousDateLabel,
  previousStartTime,
  newDateLabel,
  newStartTime,
  newEndTime,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Tu turno fue reprogramado para el {newDateLabel}</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.heading}>Turno reprogramado</Heading>
          <Text style={emailStyles.text}>Hola {patientName},</Text>
          <Text style={emailStyles.text}>Tu turno fue reprogramado. Estos son los nuevos detalles:</Text>
          <Section style={emailStyles.detailsBox}>
            <Text style={emailStyles.text}>
              <strong>Turno anterior:</strong> {previousDateLabel} a las {previousStartTime} hs (cancelado)
              <br />
              <strong>Nuevo turno:</strong> {newDateLabel} de {newStartTime} a {newEndTime} hs
            </Text>
          </Section>
          <Text style={emailStyles.footer}>{CLINIC_NAME}</Text>
        </Container>
      </Body>
    </Html>
  );
}
