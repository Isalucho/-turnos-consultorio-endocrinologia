import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

import { CLINIC_NAME, emailStyles } from "./components";

type Props = {
  patientName: string;
  dateLabel: string;
  startTime: string;
};

export default function AppointmentCancelledEmail({ patientName, dateLabel, startTime }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Tu turno del {dateLabel} fue cancelado</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.heading}>Turno cancelado</Heading>
          <Text style={emailStyles.text}>Hola {patientName},</Text>
          <Text style={emailStyles.text}>Te confirmamos que tu turno fue cancelado.</Text>
          <Section style={emailStyles.detailsBox}>
            <Text style={emailStyles.text}>
              <strong>Fecha:</strong> {dateLabel}
              <br />
              <strong>Horario:</strong> {startTime} hs
            </Text>
          </Section>
          <Text style={emailStyles.text}>
            Si querés sacar un nuevo turno, podés hacerlo cuando quieras desde tu cuenta.
          </Text>
          <Text style={emailStyles.footer}>{CLINIC_NAME}</Text>
        </Container>
      </Body>
    </Html>
  );
}
