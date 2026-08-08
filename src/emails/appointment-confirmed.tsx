import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";

import { CLINIC_NAME, emailStyles } from "./components";

type Props = {
  patientName: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
};

export default function AppointmentConfirmedEmail({ patientName, dateLabel, startTime, endTime }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Tu turno quedó confirmado para el {dateLabel}</Preview>
      <Body style={emailStyles.body}>
        <Container style={emailStyles.container}>
          <Heading style={emailStyles.heading}>Turno confirmado</Heading>
          <Text style={emailStyles.text}>Hola {patientName},</Text>
          <Text style={emailStyles.text}>
            Tu turno en {CLINIC_NAME} fue confirmado con éxito. Estos son los detalles:
          </Text>
          <Section style={emailStyles.detailsBox}>
            <Text style={emailStyles.text}>
              <strong>Fecha:</strong> {dateLabel}
              <br />
              <strong>Horario:</strong> {startTime} a {endTime} hs
            </Text>
          </Section>
          <Text style={emailStyles.text}>
            Si necesitás cancelar o reprogramar, podés hacerlo desde tu cuenta en la sección
            &quot;Mis turnos&quot;.
          </Text>
          <Text style={emailStyles.footer}>{CLINIC_NAME}</Text>
        </Container>
      </Body>
    </Html>
  );
}
